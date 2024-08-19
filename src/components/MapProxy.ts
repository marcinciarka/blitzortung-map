import dynamic from "next/dynamic";

export const MapProxy = dynamic(
  () => import("@/components/Map").then((module) => module.Map),
  { ssr: false }
);
