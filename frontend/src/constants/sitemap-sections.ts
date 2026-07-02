import { ALL_COUNTRIES } from "@/constants/countries";

export type SitemapLink = { label: string; href: string };

export type SitemapSection = {
  title: string;
  links: readonly SitemapLink[];
};

export const FOOTER_STUDENT_TOOLS: readonly SitemapLink[] = [
  { label: "GPA Calculator", href: "/tools/gpa" },
  { label: "CGPA Converter", href: "/tools/cgpa" },
  { label: "Cost Calculator", href: "/tools/cost" },
  { label: "University Compare", href: "/tools/compare" },
  { label: "Visa Checklist", href: "/tools/visa" },
  { label: "Currency Converter", href: "/tools/currency" },
];

export const SITEMAP_SECTIONS: readonly SitemapSection[] = [
  {
    title: "Main Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Scholarships", href: "/scholarships" },
      { label: "Universities", href: "/universities" },
      { label: "Testimonials", href: "/testimonials" },
      { label: "Blogs", href: "/blogs" },
      { label: "Courses", href: "/courses" },
      { label: "Eligibility", href: "/eligibility" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Study Destinations",
    links: [
      { label: "All Countries", href: "/countries" },
      ...ALL_COUNTRIES.map((c) => ({
        label: c.name,
        href: c.href,
      })),
    ],
  },
  {
    title: "Services",
    links: [
      { label: "All Services", href: "/services" },
      { label: "Career Counseling", href: "/services/career" },
      { label: "University Selection", href: "/services/university" },
      { label: "Application Support", href: "/services/application" },
      { label: "Scholarship Assistance", href: "/services/scholarship" },
      { label: "Visa Assistance", href: "/services/visa" },
      { label: "Education Loan", href: "/services/loan" },
      { label: "Pre-Departure", href: "/services/pre-departure" },
      { label: "Accommodation", href: "/services/accommodation" },
    ],
  },
  {
    title: "Student Tools",
    links: FOOTER_STUDENT_TOOLS,
  },
  {
    title: "Support",
    links: [
      { label: "Visa Guidance", href: "/visa" },
      { label: "FAQ", href: "/faq" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
] as const;
