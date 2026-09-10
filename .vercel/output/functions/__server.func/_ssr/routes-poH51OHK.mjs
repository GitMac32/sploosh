import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Download, i as Eraser, n as SlidersHorizontal, o as ChevronDown, r as RotateCcw } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-poH51OHK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BACKGROUNDS = [
	{
		id: "void",
		label: "Void",
		color: "#070708",
		rgb: [
			7,
			7,
			8
		]
	},
	{
		id: "ink",
		label: "Ink",
		color: "#0a1018",
		rgb: [
			10,
			16,
			24
		]
	},
	{
		id: "paper",
		label: "Paper",
		color: "#ebe6db",
		rgb: [
			235,
			230,
			219
		]
	},
	{
		id: "forest",
		label: "Forest",
		color: "#0a120e",
		rgb: [
			10,
			18,
			14
		]
	},
	{
		id: "abyss",
		label: "Abyss",
		color: "#031016",
		rgb: [
			3,
			16,
			22
		]
	}
];
var COLOR_MODES = [
	{
		id: "aurora",
		label: "Aurora",
		hue0: 148,
		hue1: 198,
		sat: 78,
		light: 62,
		lightOnPaper: 38,
		shift: 14
	},
	{
		id: "ember",
		label: "Ember",
		hue0: 8,
		hue1: 38,
		sat: 86,
		light: 60,
		lightOnPaper: 42,
		shift: 10
	},
	{
		id: "ice",
		label: "Ice",
		hue0: 186,
		hue1: 224,
		sat: 72,
		light: 68,
		lightOnPaper: 36,
		shift: 12
	},
	{
		id: "prism",
		label: "Prism",
		hue0: 0,
		hue1: 360,
		sat: 74,
		light: 62,
		lightOnPaper: 40,
		shift: 22
	}
];
function backgroundById(id) {
	return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}
