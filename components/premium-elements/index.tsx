"use client";
import type { ComponentType } from "react";
import type { PremiumElement, PremiumElementType } from "../../lib/premium-elements";
import { StructureView, ContentView } from "./content";
import { MediaView } from "./media";
import {
  AccordionView,
  TabsView,
  CarouselView,
  CompareView,
  CodeView,
  CountdownView,
  ProgressView,
} from "./interactive";
import { MotionView } from "./motion";
import type { ViewProps } from "./shared";
import "./premium-elements.css";
const views: Record<PremiumElementType, ComponentType<ViewProps>> = {
  SiteNav: StructureView,
  Hero: StructureView,
  SplitHero: StructureView,
  FeatureGrid: ContentView,
  Cards: ContentView,
  ProjectGrid: ContentView,
  Gallery: MediaView,
  Carousel: CarouselView,
  Accordion: AccordionView,
  Tabs: TabsView,
  PricingTable: ContentView,
  CallToAction: StructureView,
  Stats: ContentView,
  Timeline: ContentView,
  Quote: ContentView,
  LogoCloud: MediaView,
  Divider: StructureView,
  Badge: ContentView,
  Checklist: ContentView,
  ImageCompare: CompareView,
  CodeBlock: CodeView,
  Countdown: CountdownView,
  Contact: StructureView,
  SiteFooter: StructureView,
  Marquee: MotionView,
  Spotlight: MotionView,
  Announcement: StructureView,
  Steps: ContentView,
  SocialLinks: ContentView,
  Progress: ProgressView,
};
export function PremiumElementView({
  element,
  interactive = true,
}: {
  element: PremiumElement;
  interactive?: boolean;
}) {
  const View = views[element.type];
  return View ? <View element={element} interactive={interactive} /> : null;
}
