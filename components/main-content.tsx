"use client";

import React from "react";
import { useSection } from "./section-provider";
import { AboutSection } from "./sections/about-section";
import { ProjectsSection } from "./sections/projects-section";
import { BlogSection } from "./sections/blog-section";
import { ActivismSection } from "./sections/activism-section";
import { ContactsSection } from "./sections/contacts-section";
import { AnimatePresence, motion } from "framer-motion";

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
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={variants}
        className="w-full min-h-screen"
      >
        <SectionComponent />
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {renderSection()}
    </AnimatePresence>
  );
} 