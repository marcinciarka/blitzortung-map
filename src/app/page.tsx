import { getBaseStrikes } from "@/app/server/get-base-strikes";
import { MapProxy } from "@/components/MapProxy";

export default async function Home() {
  const { baseStrikesData, updatedAt } = await getBaseStrikes();
  return <MapProxy baseStrikesData={baseStrikesData} updatedAt={updatedAt} />;
}
