"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, CheckIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { examples } from "@/lib/examples";
import { Phone } from "./phone";
export function Hero() {
  const [selected, setSelected] = useState(0);
  const [handle, setHandle] = useState("");
  const reduce = useReducedMotion();
  return (
    <section className="hero">
      <motion.div
        className="hero-copy"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="eyebrow">
          <span className="tiny-mark" /> YOUR CORNER OF THE INTERNET
        </div>
        <h1>
          Your links.
          <br />
          Your look.
          <br />
          <span>Your own space.</span>
        </h1>
        <p>
          A home for your socials, your work, and the things you’re into. Make it feel like you.
          Share it with one link.
        </p>
        <form
          className="claim-form"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.assign(
              "/studio" +
                (handle
                  ? "?handle=" + encodeURIComponent(handle.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  : ""),
            );
          }}
        >
          <label className="claim-field">
            <span>ownspace /</span>
            <input
              aria-label="Your page address"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your-name"
              maxLength={30}
            />
          </label>
          <button className="button" type="submit">
            Make it yours <ArrowUpRightIcon />
          </button>
        </form>
        <div className="hero-footnote">
          <CheckIcon size={14} /> Start free <span /> No card needed <span /> Yours in a few minutes
        </div>
      </motion.div>
      <div className="hero-product">
        <div className="preview-heading">
          <span className="live-dot" /> INTERACTIVE PROFILE PREVIEW{" "}
          <span className="preview-count">0{selected + 1} / 04</span>
        </div>
        <Phone profile={examples[selected]} />
        <div className="style-picker" role="group" aria-label="Preview a page style">
          {examples.map((p, i) => (
            <button
              key={p.theme}
              className={selected === i ? "selected" : ""}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span className={"style-swatch swatch-" + p.theme} />
              {["After dark", "Open sky", "Desktop", "Gallery"][i]}
            </button>
          ))}
        </div>
        <p className="preview-note">Same page. A different side of you.</p>
      </div>
      <div className="hero-bottom">
        <span>One address. Everything you want to share.</span>
        <a href="#explore">
          Find your starting point <span>↓</span>
        </a>
      </div>
    </section>
  );
}
