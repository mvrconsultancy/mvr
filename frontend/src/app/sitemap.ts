import type { MetadataRoute } from "next";
import { ALL_COUNTRIES } from "@/constants/countries";
import { apiUrl } from "@/lib/api-url";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://www.mvrconsultants.org";

import { UNIVERSITIES } from "@/data/universities";

// Derived from ALL_COUNTRIES — single source of truth.
// Adding a country to constants/countries.ts auto-includes it in the sitemap.
const COUNTRY_SLUGS = ALL_COUNTRIES.map((c) => c.id);

// Dynamic course slugs matching the homepage links
const COURSE_DISCIPLINE_SLUGS = ["engineering", "business", "cs", "medicine", "law", "design"];

// Mock blog slugs used as a fallback when the API is unreachable
const MOCK_BLOG_SLUGS = [
  "how-to-get-uk-student-visa",
  "top-scholarships-indian-students",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch all published blog slugs from the backend. Falls back to mock data. */
async function getBlogSlugs(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(apiUrl("/api/blogs?per_page=500"), {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`API responded with ${res.status}`);

    const data = await res.json();

    // Handle both array response and { data: [] } envelope
    const blogs: Array<{ slug: string }> = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const slugs = blogs
      .map((b) => b?.slug)
      .filter((s): s is string => typeof s === "string" && s.length > 0);

    return slugs.length > 0 ? slugs : [...MOCK_BLOG_SLUGS];
  } catch {
    // API is down or timed-out — use mock slugs so the sitemap always builds
    return [...MOCK_BLOG_SLUGS];
  }
}

// ---------------------------------------------------------------------------
// Static public routes — add new pages here as the site grows
// ---------------------------------------------------------------------------
interface StaticRoute {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified?: Date;
}

const STATIC_ROUTES: StaticRoute[] = [
  // ── Homepage ────────────────────────────────────────────────────────────
  { path: "/",            priority: 1.0, changeFrequency: "weekly" },

  // ── Main pages (0.8) ────────────────────────────────────────────────────
  { path: "/about",       priority: 0.8, changeFrequency: "monthly" },
  { path: "/services",    priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact",     priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries",   priority: 0.8, changeFrequency: "weekly"  },
  { path: "/courses",     priority: 0.8, changeFrequency: "weekly"  },
  { path: "/eligibility", priority: 0.8, changeFrequency: "weekly"  },
  { path: "/blogs",       priority: 0.8, changeFrequency: "daily"   },

  // ── Service detail pages (0.75) ─────────────────────────────────────────
  { path: "/services/career",        priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/university",    priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/application",   priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/scholarship",   priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/visa",          priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/loan",          priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/pre-departure", priority: 0.75, changeFrequency: "monthly" },
  { path: "/services/accommodation", priority: 0.75, changeFrequency: "monthly" },

  // ── Secondary pages (0.7) ───────────────────────────────────────────────
  { path: "/scholarships",  priority: 0.7, changeFrequency: "weekly"  },
  { path: "/testimonials", priority: 0.7, changeFrequency: "weekly"  },
  { path: "/universities",  priority: 0.7, changeFrequency: "weekly"  },
  { path: "/visa",          priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq",           priority: 0.7, changeFrequency: "monthly" },

  // ── Student resource tools (0.65) ───────────────────────────────────────
  { path: "/tools/gpa",      priority: 0.65, changeFrequency: "yearly" },
  { path: "/tools/cgpa",     priority: 0.65, changeFrequency: "yearly" },
  { path: "/tools/cost",     priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/compare",  priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/visa",     priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/currency", priority: 0.65, changeFrequency: "daily"  },

  // ── Legal / support (0.5) ───────────────────────────────────────────────
  { path: "/sitemap",     priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy",     priority: 0.5, changeFrequency: "yearly"  },
  { path: "/terms",       priority: 0.5, changeFrequency: "yearly"  },
];


// ---------------------------------------------------------------------------
// Sitemap export — Next.js calls this at build time (or on-demand with ISR)
// ---------------------------------------------------------------------------
export const revalidate = 3600; // Regenerate the sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── 1. Static routes ──────────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: route.lastModified ?? now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // ── 2. Country detail pages (/countries/[slug]) ───────────────────────────
  const countryEntries: MetadataRoute.Sitemap = COUNTRY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/countries/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // ── 3. Blog detail pages (/blogs/[slug]) — fetched dynamically ────────────
  const blogSlugs = await getBlogSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blogs/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // ── 4. University profile pages (/universities/[slug]) — dynamic ─────────
  const universityEntries: MetadataRoute.Sitemap = UNIVERSITIES.map((uni) => ({
    url: `${BASE_URL}/universities/${uni.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // ── 5. Course discipline guides (/courses/[slug]) — dynamic ──────────────
  const courseDisciplineEntries: MetadataRoute.Sitemap = COURSE_DISCIPLINE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/courses/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // ── 6. Merge & deduplicate by URL ─────────────────────────────────────────
  const allEntries = [
    ...staticEntries,
    ...countryEntries,
    ...blogEntries,
    ...universityEntries,
    ...courseDisciplineEntries,
  ];

  const seen = new Set<string>();
  const deduped = allEntries.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  return deduped;
}

