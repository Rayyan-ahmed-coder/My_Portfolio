import React from "react";
import UpdateNotification from "./components/UpdateNotification";
import ScrollProgressIndicator from "./components/ScrollProgressIndicator";
import MainNavbar from "./components/MainNavbar";
import HeroSection from "./components/Hero";
import ImpactStrip from "./components/ImpactStrip";
import BuildApproach from "./components/BuildApproach";
import WorkSection from "./components/Work";
import AboutSection from "./components/About";
import FeaturesSection from "./components/Features";
import TechnologiesSection from "./components/Technologies";
import ContactSection from "./components/Contact";
import SiteFooter from "./components/Footer";
import { CommandPanel } from "./components/CommandPanel";
import "./css/style.css";

export default function App(): React.JSX.Element {
  if (typeof window === "undefined" || typeof document === "undefined") {
    console.warn("Window or Document is undefined");
    return <></>;
  }

  return (
    <>
      <UpdateNotification />
      <ScrollProgressIndicator />
      <header className="site-header" id="site-header">
        <MainNavbar />
      </header>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <main id="main-content">
        <HeroSection />
        <ImpactStrip />
        <BuildApproach />
        <WorkSection />
        <FeaturesSection />
        <AboutSection />
        <TechnologiesSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <CommandPanel />
      <button className="scroll-top" id="scroll-top" type="button" aria-label="Scroll to top">
        ↑
      </button>
    </>
  );
}
