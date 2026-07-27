export interface CommunityCountryOption {
  value: string;
  label: string;
}

/** Curated ISO 3166-1 alpha-2 list for profile country picker. */
export const COMMUNITY_COUNTRY_OPTIONS: CommunityCountryOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "IE", label: "Ireland" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "DE", label: "Germany" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "PT", label: "Portugal" },
  { value: "IT", label: "Italy" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "PL", label: "Poland" },
  { value: "CZ", label: "Czechia" },
  { value: "AT", label: "Austria" },
  { value: "CH", label: "Switzerland" },
  { value: "HU", label: "Hungary" },
  { value: "RO", label: "Romania" },
  { value: "GR", label: "Greece" },
  { value: "TR", label: "Türkiye" },
  { value: "UA", label: "Ukraine" },
  { value: "RU", label: "Russia" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "PH", label: "Philippines" },
  { value: "TH", label: "Thailand" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "ID", label: "Indonesia" },
  { value: "VN", label: "Vietnam" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "EG", label: "Egypt" },
  { value: "BR", label: "Brazil" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "Mexico" },
  { value: "PE", label: "Peru" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "IL", label: "Israel" },
  { value: "HK", label: "Hong Kong" },
  { value: "TW", label: "Taiwan" },
].sort((a, b) => a.label.localeCompare(b.label));

export function formatCountryLabel(countryCode: string | null | undefined): string | null {
  if (!countryCode) {
    return null;
  }

  return (
    COMMUNITY_COUNTRY_OPTIONS.find((option) => option.value === countryCode)?.label ?? countryCode
  );
}
