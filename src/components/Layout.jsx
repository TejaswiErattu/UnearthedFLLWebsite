import { useState, useRef, useEffect } from "react";
import { Shell } from '../components/Shell';
import { Hero, About, Outreach, UnearthedSection, RobotDesign, TeamFun, Timeline, SmartChatBot, Contact } from '../components/Sections';

export default function App() {
  useEffect(() => {
    if (import.meta?.env?.MODE !== "production") runSelfTests();
  }, []);

  return (
    <Shell>
      <Hero />
      <About />
      <Outreach />
      <UnearthedSection />
      <RobotDesign />
      <TeamFun />
      <Timeline />
      <SmartChatBot />
      <Contact />
    </Shell>
  );
}
