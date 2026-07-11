import { notFound, redirect } from "next/navigation";
import { ChoosePlanScreenPreview } from "@/features/onboarding/components/ChoosePlanScreen";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

interface SubscribePreviewPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function SubscribePreviewPage({ searchParams }: SubscribePreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;

  if (isSubscriptionPlanId(params.plan)) {
    redirect(`/subscribe/preview/confirm?plan=${params.plan}`);
  }

  return <ChoosePlanScreenPreview />;
}
