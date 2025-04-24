"use client";

import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import React from "react";

import { cn } from "@/lib/utils";

export type FloatingDockItem = {
  id: string;
  title?: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  bgColor: string;
  isActive?: boolean;
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop className={desktopClassName} items={items} />
      <FloatingDockMobile className={mobileClassName} items={items} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full mb-2 inset-x-0 flex flex-col gap-2 items-start"
            layoutId="nav"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                {item.href ? (
                  <Link
                    key={item.id}
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shadow-md",
                      item.bgColor,
                      item.isActive && "scale-110"
                    )}
                    href={item.href}
                  >
                    <div className="h-4 w-4 text-white">
                      {item.icon}
                    </div>
                  </Link>
                ) : (
                  <button
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shadow-md",
                      item.bgColor,
                      item.isActive && "scale-110"
                    )}
                    onClick={item.onClick}
                  >
                    <div className="h-4 w-4 text-white">
                      {item.icon}
                    </div>
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        className="h-10 w-10 rounded-full bg-gray-200/50 backdrop-blur-lg dark:bg-neutral-800/50 flex items-center justify-center"
        onClick={() => setOpen(!open)}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      className={cn(
        "mx-auto hidden md:flex h-16 gap-4 items-end rounded-2xl px-4 pb-3 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg",
        className
      )}
      onMouseLeave={() => mouseX.set(Infinity)}
      onMouseMove={(e) => mouseX.set(e.pageX)}
    >
      {items.map((item) => (
        <IconContainer key={item.id} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  );
};

interface DockIconProps {
  width: MotionValue<number>;
  height: MotionValue<number>;
  widthIcon: MotionValue<number>;
  heightIcon: MotionValue<number>;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  setHovered: (value: boolean) => void;
  hovered: boolean;
  isActive?: boolean;
}

const DockIcon = React.forwardRef<HTMLDivElement, DockIconProps>(({
  width,
  height,
  widthIcon,
  heightIcon,
  label,
  icon,
  bgColor,
  setHovered,
  hovered,
  isActive
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "aspect-square rounded-full flex items-center justify-center relative shadow-md",
        bgColor
      )}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            className="px-2 py-0.5 whitespace-pre rounded-md bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border dark:border-neutral-700 dark:text-white border-gray-200 text-neutral-700 absolute left-1/2 -translate-x-1/2 -top-8 w-fit text-xs"
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            initial={{ opacity: 0, y: 10, x: "-50%" }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="flex items-center justify-center text-white"
        style={{ width: widthIcon, height: heightIcon }}
      >
        {icon}
      </motion.div>
    </motion.div>
  );
});

DockIcon.displayName = "DockIcon";

function IconContainer({
  mouseX,
  id,
  title,
  label,
  icon,
  href,
  onClick,
  bgColor,
  isActive,
}: {
  mouseX: MotionValue;
  id: string;
  title?: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  bgColor: string;
  isActive?: boolean;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20]
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <>
      {href ? (
        <Link href={href}>
          <DockIcon
            ref={ref}
            bgColor={bgColor}
            height={height}
            heightIcon={heightIcon}
            hovered={hovered}
            icon={icon}
            isActive={isActive}
            label={label || title || ''}
            setHovered={setHovered}
            width={width}
            widthIcon={widthIcon}
          />
        </Link>
      ) : (
        <button onClick={onClick}>
          <DockIcon
            ref={ref}
            bgColor={bgColor}
            height={height}
            heightIcon={heightIcon}
            hovered={hovered}
            icon={icon}
            isActive={isActive}
            label={label || title || ''}
            setHovered={setHovered}
            width={width}
            widthIcon={widthIcon}
          />
        </button>
      )}
    </>
  );
}
