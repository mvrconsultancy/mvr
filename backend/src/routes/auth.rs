use crate::{
    models::user::{
        LoginRequest, RegisterRequest, TotpConfirmRequest, TotpDisableRequest, TotpVerifyRequest,
        User, UserRole,
    },
    repositories::auth_repository::AuthRepository,
    routes::AppState,
    utils::{
        errors::{AppError, AppResult},
        json_extractor::parse_json_body,
        jwt::{
            generate_access_token, generate_pending_totp_token, generate_refresh_token,
            verify_refresh_token,
        },
        password::{hash_password, validate_password_strength, verify_password},
        response::MessageResponse,
        totp::{build_otpauth_url, decrypt_secret, encrypt_secret, generate_secret, verify_code},
        validators::validate_email,
    },
};
use axum::{
    Json,
    extract::State,
    http::{HeaderValue, header},
    response::{AppendHeaders, IntoResponse, Response},
};
use uuid::Uuid;

/// Request body for token refresh.
/// The `refresh_token` field is OPTIONAL: if absent, the middleware
/// will fall back to reading the `mvr_refresh` httpOnly cookie.
#[derive(Debug, serde::Deserialize, Default)]
pub struct RefreshRequest {
    pub refresh_token: Option<String>,
}

// ─────────────────────────────────────────────
// Cookie helpers
// ─────────────────────────────────────────────

/// Builds a Set-Cookie header value for the access token.
/// Secure flag is only set when the environment is production (HTTPS).
fn access_cookie(token: &str, max_age_secs: u64, is_prod: bool) -> String {
    let secure = if is_prod { "; Secure" } else { "" };
    format!("mvr_access={token}; HttpOnly; SameSite=Lax{secure}; Path=/; Max-Age={max_age_secs}")
}

/// Builds a Set-Cookie header value for the refresh token.
fn refresh_cookie(token: &str, max_age_secs: u64, is_prod: bool) -> String {
    let secure = if is_prod { "; Secure" } else { "" };
    format!("mvr_refresh={token}; HttpOnly; SameSite=Lax{secure}; Path=/; Max-Age={max_age_secs}")
}

/// Pending 2FA session cookie (ADMIN login step 1).
fn pending_totp_cookie(token: &str, max_age_secs: u64, is_prod: bool) -> String {
    let secure = if is_prod { "; Secure" } else { "" };
    format!(
        "mvr_pending_totp={token}; HttpOnly; SameSite=Lax{secure}; Path=/; Max-Age={max_age_secs}"
    )
}

const PENDING_TOTP_MAX_AGE_SECS: u64 = 600;

/// Set-Cookie headers that immediately expire all auth cookies (logout).
fn clear_all_auth_cookies(is_prod: bool) -> [(header::HeaderName, HeaderValue); 3] {
    let secure = if is_prod { "; Secure" } else { "" };
    let access = format!("mvr_access=; HttpOnly; SameSite=Lax{secure}; Path=/; Max-Age=0");
    let refresh = format!("mvr_refresh=; HttpOnly; SameSite=Lax{secure}; Path=/; Max-Age=0");
    let pending = format!("mvr_pending_totp=; HttpOnly; SameSite=Lax{secure}; Path=/; Max-Age=0");
    [
        (header::SET_COOKIE, HeaderValue::from_str(&access).unwrap()),
        (header::SET_COOKIE, HeaderValue::from_str(&refresh).unwrap()),
        (header::SET_COOKIE, HeaderValue::from_str(&pending).unwrap()),
    ]
}

/// Extracts the `mvr_refresh` cookie from the Cookie header.
fn extract_refresh_cookie(request_headers: &axum::http::HeaderMap) -> Option<String> {
    request_headers
        .get(header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|cookies| {
            cookies
                .split(';')
                .map(|c| c.trim())
                .find(|c| c.starts_with("mvr_refresh="))
                .map(|c| c.trim_start_matches("mvr_refresh=").to_string())
        })
}