function colorModeById(id) {
	return COLOR_MODES.find((m) => m.id === id) ?? COLOR_MODES[0];
}
function isLightRgb(rgb) {
	const [r, g, b] = rgb;
	return (r * .2126 + g * .7152 + b * .0722) / 255 > .45;
}
var HUE_STEPS = 36;
var SPRITE = 32;
var SOFTEN = 36;
var PULL_GAIN = 5200;
var SWIRL_GAIN = 3400;
var HOLD_PULL = 2.35;
var HOLD_SWIRL = 1.45;
var AMBIENT = 8;
function makeGlowAtlas() {
	const atlas = document.createElement("canvas");
	atlas.width = 1152;
	atlas.height = 64;
	const ctx = atlas.getContext("2d");
	if (!ctx) return atlas;
	for (let row = 0; row < 2; row++) for (let i = 0; i < HUE_STEPS; i++) {
		const hue = i / HUE_STEPS * 360;
		const x = i * SPRITE + SPRITE / 2;
		const y = row * SPRITE + SPRITE / 2;
		const light = row === 0 ? 62 : 38;
		const sat = row === 0 ? 80 : 72;
		const g = ctx.createRadialGradient(x, y, 0, x, y, SPRITE / 2);
		g.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 18}%, 1)`);
		g.addColorStop(.22, `hsla(${hue}, ${sat}%, ${light}%, 0.85)`);
		g.addColorStop(.5, `hsla(${hue}, ${sat}%, ${light - 8}%, 0.28)`);
		g.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
		ctx.fillStyle = g;
		ctx.fillRect(i * SPRITE, row * SPRITE, SPRITE, SPRITE);
	}
	return atlas;
}
var ParticleEngine = class {
	canvas;
	ctx;
	atlas;
	settings;
	xs = /* @__PURE__ */ new Float32Array(0);
	ys = /* @__PURE__ */ new Float32Array(0);
	vxs = /* @__PURE__ */ new Float32Array(0);
	vys = /* @__PURE__ */ new Float32Array(0);
	seeds = /* @__PURE__ */ new Float32Array(0);
	count = 0;
	cssW = 1;
	cssH = 1;
	dpr = 1;
	raf = 0;
	last = 0;
	time = 0;
	pointerX = 0;
	pointerY = 0;
	pointerSeen = false;
	pointerDown = 0;
	hold = false;
	waves = [];
	reduced = false;
	running = false;
	resizeObserver = null;
	onPointerMove = (e) => this.handleMove(e);
	onPointerDown = (e) => this.handleDown(e);
	onPointerUp = (e) => this.handleUp(e);
	onPointerCancel = (e) => this.handleUp(e);
	onVisibility = () => {
		if (document.visibilityState === "visible") this.last = performance.now();
	};
	constructor(canvas, settings) {
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) throw new Error("Canvas 2D is not available.");
		this.canvas = canvas;
		this.ctx = ctx;
		this.settings = { ...settings };
		this.atlas = makeGlowAtlas();
		this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		this.pointerX = window.innerWidth * .5;
		this.pointerY = window.innerHeight * .5;
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
	setSettings(next) {
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
	bind() {
		window.addEventListener("pointermove", this.onPointerMove, { passive: true });
		this.canvas.addEventListener("pointerdown", this.onPointerDown);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerCancel);
		document.addEventListener("visibilitychange", this.onVisibility);
		this.resizeObserver = new ResizeObserver(() => this.fit());
		this.resizeObserver.observe(this.canvas);
		window.addEventListener("resize", this.fitBound);
	}
	unbind() {
		window.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerCancel);
		document.removeEventListener("visibilitychange", this.onVisibility);
		window.removeEventListener("resize", this.fitBound);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	}
	fitBound = () => this.fit();
	fit() {
		const rect = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect();
		const cssW = Math.max(1, Math.floor(rect.width));
		const cssH = Math.max(1, Math.floor(rect.height));
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const need = cssW !== this.cssW || cssH !== this.cssH || dpr !== this.dpr;
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
	resizeParticles(n) {
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
	spawnAll() {
		for (let i = 0; i < this.count; i++) this.spawn(i);
	}
	spawn(i) {
		this.xs[i] = Math.random() * this.cssW;
		this.ys[i] = Math.random() * this.cssH;
		this.vxs[i] = (Math.random() - .5) * 28;
		this.vys[i] = (Math.random() - .5) * 28;
		this.seeds[i] = Math.random();
	}
	handleMove(e) {
		const rect = this.canvas.getBoundingClientRect();
		this.pointerX = e.clientX - rect.left;
		this.pointerY = e.clientY - rect.top;
		this.pointerSeen = true;
	}
	handleDown(e) {
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
	handleUp(e) {
		this.hold = false;
		this.pointerDown = 1;
		try {
			if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
		} catch {}
	}
	burst(x, y) {
		const mode = colorModeById(this.settings.colorMode);
		const hue = (mode.hue0 + mode.hue1) * .5;
		this.waves.push({
			x,
			y,
			r: 8,
			maxR: 220,
			life: 1,
			hue
		});
		const sign = this.settings.attract ? -1 : 1;
		const radius = 210;
		const radiusSq = 44100;
		const impulse = 560 * this.settings.force;
		const { xs, ys, vxs, vys, count } = this;
		for (let i = 0; i < count; i++) {
			const dx = xs[i] - x;
			const dy = ys[i] - y;
			const d2 = dx * dx + dy * dy;
			if (d2 > radiusSq || d2 < .5) continue;
			const d = Math.sqrt(d2);
			const falloff = 1 - d / radius;
			const mag = impulse * falloff * falloff;
			vxs[i] += dx / d * mag * sign;
			vys[i] += dy / d * mag * sign;
			const tx = -dy / d;
			const ty = dx / d;
			vxs[i] += tx * mag * .35;
			vys[i] += ty * mag * .35;
		}
	}
	tick = (now) => {
		if (!this.running) return;
		const dt = Math.min((now - this.last) / 1e3, .05);
		this.last = now;
		this.time += dt;
		this.pointerDown = Math.max(0, this.pointerDown - dt * 3.2);
		this.step(dt);
		this.draw();
		this.publish();
		this.raf = requestAnimationFrame(this.tick);
	};
	attractor() {
		if (this.pointerSeen) return {
			x: this.pointerX,
			y: this.pointerY
		};
		const t = this.time;
		return {
			x: this.cssW * .5 + Math.cos(t * .42) * this.cssW * .22,
			y: this.cssH * .5 + Math.sin(t * .31) * this.cssH * .18
		};
	}
	step(dt) {
		const { force, attract } = this.settings;
		const target = this.attractor();
		const pullSign = attract ? 1 : -1;
		const holdMul = this.hold ? HOLD_PULL : 1;
		const swirlMul = this.hold ? HOLD_SWIRL : 1;
		const pull = force * PULL_GAIN * pullSign * holdMul;
		const swirl = force * SWIRL_GAIN * swirlMul * (this.reduced ? .45 : 1);
		const damp = Math.exp(-1.65 * dt);
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
			const inv = 1 / (Math.hypot(dx, dy) + SOFTEN);
			const inv2 = inv * inv;
			vx += (dx * pull - dy * swirl) * inv2 * dt;
			vy += (dy * pull + dx * swirl) * inv2 * dt;
			const seed = seeds[i];
			vx += Math.sin(t * .7 + seed * 12.2) * AMBIENT * dt;
			vy += Math.cos(t * .55 + seed * 9.4) * AMBIENT * dt;
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
	paintSolid() {
		const bg = backgroundById(this.settings.background);
		const { ctx } = this;
		ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;
		ctx.fillStyle = bg.color;
		ctx.fillRect(0, 0, this.cssW, this.cssH);
	}
	draw() {
		const { ctx, settings, cssW, cssH, dpr } = this;
		const bg = backgroundById(settings.background);
		const mode = colorModeById(settings.colorMode);
		const light = isLightRgb(bg.rgb);
		const trails = settings.trails;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;
		if (trails <= .02) {
			ctx.fillStyle = bg.color;
			ctx.fillRect(0, 0, cssW, cssH);
		} else {
			const fade = this.reduced ? .22 : .045 + (1 - trails) * .22;
			ctx.fillStyle = `rgba(${bg.rgb[0]},${bg.rgb[1]},${bg.rgb[2]},${fade})`;
			ctx.fillRect(0, 0, cssW, cssH);
		}
		const row = light ? SPRITE : 0;
		const hueSpan = mode.hue1 - mode.hue0;
		const shift = this.time * mode.shift * (this.reduced ? .25 : 1);
		const atlas = this.atlas;
		const { xs, ys, vxs, vys, seeds, count } = this;
		ctx.globalCompositeOperation = light ? "multiply" : "lighter";
		for (let i = 0; i < count; i++) {
			const vx = vxs[i];
			const vy = vys[i];
			const speed = Math.hypot(vx, vy);
			const local = (seeds[i] + shift * .02 + speed * .0018 + xs[i] * 35e-5) % 1;
			const hue = mode.hue0 + (local + 1) % 1 * hueSpan;
			const sx = (Math.floor((hue % 360 + 360) % 360) / 360 * HUE_STEPS | 0) % HUE_STEPS * SPRITE;
			const size = 5.5 + Math.min(speed * .045, 14) + seeds[i] * 3.2;
			ctx.globalAlpha = light ? .28 + Math.min(speed / 420, .5) : .32 + Math.min(speed / 380, .7);
			ctx.drawImage(atlas, sx, row, SPRITE, SPRITE, xs[i] - size * .5, ys[i] - size * .5, size, size);
		}
		this.drawWaves(light);
		this.drawCursor(light, mode);
	}
	drawWaves(light) {
		const { ctx } = this;
		if (this.waves.length === 0) return;
		ctx.globalCompositeOperation = light ? "multiply" : "lighter";
		ctx.lineWidth = 1.5;
		for (const wave of this.waves) {
			ctx.globalAlpha = Math.max(0, wave.life) * .55;
			ctx.strokeStyle = `hsla(${wave.hue}, 70%, ${light ? 28 : 72}%, 1)`;
			ctx.beginPath();
			ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.globalAlpha = Math.max(0, wave.life) * .2;
			ctx.beginPath();
			ctx.arc(wave.x, wave.y, wave.r * .55, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
	drawCursor(light, mode) {
		const target = this.pointerSeen ? {
			x: this.pointerX,
			y: this.pointerY
		} : this.attractor();
		const { ctx } = this;
		const pulse = .55 + Math.sin(this.time * 3.1) * .12;
		const down = this.hold ? 1.55 : 1 + this.pointerDown * .8;
		const radius = 42 * down * pulse;
		const hue = (mode.hue0 + mode.hue1) * .5;
		ctx.globalCompositeOperation = light ? "multiply" : "lighter";
		const g = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, radius);
		const core = light ? .22 : .55;
		g.addColorStop(0, `hsla(${hue}, 70%, ${light ? 24 : 78}%, ${core * down})`);
		g.addColorStop(.35, `hsla(${hue}, 70%, ${light ? 30 : 64}%, ${.16 * down})`);
		g.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);
		ctx.globalAlpha = 1;
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = light ? .7 : .9;
		ctx.fillStyle = light ? "#1a1a18" : "#f4f2ec";
		ctx.beginPath();
		ctx.arc(target.x, target.y, this.hold ? 2.6 : 1.7, 0, Math.PI * 2);
		ctx.fill();
	}
	publish() {
		window.__aether = {
			count: this.count,
			force: this.settings.force,
			attract: this.settings.attract,
			background: this.settings.background,
			colorMode: this.settings.colorMode,
			trails: this.settings.trails,
			pointerSeen: this.pointerSeen,
			clear: () => this.clearTrails(),
			reset: () => this.resetParticles()
		};
	}
};
function ParticleCanvas({ settings, engineRef }) {
	const canvasRef = (0, import_react.useRef)(null);
	const settingsRef = (0, import_react.useRef)(settings);
	settingsRef.current = settings;
	(0, import_react.useEffect)(() => {
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
	(0, import_react.useEffect)(() => {
		engineRef.current?.setSettings(settings);
	}, [settings, engineRef]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "absolute inset-0 block h-full w-full touch-none",
		"aria-label": "Interactive particle field"
	});
}
var COUNT_MAX = 5e3;
var FORCE_MIN = .2;
var FORCE_MAX = 2.6;
var DEFAULT_SETTINGS = {
	count: 1800,
	force: 1,
	trails: .72,
	colorMode: "aurora",
	background: "void",
	attract: true
};
function clampCount(n) {
	return Math.round(Math.min(COUNT_MAX, Math.max(200, n)));
}
var useFieldSettings = create()(persist((set) => ({
	...DEFAULT_SETTINGS,
	setCount: (count) => set({ count: clampCount(count) }),
	setForce: (force) => set({ force: Math.min(FORCE_MAX, Math.max(FORCE_MIN, force)) }),
	setTrails: (trails) => set({ trails: Math.min(1, Math.max(0, trails)) }),
	setColorMode: (colorMode) => set({ colorMode }),
	setBackground: (background) => set({ background }),
	setAttract: (attract) => set({ attract }),
	restoreDefaults: () => set({ ...DEFAULT_SETTINGS })
}), {
	name: "aether-field-v1",
	version: 1,
	partialize: (state) => ({
		count: state.count,
		force: state.force,
		trails: state.trails,
		colorMode: state.colorMode,
		background: state.background,
		attract: state.attract
	})
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg", {
	variants: {
		variant: {
			primary: "bg-fg text-bg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-accent",
			secondary: "bg-surface-2 text-fg shadow-[0_0_0_1px_rgba(243,242,238,0.1)] hover:bg-surface",
			ghost: "bg-transparent text-fg hover:bg-surface-2",
			outline: "bg-transparent text-fg shadow-[0_0_0_1px_rgba(243,242,238,0.14)] hover:bg-surface-2"
		},
		size: {
			sm: "h-9 rounded-sm px-3 text-sm",
			md: "h-11 rounded-md px-4 text-sm",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex h-11 w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1 w-full grow overflow-hidden rounded-full bg-surface-2 shadow-[0_0_0_1px_rgba(243,242,238,0.08)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-fg" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg shadow-[0_0_0_1px_rgba(243,242,238,0.18),0_1px_2px_rgba(0,0,0,0.4)] outline-none transition-[box-shadow,transform] duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/70" })]
}));
Slider.displayName = Slider$1.displayName;
function ControlPanel({ open, onDownload, onClear, onReset, saved }) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "field-controls",
		"aria-hidden": !open,
		className: cn("pointer-events-auto w-full max-w-sm origin-bottom rounded-xl bg-surface/90 p-4 shadow-[0_0_0_1px_rgba(243,242,238,0.1),0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md", "max-h-[min(70dvh,36rem)] overflow-y-auto transition-[opacity,transform] duration-200 ease-out-smooth", open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"),
		"aria-label": "Field controls",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-3 flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium tracking-tight text-fg",
					children: "Field"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Count, pull, and color"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
						id: "particle-count",
						label: "Particles",
						valueLabel: count.toLocaleString(),
						min: 200,
						max: COUNT_MAX,
						step: 100,
						value: count,
						onChange: setCount
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
						id: "particle-force",
						label: "Force",
						valueLabel: force.toFixed(2),
						min: FORCE_MIN,
						max: FORCE_MAX,
						step: .05,
						value: force,
						onChange: setForce
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
						id: "particle-trails",
						label: "Trails",
						valueLabel: `${Math.round(trails * 100)}%`,
						min: 0,
						max: 1,
						step: .02,
						value: trails,
						onChange: setTrails
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-medium text-muted",
					children: "Background"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					role: "radiogroup",
					"aria-label": "Background color",
					children: BACKGROUNDS.map((bg) => {
						const active = background === bg.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "radio",
							"aria-checked": active,
							"aria-label": bg.label,
							onClick: () => setBackground(bg.id),
							className: cn("flex h-11 min-w-11 items-center gap-2 rounded-sm px-2.5 text-xs font-medium text-fg transition-[box-shadow,background-color] duration-150 ease-out", active ? "bg-surface-2 shadow-[0_0_0_1px_rgba(243,242,238,0.28)]" : "shadow-[0_0_0_1px_rgba(243,242,238,0.1)] hover:bg-surface-2"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "size-3.5 rounded-full shadow-[0_0_0_1px_rgba(243,242,238,0.2)]",
								style: { backgroundColor: bg.color },
								"aria-hidden": "true"
							}), bg.label]
						}, bg.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-medium text-muted",
					children: "Color shift"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-4 gap-1 rounded-md bg-bg p-1 shadow-[0_0_0_1px_rgba(243,242,238,0.08)]",
					role: "radiogroup",
					"aria-label": "Color shift",
					children: COLOR_MODES.map((mode) => {
						const active = colorMode === mode.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "radio",
							"aria-checked": active,
							onClick: () => setColorMode(mode.id),
							className: cn("h-9 rounded-sm text-xs font-medium transition-[background-color,color] duration-150 ease-out", active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"),
							children: mode.label
						}, mode.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-1 rounded-md bg-bg p-1 shadow-[0_0_0_1px_rgba(243,242,238,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": attract,
					onClick: () => setAttract(true),
					className: cn("h-10 rounded-sm text-sm font-medium transition-[background-color,color] duration-150 ease-out", attract ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"),
					children: "Attract"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": !attract,
					onClick: () => setAttract(false),
					className: cn("h-10 rounded-sm text-sm font-medium transition-[background-color,color] duration-150 ease-out", !attract ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"),
					children: "Repel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "secondary",
						size: "sm",
						onClick: onClear,
						className: "h-11",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, {}), "Clear"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "secondary",
						size: "sm",
						onClick: onReset,
						className: "h-11",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "Reset"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "primary",
						size: "sm",
						onClick: onDownload,
						className: "h-11",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), saved ? "Saved" : "Save"]
					})
				]
			})
		]
	});
}
function SliderRow({ id, label, valueLabel, min, max, step, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			htmlFor: id,
			className: "text-xs font-medium text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tabular-nums text-fg",
			children: valueLabel
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
		id,
		min,
		max,
		step,
		value: [value],
		onValueChange: ([next]) => {
			if (typeof next === "number") onChange(next);
		},
		"aria-label": label
	})] });
}
function FieldApp() {
	const engineRef = (0, import_react.useRef)(null);
	const count = useFieldSettings((s) => s.count);
	const force = useFieldSettings((s) => s.force);
	const trails = useFieldSettings((s) => s.trails);
	const colorMode = useFieldSettings((s) => s.colorMode);
	const background = useFieldSettings((s) => s.background);
	const attract = useFieldSettings((s) => s.attract);
	const setCount = useFieldSettings((s) => s.setCount);
	const settings = (0, import_react.useMemo)(() => ({
		count,
		force,
		trails,
		colorMode,
		background,
		attract
	}), [
		count,
		force,
		trails,
		colorMode,
		background,
		attract
	]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [hint, setHint] = (0, import_react.useState)(true);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const savedTimer = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const mobile = window.matchMedia("(max-width: 639px)").matches;
		if (!mobile) setOpen(true);
		const persisted = localStorage.getItem("aether-field-v1");
		if (!persisted && mobile) setCount(900);
		else if (!persisted && (navigator.hardwareConcurrency || 8) <= 4) setCount(1200);
	}, [setCount]);
	(0, import_react.useEffect)(() => {
		const hide = () => setHint(false);
		window.addEventListener("pointerdown", hide, { once: true });
		window.addEventListener("pointermove", hide, { once: true });
		return () => {
			window.removeEventListener("pointerdown", hide);
			window.removeEventListener("pointermove", hide);
		};
	}, []);
	(0, import_react.useEffect)(() => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Aether — interactive particle field"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParticleCanvas, {
				settings,
				engineRef
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl leading-tight tracking-display text-fg italic sm:text-4xl",
						children: "Aether"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-1 max-w-64 text-sm text-muted text-pretty transition-opacity duration-300 ease-out-smooth", hint ? "opacity-100" : "opacity-50"),
						children: attract ? "Move to stir · Hold to pull" : "Move to stir · Hold to push"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							size: "icon",
							"aria-label": saved ? "Screenshot saved" : "Download screenshot",
							onClick: onDownload,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							size: "icon",
							"aria-expanded": open,
							"aria-controls": "field-controls",
							"aria-label": open ? "Hide controls" : "Show controls",
							onClick: () => setOpen((v) => !v),
							children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {})
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end justify-start",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlPanel, {
						open,
						onDownload,
						onClear,
						onReset,
						saved
					})
				})]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldApp, {});
}
//#endregion
export { Home as component };
