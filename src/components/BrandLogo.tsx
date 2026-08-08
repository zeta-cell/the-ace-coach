import logoDark from "@/assets/hi-volley-logo.png.asset.json";
import logoWhite from "@/assets/hi-volley-logo-white.png.asset.json";
import iconAsset from "@/assets/hi-volley-icon.png.asset.json";

/** Full Hi Volley wordmark. Swaps to the white version in dark mode. */
export const BrandLogo = ({ className = "h-7" }: { className?: string }) => (
  <>
    <img src={logoDark.url} alt="Hi Volley" className={`${className} w-auto dark:hidden`} />
    <img src={logoWhite.url} alt="Hi Volley" className={`${className} w-auto hidden dark:block`} />
  </>
);

/** Square app icon (rounded navy tile with the “hi” mark). */
export const BrandIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <img src={iconAsset.url} alt="Hi Volley" className={`${className} rounded-lg`} />
);

export default BrandLogo;
