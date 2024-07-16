"use client";

import { StrikeEntity } from "@/types";
import { Circle, MapContainer, TileLayer } from "react-leaflet";
import { MarkerLayer, Marker } from "react-leaflet-marker";
import MarkerClusterGroup from "react-leaflet-cluster";
import Image from "next/image";

import strikeIcon from "../app/strike.png";
import dayjs from "dayjs";
import {
  NEXT_PUBLIC_API_URL_WEBSOCKET,
  NEXT_PUBLIC_HOME_LAT,
  NEXT_PUBLIC_HOME_LONG,
  NEXT_PUBLIC_TOKEN,
} from "@/constants";
import { useEffect, useState } from "react";

const mapCenter = [NEXT_PUBLIC_HOME_LAT, NEXT_PUBLIC_HOME_LONG] as [
  number,
  number
];

const Strike = ({ strike }: { strike: StrikeEntity }) => {
  const now = dayjs();
  const relevancy = 1 + dayjs(strike.last_changed).diff(now, "minute") / 10;

  return (
    <Marker
      key={strike.entity_id}
      position={[strike.attributes.latitude, strike.attributes.longitude]}
    >
      <Image
        src={strikeIcon}
        alt=""
        height={relevancy !== 0 ? 12 * relevancy : 1}
        width={relevancy !== 0 ? 12 * relevancy : 1}
        style={{
          opacity: 1 * relevancy,
        }}
        className={`absolute markerAppear z-20 h-[${12 * relevancy}px] w-[${
          12 * relevancy
        }px] rounded-full`}
      />
    </Marker>
  );
};

export const Map = ({
  baseStrikesData,
  updatedAt,
}: {
  baseStrikesData: StrikeEntity[];
  updatedAt: string;
}) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [strikes, setStrikes] = useState<StrikeEntity[]>(baseStrikesData);

  useEffect(() => {
    const ws = new WebSocket(NEXT_PUBLIC_API_URL_WEBSOCKET as string);
    ws.onopen = () => {};
    ws.onclose = () => {
      console.log("Websocket closed");
      setConnected(false);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "auth_required") {
        ws.send(
          JSON.stringify({ type: "auth", access_token: NEXT_PUBLIC_TOKEN })
        );
        return;
      }
      if (data.type === "auth_ok") {
        setConnected(true);
        ws.send(JSON.stringify({ id: 1, type: "subscribe_events" }));
        return;
      }
      if (
        data.type === "event" &&
        data.event.event_type === "state_changed" &&
        data.event.data.entity_id.startsWith("geo_location.lightning_strike_")
      ) {
        !data.event.data.old_state &&
          data.event.data.new_state &&
          setStrikes((prevStrikes) => [
            ...prevStrikes,
            data.event.data.new_state,
          ]);
        return;
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <div className="absolute top-12 right-12 z-10 p-4 bg-white text-black bg-opacity-50 backdrop-blur-lg rounded-lg">
        <h1>Blitzortung lightning strikes Map</h1>
        <p>Updated at: {updatedAt}</p>
        <p>Lightning count: {strikes.length}</p>
        <p>Backend: {connected ? "Connected" : "Not connected"}</p>
      </div>
      <MapContainer
        center={mapCenter}
        zoom={7}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100vw", zIndex: 0 }}
        fadeAnimation={false}
        zoomAnimationThreshold={4}
      >
        <TileLayer
          attribution=""
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={mapCenter} radius={35} fillColor="red" color="red" />
        <MarkerLayer>
          <MarkerClusterGroup chunkedLoading>
            {strikes.map((strike) => (
              <Strike key={strike.entity_id} strike={strike} />
            ))}
          </MarkerClusterGroup>
        </MarkerLayer>
      </MapContainer>
    </>
  );
};
