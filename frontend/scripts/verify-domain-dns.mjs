#!/usr/bin/env node
/**
 * Verify mvrconsultants.org DNS and HTTP headers match Vercel expectations.
 * Run after Hostinger DNS changes: node scripts/verify-domain-dns.mjs
 */
const VERCEL_CNAME_SUFFIX = "vercel-dns";
const EXPECTED_WWW_CNAME = "38a1e8e29e879bb4.vercel-dns-017.com";

async function resolveCname(hostname) {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=CNAME`,
      { headers: { Accept: "application/dns-json" } },
    );
    const data = await res.json();
    const answers = data.Answer ?? [];
    return answers.filter((a) => a.type === 5).map((a) => a.data.replace(/\.$/, ""));
  } catch {
    return [];
  }
}

async function head(url) {
  const res = await fetch(url, { method: "HEAD", redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), server: res.headers.get("server") };
}

let failed = 0;

const wwwCnames = await resolveCname("www.mvrconsultants.org");
if (wwwCnames.some((c) => c.includes(VERCEL_CNAME_SUFFIX))) {
  console.log("PASS  www CNAME points to Vercel:", wwwCnames.join(", "));
} else if (wwwCnames.length === 0) {
  console.log("WARN  www has no CNAME (may still be apex alias — check Hostinger)");
  console.log("      Expected CNAME target:", EXPECTED_WWW_CNAME);
  failed++;
} else {
  console.log("FAIL  www CNAME wrong:", wwwCnames.join(", "));
  console.log("      Delete www CNAME → mvrconsultants.org");
  console.log("      Add    www CNAME →", EXPECTED_WWW_CNAME);
  failed++;
}

const www = await head("https://www.mvrconsultants.org/");
if (www.status === 200 && !www.location) {
  console.log("PASS  https://www.mvrconsultants.org/ → 200, Server:", www.server ?? "(none)");
} else {
  console.log("FAIL  www:", www.status, www.location ?? "");
  failed++;
}

const apex = await head("https://mvrconsultants.org/");
if (apex.status >= 300 && apex.status < 400 && apex.location?.includes("www.mvrconsultants.org")) {
  console.log("PASS  apex redirects to www:", apex.status, apex.location);
} else {
  console.log("WARN  apex:", apex.status, apex.location ?? "(no redirect)");
}

for (const path of ["/health", "/api/countries/uk", "/admin/login"]) {
  const r = await head(`https://www.mvrconsultants.org${path}`);
  if (r.status === 200) console.log(`PASS  ${path} → 200`);
  else {
    console.log(`FAIL  ${path} → ${r.status}`);
    failed++;
  }
}

process.exit(failed > 0 ? 1 : 0);
