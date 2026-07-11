import Link from "next/link";
import { LOGIN_PATH } from "@/lib/auth/routes";

export const metadata = {
  title: "Terms of Service — DartScorer",
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <h1 className="legal-page__title">Terms of Service</h1>
        <p className="legal-page__updated">Last updated: July 2026</p>

        <div className="legal-page__body">
          <p>
            These terms govern your use of DartScorer. A complete terms of service document will
            be published before public launch, including subscription billing, trial periods, and
            acceptable use.
          </p>
          <p>
            By creating an account or starting a trial, you agree to use the service responsibly
            and in compliance with applicable laws.
          </p>
          <p>
            For questions, contact{" "}
            <a href="mailto:hello@dartscorer.app" className="legal-page__link">
              hello@dartscorer.app
            </a>
            .
          </p>
        </div>

        <Link href={LOGIN_PATH} className="legal-page__back">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
