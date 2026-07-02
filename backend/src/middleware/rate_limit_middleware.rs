use std::{
    collections::HashMap,
    net::IpAddr,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use axum::{
    extract::{ConnectInfo, Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde_json::json;

// ── Token-bucket state per IP ────────────────────────────────────────────────

#[derive(Debug, Clone)]
struct Bucket {
    /// Tokens currently available (fractional accumulation is fine as f64).
    tokens: f64,
    /// Last time this bucket was refilled.
    last_refill: Instant,
}

impl Bucket {
    fn new(capacity: f64) -> Self {
        Self {
            tokens: capacity,
            last_refill: Instant::now(),
        }
    }

    /// Refill tokens proportionally to elapsed time and consume one token.
    /// Returns `true` if the request is allowed, `false` if rate-limited.
    fn consume(&mut self, capacity: f64, refill_per_sec: f64) -> bool {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.tokens = (self.tokens + elapsed * refill_per_sec).min(capacity);
        self.last_refill = now;

        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            true
        } else {
            false
        }
    }
}

// ── Shared limiter state ─────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct RateLimiterState {
    buckets: Arc<Mutex<HashMap<IpAddr, Bucket>>>,
    /// Maximum tokens per IP (= burst capacity).
    capacity: f64,
    /// Tokens added per second (steady-state throughput).
    refill_per_sec: f64,
    /// Trust X-Forwarded-For / X-Real-IP (Render, nginx, Vercel rewrites).
    trust_proxy_headers: bool,
}

impl RateLimiterState {
    pub fn new(capacity: u32, refill_per_sec: f64, trust_proxy_headers: bool) -> Self {
        Self {
            buckets: Arc::new(Mutex::new(HashMap::new())),
            capacity: capacity as f64,
            refill_per_sec,
            trust_proxy_headers,
        }
    }

    fn is_allowed(&self, ip: IpAddr) -> bool {
        let mut map = self.buckets.lock().unwrap();
        let bucket = map.entry(ip).or_insert_with(|| Bucket::new(self.capacity));
        bucket.consume(self.capacity, self.refill_per_sec)
    }

    pub fn trust_proxy_headers(&self) -> bool {
        self.trust_proxy_headers
    }
}

// ── IP extraction helper ─────────────────────────────────────────────────────

/// Returns true if the given IP is a private/loopback address that we trust
/// to be a legitimate reverse proxy (nginx, Render's load balancer, etc.).
/// Public IPs should never be trusted as proxies.
fn is_trusted_proxy(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            v4.is_loopback()       // 127.0.0.0/8
            || v4.is_private()     // 10.x, 172.16-31.x, 192.168.x
            || v4.is_link_local() // 169.254.x.x
        }
        IpAddr::V6(v6) => v6.is_loopback(),
    }
}

/// Extracts the real client IP.
///
/// M-3 security fix: Prefers `X-Real-IP` over `X-Forwarded-For`.
///
/// Rationale:
/// - nginx sets `X-Real-IP = $remote_addr` (the actual TCP peer IP, i.e. the client's IP)
/// - This is reliable in multi-proxy chains (Render LB → nginx → backend) because
///   nginx always overwrites X-Real-IP with the peer it sees.
/// - `X-Forwarded-For` grows by appending each proxy's reported client IP, making
///   "take the last entry" unreliable when there are N proxies in the chain.
///
/// C-5 fix (preserved): `X-Real-IP` and `X-Forwarded-For` are only trusted when
/// the TCP peer is a known private/loopback address.
fn extract_ip(request: &Request, trust_proxy_headers: bool) -> IpAddr {
    if trust_proxy_headers {
        if let Some(real_ip) = request
            .headers()
            .get("X-Real-IP")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.trim().parse::<IpAddr>().ok())
        {
            return real_ip;
        }

        if let Some(forwarded) = request
            .headers()
            .get("X-Forwarded-For")
            .and_then(|v| v.to_str().ok())
            && let Some(ip) = forwarded.split(',').next()
            && let Ok(parsed) = ip.trim().parse::<IpAddr>()
        {
            return parsed;
        }
    }

    // Get the TCP peer address
    let peer_ip = request
        .extensions()
        .get::<ConnectInfo<std::net::SocketAddr>>()
        .map(|ci| ci.0.ip());

    // Honour proxy headers only from trusted private/loopback peers (local nginx)
    if let Some(peer) = peer_ip {
        if is_trusted_proxy(&peer) {
            if let Some(real_ip) = request
                .headers()
                .get("X-Real-IP")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.trim().parse::<IpAddr>().ok())
            {
                return real_ip;
            }

            if let Some(forwarded) = request
                .headers()
                .get("X-Forwarded-For")
                .and_then(|v| v.to_str().ok())
                && let Some(ip) = forwarded.split(',').next()
                && let Ok(parsed) = ip.trim().parse::<IpAddr>()
            {
                return parsed;
            }
        }
        return peer;
    }

    IpAddr::from([127, 0, 0, 1])
}

// ── 429 response ─────────────────────────────────────────────────────────────

