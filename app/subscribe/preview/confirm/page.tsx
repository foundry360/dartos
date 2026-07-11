import { notFound } from "next/navigation";
import { ConfirmSubscriptionScreenPreview } from "@/features/onboarding/components/ConfirmSubscriptionScreen";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

interface SubscribeConfirmPreviewPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function SubscribeConfirmPreviewPage({
  searchParams,
}: SubscribeConfirmPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const plan = isSubscriptionPlanId(params.plan) ? params.plan : "elite";

  return <ConfirmSubscriptionScreenPreview plan={plan} />;
}