// ─────────────────────────────────────────────
// POST /api/auth/clear  (public — expire stale auth cookies)
// ─────────────────────────────────────────────
pub async fn clear_session(
    State(state): State<AppState>,
) -> AppResult<(
    AppendHeaders<[(header::HeaderName, HeaderValue); 3]>,
    Json<MessageResponse>,
)> {
    let cookies = clear_all_auth_cookies(state.config.is_production());
    Ok((
        AppendHeaders(cookies),
        Json(MessageResponse::new("Session cleared")),
    ))
}

// ─────────────────────────────────────────────
// POST /api/auth/register  (admin only)
// ─────────────────────────────────────────────
pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Validate inputs
    if body.name.trim().is_empty() {
        return Err(AppError::BadRequest("Name is required".to_string()));
    }
    validate_email(&body.email)?;
    validate_password_strength(&body.password)?;

    let repo = AuthRepository::new(state.db.clone());

    // Check existing email
    if repo
        .find_by_email(&body.email.to_lowercase())
        .await?
        .is_some()
    {
        return Err(AppError::Conflict(
            "Email address is already registered".to_string(),
        ));
    }

    let password_hash = hash_password(&body.password)?;
    let user = repo.create(&body, &password_hash).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Account created successfully",
        "data": user,
    })))
}

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
#[allow(clippy::result_large_err)]
pub async fn login(
    State(state): State<AppState>,
    body: Result<Json<LoginRequest>, axum::extract::rejection::JsonRejection>,
) -> Result<Response, Response> {
    let body = parse_json_body(body)?;
    login_impl(state, body).await.map_err(|e| e.into_response())
}

async fn build_full_session_response(
    state: &AppState,
    user: &User,
    message: &str,
) -> AppResult<Response> {
    let role_str = format!("{:?}", user.role).to_uppercase();
    let access_token = generate_access_token(&user.id, &user.email, &role_str, &state.config)?;
    let refresh_token = generate_refresh_token(&user.id, &state.config)?;

    let access_max_age = state.config.jwt_expiry_hours * 3600;
    let refresh_max_age = state.config.jwt_refresh_expiry_days * 86400;
    let is_prod = state.config.is_production();

    let cookies = [
        (
            header::SET_COOKIE,
            HeaderValue::from_str(&access_cookie(&access_token, access_max_age, is_prod)).unwrap(),
        ),
        (
            header::SET_COOKIE,
            HeaderValue::from_str(&refresh_cookie(&refresh_token, refresh_max_age, is_prod))
                .unwrap(),
        ),
        (
            header::SET_COOKIE,
            HeaderValue::from_str(&pending_totp_cookie("", 0, is_prod)).unwrap(),
        ),
    ];

    let user_response: crate::models::user::UserResponse = user.clone().into();

    Ok((
        AppendHeaders(cookies),
        Json(serde_json::json!({
            "success": true,
            "message": message,
            "data": {
                "token_type": "Bearer",
                "expires_in": access_max_age,
                "requires_totp": false,
                "user": user_response,
            },
        })),
    )
        .into_response())
}

async fn login_impl(state: AppState, body: LoginRequest) -> AppResult<Response> {
    validate_email(&body.email)?;
    if body.password.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Email and password are required".to_string(),
        ));
    }

    let repo = AuthRepository::new(state.db.clone());

    // Look up user
    let user = repo
        .find_by_email(&body.email.to_lowercase())
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    // Check active status
    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Account is deactivated. Contact admin.".to_string(),
        ));
    }

    // Verify password
    if !verify_password(&body.password, &user.password_hash)? {
        return Err(AppError::Unauthorized(
            "Invalid email or password".to_string(),
        ));
    }

    // ADMIN with 2FA enabled: password step only — issue pending cookie, not full session.
    if user.role == UserRole::Admin && user.totp_enabled {
        let pending = generate_pending_totp_token(&user.id, &state.config)?;
        let is_prod = state.config.is_production();
        let user_response: crate::models::user::UserResponse = user.into();

        let cookies = [(
            header::SET_COOKIE,
            HeaderValue::from_str(&pending_totp_cookie(
                &pending,
                PENDING_TOTP_MAX_AGE_SECS,
                is_prod,
            ))
            .unwrap(),
        )];

        return Ok((
            AppendHeaders(cookies),
            Json(serde_json::json!({
                "success": true,
                "message": "Two-factor authentication required",
                "data": {
                    "requires_totp": true,
                    "user": user_response,
                },
            })),
        )
            .into_response());
    }

    build_full_session_response(&state, &user, "Login successful").await
}

