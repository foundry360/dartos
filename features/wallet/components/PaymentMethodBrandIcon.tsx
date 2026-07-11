import Image from "next/image";
import { cn } from "@/utils/cn";

interface PaymentMethodBrandIconProps {
  brand: string | null;
  className?: string;
}

const CARD_BRAND_ICONS: Record<string, { src: string; label: string }> = {
  visa: { src: "/wallet/card-brands/visa.png", label: "Visa" },
  mastercard: { src: "/wallet/card-brands/mastercard.png", label: "Mastercard" },
  amex: { src: "/wallet/card-brands/amex.png", label: "American Express" },
  american_express: { src: "/wallet/card-brands/amex.png", label: "American Express" },
  discover: { src: "/wallet/card-brands/discover.png", label: "Discover" },
};

function normalizeCardBrand(brand: string | null): string {
  return (brand ?? "unknown").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function GenericCardIcon({ className }: { className?: string }) {
  return (
    <span className={cn("wallet-settings__card-brand", className)} role="img" aria-label="Card">
      <svg viewBox="0 0 40 24" aria-hidden>
        <rect width="40" height="24" rx="4" fill="#27272A" />
        <rect x="7" y="8" width="26" height="4" rx="1" fill="#71717A" />
        <rect x="7" y="14" width="10" height="3" rx="1" fill="#A1A1AA" />
      </svg>
    </span>
  );
}

export function PaymentMethodBrandIcon({ brand, className }: PaymentMethodBrandIconProps) {
  const icon = CARD_BRAND_ICONS[normalizeCardBrand(brand)];

  if (!icon) {
    return <GenericCardIcon className={className} />;
  }

  return (
    <span
      className={cn("wallet-settings__card-brand wallet-settings__card-brand--image", className)}
      role="img"
      aria-label={icon.label}
    >
      <Image
        src={icon.src}
        alt=""
        width={70}
        height={48}
        unoptimized
        className="wallet-settings__card-brand-image"
        aria-hidden
      />
    </span>
  );
}
