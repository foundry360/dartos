import { notFound } from "next/navigation";
import {
  MarketingMatchShot,
  type MarketingShotKind,
} from "@/features/dev/components/MarketingMatchShot";

const KINDS = new Set<MarketingShotKind>(["x01-301", "cricket"]);

export default async function DevMarketingShotPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { kind } = await params;
  if (!KINDS.has(kind as MarketingShotKind)) {
    notFound();
  }

  return <MarketingMatchShot kind={kind as MarketingShotKind} />;
}