fn too_many_requests(endpoint: &str, retry_after_secs: u64) -> Response {
    let body = axum::Json(json!({
        "success": false,
        "error": {
            "code": "RATE_LIMITED",
            "message": format!(
                "Too many requests to {}. Please wait a moment and try again.",
                endpoint
            )
        }
    }));
    // M-12: Include Retry-After so well-behaved clients back off correctly
    let retry_after_val = axum::http::HeaderValue::from_str(&retry_after_secs.to_string())
        .unwrap_or_else(|_| axum::http::HeaderValue::from_static("60"));
    let mut response = (StatusCode::TOO_MANY_REQUESTS, body).into_response();
    response
        .headers_mut()
        .insert("Retry-After", retry_after_val);
    response
}

// ── Middleware functions ─────────────────────────────────────────────────────

/// Rate limiter for POST /api/auth/login
/// Config: 5 attempts burst, then 1 attempt per 10 seconds.
/// Rationale: stops brute-force without blocking a user who fat-fingers once.
pub async fn rate_limit_login(
    State(limiter): State<RateLimiterState>,
    request: Request,
    next: Next,
) -> Response {
    let ip = extract_ip(&request, limiter.trust_proxy_headers());
    if !limiter.is_allowed(ip) {
        tracing::warn!(ip = %ip, "Rate limit hit on /api/auth/login");
        return too_many_requests("/api/auth/login", 10);
    }
    next.run(request).await
}

/// Rate limiter for POST /api/contact
/// Config: 3 submissions burst, then 1 per 30 seconds.
/// Rationale: prevents spam/bot submissions while allowing a human to retry.
pub async fn rate_limit_contact(
    State(limiter): State<RateLimiterState>,
    request: Request,
    next: Next,
) -> Response {
    let ip = extract_ip(&request, limiter.trust_proxy_headers());
    if !limiter.is_allowed(ip) {
        tracing::warn!(ip = %ip, "Rate limit hit on /api/contact");
        return too_many_requests("/api/contact", 30);
    }
    next.run(request).await
}

/// Rate limiter for POST /api/leads
/// Config: 5 submissions burst, then 1 per 20 seconds.
/// Rationale: a legitimate user might submit for multiple family members;
///            still blocks automated scrapers.
pub async fn rate_limit_leads(
    State(limiter): State<RateLimiterState>,
    request: Request,
    next: Next,
) -> Response {
    let ip = extract_ip(&request, limiter.trust_proxy_headers());
    if !limiter.is_allowed(ip) {
        tracing::warn!(ip = %ip, "Rate limit hit on /api/leads");
        return too_many_requests("/api/leads", 20);
    }
    next.run(request).await
}

/// Rate limiter for POST /api/newsletter/subscribe
/// Config: 2 attempts burst, then 1 per 60 seconds.
#[allow(dead_code)]
pub async fn rate_limit_newsletter(
    State(limiter): State<RateLimiterState>,
    request: Request,
    next: Next,
) -> Response {
    let ip = extract_ip(&request, limiter.trust_proxy_headers());
    if !limiter.is_allowed(ip) {
        tracing::warn!(ip = %ip, "Rate limit hit on /api/newsletter/subscribe");
        return too_many_requests("/api/newsletter/subscribe", 60);
    }
    next.run(request).await
}

/// Rate limiter for POST /api/auth/refresh — same limits as login.
pub async fn rate_limit_refresh(
    State(limiter): State<RateLimiterState>,
    request: Request,
    next: Next,
) -> Response {
    let ip = extract_ip(&request, limiter.trust_proxy_headers());
    if !limiter.is_allowed(ip) {
        tracing::warn!(ip = %ip, "Rate limit hit on /api/auth/refresh");
        return too_many_requests("/api/auth/refresh", 10);
    }
    next.run(request).await
}

/// Returns a limiter sized for login: 5-burst, 1 req / 10 s per IP.
pub fn login_limiter(trust_proxy: bool) -> RateLimiterState {
    RateLimiterState::new(5, 0.1, trust_proxy)
}

/// Returns a limiter sized for contact form: 3-burst, 1 req / 30 s per IP.
pub fn contact_limiter(trust_proxy: bool) -> RateLimiterState {
    RateLimiterState::new(3, 1.0 / 30.0, trust_proxy)
}

/// Returns a limiter sized for lead submission: 5-burst, 1 req / 20 s per IP.
pub fn leads_limiter(trust_proxy: bool) -> RateLimiterState {
    RateLimiterState::new(5, 1.0 / 20.0, trust_proxy)
}

/// Returns a limiter sized for newsletter subscribe: 2-burst, 1 req / 60 s per IP.
#[allow(dead_code)]
pub fn newsletter_limiter(trust_proxy: bool) -> RateLimiterState {
    RateLimiterState::new(2, 1.0 / 60.0, trust_proxy)
}

// ── Periodic eviction task ────────────────────────────────────────────────────

/// Spawns a Tokio background task that prunes IPs whose buckets have not been
/// touched in more than 10 minutes.  This prevents unbounded memory growth on
/// long-running servers without needing an external cache.
pub fn spawn_eviction_task(state: RateLimiterState) {
    tokio::spawn(async move {
        let interval = Duration::from_secs(600); // run every 10 minutes
        let max_idle = Duration::from_secs(600);
        loop {
            tokio::time::sleep(interval).await;
            let mut map = state.buckets.lock().unwrap();
            let before = map.len();
            map.retain(|_, bucket| bucket.last_refill.elapsed() < max_idle);
            let removed = before - map.len();
            if removed > 0 {
                tracing::debug!("Rate limiter eviction: removed {removed} idle IP buckets");
            }
        }
    });
}
