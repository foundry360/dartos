import Image from "next/image";

export function AuthBrandLogo() {
  return (
    <div className="auth-screen__brand-row">
      <Image
        src="/auth/vector-logo.png"
        alt="Vector"
        width={471}
        height={135}
        className="auth-screen__brand-logo"
        priority
      />
    </div>
  );
}
