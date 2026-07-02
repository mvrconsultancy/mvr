// =============================================================================
// Navigation constants
// =============================================================================

export const CONTACT_FORM_ANCHOR = "contact-form";
export const CONTACT_FORM_HREF = `/contact#${CONTACT_FORM_ANCHOR}`;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Study Abroad",
    href: "/countries",
    children: [
      { label: "USA", href: "/countries/usa" },
      { label: "UK", href: "/countries/uk" },
      { label: "Canada", href: "/countries/canada" },
      { label: "Australia", href: "/countries/australia" },
      { label: "Germany", href: "/countries/germany" },
      { label: "Ireland", href: "/countries/ireland" },
      { label: "All Countries", href: "/countries" },
    ],
  },
  { label: "Services", href: "/services" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Universities", href: "/universities" },
  {
    label: "Visa",
    href: "/visa",
  },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Study Abroad", href: "/countries" },
  { label: "Universities", href: "/universities" },
  { label: "Services", href: "/services" },
  { label: "Visa Assistance", href: "/visa" },
  { label: "Contact Us", href: "/contact" },
];

export const FOOTER_STUDY_ABROAD = [
  { label: "All Countries", href: "/countries" },
  { label: "🇺🇸 USA", href: "/countries/usa" },
  { label: "🇬🇧 UK", href: "/countries/uk" },
  { label: "🇨🇦 Canada", href: "/countries/canada" },
  { label: "🇦🇺 Australia", href: "/countries/australia" },
  { label: "🇩🇪 Germany", href: "/countries/germany" },
  { label: "🇮🇪 Ireland", href: "/countries/ireland" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Blogs & Guides", href: "/blogs" },
];

export const FOOTER_SUPPORT = [
  { label: "FAQ", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Sitemap", href: "/sitemap" },
];

export const OFFICES = [
  {
    id: "address1",
    region: "Telangana (Head Office)",
    city: "Hyderabad",
    lines: [
      "H.No. 15-31-27,",
      "Dharma Reddy Colony,",
      "Ph. 1 MRO Office Lane,",
      "KPHB Colony,",
      "Hyderabad – 500072",
    ],
    mapsQuery:
      "H.No. 15-31-27, Dharma Reddy Colony, KPHB Colony, Hyderabad 500072",
  },
  {
    id: "address2",
    region: "Andhra Pradesh (Head Office)",
    city: "Guntur",
    lines: [
      "D.No. 3-28-41/5, 1st Floor,",
      "4th Lane, Brundavan Gardens,",
      "Y5 Mall Beside Road,",
      "Guntur – 522006",
    ],
    mapsQuery:
      "D.No. 3-28-41/5, 4th Lane Brundavan Gardens, Guntur 522006",
  },
] as const;

const officeAddressLine = (lines: readonly string[]) =>
  lines.join(" ").replace(/\s+/g, " ").trim();

export const CONTACT_INFO = {
  // Primary phones (both numbers from visiting cards)
  phone: "+91 99669 03884",
  phoneAlt: "+91 85999 99331",

  // Official contact emails
  email: "guntur@mvrconsultants.org",
  emailAlt: "mvroverseasconsultancy@gmail.com",
  emails: [
    "guntur@mvrconsultants.org",
    "mvroverseasconsultancy@gmail.com",
  ] as const,

  // Office hours (displayed on contact page and footers)
  officeHours: {
    callSub: "Mon–Sat: 10am – 5pm IST",
    lines: ["Mon–Sat: 10am – 5pm"],
    sunday: "Sunday: Closed",
  },

  // Website
  website: "www.mvrconsultants.org",

  // Managing Director
  md: "Mukkapati Veeranjaneyulu",
  mdTitle: "Managing Director",

  // Hyderabad office (derived from OFFICES)
  address: officeAddressLine(OFFICES[0].lines),

  // Guntur office (derived from OFFICES)
  addressGuntur: officeAddressLine(OFFICES[1].lines),

  socialMedia: {
    facebook:  "https://facebook.com/mvrconsultants",
    instagram: "https://instagram.com/mvrconsultants",
    linkedin:  "https://linkedin.com/company/mvrconsultants",
    youtube:   "https://youtube.com/mvrconsultants",
    // WhatsApp — primary business number, digits-only for wa.me links
    whatsapp:  "919966903884",
  },
};

