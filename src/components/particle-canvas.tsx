import { useEffect, useRef, type MutableRefObject } from "react";
import { ParticleEngine, type EngineSettings } from "@/lib/particles/engine";

interface ParticleCanvasProps {
  settings: EngineSettings;
  engineRef: MutableRefObject<ParticleEngine | null>;
}

export function ParticleCanvas({ settings, engineRef }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new ParticleEngine(canvas, settingsRef.current);
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [engineRef]);

  useEffect(() => {
    engineRef.current?.setSettings(settings);
  }, [settings, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full touch-none"
      aria-label="Interactive particle field"
    />
  );
}
