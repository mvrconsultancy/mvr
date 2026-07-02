use anyhow::{Context, Result};

/// Application configuration loaded from environment variables.
/// All secrets are loaded at startup — fail fast if missing.
#[derive(Debug, Clone)]
pub struct Config {
    // Server
    pub host: String,
    pub port: u16,
    pub environment: String,

    // Database (Supabase PostgreSQL)
    pub database_url: String,

    // JWT
    pub jwt_secret: String,
    pub jwt_refresh_secret: String,
    pub jwt_expiry_hours: u64,
    pub jwt_refresh_expiry_days: u64,

    // CORS
    #[allow(dead_code)]
    pub frontend_url: String,
    pub allowed_origins: Vec<String>,

    // Cloudinary (H-2 fix: used by the signed upload service)
    pub cloudinary_cloud_name: Option<String>,
    pub cloudinary_api_key: Option<String>,
    pub cloudinary_api_secret: Option<String>,
    #[allow(dead_code)]
    pub cloudinary_upload_preset: Option<String>,

    // Resend Email
    pub resend_api_key: String,
    pub email_from: String,
    pub email_from_name: String,
    pub admin_email: String,
    pub admin_email_guntur: String,

    // Redis — optional JTI blocklist backend (C-1 security fix)
    // If set, token revocations survive restarts and support multi-instance deploys.
    // If unset, falls back to in-memory blocklist (acceptable for single-instance dev).
    pub redis_url: Option<String>,

    /// When true, trust X-Forwarded-For / X-Real-IP from the reverse proxy (Render, nginx).
    /// Defaults to true in production where the app is only reachable via the platform LB.
    pub trust_proxy_headers: bool,

    /// AES-256 key (base64, 32 bytes) for encrypting TOTP secrets at rest.
    pub totp_encryption_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Config {
            // Server
            host: std::env::var("BACKEND_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: std::env::var("PORT")
                .or_else(|_| std::env::var("BACKEND_PORT"))
                .unwrap_or_else(|_| "8080".to_string())
                .parse::<u16>()
                .context("PORT must be a valid port number")?,
            environment: std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),

            // Database
            database_url: std::env::var("DATABASE_URL")
                .context("DATABASE_URL must be set (Supabase PostgreSQL connection string)")?,

            // JWT
            jwt_secret: {
                let secret = std::env::var("JWT_SECRET")
                    .context("JWT_SECRET must be set (minimum 32 characters)")?;
                if secret.len() < 32 {
                    anyhow::bail!("JWT_SECRET must be at least 32 characters");
                }
                secret
            },
            jwt_refresh_secret: {
                let secret = std::env::var("JWT_REFRESH_SECRET")
                    .context("JWT_REFRESH_SECRET must be set (minimum 32 characters)")?;
                if secret.len() < 32 {
                    anyhow::bail!("JWT_REFRESH_SECRET must be at least 32 characters");
                }
                secret
            },
            jwt_expiry_hours: std::env::var("JWT_EXPIRY_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse::<u64>()
                .context("JWT_EXPIRY_HOURS must be a number")?,
            jwt_refresh_expiry_days: std::env::var("JWT_REFRESH_EXPIRY_DAYS")
                .unwrap_or_else(|_| "30".to_string())
                .parse::<u64>()
                .context("JWT_REFRESH_EXPIRY_DAYS must be a number")?,

            // CORS
            frontend_url: std::env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),

            // Cloudinary (H-2 fix: all optional — signed upload enabled when all three are set)
            cloudinary_cloud_name: std::env::var("CLOUDINARY_CLOUD_NAME")
                .ok()
                .filter(|s| !s.is_empty()),
            cloudinary_api_key: std::env::var("CLOUDINARY_API_KEY")
                .ok()
                .filter(|s| !s.is_empty()),
            cloudinary_api_secret: std::env::var("CLOUDINARY_API_SECRET")
                .ok()
                .filter(|s| !s.is_empty()),
            cloudinary_upload_preset: std::env::var("CLOUDINARY_UPLOAD_PRESET")
                .ok()
                .filter(|s| !s.is_empty()),

            // Resend
            resend_api_key: std::env::var("RESEND_API_KEY").unwrap_or_else(|_| "".to_string()),
            email_from: std::env::var("EMAIL_FROM")
                .unwrap_or_else(|_| "noreply@mvrconsultants.org".to_string()),
            email_from_name: std::env::var("EMAIL_FROM_NAME")
                .unwrap_or_else(|_| "MVR Consultants".to_string()),
            // L-2 security fix: admin emails are now required — no hardcoded fallbacks
            // that would expose real PII in version-controlled source code.
            admin_email: std::env::var("ADMIN_EMAIL")
                .context("ADMIN_EMAIL must be set (Hyderabad office notification address)")?,
            admin_email_guntur: std::env::var("ADMIN_EMAIL_GUNTUR")
                .context("ADMIN_EMAIL_GUNTUR must be set (Guntur office notification address)")?,

            // Redis — required in production for persistent admin logout revocation
            redis_url: {
                let environment =
                    std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
                match std::env::var("REDIS_URL") {
                    Ok(url) if !url.trim().is_empty() => Some(url),
                    _ if environment == "production" => {
                        anyhow::bail!(
                            "REDIS_URL must be set in production (Render Redis → Internal Connection URL)"
                        );
                    }
                    _ => None,
                }
            },

            trust_proxy_headers: std::env::var("TRUST_PROXY_HEADERS")
                .map(|v| v == "true" || v == "1")
                .unwrap_or_else(|_| {
                    std::env::var("ENVIRONMENT")
                        .map(|e| e == "production")
                        .unwrap_or(false)
                }),

            totp_encryption_key: std::env::var("TOTP_ENCRYPTION_KEY")
                .ok()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty()),
        })
    }

    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }

    /// True when Resend API key is set — contact form will attempt outbound email.
    pub fn is_email_configured(&self) -> bool {
        !self.resend_api_key.is_empty()
    }
}
