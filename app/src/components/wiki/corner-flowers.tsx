// Drawing helpers for the flat, slightly textured watercolour shapes of the mockup's blog list header (see
// components/layout/top-wash.tsx): a broad petal with a rounded tip, a pointed leaf and a midrib, each given as a base
// point, a tip point and a width, in the mockup's own screenshot pixels.

import { warm } from '@/config/botanical-theme';

export type Point = readonly [number, number];

export const PEACH = warm('#f0c3a6');
export const CORAL = warm('#dc7a60');
export const CORAL_RIB = warm('#b7533d');
export const OLIVE = warm('#707642');
export const OLIVE_RIB = warm('#c8cd9b');

/** Walks from `from` towards `to` (`along`, 0–1) and sideways (`across`, in units of `width`) */
const at = (from: Point, to: Point, along: number, across: number, width: number): string => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  return `${(from[0] + dx * along + nx * across * width).toFixed(1)} ${(from[1] + dy * along + ny * across * width).toFixed(1)}`;
};

/** A broad petal with a rounded tip */
export const petal = (from: Point, to: Point, width: number) => {
  const p = (along: number, across: number) => at(from, to, along, across, width);
  return `M${p(0, 0)} C${p(0.1, 0.7)} ${p(0.5, 1.3)} ${p(0.88, 0.75)} C${p(1.02, 0.4)} ${p(1.02, -0.4)} ${p(0.88, -0.75)} C${p(0.5, -1.3)} ${p(0.1, -0.7)} ${p(0, 0)} Z`;
};

/** A pointed leaf */
export const leaf = (from: Point, to: Point, width: number) => {
  const p = (along: number, across: number) => at(from, to, along, across, width);
  return `M${p(0, 0)} C${p(0.25, 1.2)} ${p(0.7, 1)} ${p(1, 0)} C${p(0.7, -1)} ${p(0.25, -1.2)} ${p(0, 0)} Z`;
};

/** The midrib: a line from the base to most of the way to the tip */
export const rib = (from: Point, to: Point, reach = 0.82) => `M${from[0]} ${from[1]} L${at(from, to, reach, 0, 0)}`;
