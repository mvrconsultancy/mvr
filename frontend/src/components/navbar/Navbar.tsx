"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_COUNTRIES } from "@/constants/countries";
import { CONTACT_FORM_HREF } from "@/constants/navigation";
import { CountryFlag } from "@/components/ui/CountryFlag";

// ─── Types ────────────────────────────────────────────────────────────────────
type NavChild = { label: string; href: string; countrySlug?: string };
type NavItem = {
  label: string;
  href: string;
  children?: ReadonlyArray<NavChild>;
};

// ─── Build nav items (Study Abroad children derived from ALL_COUNTRIES) ────────
const STUDY_ABROAD_CHILDREN: NavChild[] = [
  ...ALL_COUNTRIES.map((c) => ({ label: c.name, href: c.href, countrySlug: c.id })),
  { label: "🌍 All Destinations", href: "/countries" },
];

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Study Abroad",
    href: "/countries",
    children: STUDY_ABROAD_CHILDREN,
  },
  { label: "Services", href: "/services" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Universities", href: "/universities" },
  { label: "Visa", href: "/visa" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: CONTACT_FORM_HREF },
];

// ─── Dropdown menu ─────────────────────────────────────────────────────────────
function NavDropdown({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
      style={{ animation: "hero-fade-up 0.18s ease-out forwards" }}
    >
      {/* Scrollable list for large country sets */}
      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        {item.children?.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fdf8ef] hover:text-[#1a2f5e] font-medium transition-colors duration-150 border-b border-gray-50 last:border-0"
          >
            {child.countrySlug ? (
              <>
                <CountryFlag slug={child.countrySlug} size="sm" />
                <span>{child.label}</span>
              </>
            ) : (
              child.label
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Desktop nav item ──────────────────────────────────────────────────────────
function DesktopNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="text-sm font-semibold hover:text-[#c9a84c] transition-colors duration-200 whitespace-nowrap"
        style={{ color: "#1a2f5e" }}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-semibold hover:text-[#c9a84c] transition-colors duration-200 whitespace-nowrap"
        style={{ color: "#1a2f5e" }}
      >
        {item.label}
        <ChevronDown
          size={13}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <NavDropdown item={item} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Main navbar ── */}
      {/* CSS navbar-slide-down animation replaces Framer Motion (blocked by prod CSP) */}
      <header
        className="navbar-animate sticky top-0 z-40"
        style={{
          background:
            "linear-gradient(135deg, #fdf8ef 0%, #fef9f0 40%, #fff8e8 100%)",
          borderBottom: "1px solid rgba(201,168,76,0.18)",
          boxShadow: "0 2px 16px rgba(26,47,94,0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-[90px] lg:h-[100px]">
            {/* Logo — clip the empty SVG whitespace above/below the logo content */}
            <Link href="/" className="flex items-center shrink-0">
              <div className="w-[260px] xl:w-[280px] 2xl:w-[320px] h-[116px] overflow-hidden relative shrink-0">
                {/* The SVG is 1536×1024. At width=320px → rendered height ≈ 213px.
                    Logo content sits roughly at y=40px–140px of rendered height.
                    We shift up by 38px so logo is centered in the 90px window. */}
                <Image
                  src="/favicon-removebg-preview.png"
                  alt="MVR Consultants — Abroad Education"
                  width={1536}
                  height={1024}
                  className="absolute top-[-38px] left-0 w-[244px] xl:w-[263px] 2xl:w-[300px] h-[200px]"
                  style={{ mixBlendMode: "multiply" }}
                  unoptimized
                  priority
                />
              </div>
            </Link>

            {/* Desktop nav + CTA + hamburger */}
            <div className="flex items-center gap-5 xl:gap-6 shrink-0 ml-auto">
              <nav className="hidden xl:flex items-center gap-4 2xl:gap-5">
                {NAV_ITEMS.map((item) => (
                  <DesktopNavItem key={item.href} item={item} />
                ))}
              </nav>
              <Link
                href={CONTACT_FORM_HREF}
                className="hidden md:block shrink-0 relative z-10 xl:pl-5 xl:border-l xl:border-[#1a2f5e]/15"
              >
                <Button
                  size="sm"
                  className="text-white font-bold px-5 text-xs rounded-none transition-all duration-200 tracking-widest hover:opacity-90"
                  style={{ background: "#1a2f5e" }}
                >
                  APPLY NOW →
                </Button>
              </Link>
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="xl:hidden p-2 rounded-lg transition-colors"
                style={{ color: "#1a2f5e" }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
          {mobileOpen && (
            <div
              className="xl:hidden border-t overflow-y-auto max-h-[calc(100vh-70px)]"
              style={{
                background:
                  "linear-gradient(135deg, #fdf8ef 0%, #fff8e8 100%)",
                borderColor: "rgba(201,168,76,0.2)",
              }}
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <div key={item.href}>
                    {item.children ? (
                      <>
                        <button
                          onClick={() =>
                            setMobileExpanded((p) =>
                              p === item.label ? null : item.label
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-white/60"
                          style={{ color: "#1a2f5e" }}
                        >
                          {item.label}
                          <ChevronDown
                            size={15}
                            className={cn(
                              "transition-transform duration-200",
                              mobileExpanded === item.label && "rotate-180"
                            )}
                          />
                        </button>
                        {mobileExpanded === item.label && (
                            <div
                              className="overflow-hidden ml-3 border-l-2 pl-3"
                              style={{
                                borderColor: "rgba(201,168,76,0.4)",
                              }}
                            >
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-2 py-2 text-sm font-medium hover:text-[#c9a84c]"
                                  style={{ color: "#4b5563" }}
                                >
                                  {child.countrySlug ? (
                                    <>
                                      <CountryFlag slug={child.countrySlug} size="sm" />
                                      <span>{child.label}</span>
                                    </>
                                  ) : (
                                    child.label
                                  )}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-white/60 hover:text-[#c9a84c]"
                        style={{ color: "#1a2f5e" }}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
                <div className="pt-3 pb-2">
                  <Link href={CONTACT_FORM_HREF} onClick={() => setMobileOpen(false)}>
                    <Button
                      className="w-full text-white font-bold rounded-none"
                      style={{ background: "#1a2f5e" }}
                    >
                      APPLY NOW →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
      </header>
    </>
  );
}
