"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const RESOURCES = [
  {
    id: "gpa",
    label: "GPA Calculator",
    href: "/tools/gpa",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <rect x="6" y="6" width="32" height="32" rx="4" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M6 16h32" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M16 6v32" stroke="#1a2f5e" strokeWidth="1.5"/>
        <text x="20" y="30" fontSize="9" fontWeight="bold" fill="#c9a84c">%</text>
        <text x="8" y="28" fontSize="8" fill="#1a2f5e">4.0</text>
      </svg>
    ),
  },
  {
    id: "cgpa",
    label: "CGPA Converter",
    href: "/tools/cgpa",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <path d="M12 32c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#1a2f5e" strokeWidth="1.5"/>
        <circle cx="22" cy="18" r="6" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M8 22h4M32 22h4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 8v4M22 34v4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "cost",
    label: "Cost Calculator",
    href: "/tools/cost",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <rect x="8" y="10" width="28" height="24" rx="3" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M8 18h28" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M16 24h4M24 24h4M16 30h4M24 30h4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="12" y="22" width="6" height="10" rx="1" fill="#c9a84c" fillOpacity="0.15"/>
      </svg>
    ),
  },
  {
    id: "compare",
    label: "University Compare",
    href: "/tools/compare",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <rect x="6" y="14" width="14" height="20" rx="2" stroke="#1a2f5e" strokeWidth="1.5"/>
        <rect x="24" y="10" width="14" height="24" rx="2" stroke="#c9a84c" strokeWidth="1.5"/>
        <path d="M20 22h4" stroke="#1a2f5e" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 22a7 7 0 1 0 0-14 7 7 0 0 0 0 14" stroke="#1a2f5e" strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    id: "visa",
    label: "Visa Checklist",
    href: "/tools/visa",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <rect x="6" y="10" width="32" height="24" rx="3" stroke="#1a2f5e" strokeWidth="1.5"/>
        <circle cx="16" cy="22" r="5" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M26 17h8M26 22h8M26 27h5" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 22l2 2 3-3" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "currency",
    label: "Currency Converter",
    href: "/tools/currency",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <circle cx="22" cy="22" r="16" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M16 18c0-3 2-5 6-5s6 2 6 5-2 4-6 4-6 2-6 5 2 5 6 5 6-2 6-5" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 12v2M22 30v2" stroke="#1a2f5e" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "blog",
    label: "Blog & News",
    href: "/blogs",
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="w-9 h-9 mx-auto">
        <rect x="6" y="8" width="32" height="28" rx="3" stroke="#1a2f5e" strokeWidth="1.5"/>
        <path d="M6 18h32" stroke="#1a2f5e" strokeWidth="1.5"/>
        <rect x="12" y="24" width="10" height="6" rx="1" fill="#c9a84c" fillOpacity="0.3" stroke="#c9a84c" strokeWidth="1"/>
        <path d="M26 24h8M26 28h5" stroke="#1a2f5e" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function StudentResourcesSection() {
  return (
    <section className="py-14 bg-white" id="resources">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-2xl font-bold text-[#1a2f5e] tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Student Resources
          </h2>
          <div className="w-16 h-0.5 bg-[#c9a84c] mx-auto" />
        </motion.div>

        {/* 8-tile row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {RESOURCES.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link href={res.href}>
                <div className="group flex flex-col items-center py-6 px-2 bg-[#f8f9fc] rounded-lg border border-gray-100 hover:border-[#c9a84c]/50 hover:bg-[#fef9f0] hover:shadow-sm transition-all duration-200 cursor-pointer text-center h-full">
                  <div className="mb-3 group-hover:scale-105 transition-transform duration-200">
                    {res.icon}
                  </div>
                  <p className="text-[#1a2f5e] text-xs font-semibold leading-tight group-hover:text-[#c9a84c] transition-colors">
                    {res.label}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
