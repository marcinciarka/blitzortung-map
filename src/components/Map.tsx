"use client";

import { StrikeEntity } from "@/types";
import { Circle, MapContainer, TileLayer } from "react-leaflet";
import { MarkerLayer, Marker } from "react-leaflet-marker";
import MarkerClusterGroup from "react-leaflet-cluster";
import Image from "next/image";

import strikeIcon from "../app/strike.png";
import dayjs from "dayjs";
import { memoize } from "lodash";
import timeAgo from "dayjs/plugin/relativeTime";
import {
  NEXT_PUBLIC_API_URL_WEBSOCKET,
  NEXT_PUBLIC_HOME_LAT,
  NEXT_PUBLIC_HOME_LONG,
  NEXT_PUBLIC_TOKEN,
} from "@/constants";
import { useEffect, useState } from "react";

dayjs.extend(timeAgo, {
  thresholds: [
    { l: "s", r: 1 },
    { l: "m", r: 1 },
    { l: "mm", r: 60, d: "minute" },
  ],
});

const showTimeRange = 60; // seconds

const mapCenter = [NEXT_PUBLIC_HOME_LAT, NEXT_PUBLIC_HOME_LONG] as [
  number,
  number
];

const Strike = memoize(
  ({ strike, timeRange }: { strike: StrikeEntity; timeRange: number }) => {
    const now = dayjs();
    const timeRangeFinal = (timeRange / 100) * showTimeRange;
    const relevant = dayjs(now).isBefore(
      dayjs(strike.last_changed).add(timeRangeFinal, "minute")
    );

    const hoverData = (
      <div className="group-hover:opacity-100 pointer-events-none opacity-0 absolute z-25 top-[-40px] h-[30px] left-[-41px] w-[100px] text-center bg-slate-900/50 text-white backdrop-blur-lg rounded-lg p-2">
        {dayjs(strike.last_changed).fromNow()}
      </div>
    );

    return relevant ? (
      <Marker
        key={strike.entity_id}
        position={[strike.attributes.latitude, strike.attributes.longitude]}
      >
        <div className="group">
          <Image
            src={strikeIcon}
            title={dayjs(strike.last_changed).fromNow()}
            alt={dayjs(strike.last_changed).fromNow()}
            height={18}
            width={18}
            className="absolute markerAppear z-20 h-[18px] w-[18px] rounded-full"
          />
          {hoverData}
        </div>
      </Marker>
    ) : (
      <Marker
        key={strike.entity_id}
        position={[strike.attributes.latitude, strike.attributes.longitude]}
      >
        <div className="group">
          <Image
            src={strikeIcon}
            title={dayjs(strike.last_changed).fromNow()}
            alt={dayjs(strike.last_changed).fromNow()}
            height={8}
            width={8}
            style={{
              opacity: 1,
              filter: "saturate(0%)",
            }}
            className="absolute markerAppear z-20 h-[8px] w-[8px] rounded-full"
          />
          {hoverData}
        </div>
      </Marker>
    );
  }
);

export const Map = ({
  baseStrikesData,
  updatedAt,
}: {
  baseStrikesData: StrikeEntity[];
  updatedAt: string;
}) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [strikes, setStrikes] = useState<StrikeEntity[]>(baseStrikesData);
  const [timeRange, setTimeRange] = useState<number>(100);

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
        {/* slider */}
        <label htmlFor="range">Time range (% of 1h):</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={timeRange}
          onChange={(e) => {
            setTimeRange(parseFloat(e.target.value));
          }}
        />
        <p>
          Showing last: {Math.ceil((timeRange / 100) * showTimeRange)} minutes
        </p>
      </div>
      <MapContainer
        center={mapCenter}
        zoom={12}
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
              <Strike
                key={strike.entity_id}
                strike={strike}
                timeRange={timeRange}
              />
            ))}
          </MarkerClusterGroup>
        </MarkerLayer>
      </MapContainer>
    </>
  );
};
