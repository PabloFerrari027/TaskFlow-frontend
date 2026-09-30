/**
 * A short confetti burst for finishing something (a task marked done). Plain
 * DOM + Web Animations API, no dependency: ~40 small pieces that fly out from
 * where the user last clicked and fade away in about a second. Skipped
 * entirely for users who asked the OS for reduced motion.
 */

const COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--analytics-cat-2)",
  "var(--analytics-cat-4)",
  "var(--analytics-cat-5)",
];
const PIECES = 40;

let lastPointer: { x: number; y: number } | null = null;

if (typeof window !== "undefined") {
  // The burst starts where the click that finished the task happened (the
  // status select, a checkbox…). Captured, so nothing can swallow it.
  window.addEventListener(
    "pointerdown",
    (event) => {
      lastPointer = { x: event.clientX, y: event.clientY };
    },
    { capture: true, passive: true }
  );
}

export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const origin = lastPointer ?? { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:100;overflow:hidden";
  document.body.appendChild(layer);

  const animations = Array.from({ length: PIECES }, (_, index) => {
    const piece = document.createElement("span");
    const size = 5 + Math.random() * 5;
    piece.style.cssText = [
      "position:absolute",
      `left:${origin.x}px`,
      `top:${origin.y}px`,
      `width:${size}px`,
      `height:${size * (Math.random() > 0.5 ? 1 : 0.45)}px`,
      `background:${COLORS[index % COLORS.length]}`,
      `border-radius:${Math.random() > 0.6 ? "50%" : "2px"}`,
    ].join(";");
    layer.appendChild(piece);

    // Mostly upwards, fanned out, then gravity pulls it down past the start.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 90 + Math.random() * 140;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 720;

    return piece.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spin / 2}deg)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + 160}px)) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" }
    );
  });

  Promise.all(animations.map((animation) => animation.finished))
    .catch(() => undefined)
    .finally(() => layer.remove());
}