// ─────────────────────────────────────────────
// POST /api/auth/logout  (requires auth)
// ─────────────────────────────────────────────
pub async fn logout(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
    headers: axum::http::HeaderMap,
) -> AppResult<(
    AppendHeaders<[(header::HeaderName, HeaderValue); 3]>,
    Json<MessageResponse>,
)> {
    // Revoke the access token JTI (from verified middleware claims)
    state.blocklist.block(claims.jti, claims.exp).await;
    tracing::info!(user.email = %claims.email, "User logged out — access token revoked");

    // Revoke the refresh token if present in cookies
    if let Some(refresh) = extract_refresh_cookie(&headers)
        && let Ok(refresh_claims) = verify_refresh_token(&refresh, &state.config)
    {
        state
            .blocklist
            .block(refresh_claims.jti, refresh_claims.exp)
            .await;
    }

    let cookies = clear_all_auth_cookies(state.config.is_production());
    Ok((
        AppendHeaders(cookies),
        Json(MessageResponse::new("Logged out successfully")),
    ))
}

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────
pub async fn refresh_token(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    // Body is optional — the refresh token can come from the cookie
    body: Option<Json<RefreshRequest>>,
) -> AppResult<(
    AppendHeaders<[(header::HeaderName, HeaderValue); 2]>,
    Json<serde_json::Value>,
)> {
    // Priority: request body → httpOnly cookie
    let token_str = body
        .as_ref()
        .and_then(|b| b.refresh_token.clone())
        .or_else(|| extract_refresh_cookie(&headers))
        .ok_or_else(|| AppError::Unauthorized("Refresh token required".to_string()))?;

    // Verify the refresh token
    let claims = verify_refresh_token(&token_str, &state.config)?;

    if state.blocklist.is_blocked(&claims.jti).await {
        return Err(AppError::Unauthorized(
            "Session has been invalidated. Please log in again.".to_string(),
        ));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token subject".to_string()))?;

    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_by_id(user_id).await?;

    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Account is deactivated. Contact admin.".to_string(),
        ));
    }

    // Rotate refresh token — invalidate the old one
    state.blocklist.block(claims.jti, claims.exp).await;

    let role_str = format!("{:?}", user.role).to_uppercase();
    let access_token = generate_access_token(&user.id, &user.email, &role_str, &state.config)?;
    let new_refresh_token = generate_refresh_token(&user.id, &state.config)?;

    let access_max_age = state.config.jwt_expiry_hours * 3600;
    let refresh_max_age = state.config.jwt_refresh_expiry_days * 86400;
    let is_prod = state.config.is_production();

    let cookies = [
        (
            header::SET_COOKIE,
            HeaderValue::from_str(&access_cookie(&access_token, access_max_age, is_prod)).unwrap(),
        ),
        (
            header::SET_COOKIE,
            HeaderValue::from_str(&refresh_cookie(
                &new_refresh_token,
                refresh_max_age,
                is_prod,
            ))
            .unwrap(),
        ),
    ];

    Ok((
        AppendHeaders(cookies),
        Json(serde_json::json!({
            "success": true,
            "data": {
                // C-2 security fix: new tokens are in Set-Cookie headers only.
                // Return only non-secret metadata the frontend may use.
                "token_type": "Bearer",
                "expires_in": access_max_age,
                "user": user,
            }
        })),
    ))
}

// ─────────────────────────────────────────────
// GET /api/auth/me  (requires auth)
// ─────────────────────────────────────────────
pub async fn get_me(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_by_id(user_id).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": user,
    })))
}

// ─────────────────────────────────────────────
// TOTP / 2FA (ADMIN only)
// ─────────────────────────────────────────────

