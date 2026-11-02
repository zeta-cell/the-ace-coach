import { useLocation } from "react-router-dom";

type Glow = { c: "blue" | "orange" | "black"; x: number; y: number; w: number; h: number; o: number };

const COLOR = {
  blue: "hsl(199 98% 44%)",
  orange: "hsl(13 97% 64%)",
  black: "hsl(203 67% 2%)",
};

// Seeded variation so each page gets its own composition of soft light
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compose(path: string): Glow[] {
  const r = rng(hash(path));
  const count = 2 + Math.floor(r() * 3);
  const palette: Glow["c"][] = ["blue", "orange", "blue", "orange", "black"];
  return Array.from({ length: count }, (_, i) => {
    const c = i === 0 ? "blue" : palette[Math.floor(r() * palette.length)];
    return {
      c,
      x: Math.round(r() * 100),
      y: Math.round(r() * 100),
      w: 28 + Math.round(r() * 36),
      h: 20 + Math.round(r() * 30),
      o: c === "black" ? 0.06 : 0.12 + r() * 0.14,
    };
  });
}

export default function AmbientBackground() {
  const { pathname } = useLocation();
  const glows = compose(pathname);
  return (
    <div className="hv-ambient" aria-hidden>
      {glows.map((g, i) => (
        <span
          key={`${pathname}-${i}`}
          style={{
            left: `${g.x - g.w / 2}%`,
            top: `${g.y - g.h / 2}%`,
            width: `${g.w}vw`,
            height: `${g.h}vw`,
            background: COLOR[g.c],
            opacity: g.o,
          }}
        />
      ))}
    </div>
  );
}
