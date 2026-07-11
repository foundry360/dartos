import Link from "next/link";
import { LOGIN_PATH } from "@/lib/auth/routes";

export const metadata = {
  title: "Privacy Policy — DartScorer",
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <h1 className="legal-page__title">Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: July 2026</p>

        <div className="legal-page__body">
          <p>
            DartScorer respects your privacy. This page will be updated with our full privacy
            policy before public launch, including what data we collect, how we use it, and your
            rights.
          </p>
          <p>
            Account information, match history, and billing details are stored securely and used
            only to provide the scoring service you signed up for.
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
