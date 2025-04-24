"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className,
  useGradient = false,
}: {
  words: string[];
  duration?: number;
  className?: string;
  useGradient?: boolean;
}) => {
  // Фільтруємо порожні слова
  const filteredWords = words.filter(word => word.trim() !== "");
  const [currentWord, setCurrentWord] = useState(filteredWords[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const { theme } = useTheme();

  // thanks for the fix Julian - https://github.com/Julian-AT
  const startAnimation = useCallback(() => {
    const word = filteredWords[filteredWords.indexOf(currentWord) + 1] || filteredWords[0];

    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, filteredWords]);

  useEffect(() => {
    if (!isAnimating)
      setTimeout(() => {
        startAnimation();
      }, duration);
  }, [isAnimating, duration, startAnimation]);

  // Використовуємо різні кольори для різних тем
  const textColorClass = useGradient 
    ? theme === "light" 
      ? "text-blue-300" // Світліший синій для світлої теми
      : "text-blue-400"  // Поточний синій для темної теми
    : "";

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence
        onExitComplete={() => {
          setIsAnimating(false);
        }}
      >
        <motion.div
          key={currentWord}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={cn("z-10 inline-block relative text-left px-2", textColorClass)}
          exit={{
            opacity: 0,
            y: -40,
            x: 40,
            filter: "blur(8px)",
            scale: 2,
            position: "absolute",
          }}
          initial={{
            opacity: 0,
            y: 10,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
        >
          {currentWord.split(" ").map((word, wordIndex) => (
            <motion.span
              key={word + wordIndex}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className="inline-block whitespace-nowrap"
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              transition={{
                delay: wordIndex * 0.3,
                duration: 0.3,
              }}
            >
              {word.split("").map((letter, letterIndex) => (
                <motion.span
                  key={word + letterIndex}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  className="inline-block"
                  initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                  transition={{
                    delay: wordIndex * 0.3 + letterIndex * 0.05,
                    duration: 0.2,
                  }}
                >
                  {letter}
                </motion.span>
              ))}
              <span className="inline-block">&nbsp;</span>
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
