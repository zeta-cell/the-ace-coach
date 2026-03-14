import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "./translations/en";
import { de } from "./translations/de";
import { es } from "./translations/es";
import { ru } from "./translations/ru";
import { uk } from "./translations/uk";
import { pl } from "./translations/pl";
import { fr } from "./translations/fr";
import { pt } from "./translations/pt";
import { ar } from "./translations/ar";

export type Language = "en" | "de" | "es" | "ru" | "uk" | "pl" | "fr" | "pt" | "ar";
export type Translations = typeof en;

const translationsMap: Record<Language, Translations> = { en, de, es, ru, uk, pl, fr, pt, ar };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("ace-lang");
    if (["en", "de", "es", "ru", "uk", "pl", "fr", "pt", "ar"].includes(saved as string)) return saved as Language;
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLang(lang);
    localStorage.setItem("ace-lang", lang);
  };

  const t = translationsMap[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
