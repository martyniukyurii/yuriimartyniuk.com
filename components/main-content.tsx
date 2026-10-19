"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import { useSection } from "./section-provider";
import { AboutSection } from "./sections/about-section";
const ProjectsSection = dynamic(() => import("./sections/projects-section").then(module => module.ProjectsSection));
const BlogSection = dynamic(() => import("./sections/blog-section").then(module => module.BlogSection));
const ActivismSection = dynamic(() => import("./sections/activism-section").then(module => module.ActivismSection));
const ContactsSection = dynamic(() => import("./sections/contacts-section").then(module => module.ContactsSection));

// Варіанти анімації для переходів між секціями
const variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.61, 1, 0.88, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.61, 1, 0.88, 1],
    },
  },
};

export function MainContent() {
  const { activeSection } = useSection();

  // Створюємо компонент з анімацією для відповідної секції
  const renderSection = () => {
    let SectionComponent;
    
    switch(activeSection) {
      case "about":
        SectionComponent = AboutSection;
        break;
      case "projects":
        SectionComponent = ProjectsSection;
        break;
      case "blog":
        SectionComponent = BlogSection;
        break;
      case "activism":
        SectionComponent = ActivismSection;
        break;
      case "contacts":
        SectionComponent = ContactsSection;
        break;
      default:
        SectionComponent = AboutSection;
    }

    return (
      <motion.div
        key={activeSection}
        animate="enter"
        className="w-full min-h-screen"
        exit="exit"
        initial="hidden"
        variants={variants}
      >
        <SectionComponent />
      </motion.div>
    );
  };

  return (
    // Нова секція завжди відкривається з початку сторінки
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}>
      {renderSection()}
    </AnimatePresence>
  );
}
