import Image from "next/image";

export function AuthBrandLogo() {
  return (
    <div className="auth-screen__brand-row">
      <Image
        src="/vectoros-logo.png"
        alt="VectorOS"
        width={1024}
        height={113}
        className="auth-screen__brand-logo"
        priority
      />
    </div>
  );
}
