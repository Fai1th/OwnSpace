"use client";
import { useState } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { websiteExamples as examples } from "@/lib/website-examples";
import { Phone } from "./phone";

export function Hero() {
  const [selected, setSelected] = useState(0);
  const [handle, setHandle] = useState("");
  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>
          Build a website from
          <br className="hero-line-break" /> the pieces you need.
        </h1>
        <p>
          Arrange content, choose your background and publish a website for your work, business or
          next project.
        </p>
        <form
          className="claim-form"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.assign(
              "/editor" +
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
            Start building free <ArrowUpRightIcon />
          </button>
        </form>
      </div>
      <div className="hero-product">
        <div className="preview-heading">
          <span>Website preview</span>
          <a href={"/examples/" + examples[selected].handle}>
            Open example <ArrowUpRightIcon />
          </a>
        </div>
        <Phone profile={examples[selected]} />
        <div className="style-picker" role="group" aria-label="Preview an example website">
          {examples.map((profile, i) => (
            <button
              key={profile.handle}
              className={selected === i ? "selected" : ""}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              {["Portfolio", "Creative studio", "Project", "Visual journal"][i]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
