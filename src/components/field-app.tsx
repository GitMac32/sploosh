import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, SlidersHorizontal } from "lucide-react";
import { ParticleCanvas } from "@/components/particle-canvas";
import { ControlPanel } from "@/components/control-panel";
import { Button } from "@/components/ui/button";
import type { ParticleEngine } from "@/lib/particles/engine";
import { cn } from "@/lib/utils";
import { useFieldSettings } from "@/store/field-settings";

export function FieldApp() {
  const engineRef = useRef<ParticleEngine | null>(null);
  const count = useFieldSettings((s) => s.count);
  const force = useFieldSettings((s) => s.force);
  const trails = useFieldSettings((s) => s.trails);
  const colorMode = useFieldSettings((s) => s.colorMode);
  const background = useFieldSettings((s) => s.background);
  const attract = useFieldSettings((s) => s.attract);
  const setCount = useFieldSettings((s) => s.setCount);

  const settings = useMemo(
    () => ({ count, force, trails, colorMode, background, attract }),
    [count, force, trails, colorMode, background, attract],
  );

  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(true);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number>(0);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (!mobile) setOpen(true);
    const persisted = localStorage.getItem("aether-field-v1");
    if (!persisted && mobile) {
      setCount(900);
    } else if (!persisted && (navigator.hardwareConcurrency || 8) <= 4) {
      setCount(1200);
    }
  }, [setCount]);

  useEffect(() => {
    const hide = () => setHint(false);
    window.addEventListener("pointerdown", hide, { once: true });
    window.addEventListener("pointermove", hide, { once: true });
    return () => {
      window.removeEventListener("pointerdown", hide);
      window.removeEventListener("pointermove", hide);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    };
  }, []);

  const onDownload = () => {
    engineRef.current?.download();
    setSaved(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 1600);
  };

  const onClear = () => engineRef.current?.clearTrails();
  const onReset = () => {
    engineRef.current?.resetParticles();
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none">
      <h1 className="sr-only">Aether — interactive particle field</h1>
      <ParticleCanvas settings={settings} engineRef={engineRef} />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-3xl leading-tight tracking-display text-fg italic sm:text-4xl">
              Aether
            </p>
            <p
              className={cn(
                "mt-1 max-w-64 text-sm text-muted text-pretty transition-opacity duration-300 ease-out-smooth",
                hint ? "opacity-100" : "opacity-50",
              )}
            >
              {attract ? "Move to stir · Hold to pull" : "Move to stir · Hold to push"}
            </p>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={saved ? "Screenshot saved" : "Download screenshot"}
              onClick={onDownload}
            >
              <Download />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-expanded={open}
              aria-controls="field-controls"
              aria-label={open ? "Hide controls" : "Show controls"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <ChevronDown /> : <SlidersHorizontal />}
            </Button>
          </div>
        </header>

        <div className="flex items-end justify-start">
          <ControlPanel
            open={open}
            onDownload={onDownload}
            onClear={onClear}
            onReset={onReset}
            saved={saved}
          />
        </div>
      </div>
    </main>
  );
}
