"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrganizationSlugRedirectPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  useEffect(() => {
    router.replace(slug ? `/leagues/${slug}` : "/leagues");
  }, [router, slug]);

  return null;
}
