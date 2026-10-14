// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import axe from "axe-core";
import { installPuckAccessibility } from "../lib/website-editor-accessibility";
afterEach(() => {
  document.body.replaceChildren();
});
it("repairs the actual upstream loader and zoom naming errors without replacing controls", async () => {
  document.body.innerHTML =
    '<div id="outside"><span class="_Loader_other" aria-label="External loading"></span></div><div id="editor"><div class="Puck"><span class="_Loader_1w5zn_13" aria-label="loading"></span><select class="_ViewportControls-zoomSelect_v26yb_79"><option value=".5">50%</option><option value="1">100%</option></select></div></div>';
  const root = document.getElementById("editor")!;
  const select = root.querySelector("select")!;
  let changes = 0;
  select.addEventListener("change", () => {
    changes++;
  });
  const before = await axe.run(root, {
    runOnly: { type: "rule", values: ["aria-prohibited-attr", "select-name"] },
  });
  expect(before.violations.map((item) => item.id).sort()).toEqual([
    "aria-prohibited-attr",
    "select-name",
  ]);
  const dispose = installPuckAccessibility(root);
  const after = await axe.run(root, {
    runOnly: { type: "rule", values: ["aria-prohibited-attr", "select-name"] },
  });
  expect(after.violations).toEqual([]);
  expect(select.getAttribute("aria-label")).toBe("Canvas zoom");
  select.value = "1";
  select.dispatchEvent(new Event("change"));
  expect(changes).toBe(1);
  expect(document.querySelector("#outside span")?.hasAttribute("role")).toBe(false);
  dispose();
});
it("handles native toolbar replacements and disconnects its observer on unmount", async () => {
  const root = document.createElement("div");
  root.innerHTML = '<div class="Puck"></div>';
  document.body.append(root);
  const dispose = installPuckAccessibility(root);
  const puck = root.firstElementChild!;
  puck.innerHTML =
    '<select class="_ViewportControls-zoomSelect_other"><option>100%</option></select><span class="_Loader_other" aria-label="loading"></span>';
  await Promise.resolve();
  expect(puck.querySelector("select")?.getAttribute("aria-label")).toBe("Canvas zoom");
  expect(puck.querySelector("span")?.getAttribute("role")).toBe("status");
  dispose();
  puck.innerHTML =
    '<select class="_ViewportControls-zoomSelect_other"><option>100%</option></select>';
  await Promise.resolve();
  expect(puck.querySelector("select")?.hasAttribute("aria-label")).toBe(false);
});
async function auditFrameSection(documentInFrame: Document) {
  // axe-jsdom cannot audit a foreign Window directly; audit the exact frame DOM
  // in a same-document fixture. The real browser smoke audits the live iframe.
  const fixture = document.createElement("div");
  fixture.innerHTML = documentInFrame.body.innerHTML;
  document.body.append(fixture);
  try {
    return await axe.run(fixture, {
      iframes: false,
      runOnly: { type: "rule", values: ["nested-interactive", "aria-prohibited-attr"] },
    });
  } finally {
    fixture.remove();
  }
}
it("names the real preview iframe and repairs nested Section semantics without removing keyboard drag controls", async () => {
  document.body.innerHTML =
    '<div id="dnd-kit-description-2">Press Space to pick up a draggable item. Use arrow keys to move and Space to drop.</div><div id="editor"><div class="Puck"><iframe id="preview-frame"></iframe></div></div>';
  const root = document.getElementById("editor")!;
  const frame = root.querySelector("iframe")!;
  const frameDocument = frame.contentDocument!;
  frameDocument.body.innerHTML =
    '<div data-puck-entry><div data-puck-component="custom-parent-id" data-puck-dnd="custom-parent-id" tabindex="0" role="button" aria-roledescription="draggable" aria-describedby="dnd-kit-description-2" aria-pressed="false" aria-grabbed="false" aria-disabled="false"><section class="website-section"><div data-puck-dropzone="custom-parent-id:content"><div data-puck-component="child" data-puck-dnd="child" tabindex="0" role="button" aria-roledescription="draggable" aria-pressed="false">Text content</div></div></section></div></div>';
  const parent = frameDocument.querySelector<HTMLElement>(
    '[data-puck-component="custom-parent-id"]',
  )!;
  const child = frameDocument.querySelector<HTMLElement>('[data-puck-component="child"]')!;
  let parentKeys = 0,
    childKeys = 0;
  parent.addEventListener("keydown", () => {
    parentKeys++;
  });
  child.addEventListener("keydown", (event) => {
    childKeys++;
    event.stopPropagation();
  });
  const beforeTitle = await axe.run(root, {
    iframes: false,
    runOnly: { type: "rule", values: ["frame-title"] },
  });
  expect(beforeTitle.violations.map((item) => item.id)).toEqual(["frame-title"]);
  const beforeNested = await auditFrameSection(frameDocument);
  expect(beforeNested.violations.map((item) => item.id)).toContain("nested-interactive");
  const dispose = installPuckAccessibility(root);
  expect(frame.title).toBe("Website preview");
  expect(parent.getAttribute("role")).toBe("group");
  expect(parent.getAttribute("aria-label")).toBe("Section");
  expect(parent.tabIndex).toBe(0);
  expect(parent.getAttribute("aria-roledescription")).toBe("draggable");
  expect(parent.getAttribute("aria-describedby")).toBe("dnd-kit-description-2");
  expect(parent.hasAttribute("aria-pressed")).toBe(false);
  expect(parent.hasAttribute("aria-grabbed")).toBe(false);
  expect(frameDocument.getElementById("dnd-kit-description-2")?.textContent).toContain(
    "Press Space",
  );
  expect(child.getAttribute("role")).toBe("button");
  expect(child.tabIndex).toBe(0);
  parent.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  child.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  expect(parentKeys).toBe(1);
  expect(childKeys).toBe(1);
  const afterTitle = await axe.run(root, {
    iframes: false,
    runOnly: { type: "rule", values: ["frame-title"] },
  });
  const afterNested = await auditFrameSection(frameDocument);
  expect(afterTitle.violations).toEqual([]);
  expect(afterNested.violations).toEqual([]);
  // Native dnd-kit may restore its button attributes after a drag; repair again.
  parent.setAttribute("role", "button");
  parent.setAttribute("aria-pressed", "true");
  parent.setAttribute("aria-grabbed", "true");
  await Promise.resolve();
  expect(parent.getAttribute("role")).toBe("group");
  expect(parent.hasAttribute("aria-pressed")).toBe(false);
  dispose();
  parent.setAttribute("role", "button");
  await Promise.resolve();
  expect(parent.getAttribute("role")).toBe("button");
});
