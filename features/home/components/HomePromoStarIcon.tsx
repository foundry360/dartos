export function HomePromoStarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "home-classics-promo__tool-icon"}
      aria-hidden
    >
      <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19.6l1-5.8-4.2-4.1 5.9-.9L12 3.5z" />
    </svg>
  );
}
