import Image from "next/image";

export function AppBrandLogo() {
  return (
    <Image
      src="/vectoros-logo.png"
      alt="VectorOS"
      width={1024}
      height={113}
      className="mobile-app-shell__brand-logo"
      priority
    />
  );
}
