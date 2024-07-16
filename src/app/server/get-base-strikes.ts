import { API_URL, NEXT_PUBLIC_TOKEN } from "@/constants";
import { StrikeEntity } from "@/types";

export const getBaseStrikes = async () => {
  const baseStrikesData = await fetch(`${API_URL}/states`, {
    cache: "no-cache",
    method: "GET",
    headers: {
      Authorization: `Bearer ${NEXT_PUBLIC_TOKEN}`,
      "content-type": "application/json",
    },
  }).then((res) => res.json());
  return {
    baseStrikesData: baseStrikesData.filter((state: { entity_id: string }) =>
      state.entity_id.startsWith("geo_location.lightning_strike_")
    ) as StrikeEntity[],
    updatedAt: new Date().toISOString(),
  };
};
