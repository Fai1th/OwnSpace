import { useCallback, useEffect, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import * as Progress from "@radix-ui/react-progress";
import useEmblaCarousel from "embla-carousel-react";
import { Highlight, themes } from "prism-react-renderer";
import { Header, Picture, Section } from "./shared";
import type { ViewProps } from "./shared";

export function AccordionView({ element, interactive }: ViewProps) {
  const p = element.props;
  return (
    <Section element={element}>
      <Header element={element} />
      {interactive ? (
        <Accordion.Root type="single" collapsible className="premium-accordion">
          {p.items.map((item, i) => (
            <Accordion.Item value={String(i)} className="premium-accordion-item" key={i}>
              <Accordion.Header>
                <Accordion.Trigger className="premium-accordion-trigger">
                  {item.title}
                  <span aria-hidden="true">+</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="premium-accordion-content">
                <p>{item.text}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      ) : (
        <div className="premium-accordion">
          {p.items.map((item, i) => (
            <div className="premium-accordion-item" key={i}>
              <h3 className="premium-accordion-trigger">
                {item.title}
                <span aria-hidden="true">+</span>
              </h3>
              {i === 0 && (
                <div className="premium-accordion-content">
                  <p>{item.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
export function TabsView({ element, interactive }: ViewProps) {
  const p = element.props;
  return (
    <Section element={element}>
      <Header element={element} />
      {interactive ? (
        <Tabs.Root defaultValue="0" className="premium-tabs" key={p.id + p.items.length}>
          <Tabs.List className="premium-tab-list" aria-label={p.title || "Content tabs"}>
            {p.items.map((item, i) => (
              <Tabs.Trigger key={i} className="premium-tab" value={String(i)}>
                {item.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {p.items.map((item, i) => (
            <Tabs.Content className="premium-tab-content" key={i} value={String(i)}>
              {item.image && <Picture image={item.image} title={item.title} />}
              <p>{item.text}</p>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      ) : (
        <div className="premium-tabs">
          <div className="premium-tab-list">
            {p.items.map((item, i) => (
              <span key={i} className="premium-tab" data-state={i === 0 ? "active" : "inactive"}>
                {item.title}
              </span>
            ))}
          </div>
          {p.items[0] && (
            <div className="premium-tab-content">
              <p>{p.items[0].text}</p>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
export function CarouselView({ element, interactive }: ViewProps) {
  const p = element.props;
  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    watchDrag: interactive,
    watchFocus: interactive,
  });
  const [position, setPosition] = useState(0);
  const onSelect = useCallback(() => setPosition(embla?.selectedScrollSnap() || 0), [embla]);
  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);
  return (
    <Section element={element}>
      <Header element={element} />
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={p.title || "Image carousel"}
        className="premium-carousel"
      >
        <div className="premium-carousel-viewport" ref={interactive ? emblaRef : undefined}>
          <div className="premium-carousel-track">
            {p.items.map((item, i) => (
              <figure
                className="premium-carousel-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={i + 1 + " of " + p.items.length}
                key={i}
              >
                <Picture image={item.image} title={item.title} />
                <figcaption>
                  <strong>{item.title}</strong>
                  {item.text && <span>{item.text}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="premium-carousel-controls">
          {interactive ? (
            <>
              <button
                type="button"
                onClick={() => embla?.scrollPrev()}
                disabled={position === 0}
                aria-label="Previous slide"
              >
                ←
              </button>
              <span aria-live="polite">
                {p.items.length ? position + 1 : 0} / {p.items.length}
              </span>
              <button
                type="button"
                onClick={() => embla?.scrollNext()}
                disabled={position >= p.items.length - 1}
                aria-label="Next slide"
              >
                →
              </button>
            </>
          ) : (
            <span>
              ← &nbsp; {p.items.length ? 1 : 0} / {p.items.length} &nbsp; →
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
export function CompareView({ element, interactive }: ViewProps) {
  const p = element.props;
  const [value, setValue] = useState(p.value);
  useEffect(() => setValue(p.value), [p.value]);
  const after = p.items[0];
  return (
    <Section element={element}>
      <Header element={element} />
      <div className="premium-compare">
        <Picture image={after?.image || ""} title={after?.title || "After"} />
        <div
          className="premium-compare-before"
          style={{ clipPath: "inset(0 " + (100 - value) + "% 0 0)" }}
        >
          <Picture image={p.image} title={p.label || "Before"} />
        </div>
        <span className="premium-compare-line" style={{ left: value + "%" }} aria-hidden="true">
          <span>↔</span>
        </span>
        <div className="premium-compare-labels">
          <span>{p.label || "Before"}</span>
          <span>{after?.title || "After"}</span>
        </div>
      </div>
      {interactive && (
        <label className="premium-range-label">
          Comparison position: {value}%
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            aria-label="Image comparison position"
          />
        </label>
      )}
    </Section>
  );
}
export function CodeView({ element, interactive }: ViewProps) {
  const p = element.props;
  const [status, setStatus] = useState("");
  const language = [
    "javascript",
    "typescript",
    "jsx",
    "tsx",
    "css",
    "markup",
    "json",
    "bash",
    "python",
  ].includes(p.label)
    ? p.label
    : "javascript";
  return (
    <Section element={element}>
      {p.title && <h2 className="premium-heading">{p.title}</h2>}
      <div className="premium-code">
        <div className="premium-code-toolbar">
          <span>{language}</span>
          {interactive && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(p.text);
                  setStatus("Copied");
                } catch {
                  setStatus("Copy unavailable. Select the code to copy it.");
                }
              }}
            >
              Copy code
            </button>
          )}
        </div>
        <Highlight theme={themes.nightOwl} code={p.text} language={language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              <code>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    <span className="premium-code-line-number" aria-hidden="true">
                      {i + 1}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
      </div>
      {status && (
        <p role="status" className="premium-copy-status">
          {status}
        </p>
      )}
    </Section>
  );
}
export function CountdownView({ element, interactive }: ViewProps) {
  const p = element.props;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!interactive || !p.date) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [interactive, p.date]);
  const target = p.date ? Date.parse(p.date) : NaN;
  const seconds =
    now === null || !Number.isFinite(target)
      ? null
      : Math.max(0, Math.floor((target - now) / 1000));
  const values =
    seconds === null
      ? ["—", "—", "—", "—"]
      : [
          Math.floor(seconds / 86400),
          Math.floor(seconds / 3600) % 24,
          Math.floor(seconds / 60) % 60,
          seconds % 60,
        ];
  return (
    <Section element={element}>
      <Header element={element} />
      {p.date && (
        <time className="premium-event-date" dateTime={p.date}>
          {p.date.replace("T", " ").replace(/Z$/, " UTC")}
        </time>
      )}
      {seconds === 0 ? (
        <p className="premium-countdown-ended">{p.label || "The moment is here."}</p>
      ) : (
        <div className="premium-countdown" role="timer" aria-label="Time until event">
          {["Days", "Hours", "Minutes", "Seconds"].map((unit, i) => (
            <div key={unit}>
              <strong>
                {typeof values[i] === "number" ? String(values[i]).padStart(2, "0") : values[i]}
              </strong>
              <span>{unit}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
export function ProgressView({ element }: ViewProps) {
  const p = element.props;
  return (
    <Section element={element}>
      <Header element={element} />
      <div className="premium-progress-value" aria-hidden="true">
        {p.value}%
      </div>
      <Progress.Root
        className="premium-progress-track"
        value={p.value}
        max={100}
        aria-label={p.title || "Progress"}
      >
        <Progress.Indicator
          className="premium-progress-fill"
          style={{ transform: "translateX(-" + (100 - p.value) + "%)" }}
        />
      </Progress.Root>
    </Section>
  );
}
