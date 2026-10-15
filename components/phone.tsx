"use client";
import { useRef } from "react";
import { useMotionValue, useTransform, motion } from "motion/react";
import { useLiveReducedMotion } from "@/lib/use-reduced-motion";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { ProfileView } from "./profile-view";
import type { Profile } from "@/lib/profile";
export function Phone({ profile }: { profile: Profile }) {
  const rx = useMotionValue(7),
    ry = useMotionValue(-16);
  const reduced = useLiveReducedMotion();
  const dragging = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const transform = useTransform(
    [rx, ry],
    ([x, y]) => `rotateX(${x}deg) rotateY(${y}deg) rotateZ(-3deg)`,
  );
  return (
    <div className="phone-stage">
      <motion.div className="phone" style={reduced ? {} : { transform }}>
        <div className="phone-side side-left" />
        <div className="phone-side side-right" />
        <div className="phone-screen">
          <div className="phone-status">
            <span>9:41</span>
            <span className="status-symbols">LTE ▰</span>
          </div>
          <div className="phone-island" />
          <div
            className="phone-page"
            tabIndex={0}
            role="region"
            aria-label="Scroll the example profile"
          >
            <ProfileView profile={profile} compact interactive={false} />
          </div>
          <div className="phone-home" />
        </div>
      </motion.div>
      <button
        className="phone-drag"
        aria-label="Drag to rotate the phone"
        disabled={Boolean(reduced)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = { x: e.clientX, y: e.clientY, rx: rx.get(), ry: ry.get() };
        }}
        onPointerMove={(e) => {
          const d = dragging.current;
          if (!d || reduced) return;
          rx.set(Math.max(-25, Math.min(25, d.rx - (e.clientY - d.y) / 6)));
          ry.set(Math.max(-40, Math.min(40, d.ry + (e.clientX - d.x) / 6)));
        }}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
      >
        Drag to rotate
      </button>
      <button
        className="phone-reset"
        onClick={() => {
          rx.set(7);
          ry.set(-16);
        }}
      >
        <ArrowCounterClockwiseIcon />
        Reset view
      </button>
    </div>
  );
}
