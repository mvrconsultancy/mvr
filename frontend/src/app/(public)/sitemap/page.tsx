import type { Metadata } from "next";
import Link from "next/link";
import { SITEMAP_SECTIONS } from "@/constants/sitemap-sections";

export const metadata: Metadata = {
  title: "Sitemap | MVR Consultants",
  description:
    "Browse all pages on MVR Consultants — study abroad destinations, services, student tools, and support resources.",
};

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-3">
            Navigation
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-[#1a2f5e] mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Site <span className="text-[#c9a84c]">Map</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Browse all pages on MVR Consultants — destinations, services, tools, and support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SITEMAP_SECTIONS.map((section) => (
            <section
              key={section.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
              <h2 className="text-[#1a2f5e] font-bold text-sm uppercase tracking-wider mb-4">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-[#c9a84c] text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-12">
          Search engines can also use our{" "}
          <Link href="/sitemap.xml" className="text-[#c9a84c] hover:underline">
            XML sitemap
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
