import { MapPin } from "lucide-react";
import { OFFICES } from "@/constants/navigation";

type OfficeAddressesProps = {
  variant: "card" | "footer";
  showDirections?: boolean;
};

function mapsUrl(query: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

function OfficeBlock({
  office,
  variant,
  showDirections,
}: {
  office: (typeof OFFICES)[number];
  variant: "card" | "footer";
  showDirections?: boolean;
}) {
  if (variant === "footer") {
    return (
      <div className="min-w-0">
        <p className="text-white/80 text-xs font-bold uppercase tracking-wide">
          {office.region}
        </p>
        <p className="text-[#c9a84c] text-xs font-bold uppercase tracking-wide mb-1">
          {office.city}
        </p>
        <p className="text-white/60 text-sm leading-relaxed">
          {office.lines.join(", ")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-[#1a2f5e] uppercase tracking-wide">
        {office.region}
      </p>
      <p className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider mb-2">
        {office.city}
      </p>
      <p className="text-gray-700 text-sm leading-relaxed">
        {office.lines.map((line, i) => (
          <span key={line}>
            {line}
            {i < office.lines.length - 1 && <br />}
          </span>
        ))}
      </p>
      {showDirections && (
        <a
          href={mapsUrl(office.mapsQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#c9a84c] text-xs font-semibold mt-1.5 hover:underline"
        >
          <MapPin size={11} /> Get Directions →
        </a>
      )}
    </div>
  );
}

export default function OfficeAddresses({
  variant,
  showDirections = false,
}: OfficeAddressesProps) {
  if (variant === "footer") {
    return (
      <div className="flex items-start gap-3 text-sm">
        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={13} />
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 min-w-0 flex-1">
          {OFFICES.map((office) => (
            <OfficeBlock
              key={office.id}
              office={office}
              variant="footer"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-6 md:divide-x md:divide-[#c9a84c]/40 gap-6">
      {OFFICES.map((office) => (
        <OfficeBlock
          key={office.id}
          office={office}
          variant="card"
          showDirections={showDirections}
        />
      ))}
    </div>
  );
}
