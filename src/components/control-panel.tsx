import { Download, Eraser, RotateCcw } from "lucide-react";
import { BACKGROUNDS, COLOR_MODES } from "@/lib/particles/palettes";
import {
  COUNT_MAX,
  COUNT_MIN,
  FORCE_MAX,
  FORCE_MIN,
  useFieldSettings,
} from "@/store/field-settings";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ControlPanelProps {
  open: boolean;
  onDownload: () => void;
  onClear: () => void;
  onReset: () => void;
  saved: boolean;
}

export function ControlPanel({
  open,
  onDownload,
  onClear,
  onReset,
  saved,
}: ControlPanelProps) {
  const count = useFieldSettings((s) => s.count);
  const force = useFieldSettings((s) => s.force);
  const trails = useFieldSettings((s) => s.trails);
  const colorMode = useFieldSettings((s) => s.colorMode);
  const background = useFieldSettings((s) => s.background);
  const attract = useFieldSettings((s) => s.attract);
  const setCount = useFieldSettings((s) => s.setCount);
  const setForce = useFieldSettings((s) => s.setForce);
  const setTrails = useFieldSettings((s) => s.setTrails);
  const setColorMode = useFieldSettings((s) => s.setColorMode);
  const setBackground = useFieldSettings((s) => s.setBackground);
  const setAttract = useFieldSettings((s) => s.setAttract);

  return (
    <section
      id="field-controls"
      aria-hidden={!open}
      className={cn(
        "pointer-events-auto w-full max-w-sm origin-bottom rounded-xl bg-surface/90 p-4 shadow-[0_0_0_1px_rgba(243,242,238,0.1),0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md",
        "max-h-[min(70dvh,36rem)] overflow-y-auto transition-[opacity,transform] duration-200 ease-out-smooth",
        open
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0",
      )}
      aria-label="Field controls"
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight text-fg">Field</h2>
        <p className="text-xs text-muted">Count, pull, and color</p>
      </header>

      <div className="flex flex-col gap-1">
        <SliderRow
          id="particle-count"
          label="Particles"
          valueLabel={count.toLocaleString()}
          min={COUNT_MIN}
          max={COUNT_MAX}
          step={100}
          value={count}
          onChange={setCount}
        />
        <SliderRow
          id="particle-force"
          label="Force"
          valueLabel={force.toFixed(2)}
          min={FORCE_MIN}
          max={FORCE_MAX}
          step={0.05}
          value={force}
          onChange={setForce}
        />
        <SliderRow
          id="particle-trails"
          label="Trails"
          valueLabel={`${Math.round(trails * 100)}%`}
          min={0}
          max={1}
          step={0.02}
          value={trails}
          onChange={setTrails}
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted">Background</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Background color">
          {BACKGROUNDS.map((bg) => {
            const active = background === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={bg.label}
                onClick={() => setBackground(bg.id)}
                className={cn(
                  "flex h-11 min-w-11 items-center gap-2 rounded-sm px-2.5 text-xs font-medium text-fg transition-[box-shadow,background-color] duration-150 ease-out",
                  active
                    ? "bg-surface-2 shadow-[0_0_0_1px_rgba(243,242,238,0.28)]"
                    : "shadow-[0_0_0_1px_rgba(243,242,238,0.1)] hover:bg-surface-2",
                )}
              >
                <span
                  className="size-3.5 rounded-full shadow-[0_0_0_1px_rgba(243,242,238,0.2)]"
                  style={{ backgroundColor: bg.color }}
                  aria-hidden="true"
                />
                {bg.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted">Color shift</p>
        <div
          className="grid grid-cols-4 gap-1 rounded-md bg-bg p-1 shadow-[0_0_0_1px_rgba(243,242,238,0.08)]"
          role="radiogroup"
          aria-label="Color shift"
        >
          {COLOR_MODES.map((mode) => {
            const active = colorMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setColorMode(mode.id)}
                className={cn(
                  "h-9 rounded-sm text-xs font-medium transition-[background-color,color] duration-150 ease-out",
                  active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                )}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-bg p-1 shadow-[0_0_0_1px_rgba(243,242,238,0.08)]">
        <button
          type="button"
          aria-pressed={attract}
          onClick={() => setAttract(true)}
          className={cn(
            "h-10 rounded-sm text-sm font-medium transition-[background-color,color] duration-150 ease-out",
            attract ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
          )}
        >
          Attract
        </button>
        <button
          type="button"
          aria-pressed={!attract}
          onClick={() => setAttract(false)}
          className={cn(
            "h-10 rounded-sm text-sm font-medium transition-[background-color,color] duration-150 ease-out",
            !attract ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
          )}
        >
          Repel
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClear} className="h-11">
          <Eraser />
          Clear
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onReset} className="h-11">
          <RotateCcw />
          Reset
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onDownload} className="h-11">
          <Download />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
    </section>
  );
}

function SliderRow({
  id,
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-muted">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-fg">{valueLabel}</span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => {
          if (typeof next === "number") onChange(next);
        }}
        aria-label={label}
      />
    </div>
  );
}
