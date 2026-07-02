"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube } from "@icons-pack/react-simple-icons";
import {
  CONTACT_INFO,
  FOOTER_QUICK_LINKS,
  FOOTER_STUDY_ABROAD,
  FOOTER_SUPPORT,
} from "@/constants/navigation";
import { FOOTER_STUDENT_TOOLS } from "@/constants/sitemap-sections";
import OfficeAddresses from "@/components/contact/OfficeAddresses";
import ContactEmails from "@/components/contact/ContactEmails";

// LinkedIn not in this simple-icons version — inline SVG matches official shape
function IconLinkedin() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// ─── Brand definitions ────────────────────────────────────────────────────────
type SocialDef = {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** solid bg color (hex) — null = use gradient */
  bg: string | null;
  /** gradient string for Instagram */
  gradient?: string;
  /** glow color for box-shadow */
  glow: string;
};

const SOCIAL_DEFS: SocialDef[] = [
  {
    label: "Facebook",
    href: CONTACT_INFO.socialMedia.facebook,
    icon: <SiFacebook size={18} />,
    bg: "#1877F2",
    glow: "rgba(24,119,242,0.55)",
  },
  {
    label: "Instagram",
    href: CONTACT_INFO.socialMedia.instagram,
    icon: <SiInstagram size={18} />,
    bg: null,
    gradient: "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)",
    glow: "rgba(221,42,123,0.55)",
  },
  {
    label: "LinkedIn",
    href: CONTACT_INFO.socialMedia.linkedin,
    icon: <IconLinkedin />,
    bg: "#0A66C2",
    glow: "rgba(10,102,194,0.55)",
  },
  {
    label: "YouTube",
    href: CONTACT_INFO.socialMedia.youtube,
    icon: <SiYoutube size={18} />,
    bg: "#FF0000",
    glow: "rgba(255,0,0,0.50)",
  },
];

// ─── Premium animated social icon ─────────────────────────────────────────────
function SocialIcon({ def }: { def: SocialDef }) {
  const [hovered, setHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    background: hovered
      ? def.bg ?? "transparent"
      : "rgba(255,255,255,0.07)",
    border: hovered
      ? "1.5px solid transparent"
      : "1.5px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(8px)",
    boxShadow: hovered
      ? `0 0 18px 4px ${def.glow}, 0 4px 20px rgba(0,0,0,0.3)`
      : "0 2px 8px rgba(0,0,0,0.25)",
    color: hovered ? "#fff" : "rgba(255,255,255,0.55)",
    transition:
      "background 0.3s ease, box-shadow 0.3s ease, border 0.3s ease, color 0.3s ease",
  };

  const gradientOverlay: React.CSSProperties | null =
    def.gradient
      ? {
        position: "absolute",
        inset: 0,
        background: def.gradient,
        borderRadius: "50%",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.3s ease",
        zIndex: 0,
      }
      : null;

  const iconWrap: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <motion.a
      href={def.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={def.label}
      title={def.label}
      style={containerStyle}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
    >
      {gradientOverlay && <div style={gradientOverlay} />}
      <span style={iconWrap}>{def.icon}</span>
    </motion.a>
  );
}

// ─── Footer column component ──────────────────────────────────────────────────
function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-white/60 hover:text-[#c9a84c] text-sm transition-colors duration-150 flex items-center gap-1.5 group"
            >
              <ArrowRight
                size={11}
                className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150"
              />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main footer ──────────────────────────────────────────────────────────────
export default function SiteFooter() {
  return (
    <footer className="bg-[#0f1c3d]">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 lg:items-start">

          {/* Brand column */}
          <div className="lg:col-span-5">
            {/* Logo — same clipping approach as navbar, inverted white for dark bg */}
            <Link href="/" className="flex items-center shrink-0 mb-5">
              <div
                style={{
                  width: "260px",
                  height: "95px",
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/favicon-removebg-preview.png"
                  alt="MVR Consultants — Abroad Education"
                  width={1536}
                  height={1024}
                  style={{
                    width: "245px",
                    height: "163px",
                    position: "absolute",
                    top: "-31px",
                    left: "0",
                    filter: "brightness(0) invert(1)",
                  }}
                  unoptimized
                  priority
                />
              </div>
            </Link>

            <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-sm">
              Empowering students to achieve their dream of studying abroad
              with expert guidance on admissions, visas, scholarships, and
              more. 10 years of trust.
            </p>

            {/* Social media buttons — premium animated */}
            <div className="flex items-center gap-3 mb-7">
              {SOCIAL_DEFS.map((def) => (
                <SocialIcon key={def.label} def={def} />
              ))}
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className="flex items-center gap-3 text-white/60 hover:text-white text-sm transition-colors group"
              >
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#c9a84c] transition-colors">
                  <Phone size={13} />
                </span>
                {CONTACT_INFO.phone}
              </a>
              <ContactEmails variant="inline" />
              <p className="text-white/50 text-xs pl-11">
                {CONTACT_INFO.mdTitle}: {CONTACT_INFO.md}
              </p>
              <OfficeAddresses variant="footer" />
            </div>
          </div>

          {/* Link columns — 4 equal columns filling the right side */}
          <div className="lg:col-span-7 grid w-full grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            <FooterColumn title="Quick Links" links={FOOTER_QUICK_LINKS} />
            <FooterColumn title="Study Abroad" links={FOOTER_STUDY_ABROAD} />
            <FooterColumn title="Student Tools" links={[...FOOTER_STUDENT_TOOLS]} />
            <FooterColumn title="Support" links={FOOTER_SUPPORT} />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs text-center">
            © {new Date().getFullYear()} MVR Consultants. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Crafted with ❤️ for aspiring students worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
