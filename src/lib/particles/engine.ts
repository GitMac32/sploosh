import {
  backgroundById,
  colorModeById,
  isLightRgb,
  type BackgroundId,
  type ColorMode,
} from "./palettes";

export interface EngineSettings {
  count: number;
  force: number;
  trails: number;
  colorMode: ColorMode;
  background: BackgroundId;
  attract: boolean;
}

interface Shockwave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  hue: number;
}

const HUE_STEPS = 36;
const SPRITE = 32;
const SOFTEN = 36;
const PULL_GAIN = 5200;
const SWIRL_GAIN = 3400;
const HOLD_PULL = 2.35;
const HOLD_SWIRL = 1.45;
const DAMP = 1.65;
const AMBIENT = 8;

function makeGlowAtlas(): HTMLCanvasElement {
  const atlas = document.createElement("canvas");
  atlas.width = SPRITE * HUE_STEPS;
  atlas.height = SPRITE * 2;
  const ctx = atlas.getContext("2d");
  if (!ctx) return atlas;

  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < HUE_STEPS; i++) {
      const hue = (i / HUE_STEPS) * 360;
      const x = i * SPRITE + SPRITE / 2;
      const y = row * SPRITE + SPRITE / 2;
      const light = row === 0 ? 62 : 38;
      const sat = row === 0 ? 80 : 72;
      const g = ctx.createRadialGradient(x, y, 0, x, y, SPRITE / 2);
      g.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 18}%, 1)`);
      g.addColorStop(0.22, `hsla(${hue}, ${sat}%, ${light}%, 0.85)`);
      g.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light - 8}%, 0.28)`);
      g.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(i * SPRITE, row * SPRITE, SPRITE, SPRITE);
    }
  }
  return atlas;
}

