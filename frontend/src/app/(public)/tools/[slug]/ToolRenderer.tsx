"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 size={28} className="animate-spin text-[#c9a84c]" />
  </div>
);

const GpaCalculator     = dynamic(() => import("@/components/tools/GpaCalculator"),     { ssr: false, loading: Loading });
const CgpaConverter     = dynamic(() => import("@/components/tools/CgpaConverter"),     { ssr: false, loading: Loading });
const CostCalculator    = dynamic(() => import("@/components/tools/CostCalculator"),    { ssr: false, loading: Loading });
const UniversityCompare = dynamic(() => import("@/components/tools/UniversityCompare"), { ssr: false, loading: Loading });
const VisaChecklist     = dynamic(() => import("@/components/tools/VisaChecklist"),     { ssr: false, loading: Loading });
const CurrencyConverter = dynamic(() => import("@/components/tools/CurrencyConverter"), { ssr: false, loading: Loading });

const MAP: Record<string, React.ComponentType> = {
  gpa:      GpaCalculator,
  cgpa:     CgpaConverter,
  cost:     CostCalculator,
  compare:  UniversityCompare,
  visa:     VisaChecklist,
  currency: CurrencyConverter,
};

export default function ToolRenderer({ slug }: { slug: string }) {
  const Tool = MAP[slug];
  if (!Tool) return null;
  // Suspense boundary required for useSearchParams() in UniversityCompare (BUG-021)
  return (
    <Suspense fallback={<Loading />}>
      <Tool />
    </Suspense>
  );
}

