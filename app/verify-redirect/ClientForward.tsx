// app/verify-redirect/ClientForward.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientForward({ next }: { next: string }) {
  const router = useRouter();

  useEffect(() => {
    // Replace so interstitial isn’t kept in history
    const t = setTimeout(() => router.replace(next), 4500);
    return () => clearTimeout(t);
  }, [next, router]);

  return null;
}
