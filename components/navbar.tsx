"use client";



import { Kbd } from "@heroui/kbd";
import Link from "next/link";
import { Input } from "@heroui/input";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "./theme-switch";
import {
  SearchIcon,
} from "@/components/icons";

const navItems = [
  { href: "/", label: "Про мене" },
  { href: "/projects", label: "Проекти" },
  { href: "/blog", label: "Блог" },
  { href: "/models-demo", label: "3D Моделі" },
  { href: "/contact", label: "Контакти" },
];

export function Navbar() {
  const pathname = usePathname();

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link className="text-xl font-bold text-gray-800 dark:text-white" href="/">
            Yurii Martyniuk
          </Link>
          
          <div className="hidden md:flex items-center">
            <div className="flex space-x-8 mr-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className={`${
                    pathname === item.href
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  } transition-colors duration-200`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <ThemeSwitch />
          </div>

          <div className="md:hidden flex items-center">
            <ThemeSwitch className="mr-2" />
            {/* Тут можна додати мобільне меню */}
            <button className="text-gray-600 dark:text-gray-300">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