export class ParticleEngine {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly atlas: HTMLCanvasElement;
  private settings: EngineSettings;
  private xs = new Float32Array(0);
  private ys = new Float32Array(0);
  private vxs = new Float32Array(0);
  private vys = new Float32Array(0);
  private seeds = new Float32Array(0);
  private count = 0;
  private cssW = 1;
  private cssH = 1;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private pointerX = 0;
  private pointerY = 0;
  private pointerSeen = false;
  private pointerDown = 0;
  private hold = false;
  private waves: Shockwave[] = [];
  private reduced = false;
  private running = false;
  private resizeObserver: ResizeObserver | null = null;
  private onPointerMove = (e: PointerEvent) => this.handleMove(e);
  private onPointerDown = (e: PointerEvent) => this.handleDown(e);
  private onPointerUp = (e: PointerEvent) => this.handleUp(e);
  private onPointerCancel = (e: PointerEvent) => this.handleUp(e);
  private onVisibility = () => {
    if (document.visibilityState === "visible") this.last = performance.now();
  };

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is not available.");
    this.canvas = canvas;
    this.ctx = ctx;
    this.settings = { ...settings };
    this.atlas = makeGlowAtlas();
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.pointerX = window.innerWidth * 0.5;
    this.pointerY = window.innerHeight * 0.5;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.fit();
    this.resizeParticles(this.settings.count);
    this.paintSolid();
    this.last = performance.now();
    this.bind();
    this.raf = requestAnimationFrame(this.tick);
    this.publish();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.unbind();
  }

  setSettings(next: EngineSettings) {
    const prevBg = this.settings.background;
    const prevCount = this.settings.count;
    this.settings = { ...next };
    if (next.count !== prevCount) this.resizeParticles(next.count);
    if (next.background !== prevBg) this.paintSolid();
    this.publish();
  }

  clearTrails() {
    this.paintSolid();
    this.waves.length = 0;
  }

  resetParticles() {
    this.spawnAll();
    this.paintSolid();
    this.waves.length = 0;
    this.time = 0;
  }

  download() {
    const name = `aether-${Date.now()}.png`;
    this.canvas.toBlob((blob) => {
      if (!blob) {
        const a = document.createElement("a");
        a.href = this.canvas.toDataURL("image/png");
        a.download = name;
        a.click();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  private bind() {
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerCancel);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(this.canvas);
    window.addEventListener("resize", this.fitBound);
  }

  private unbind() {
    window.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerCancel);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("resize", this.fitBound);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private fitBound = () => this.fit();

  private fit() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const rect = parent.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const need =
      cssW !== this.cssW || cssH !== this.cssH || dpr !== this.dpr;
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    if (need) {
      this.canvas.width = Math.floor(cssW * dpr);
      this.canvas.height = Math.floor(cssH * dpr);
      this.canvas.style.width = `${cssW}px`;
      this.canvas.style.height = `${cssH}px`;
      this.paintSolid();
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private resizeParticles(n: number) {
    const next = Math.max(1, Math.floor(n));
    const prev = this.count;
    const xs = new Float32Array(next);
    const ys = new Float32Array(next);
    const vxs = new Float32Array(next);
    const vys = new Float32Array(next);
    const seeds = new Float32Array(next);
    const keep = Math.min(prev, next);
    if (keep > 0) {
      xs.set(this.xs.subarray(0, keep));
      ys.set(this.ys.subarray(0, keep));
      vxs.set(this.vxs.subarray(0, keep));
      vys.set(this.vys.subarray(0, keep));
      seeds.set(this.seeds.subarray(0, keep));
    }
    this.xs = xs;
    this.ys = ys;
    this.vxs = vxs;
    this.vys = vys;
    this.seeds = seeds;
    this.count = next;
    for (let i = keep; i < next; i++) this.spawn(i);
  }

  private spawnAll() {
    for (let i = 0; i < this.count; i++) this.spawn(i);
  }

  private spawn(i: number) {
    this.xs[i] = Math.random() * this.cssW;
    this.ys[i] = Math.random() * this.cssH;
    this.vxs[i] = (Math.random() - 0.5) * 28;
    this.vys[i] = (Math.random() - 0.5) * 28;
    this.seeds[i] = Math.random();
  }

  private handleMove(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.pointerY = e.clientY - rect.top;
    this.pointerSeen = true;
  }

  private handleDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.pointerY = e.clientY - rect.top;
    this.pointerSeen = true;
    this.hold = true;
    this.pointerDown = 1;
    this.canvas.setPointerCapture(e.pointerId);
    if (!this.reduced) this.burst(this.pointerX, this.pointerY);
    e.preventDefault();
  }

  private handleUp(e: PointerEvent) {
    this.hold = false;
    this.pointerDown = 1;
    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* already released */
    }
  }

  private burst(x: number, y: number) {
    const mode = colorModeById(this.settings.colorMode);
    const hue = (mode.hue0 + mode.hue1) * 0.5;
    this.waves.push({
      x,
      y,
      r: 8,
      maxR: 220,
      life: 1,
      hue,
    });
    const sign = this.settings.attract ? -1 : 1;
    const radius = 210;
    const radiusSq = radius * radius;
    const impulse = 560 * this.settings.force;
    const { xs, ys, vxs, vys, count } = this;
    for (let i = 0; i < count; i++) {
      const dx = xs[i] - x;
      const dy = ys[i] - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > radiusSq || d2 < 0.5) continue;
      const d = Math.sqrt(d2);
      const falloff = 1 - d / radius;
      const mag = impulse * falloff * falloff;
      vxs[i] += (dx / d) * mag * sign;
      vys[i] += (dy / d) * mag * sign;
      const tx = -dy / d;
      const ty = dx / d;
      vxs[i] += tx * mag * 0.35;
      vys[i] += ty * mag * 0.35;
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.time += dt;
    this.pointerDown = Math.max(0, this.pointerDown - dt * 3.2);
    this.step(dt);
    this.draw();
    this.publish();
    this.raf = requestAnimationFrame(this.tick);
  };

  private attractor(): { x: number; y: number } {
    if (this.pointerSeen) return { x: this.pointerX, y: this.pointerY };
    const t = this.time;
    return {
      x: this.cssW * 0.5 + Math.cos(t * 0.42) * this.cssW * 0.22,
      y: this.cssH * 0.5 + Math.sin(t * 0.31) * this.cssH * 0.18,
    };
  }

  private step(dt: number) {
    const { force, attract } = this.settings;
    const target = this.attractor();
    const pullSign = attract ? 1 : -1;
    const holdMul = this.hold ? HOLD_PULL : 1;
    const swirlMul = this.hold ? HOLD_SWIRL : 1;
    const pull = force * PULL_GAIN * pullSign * holdMul;
    const swirl = force * SWIRL_GAIN * swirlMul * (this.reduced ? 0.45 : 1);
    const damp = Math.exp(-DAMP * dt);
    const w = this.cssW;
    const h = this.cssH;
    const t = this.time;
    const { xs, ys, vxs, vys, seeds, count } = this;

    for (let i = 0; i < count; i++) {
      let x = xs[i];
      let y = ys[i];
      let vx = vxs[i];
      let vy = vys[i];
      const dx = target.x - x;
      const dy = target.y - y;
      const dist = Math.hypot(dx, dy) + SOFTEN;
      const inv = 1 / dist;
      const inv2 = inv * inv;
      vx += (dx * pull - dy * swirl) * inv2 * dt;
      vy += (dy * pull + dx * swirl) * inv2 * dt;
      const seed = seeds[i];
      vx += Math.sin(t * 0.7 + seed * 12.2) * AMBIENT * dt;
      vy += Math.cos(t * 0.55 + seed * 9.4) * AMBIENT * dt;
      vx *= damp;
      vy *= damp;
      x += vx * dt;
      y += vy * dt;
      if (x < -40) x = w + 40;
      else if (x > w + 40) x = -40;
      if (y < -40) y = h + 40;
      else if (y > h + 40) y = -40;
      xs[i] = x;
      ys[i] = y;
      vxs[i] = vx;
      vys[i] = vy;
    }

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.r += (220 + force * 80) * dt;
      wave.life -= dt * 1.35;
      if (wave.life <= 0 || wave.r > wave.maxR) this.waves.splice(i, 1);
    }
  }

  private paintSolid() {
    const bg = backgroundById(this.settings.background);
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
  }

  private draw() {
    const { ctx, settings, cssW, cssH, dpr } = this;
    const bg = backgroundById(settings.background);
    const mode = colorModeById(settings.colorMode);
    const light = isLightRgb(bg.rgb);
    const trails = settings.trails;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    if (trails <= 0.02) {
      ctx.fillStyle = bg.color;
      ctx.fillRect(0, 0, cssW, cssH);
    } else {
      const fade = this.reduced
        ? 0.22
        : 0.045 + (1 - trails) * 0.22;
      ctx.fillStyle = `rgba(${bg.rgb[0]},${bg.rgb[1]},${bg.rgb[2]},${fade})`;
      ctx.fillRect(0, 0, cssW, cssH);
    }

    const row = light ? SPRITE : 0;
    const hueSpan = mode.hue1 - mode.hue0;
    const shift = this.time * mode.shift * (this.reduced ? 0.25 : 1);
    const atlas = this.atlas;
    const { xs, ys, vxs, vys, seeds, count } = this;

    ctx.globalCompositeOperation = light ? "multiply" : "lighter";

    for (let i = 0; i < count; i++) {
      const vx = vxs[i];
      const vy = vys[i];
      const speed = Math.hypot(vx, vy);
      const local = (seeds[i] + shift * 0.02 + speed * 0.0018 + xs[i] * 0.00035) % 1;
      const hue = mode.hue0 + ((local + 1) % 1) * hueSpan;
      const hi = ((Math.floor(((hue % 360) + 360) % 360) / 360) * HUE_STEPS) | 0;
      const sx = (hi % HUE_STEPS) * SPRITE;
      const size = 5.5 + Math.min(speed * 0.045, 14) + seeds[i] * 3.2;
      const alpha = light
        ? 0.28 + Math.min(speed / 420, 0.5)
        : 0.32 + Math.min(speed / 380, 0.7);
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        atlas,
        sx,
        row,
        SPRITE,
        SPRITE,
        xs[i] - size * 0.5,
        ys[i] - size * 0.5,
        size,
        size,
      );
    }

    this.drawWaves(light);
    this.drawCursor(light, mode);
  }

  private drawWaves(light: boolean) {
    const { ctx } = this;
    if (this.waves.length === 0) return;
    ctx.globalCompositeOperation = light ? "multiply" : "lighter";
    ctx.lineWidth = 1.5;
    for (const wave of this.waves) {
      ctx.globalAlpha = Math.max(0, wave.life) * 0.55;
      ctx.strokeStyle = `hsla(${wave.hue}, 70%, ${light ? 28 : 72}%, 1)`;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = Math.max(0, wave.life) * 0.2;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawCursor(light: boolean, mode: { hue0: number; hue1: number }) {
    const target = this.pointerSeen
      ? { x: this.pointerX, y: this.pointerY }
      : this.attractor();
    const { ctx } = this;
    const pulse = 0.55 + Math.sin(this.time * 3.1) * 0.12;
    const down = this.hold ? 1.55 : 1 + this.pointerDown * 0.8;
    const radius = 42 * down * pulse;
    const hue = (mode.hue0 + mode.hue1) * 0.5;
    ctx.globalCompositeOperation = light ? "multiply" : "lighter";
    const g = ctx.createRadialGradient(
      target.x,
      target.y,
      0,
      target.x,
      target.y,
      radius,
    );
    const core = light ? 0.22 : 0.55;
    g.addColorStop(0, `hsla(${hue}, 70%, ${light ? 24 : 78}%, ${core * down})`);
    g.addColorStop(0.35, `hsla(${hue}, 70%, ${light ? 30 : 64}%, ${0.16 * down})`);
    g.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = light ? 0.7 : 0.9;
    ctx.fillStyle = light ? "#1a1a18" : "#f4f2ec";
    ctx.beginPath();
    ctx.arc(target.x, target.y, this.hold ? 2.6 : 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  private publish() {
    window.__aether = {
      count: this.count,
      force: this.settings.force,
      attract: this.settings.attract,
      background: this.settings.background,
      colorMode: this.settings.colorMode,
      trails: this.settings.trails,
      pointerSeen: this.pointerSeen,
      clear: () => this.clearTrails(),
      reset: () => this.resetParticles(),
    };
  }
}

declare global {
  interface Window {
    __aether?: {
      count: number;
      force: number;
      attract: boolean;
      background: string;
      colorMode: string;
      trails: number;
      pointerSeen: boolean;
      clear: () => void;
      reset: () => void;
    };
  }
}
