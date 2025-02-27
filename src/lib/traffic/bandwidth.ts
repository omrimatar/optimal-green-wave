
import type { NetworkData } from "@/types/traffic";
import { BandwidthResult } from "./types";

export function calculateCorridorBandwidth(data: NetworkData, offsets: number[]): BandwidthResult {
  const { intersections, travel } = data;

  let minBandwidthUp = Infinity;
  let minBandwidthDown = Infinity;
  let hasUp = false;
  let hasDown = false;
  const local_up: Array<number|null> = [];
  const local_down: Array<number|null> = [];

  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    if (!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up) {
      local_up.push(null);
      continue;
    }
    hasUp = true;

    const distance = next.distance - curr.distance;
    const travelTime = (distance / travel.up.speed) * 3.6;

    const currGreen = curr.green_up[0];
    const nextGreen = next.green_up[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_up;
    const nextStart = (offsets[i + 1] + nextGreen.start) % next.cycle_up;
    
    const arrivalTime = (currStart + currGreen.duration/2 + travelTime) % next.cycle_up;
    const overlap = Math.min(
      nextGreen.duration,
      Math.max(0, nextGreen.duration - Math.abs(arrivalTime - (nextStart + nextGreen.duration/2)))
    );
    local_up.push(overlap);
    minBandwidthUp = Math.min(minBandwidthUp, overlap);
  }

  for (let i = intersections.length - 1; i > 0; i--) {
    const curr = intersections[i];
    const prev = intersections[i - 1];
    if (!curr.green_down?.length || !prev.green_down?.length || !curr.cycle_down || !prev.cycle_down) {
      local_down.push(null);
      continue;
    }
    hasDown = true;

    const distance = curr.distance - prev.distance;
    const travelTime = (distance / travel.down.speed) * 3.6;

    const currGreen = curr.green_down[0];
    const prevGreen = prev.green_down[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_down;
    const prevStart = (offsets[i - 1] + prevGreen.start) % prev.cycle_down;
    
    const arrivalTime = (currStart + currGreen.duration/2 + travelTime) % prev.cycle_down;
    const overlap = Math.min(
      prevGreen.duration,
      Math.max(0, prevGreen.duration - Math.abs(arrivalTime - (prevStart + prevGreen.duration/2)))
    );
    local_down.unshift(overlap);
    minBandwidthDown = Math.min(minBandwidthDown, overlap);
  }

  const upVal = hasUp ? (minBandwidthUp === Infinity ? 0 : minBandwidthUp) : null;
  const downVal = hasDown ? (minBandwidthDown === Infinity ? 0 : minBandwidthDown) : null;

  return { 
    up: upVal, 
    down: downVal,
    local_up,
    local_down
  };
}
