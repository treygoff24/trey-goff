"use client";

import dynamic from "next/dynamic";

const StarfieldBackground = dynamic(
  () => import("@/components/ui/StarfieldBackground").then((m) => m.StarfieldBackground),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-bg-0" />,
  }
);

export function StarfieldClient() {
  return <StarfieldBackground />;
}
