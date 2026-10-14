import { useEffect, useRef, useState } from "react";
import { Header, ItemLink, Picture, Section } from "./shared";
import type { ViewProps } from "./shared";
export function MediaView({ element, interactive }: ViewProps) {
  const p = element.props;
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
  }, [selected]);
  if (element.type === "LogoCloud")
    return (
      <Section element={element}>
        <Header element={element} />
        <ul className="premium-logo-cloud">
          {p.items.map((item, i) => (
            <li key={i}>
              {item.image ? (
                <Picture image={item.image} title={item.title} />
              ) : (
                <strong>
                  <ItemLink title={item.title} url={item.url} interactive={interactive} />
                </strong>
              )}
            </li>
          ))}
        </ul>
      </Section>
    );
  return (
    <Section element={element}>
      <Header element={element} />
      <div className="premium-grid premium-gallery-grid">
        {p.items.map((item, i) => (
          <figure key={i}>
            {interactive ? (
              <button
                type="button"
                className="premium-gallery-open"
                aria-label={"View image: " + item.title}
                onClick={() => setSelected(i)}
              >
                <Picture image={item.image} title={item.title} />
              </button>
            ) : (
              <Picture image={item.image} title={item.title} />
            )}
            {item.title && <figcaption>{item.title}</figcaption>}
          </figure>
        ))}
      </div>
      {interactive && (
        <dialog
          ref={dialog}
          className="premium-lightbox"
          aria-label={
            selected === null ? "Image preview" : p.items[selected]?.title || "Image preview"
          }
          onClose={() => setSelected(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialog.current?.close();
          }}
        >
          <button
            className="premium-lightbox-close"
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            Close image ×
          </button>
          {selected !== null && p.items[selected] && (
            <Picture image={p.items[selected].image} title={p.items[selected].title} />
          )}
        </dialog>
      )}
    </Section>
  );
}
