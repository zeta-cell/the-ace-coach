import { useEffect, useRef } from "react";

type Props = {
  /** Ink color(s) — blooms cycle through these. Defaults to brand coral + mist blue. */
  colors?: string[];
  /** Bloom radius in px. */
  size?: number;
  /** How opaque each bloom is (0–1). */
  intensity?: number;
  /** Seconds a bloom takes to fade out. */
  trail?: number;
  /** Upward drift speed in px/s. */
  drift?: number;
  className?: string;
};

/**
 * Chroma Halo — soft ink that blooms behind the cursor.
 * Canvas overlay; pointer-events pass through. Respects reduced motion.
 */
const ChromaHalo = ({
  colors = ["#FF6574", "#9FC4E8"],
  size = 90,
  intensity = 1,
  trail = 0.9,
  drift = 24,
  className,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Bloom = { x: number; y: number; r: number; life: number; maxLife: number; color: string };
    let blooms: Bloom[] = [];
    let raf = 0;
    let last = performance.now();
    let lastSpawn = 0;
    let colorIdx = 0;
    const pointer = { x: -1, y: -1, active: false };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };
    const onLeave = () => { pointer.active = false; };
    // Listen on window so the halo blooms even over text and buttons.
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (pointer.active && now - lastSpawn > 16) {
        lastSpawn = now;
        blooms.push({
          x: pointer.x + (Math.random() - 0.5) * 8,
          y: pointer.y + (Math.random() - 0.5) * 8,
          r: size * (0.7 + Math.random() * 0.6),
          life: 0,
          maxLife: trail,
          color: colors[colorIdx++ % colors.length],
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      blooms = blooms.filter((b) => b.life < b.maxLife);
      for (const b of blooms) {
        b.life += dt;
        b.y -= drift * dt;
        const p = b.life / b.maxLife;
        const alpha = Math.sin(Math.min(p, 1) * Math.PI) * 0.42 * intensity;
        const r = b.r * (0.6 + p * 0.9);
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        g.addColorStop(0, hexA(b.color, alpha));
        g.addColorStop(1, hexA(b.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [colors, size, intensity, trail, drift]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    />
  );
};

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default ChromaHalo;
