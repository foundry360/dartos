import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { SupportRequestScreen } from "@/features/support/components/SupportRequestScreen";

export default function SupportPage() {
  return (
    <MobileAppShell title="Support" className="support-page-shell">
      <div className="support-page">
        <SupportRequestScreen />
      </div>
    </MobileAppShell>
  );
}
