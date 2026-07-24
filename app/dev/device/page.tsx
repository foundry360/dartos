import { notFound } from "next/navigation";
import { DeviceMockupPreview } from "@/features/dev/components/DeviceMockupPreview";

export default function DevDeviceMockupPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DeviceMockupPreview />;
}
