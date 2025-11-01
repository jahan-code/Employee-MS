"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (nextDark: boolean, persist = false) => {
      setIsDark(nextDark);
      document.documentElement.classList.toggle("dark", nextDark);
      if (persist) {
        localStorage.setItem("theme", nextDark ? "dark" : "light");
      }
    };

    const initialize = () => {
      const stored = localStorage.getItem("theme");
      const shouldBeDark = stored === "dark" || (!stored && media.matches);
      applyTheme(shouldBeDark);
      setMounted(true);
    };

    const frame = requestAnimationFrame(initialize);

    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      const stored = localStorage.getItem("theme");
      if (!stored) {
        applyTheme(event.matches);
      }
    };

    media.addEventListener("change", handlePreferenceChange);

    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", handlePreferenceChange);
    };
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="transition-colors"
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

