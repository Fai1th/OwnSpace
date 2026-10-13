"use client";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { ProfileView } from "./profile-view";
import { examples } from "@/lib/examples";
export function Gallery() {
  return (
    <section id="explore" className="section gallery-section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">A STARTING POINT, NOT A BOX</div>
          <h2>
            Different people.
            <br />
            Different spaces.
          </h2>
        </div>
        <p>
          Pick a look and make it your own.
          <br />
          Everything here is yours to change.
        </p>
      </div>
      <div className="gallery-grid">
        {examples.map((p, i) => (
          <Link href={"/examples/" + p.handle} className="gallery-card" key={p.handle}>
            <div className="gallery-preview">
              <ProfileView profile={p} compact interactive={false} />
            </div>
            <div className="gallery-caption">
              <span>
                <b>{["After dark", "Open sky", "Desktop", "Gallery"][i]}</b>
                <small>Example space · {p.displayName.split(" ")[0]}</small>
              </span>
              <ArrowUpRightIcon size={22} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
