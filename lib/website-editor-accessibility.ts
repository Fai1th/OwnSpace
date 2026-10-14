"use client";
/** Puck 0.23 exposes no viewport-control, loader, or native draggable-wrapper
 * override. Repair these specific semantics without replacing engine elements,
 * tabindex values, keyboard/pointer listeners, or child controls. */
export function installPuckAccessibility(editor: HTMLElement): () => void {
  type FrameBinding = {
    document: Document | null;
    observer: MutationObserver | null;
    instructions: Set<HTMLElement>;
    onLoad: () => void;
  };
  const frames = new Map<HTMLIFrameElement, FrameBinding>();
  function repairLoaders(root: ParentNode) {
    for (const loader of root.querySelectorAll<HTMLElement>(
      '[class*="_Loader_"][aria-label]:not([role])',
    ))
      loader.setAttribute("role", "status");
  }
  function repairSections(binding: FrameBinding) {
    const document = binding.document;
    if (!document) return;
    repairLoaders(document.querySelector("[data-puck-entry]") || document.createDocumentFragment());
    for (const section of document.querySelectorAll<HTMLElement>(
      "[data-puck-entry] .website-section",
    )) {
      const wrapper = section.closest<HTMLElement>("[data-puck-component][data-puck-dnd]");
      if (!wrapper) continue;
      if (wrapper.getAttribute("role") !== "group") wrapper.setAttribute("role", "group");
      if (!wrapper.hasAttribute("aria-label") && !wrapper.hasAttribute("aria-labelledby"))
        wrapper.setAttribute("aria-label", "Section");
      // A Section groups keyboard-draggable children; it is not a toggle button.
      wrapper.removeAttribute("aria-pressed");
      wrapper.removeAttribute("aria-grabbed");
      // dnd-kit's descriptions live in the host document. ID references inside
      // srcdoc need an equivalent local target for screen readers to resolve.
      for (const id of (wrapper.getAttribute("aria-describedby") || "").split(/\s+/)) {
        if (!id.startsWith("dnd-kit-description-") || document.getElementById(id)) continue;
        const source = editor.ownerDocument.getElementById(id);
        if (!source?.textContent || !document.body) continue;
        const description = document.createElement("p");
        description.id = id;
        description.textContent = source.textContent;
        description.style.cssText =
          "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;";
        document.body.append(description);
        binding.instructions.add(description);
      }
    }
  }
  function releaseDocument(binding: FrameBinding) {
    binding.observer?.disconnect();
    binding.observer = null;
    for (const description of binding.instructions) description.remove();
    binding.instructions.clear();
    binding.document = null;
  }
  function bindDocument(frame: HTMLIFrameElement, binding: FrameBinding) {
    let document: Document | null;
    try {
      document = frame.contentDocument;
    } catch {
      return;
    }
    if (document !== binding.document) {
      releaseDocument(binding);
      binding.document = document;
      if (document?.documentElement) {
        binding.observer = new MutationObserver(() => repairSections(binding));
        binding.observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [
            "role",
            "aria-label",
            "aria-labelledby",
            "aria-describedby",
            "aria-pressed",
            "aria-grabbed",
            "data-puck-component",
            "data-puck-dnd",
          ],
        });
      }
    }
    repairSections(binding);
  }
  function repair() {
    for (const select of editor.querySelectorAll<HTMLSelectElement>(
      '.Puck select[class*="ViewportControls-zoomSelect"]',
    )) {
      if (!select.hasAttribute("aria-label") && !select.hasAttribute("aria-labelledby"))
        select.setAttribute("aria-label", "Canvas zoom");
    }
    for (const puck of editor.querySelectorAll<HTMLElement>(".Puck")) repairLoaders(puck);
    for (const frame of editor.querySelectorAll<HTMLIFrameElement>(".Puck iframe#preview-frame")) {
      if (!frame.title.trim()) frame.title = "Website preview";
      let binding = frames.get(frame);
      if (!binding) {
        binding = {
          document: null,
          observer: null,
          instructions: new Set(),
          onLoad: () => {
            const current = frames.get(frame);
            if (current) bindDocument(frame, current);
          },
        };
        frames.set(frame, binding);
        frame.addEventListener("load", binding.onLoad);
      }
      bindDocument(frame, binding);
    }
    for (const [frame, binding] of frames) {
      if (!editor.contains(frame)) {
        releaseDocument(binding);
        frame.removeEventListener("load", binding.onLoad);
        frames.delete(frame);
      }
    }
  }
  repair();
  const observer = new MutationObserver(repair);
  observer.observe(editor, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["aria-label", "role", "title"],
  });
  return () => {
    observer.disconnect();
    for (const [frame, binding] of frames) {
      releaseDocument(binding);
      frame.removeEventListener("load", binding.onLoad);
    }
    frames.clear();
  };
}
