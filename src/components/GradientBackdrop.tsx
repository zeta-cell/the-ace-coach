// Section background: a full-bleed blue -> coral gradient stretched to the
// section box, with a dark scrim so white text stays readable and the section
// melts into the deep-blue page above and below.
//
// `blend` lets the gradient tint a photo underneath instead of covering it
// (e.g. blend="screen" over the hero photo), and `scrim` is the CSS painted
// on top of the gradient for text legibility.

const DEFAULT_SCRIM =
  "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(220 60% 13% / 0.6) 12%, hsl(220 60% 13% / 0.6) 40%, hsl(219 55% 15% / 0.54) 55%, hsl(14 55% 16% / 0.4) 74%, hsl(14 55% 16% / 0.2) 92%, hsl(var(--background)) 100%)";

type GradientBackdropProps = {
  /** gradient image URL, e.g. grad01.url from an .asset.json pointer */
  src: string;
  /** CSS background painted over the gradient; pass a custom value per section */
  scrim?: string;
  /** flip vertically so the warm end sits on top */
  flip?: boolean;
  /** CSS mix-blend-mode, e.g. "screen" to lay the gradient over a photo */
  blend?: "normal" | "screen" | "soft-light" | "overlay" | "multiply" | "luminosity";
  /** opacity of the gradient layer itself */
  opacity?: number;
};

export function GradientBackdrop({ src, scrim, flip, blend, opacity }: GradientBackdropProps) {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          filter: "saturate(1.28)",
          transform: flip ? "scaleY(-1)" : undefined,
          mixBlendMode: blend,
          opacity,
        }}
      />
      <div className="absolute inset-0" style={{ background: scrim ?? DEFAULT_SCRIM }} />
    </div>
  );
}

export default GradientBackdrop;
