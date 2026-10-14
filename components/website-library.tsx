"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePuck } from "@puckeditor/core";
import { premiumCatalog } from "@/lib/premium-elements";
import { PremiumElementView } from "./premium-elements";
export function WebsiteLibrary({ premium }: { premium: boolean }) {
  const { appState, dispatch } = usePuck();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [selected, setSelected] = useState(premiumCatalog[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const matches = premiumCatalog.filter(
    (entry) =>
      (category === "All" || entry.category === category) &&
      (entry.label + " " + entry.description + " " + entry.source)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const count = appState.data.content.reduce(
    (total, block) =>
      total +
      1 +
      (block.type === "Section" && Array.isArray(block.props.content)
        ? block.props.content.length
        : 0),
    0,
  );
  function add() {
    if (!premium || count >= 40) return;
    dispatch({
      type: "insert",
      componentType: selected.type,
      destinationIndex: appState.data.content.length,
      destinationZone: "root:default-zone",
    });
    setOpen(false);
  }
  return (
    <>
      <button type="button" className="website-library-trigger" onClick={() => setOpen(true)}>
        Element library <span>30 · Premium</span>
      </button>
      <dialog
        ref={dialog}
        className="website-library-dialog"
        aria-labelledby="website-library-title"
        onClose={() => setOpen(false)}
      >
        <div className="website-library-heading">
          <div>
            <h2 id="website-library-title">Element library</h2>
            <p>Browse sections. Edit the content, layout and style on your canvas.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)}>
            Close library
          </button>
        </div>
        <div className="website-library-filters">
          <label>
            Search elements
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Gallery, navigation, accordion…"
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.currentTarget.value)}>
              {["All", "Structure", "Content", "Media", "Interactive", "Motion"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="website-library-body">
          <div className="website-library-list" aria-label="Available elements">
            {matches.map((entry) => (
              <button
                type="button"
                key={entry.type}
                aria-pressed={selected.type === entry.type}
                onClick={() => setSelected(entry)}
              >
                <strong>{entry.label}</strong>
                <span>{entry.description}</span>
                <small>{entry.category} · Premium</small>
              </button>
            ))}
            {!matches.length && <p>No matching elements. Try another search.</p>}
          </div>
          <div className="website-library-detail">
            <div className="website-library-detail-top">
              <div>
                <h3>{selected.label}</h3>
                <p>{selected.source}</p>
              </div>
              <button type="button" disabled={!premium || count >= 40} onClick={add}>
                {premium ? "Add to page" : "Premium required"}
              </button>
            </div>
            {!premium && (
              <p>
                All library elements require Premium.{" "}
                <a href="/studio?panel=upgrade">View upgrade options</a>. Your Free page includes
                six basic blocks.
              </p>
            )}
            {count >= 40 && (
              <p role="status">Your page has reached the 40 block limit. Remove a block first.</p>
            )}
            <div
              className="website-library-example"
              style={
                {
                  "--site-accent": "#bedd76",
                  "--site-foreground": "#fbfcfd",
                  "--site-background": "#171717",
                } as CSSProperties
              }
            >
              <PremiumElementView
                key={selected.type}
                element={{
                  type: selected.type,
                  props: { ...selected.defaults, id: "library-preview" },
                }}
              />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
