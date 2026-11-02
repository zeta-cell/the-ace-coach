// Section background: a full-bleed blue -> coral gradient stretched to the
// section box, with a dark scrim so white text stays readable and the section
// melts into the midnight-black page above and below.

const DEFAULT_SCRIM =
  "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background) / 0.48) 20%, hsl(var(--background) / 0.66) 50%, hsl(var(--background) / 0.48) 80%, hsl(var(--background)) 100%)";

type GradientBackdropProps = {
  /** gradient image URL, e.g. grad01.url from an .asset.json pointer */
  src: string;
  /** CSS background painted over the gradient; pass a custom value per section */
  scrim?: string;
  /** flip vertically so the warm end sits on top */
  flip?: boolean;
};

export function GradientBackdrop({ src, scrim, flip }: GradientBackdropProps) {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          transform: flip ? "scaleY(-1)" : undefined,
        }}
      />
      <div className="absolute inset-0" style={{ background: scrim ?? DEFAULT_SCRIM }} />
    </div>
  );
}

export default GradientBackdrop;
