import { Metadata } from "next";
import { notFound } from "next/navigation";
import CountryDetailClient from "./CountryDetailClient";
import type { CountryData } from "@/types/country";
import { ALL_COUNTRIES } from "@/constants/countries";
import { apiUrl } from "@/lib/api-url";
import { normalizeCountryImages } from "@/lib/country-images";

type Props = { params: Promise<{ slug: string }> };

async function fetchCountryFromApi(slug: string): Promise<CountryData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(apiUrl(`/api/countries/${slug}`), {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json?.data) return json.data as CountryData;
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

async function fetchCountryFromStatic(slug: string): Promise<CountryData | null> {
  try {
    const data = await import(`@/data/countries/${slug}.json`);
    return data.default as CountryData;
  } catch {
    return null;
  }
}

async function getCountryData(slug: string): Promise<CountryData | null> {
  const [fromApi, fromStatic] = await Promise.all([
    fetchCountryFromApi(slug),
    fetchCountryFromStatic(slug),
  ]);
  const country = fromApi ?? fromStatic;
  if (!country) return null;

  if (fromStatic?.images?.length) {
    country.images = fromStatic.images;
    if (fromStatic.heroImage) country.heroImage = fromStatic.heroImage;
  }

  return normalizeCountryImages(slug, country);
}

async function fetchCountrySlugs(): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(apiUrl("/api/countries"), {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    const slugs = (json?.data as Array<{ slug: string }> | undefined)
      ?.map((c) => c.slug)
      .filter(Boolean);
    if (slugs && slugs.length > 0) return slugs;
  } catch {
    clearTimeout(timeoutId);
  }
  return ALL_COUNTRIES.map((c) => c.id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const country = await getCountryData(slug);

  if (!country) {
    return { title: "Country Not Found | MVR Consultants" };
  }

  return {
    title: `Study in ${country.name} | Fees, Visa & Scholarships | MVR Consultants`,
    description: `${country.description} Explore top universities, tuition fees, visa requirements, scholarships, and work permit rules for Indian students studying in ${country.name}.`,
    keywords: [
      `study in ${country.name}`,
      `${country.name} student visa`,
      `${country.name} universities`,
      `${country.name} scholarships`,
      `study abroad ${country.name}`,
      `${country.name} tuition fees`,
      `${country.name} work permit`,
    ],
    openGraph: {
      title: `Study in ${country.name} | MVR Consultants`,
      description: country.description,
      images: [{ url: country.heroImage, width: 1200, height: 630, alt: `Study in ${country.name}` }],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await fetchCountrySlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function CountryDetailPage({ params }: Props) {
  const { slug } = await params;
  const country = await getCountryData(slug);

  if (!country) {
    notFound();
  }

  return <CountryDetailClient slug={slug} country={country} />;
}
