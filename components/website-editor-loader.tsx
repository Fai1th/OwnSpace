"use client";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("./website-editor").then((module) => module.WebsiteEditor), {
  ssr: false,
  loading: () => <p className="website-editor-loading">Loading website editor…</p>,
});
export function WebsiteEditorLoader({ demo }: { demo: boolean }) {
  return <Editor demo={demo} />;
}
