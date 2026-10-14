import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Action, Header, Section } from "./shared";
import type { ViewProps } from "./shared";
export function MotionView({ element, interactive }: ViewProps) {
  const p = element.props;
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const animate = interactive && !reduce && !paused;
  if (element.type === "Marquee")
    return (
      <Section element={element}>
        <div className="premium-marquee-window">
          <motion.div
            className="premium-marquee-track"
            animate={animate ? { x: ["0%", "-50%"] } : { x: "0%" }}
            transition={
              animate ? { duration: 28, repeat: Infinity, ease: "linear" } : { duration: 0 }
            }
          >
            <div className="premium-marquee-group">
              {p.items.map((item, i) => (
                <span key={i}>
                  {item.title}
                  <span aria-hidden="true">✦</span>
                </span>
              ))}
            </div>
            <div className="premium-marquee-group" aria-hidden="true">
              {p.items.map((item, i) => (
                <span key={i}>
                  {item.title}
                  <span>✦</span>
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        {interactive && !reduce && (
          <button
            type="button"
            className="premium-motion-pause"
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? "Resume motion" : "Pause motion"}
          </button>
        )}
      </Section>
    );
  return (
    <Section element={element}>
      <div className="premium-spotlight-stage">
        <motion.div
          className="premium-spotlight-glow"
          aria-hidden="true"
          animate={
            animate
              ? { x: ["-18%", "18%", "-18%"], scale: [0.9, 1.12, 0.9], opacity: [0.35, 0.6, 0.35] }
              : { x: "0%", scale: 1, opacity: 0.45 }
          }
          transition={
            animate ? { duration: 12, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }
          }
        />
        <div className="premium-spotlight-copy">
          <Header element={element} />
          <Action label={p.label} url={p.url} interactive={interactive} />
        </div>
      </div>
      {interactive && !reduce && (
        <button
          type="button"
          className="premium-motion-pause"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Resume motion" : "Pause motion"}
        </button>
      )}
    </Section>
  );
}
