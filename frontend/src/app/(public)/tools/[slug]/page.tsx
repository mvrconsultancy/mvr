import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ToolRenderer from "./ToolRenderer";

// ─── Tool metadata ─────────────────────────────────────────────────────────────
const TOOL_META: Record<string, { title: string; description: string; badge: string }> = {
  gpa: {
    title: "GPA Calculator",
    description:
      "Calculate your GPA with semester-wise subject inputs, credit hours, and grade selection. Get instant percentage conversion.",
    badge: "Academic Tools",
  },
  cgpa: {
    title: "CGPA Converter",
    description:
      "Convert your CGPA to percentage and US/UK equivalent grades. Supports all major Indian university scales.",
    badge: "Academic Tools",
  },
  cost: {
    title: "Cost Calculator",
    description:
      "Estimate the full cost of studying abroad — tuition, living expenses, and visa fees for UK, USA, Canada, Australia, Germany, and Finland.",
    badge: "Financial Planning",
  },
  compare: {
    title: "University Compare",
    description:
      "Compare up to 3 universities side-by-side across rankings, fees, intakes, scholarships, and more.",
    badge: "University Research",
  },
  visa: {
    title: "Visa Checklist",
    description:
      "Interactive document checklist for student visas to UK, USA, Canada, Australia, Germany, France, Ireland, and New Zealand.",
    badge: "Visa Guidance",
  },
  currency: {
    title: "Currency Converter",
    description:
      "Convert INR to USD, GBP, EUR, AUD, CAD, SGD, JPY, AED and more with live exchange rates.",
    badge: "Financial Tools",
  },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = TOOL_META[slug];
  if (!meta) return { title: "Tool Not Found | MVR Consultants" };
  return {
    title: `${meta.title} | Student Tools | MVR Consultants`,
    description: meta.description,
  };
}

export function generateStaticParams() {
  return Object.keys(TOOL_META).map((slug) => ({ slug }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const meta = TOOL_META[slug];
  if (!meta) notFound();

  return (
    <>
      {/* ── Hero banner ── */}
      <section className="bg-[#1a2f5e] py-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#c9a84c]/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/#resources"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Student Resources
          </Link>
          <span className="inline-block bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-4">
            {meta.badge}
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {meta.title}
          </h1>
          <p className="text-white/60 text-base max-w-2xl leading-relaxed">
            {meta.description}
          </p>
        </div>
      </section>

      {/* ── Tool (client-side, via ToolRenderer) ── */}
      <section className="bg-gray-50 py-14 min-h-[60vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ToolRenderer slug={slug} />
        </div>
      </section>

      {/* ── Related tools ── */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
            More Student Tools
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(TOOL_META)
              .filter(([s]) => s !== slug)
              .map(([s, m]) => (
                <Link
                  key={s}
                  href={`/tools/${s}`}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#1a2f5e] hover:border-[#c9a84c] hover:bg-[#fef9f0] transition-all"
                >
                  {m.title}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
