import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import aceLogo from "@/assets/the-ace-logo.svg";
import footerBg from "@/assets/footer-bg.jpeg";
import AceSpade from "./AceSpade";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border py-12 bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={footerBg} alt="" className="w-full h-full object-cover opacity-[0.08]" loading="lazy" width={1920} height={1080} />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/">
            <img src={aceLogo} alt="The Ace Academy" className="h-10 w-auto" loading="lazy" />
          </Link>
          <div className="flex items-center gap-8">
            {[
              { label: t.footer.home, to: "/" },
              { label: t.footer.programs, to: "/programs" },
              { label: t.footer.beginner, to: "/beginner-camp" },
              { label: t.footer.advanced, to: "/advanced-camp" },
              { label: t.footer.pro, to: "/pro-camp" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <AceSpade size="sm" opacity={0.12} />
            <p className="font-body text-xs text-muted-foreground">© 2026 The Ace Academy · Valencia</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
