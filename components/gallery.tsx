"use client";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { ProfileView } from "./profile-view";
import { websiteExamples as examples } from "@/lib/website-examples";

export function Gallery() {
  return (
    <section id="explore" className="section gallery-section">
      <div className="section-heading">
        <h2>
          A portfolio, a business, a project.
          <br />
          Build around your content.
        </h2>
        <p>
          Example websites made with the same components available in the editor. Open one to
          explore its layout.
        </p>
      </div>
      <div className="gallery-grid">
        {examples.map((profile, i) => (
          <Link href={"/examples/" + profile.handle} className="gallery-card" key={profile.handle}>
            <div className="gallery-preview">
              <ProfileView profile={profile} compact interactive={false} />
            </div>
            <div className="gallery-caption">
              <span>
                <b>{["Portfolio", "Creative studio", "Project page", "Visual journal"][i]}</b>
                <small>
                  {
                    [
                      "Work, images and a way to get in touch",
                      "Services, details and navigation",
                      "An introduction and what comes next",
                      "A collection with room for context",
                    ][i]
                  }
                </small>
              </span>
              <ArrowUpRightIcon size={20} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
