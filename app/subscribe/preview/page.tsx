import { notFound } from "next/navigation";
import { ChoosePlanScreenPreview } from "@/features/onboarding/components/ChoosePlanScreen";

export default function SubscribePreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ChoosePlanScreenPreview />;
}