/// POST /api/auth/totp/verify — complete ADMIN login after password step.
pub async fn totp_verify(
    State(state): State<AppState>,
    axum::Extension(pending): axum::Extension<crate::utils::jwt::PendingTotpClaims>,
    Json(body): Json<TotpVerifyRequest>,
) -> AppResult<Response> {
    let user_id = Uuid::parse_str(&pending.sub)
        .map_err(|_| AppError::Unauthorized("Invalid 2FA session".to_string()))?;

    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_full_by_id(user_id).await?;

    if user.role != UserRole::Admin || !user.totp_enabled {
        return Err(AppError::Unauthorized(
            "2FA is not enabled for this account".to_string(),
        ));
    }
    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Account is deactivated. Contact admin.".to_string(),
        ));
    }

    let encrypted = user.totp_secret_encrypted.as_ref().ok_or_else(|| {
        AppError::InternalServerError("2FA misconfigured — no secret stored".to_string())
    })?;
    let secret = decrypt_secret(encrypted, &state.config)?;
    if !verify_code(&secret, &body.code)? {
        return Err(AppError::Unauthorized(
            "Invalid authentication code".to_string(),
        ));
    }

    state.blocklist.block(pending.jti, pending.exp).await;

    build_full_session_response(&state, &user, "Login successful").await
}

/// GET /api/auth/totp/status
pub async fn totp_status(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;
    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_by_id(user_id).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "totp_enabled": user.totp_enabled,
            "role": user.role,
        }
    })))
}

/// POST /api/auth/totp/setup — generate secret + otpauth URL (ADMIN only).
pub async fn totp_setup(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
) -> AppResult<Json<serde_json::Value>> {
    if claims.role != "ADMIN" {
        return Err(AppError::Forbidden(
            "Only administrators can configure 2FA".to_string(),
        ));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;
    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_full_by_id(user_id).await?;

    let secret = generate_secret();
    let encrypted = encrypt_secret(&secret, &state.config)?;
    repo.save_totp_secret(user_id, &encrypted).await?;

    let otpauth_url = build_otpauth_url(&user.email, &secret)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "otpauth_url": otpauth_url,
            "secret": secret,
        }
    })))
}

/// POST /api/auth/totp/confirm — verify first code and enable 2FA.
pub async fn totp_confirm(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
    Json(body): Json<TotpConfirmRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if claims.role != "ADMIN" {
        return Err(AppError::Forbidden(
            "Only administrators can configure 2FA".to_string(),
        ));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;
    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_full_by_id(user_id).await?;

    let encrypted = user
        .totp_secret_encrypted
        .as_ref()
        .ok_or_else(|| AppError::BadRequest("Run setup first before confirming 2FA".to_string()))?;
    let secret = decrypt_secret(encrypted, &state.config)?;
    if !verify_code(&secret, &body.code)? {
        return Err(AppError::BadRequest(
            "Invalid authentication code".to_string(),
        ));
    }

    let updated = repo.enable_totp(user_id).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Two-factor authentication enabled",
        "data": updated,
    })))
}

/// POST /api/auth/totp/disable — requires password + current TOTP code.
pub async fn totp_disable(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
    Json(body): Json<TotpDisableRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if claims.role != "ADMIN" {
        return Err(AppError::Forbidden(
            "Only administrators can disable 2FA".to_string(),
        ));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;
    let repo = AuthRepository::new(state.db.clone());
    let user = repo.find_full_by_id(user_id).await?;

    if !verify_password(&body.password, &user.password_hash)? {
        return Err(AppError::Unauthorized("Invalid password".to_string()));
    }

    if user.totp_enabled {
        let encrypted = user
            .totp_secret_encrypted
            .as_ref()
            .ok_or_else(|| AppError::InternalServerError("2FA misconfigured".to_string()))?;
        let secret = decrypt_secret(encrypted, &state.config)?;
        if !verify_code(&secret, &body.code)? {
            return Err(AppError::Unauthorized(
                "Invalid authentication code".to_string(),
            ));
        }
    }

    let updated = repo.disable_totp(user_id).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Two-factor authentication disabled",
        "data": updated,
    })))
}
