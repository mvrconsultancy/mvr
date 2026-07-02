/**
 * HTTP smoke test for public routes. Usage: node scripts/qa-route-smoke.mjs [baseUrl]
 */
const base = process.argv[2] || "http://localhost:3001";

const staticRoutes = [
  "/",
  "/about",
  "/contact",
  "/countries",
  "/universities",
  "/scholarships",
  "/blogs",
  "/services",
  "/courses",
  "/visa",
  "/eligibility",
  "/faq",
  "/testimonials",
  "/sitemap",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/admin/login",
];

const dynamicRoutes = [
  "/countries/canada",
  "/countries/usa",
  "/countries/ireland",
  "/countries/germany",
  "/countries/australia",
  "/universities/mit",
  "/universities/stanford",
  "/blogs/how-to-get-uk-student-visa",
  "/blogs/top-scholarships-indian-students",
  "/tools/gpa",
  "/tools/cgpa",
  "/tools/cost",
  "/tools/compare",
  "/tools/visa",
  "/tools/currency",
  "/services/application",
  "/services/career",
  "/services/university",
  "/services/visa",
  "/courses/cs",
  "/courses/engineering",
];

const adminGated = ["/admin", "/admin/leads", "/admin/blogs"];

async function check(path, expectStatus) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = expectStatus ? res.status === expectStatus : res.status === 200;
    if (!ok) {
      return { path, status: res.status, ok: false, note: `expected ${expectStatus ?? 200}` };
    }
    return { path, status: res.status, ok: true };
  } catch (e) {
    return { path, status: 0, ok: false, note: e.message };
  }
}

const routes = [...staticRoutes, ...dynamicRoutes];
const results = [];

for (const path of routes) {
  results.push(await check(path));
}

for (const path of adminGated) {
  results.push(await check(path, 307)); // middleware redirect to login
}

const failed = results.filter((r) => !r.ok);
console.log(`Base: ${base}`);
console.log(`Checked: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
if (failed.length) {
  for (const f of failed) {
    console.error(`FAIL ${f.path} -> ${f.status} ${f.note ?? ""}`);
  }
  process.exit(1);
}
console.log("All route smoke checks passed.");
