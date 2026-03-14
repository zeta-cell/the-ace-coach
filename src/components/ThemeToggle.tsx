import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", isLight ? "light" : "dark");
  }, [isLight]);

  return (
    <button
      onClick={() => setIsLight((prev) => !prev)}
      className="relative flex items-center w-12 h-6 rounded-full bg-secondary border border-border transition-colors duration-300 cursor-pointer"
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span
        className={`absolute top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shadow transition-transform duration-300 ${
          isLight ? "translate-x-[1.625rem]" : "translate-x-0.5"
        }`}
      >
        {isLight ? <Sun size={12} /> : <Moon size={12} />}
      </span>
    </button>
  );
};

export default ThemeToggle;
