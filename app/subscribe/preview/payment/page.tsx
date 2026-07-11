import { notFound } from "next/navigation";
import { SubscribePaymentScreenPreview } from "@/features/onboarding/components/SubscribePaymentScreen";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

interface SubscribePaymentPreviewPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function SubscribePaymentPreviewPage({
  searchParams,
}: SubscribePaymentPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const plan = isSubscriptionPlanId(params.plan) ? params.plan : "elite";

  return <SubscribePaymentScreenPreview plan={plan} />;
}
