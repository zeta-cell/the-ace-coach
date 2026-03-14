import { useState, useEffect, useRef } from "react";
import { Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, Language } from "@/i18n/LanguageContext";

import flagEn from "@/assets/flag-en.png";
import flagDe from "@/assets/flag-de.png";
import flagEs from "@/assets/flag-es.png";
import flagFr from "@/assets/flag-fr.png";
import flagPt from "@/assets/flag-pt.png";
import flagAr from "@/assets/flag-ar.png";
import flagRu from "@/assets/flag-ru.png";
import flagUk from "@/assets/flag-uk.png";
import flagPl from "@/assets/flag-pl.png";

const languages: Language[] = ["en", "de", "es", "fr", "pt", "ar", "ru", "uk", "pl"];

const flagImages: Record<Language, string> = {
  en: flagEn,
  de: flagDe,
  es: flagEs,
  fr: flagFr,
  pt: flagPt,
  ar: flagAr,
  ru: flagRu,
  uk: flagUk,
  pl: flagPl,
};

const labels: Record<Language, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  ru: "Русский",
  uk: "Українська",
  pl: "Polski",
  fr: "Français",
  pt: "Português",
  ar: "العربية",
};

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center w-12 h-6 rounded-full bg-secondary border border-border transition-colors duration-300 cursor-pointer"
        aria-label="Toggle language selector"
      >
        <span
          className={`absolute top-0.5 flex items-center justify-center w-5 h-5 rounded-full shadow transition-all duration-300 ${
            isOpen
              ? "translate-x-[1.625rem] bg-primary-foreground text-primary"
              : "translate-x-0.5 bg-primary text-primary-foreground"
          }`}
        >
          <Languages size={12} />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-[calc(100%+8px)] right-[-40px] md:right-[-40px] grid grid-cols-3 gap-3 place-items-center bg-background/80 border border-border rounded-lg p-3 shadow-2xl z-[110] backdrop-blur-sm w-[156px] max-md:right-[-50px]"
          >
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center w-5 h-5 rounded-full overflow-hidden transition-all duration-200 ${
                  language === lang
                    ? "opacity-100 scale-110 ring-[1.5px] ring-primary ring-offset-1 ring-offset-background"
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                }`}
                aria-label={`Switch to ${labels[lang]}`}
                title={labels[lang]}
              >
                <img
                  src={flagImages[lang]}
                  alt={labels[lang]}
                  className="w-full h-full object-cover rounded-full"
                />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;