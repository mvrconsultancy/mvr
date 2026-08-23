/**
 * API integration smoke tests. Usage: node scripts/qa-api-smoke.mjs [baseUrl]
 * Default: production backend direct
 */
const base = process.argv[2] || "https://mvr-umqq.onrender.com";

async function req(method, path, body) {
  const url = `${base}${path}`;
  const init = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, json, headers: res.headers };
}

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
}

try {
  const health = await req("GET", "/health");
  record("GET /health", health.status === 200, `status ${health.status}`);

  for (const ep of [
    "/api/countries",
    "/api/universities",
    "/api/blogs",
    "/api/scholarships",
    "/api/testimonials",
  ]) {
    const r = await req("GET", ep);
    const hasData = r.json?.success && Array.isArray(r.json?.data);
    record(`GET ${ep}`, r.status === 200 && hasData, `status ${r.status}, items ${r.json?.data?.length ?? 0}`);
  }

  const canada = await req("GET", "/api/countries/canada");
  const hasImages = canada.json?.data?.content?.images?.length > 0 || canada.json?.data?.images?.length > 0;
  record(
    "GET /api/countries/canada",
    canada.status === 200 && canada.json?.success,
    `status ${canada.status}, images=${hasImages}`
  );

  const contactEmpty = await req("POST", "/api/contact", {});
  record("POST /api/contact empty", contactEmpty.status === 400 || contactEmpty.status === 422, `status ${contactEmpty.status}`);

  const leadsEmpty = await req("POST", "/api/leads", {});
  record("POST /api/leads empty", leadsEmpty.status === 400 || leadsEmpty.status === 422, `status ${leadsEmpty.status}`);

  const badLogin = await req("POST", "/api/auth/login", { email: "bad@test.com", password: "wrong" });
  record("POST /api/auth/login bad creds", badLogin.status === 401 || badLogin.status === 400, `status ${badLogin.status}`);

  const meNoAuth = await req("GET", "/api/auth/me");
  record("GET /api/auth/me no cookie", meNoAuth.status === 401, `status ${meNoAuth.status}`);

  const adminNoAuth = await req("GET", "/api/admin/stats");
  record("GET /api/admin/stats no cookie", adminNoAuth.status === 401, `status ${adminNoAuth.status}`);
} catch (e) {
  console.error("API smoke aborted:", e.message);
  process.exit(1);
}

const failed = checks.filter((c) => !c.ok);
if (failed.length) process.exit(1);
console.log(`\nAll ${checks.length} API checks passed.`);
