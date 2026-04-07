import type React from "react";
import { useEffect, useRef, useState } from "react";

type FlowerBackpackProps = {
  onPointerDown: (event: React.PointerEvent) => void;
};

export function FlowerBackpack({ onPointerDown }: FlowerBackpackProps) {
  const slots = Array.from({ length: 20 }, (_, index) => index);
  const storageKey = "tibia-push-trainer-flower-backpack-position";
  const width = 248;
  const defaultPosition = { x: 24, y: 112 };
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  function clampPosition(next: { x: number; y: number }): { x: number; y: number } {
    if (typeof window === "undefined") return next;
    const maxX = Math.max(12, window.innerWidth - width - 12);
    const measuredHeight = containerRef.current?.offsetHeight ?? 360;
    const maxY = Math.max(12, window.innerHeight - measuredHeight - 12);
    return {
      x: Math.min(Math.max(next.x, 12), maxX),
      y: Math.min(Math.max(next.y, 12), maxY),
    };
  }

  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return defaultPosition;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return defaultPosition;
      const parsed = JSON.parse(raw) as { x: number; y: number };
      if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") return defaultPosition;
      const maxX = Math.max(12, window.innerWidth - width - 12);
      const maxY = Math.max(12, window.innerHeight - 360 - 12);
      return {
        x: Math.min(Math.max(parsed.x, 12), maxX),
        y: Math.min(Math.max(parsed.y, 12), maxY),
      };
    } catch {
      return defaultPosition;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    function syncToViewport(): void {
      setPosition((prev) => clampPosition(prev));
    }

    function onPointerMove(event: PointerEvent): void {
      if (!draggingRef.current) return;
      setPosition(
        clampPosition({
          x: event.clientX - dragOffsetRef.current.x,
          y: event.clientY - dragOffsetRef.current.y,
        })
      );
    }

    function onPointerUp(): void {
      draggingRef.current = false;
    }

    syncToViewport();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", syncToViewport);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", syncToViewport);
    };
  }, []);

  function startDragging(event: React.PointerEvent<HTMLDivElement>): void {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function resetPosition(): void {
    const next = clampPosition(defaultPosition);
    setPosition(next);
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-40 w-[248px] rounded-[10px] border border-neutral-950 bg-[linear-gradient(180deg,#5f5a57,#353230_16%,#201d1c_17%,#1b1817_100%)] p-[6px] shadow-[0_14px_30px_rgba(0,0,0,0.42)]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        onPointerDown={startDragging}
        className="flex cursor-grab items-center justify-between rounded-[6px] border border-black/60 bg-[linear-gradient(180deg,#544d48,#312d2a)] px-2 py-1 text-[13px] text-neutral-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] active:cursor-grabbing"
      >
        <span className="truncate font-semibold">Backpack of Flowers</span>
        <div className="flex gap-1 text-[11px]">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={resetPosition}
            className="grid h-4 w-4 place-items-center rounded-[3px] border border-black/60 bg-[linear-gradient(180deg,#69615d,#3e3936)]"
            aria-label="Resetar posicao da backpack"
          >
            o
          </button>
          <span className="grid h-4 w-4 place-items-center rounded-[3px] border border-black/60 bg-[linear-gradient(180deg,#69615d,#3e3936)]">x</span>
        </div>
      </div>

      <div className="mt-2 rounded-[6px] border border-black/70 bg-[linear-gradient(180deg,#4f4a46,#2e2b29)] p-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="mb-2 text-[11px] leading-4 text-neutral-300">Arraste a Gold Flower da backpack para qualquer SQM, igual ao Tibia.</div>

        <div className="grid grid-cols-4 gap-[4px]">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onPointerDown={onPointerDown}
              className="group relative grid aspect-square place-items-center rounded-[3px] border border-black/70 bg-[linear-gradient(180deg,#655f5c,#3a3634)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[linear-gradient(180deg,#706966,#46413e)]"
              aria-label={`Arrastar flower do slot ${slot + 1}`}
            >
              <div className="absolute inset-[2px] rounded-[2px] bg-[linear-gradient(180deg,#4a4542,#2e2a28)]" />
              <img
                src="/god-flowers.gif"
                alt="Gold Flower"
                className="relative z-10 h-7 w-7 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)] transition-transform group-hover:scale-105"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
