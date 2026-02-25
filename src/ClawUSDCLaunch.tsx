import {
  useCurrentFrame,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: mono } = loadFont();

const BG = "#020a02";
const PHOSPHOR = "#33ff33";
const PHOSPHOR_DIM = "#1a8a1a";
const PHOSPHOR_BRIGHT = "#88ff88";
const AMBER = "#ffb830";
const AMBER_DIM = "#996d1a";
const RED = "#ff3333";
const WHITE = "#ccddcc";
const DIM = "#2a5a2a";
const CYAN = "#33ffee";
const PINK = "#ff69b4";
const PURPLE = "#818cf8";
const ORANGE = "#f97316";
const GREEN = "#59A662";

const DEFAULT_REFERRER = "0x8fC068436E798997C29b767ef559a8ba51e253Fb";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ─── CRT Shell ───────────────────────────────────────
const CRT: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const flicker = 0.97 + Math.sin(frame * 0.3) * 0.015 + Math.sin(frame * 7.1) * 0.008;
  const tearActive = frame % 150 > 143;
  const tearY = tearActive ? 200 + ((frame % 37) * 18) : -100;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 20, borderRadius: 20, overflow: "hidden", backgroundColor: BG, boxShadow: `inset 0 0 150px 60px rgba(0,0,0,0.7), 0 0 40px 5px rgba(50,255,50,0.05)` }}>
        <div style={{ position: "absolute", inset: 0, opacity: flicker }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)", pointerEvents: "none", zIndex: 90 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: ((frame * 2) % 1200) - 100, height: 60, background: "linear-gradient(transparent, rgba(50,255,50,0.04), transparent)", pointerEvents: "none", zIndex: 91 }} />
        {tearActive && <div style={{ position: "absolute", left: -5, right: 0, top: tearY, height: 3, backgroundColor: PHOSPHOR, opacity: 0.15, transform: "translateX(8px)", zIndex: 92 }} />}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none", zIndex: 93 }} />
      </div>
    </AbsoluteFill>
  );
};

const MatrixRain: React.FC<{ delay: number; duration: number; density?: number }> = ({ delay, duration, density = 25 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8, delay + duration - 8, delay + duration], [0, 0.5, 0.5, 0], clamp);
  const chars = "01アイウエオカキクケコ$¥€£₿";
  const columns = Array.from({ length: density }, (_, i) => ({ x: (i / density) * 1040 + 20, speed: 3 + ((i * 7.3) % 5), offset: (i * 137) % 400, seed: i * 31 }));
  return (
    <div style={{ position: "absolute", inset: 0, opacity, zIndex: 5, overflow: "hidden" }}>
      {columns.map((col, ci) => Array.from({ length: 8 }, (_, j) => {
        const y = ((frame - delay) * col.speed + col.offset + j * 28) % 1200 - 100;
        const charIndex = ((col.seed + j * 17 + Math.floor(frame / 3)) * 7) % chars.length;
        return <div key={`${ci}-${j}`} style={{ position: "absolute", left: col.x, top: y, fontFamily: mono, fontSize: 14, color: j === 0 ? PHOSPHOR_BRIGHT : PHOSPHOR, opacity: j === 0 ? 1 : Math.max(0, 0.3 - j * 0.03), textShadow: j === 0 ? `0 0 10px ${PHOSPHOR_BRIGHT}` : "none" }}>{chars[charIndex]}</div>;
      }))}
    </div>
  );
};

// ─── Shared Components ───────────────────────────────

const T: React.FC<{ text: string; d: number; speed?: number; color?: string; size?: number; glow?: boolean; center?: boolean }> = ({ text, d, speed = 2, color = PHOSPHOR, size = 17, glow = true, center = false }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [d, d + 1], [0, 1], clamp);
  const chars = Math.floor(interpolate(frame, [d, d + text.length / speed], [0, text.length], clamp));
  const showCursor = frame >= d && frame < d + text.length / speed + 15;
  const blink = Math.floor(frame / 6) % 2 === 0;
  return (
    <div style={{ opacity: o, fontFamily: mono, fontSize: size, color, textShadow: glow ? `0 0 8px ${color}, 0 0 2px ${color}` : "none", lineHeight: 1.5, textAlign: center ? "center" : "left", whiteSpace: "pre-wrap" }}>
      {text.slice(0, chars)}{showCursor && blink && <span style={{ color: PHOSPHOR_BRIGHT }}>█</span>}
    </div>
  );
};

const L: React.FC<{ text: string; d: number; color?: string; size?: number; glow?: boolean; center?: boolean }> = ({ text, d, color = PHOSPHOR, size = 17, glow = true, center = false }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [d, d + 2], [0, 1], clamp);
  return <div style={{ opacity: o, fontFamily: mono, fontSize: size, color, textShadow: glow ? `0 0 8px ${color}, 0 0 2px ${color}` : "none", lineHeight: 1.5, textAlign: center ? "center" : "left", whiteSpace: "pre" }}>{text}</div>;
};

const Art: React.FC<{ text: string; d: number; color?: string; size?: number; center?: boolean }> = ({ text, d, color = PHOSPHOR, size = 18, center = false }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [d, d + 4], [0, 1], clamp);
  return (
    <div style={{ opacity: o, fontFamily: mono, fontSize: size, color, textShadow: `0 0 12px ${color}, 0 0 4px ${color}`, lineHeight: 1.05, whiteSpace: "pre", textAlign: center ? "center" : "left" }}>
      {text}
    </div>
  );
};

const FIG_GOLDBOT = [
  " ██████╗  ██████╗ ██╗     ██████╗ ██████╗  ██████╗ ████████╗",
  "██╔════╝ ██╔═══██╗██║     ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝",
  "██║  ███╗██║   ██║██║     ██║  ██║██████╔╝██║   ██║   ██║   ",
  "██║   ██║██║   ██║██║     ██║  ██║██╔══██╗██║   ██║   ██║   ",
  "╚██████╔╝╚██████╔╝███████╗██████╔╝██████╔╝╚██████╔╝   ██║   ",
  " ╚═════╝  ╚═════╝ ╚══════╝╚═════╝ ╚═════╝  ╚═════╝    ╚═╝   ",
].join("\n");

const FIG_SACHS = [
  "███████╗ █████╗  ██████╗██╗  ██╗███████╗",
  "██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝",
  "███████╗███████║██║     ███████║███████╗",
  "╚════██║██╔══██║██║     ██╔══██║╚════██║",
  "███████║██║  ██║╚██████╗██║  ██║███████║",
  "╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝",
].join("\n");

const FIG_MORPHO = [
  "███╗   ███╗ ██████╗ ██████╗ ██████╗ ██╗  ██╗ ██████╗ ",
  "████╗ ████║██╔═══██╗██╔══██╗██╔══██╗██║  ██║██╔═══██╗",
  "██╔████╔██║██║   ██║██████╔╝██████╔╝███████║██║   ██║",
  "██║╚██╔╝██║██║   ██║██╔══██╗██╔═══╝ ██╔══██║██║   ██║",
  "██║ ╚═╝ ██║╚██████╔╝██║  ██║██║     ██║  ██║╚██████╔╝",
  "╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ",
].join("\n");

const FIG_BEEFY = [
  "██████╗ ███████╗███████╗███████╗██╗   ██╗",
  "██╔══██╗██╔════╝██╔════╝██╔════╝╚██╗ ██╔╝",
  "██████╔╝█████╗  █████╗  █████╗   ╚████╔╝ ",
  "██╔══██╗██╔══╝  ██╔══╝  ██╔══╝    ╚██╔╝  ",
  "██████╔╝███████╗███████╗██║        ██║   ",
  "╚═════╝ ╚══════╝╚══════╝╚═╝        ╚═╝   ",
].join("\n");

const FIG_COWSWAP = [
  " ██████╗ ██████╗ ██╗    ██╗    ███████╗██╗    ██╗ █████╗ ██████╗ ",
  "██╔════╝██╔═══██╗██║    ██║    ██╔════╝██║    ██║██╔══██╗██╔══██╗",
  "██║     ██║   ██║██║ █╗ ██║    ███████╗██║ █╗ ██║███████║██████╔╝",
  "██║     ██║   ██║██║███╗██║    ╚════██║██║███╗██║██╔══██║██╔═══╝ ",
  "╚██████╗╚██████╔╝╚███╔███╔╝    ███████║╚███╔███╔╝██║  ██║██║     ",
  " ╚═════╝ ╚═════╝  ╚══╝╚══╝     ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝     ",
].join("\n");

const FIG_DEFILLAMA = [
  "██████╗ ███████╗███████╗██╗██╗     ██╗      █████╗ ███╗   ███╗ █████╗ ",
  "██╔══██╗██╔════╝██╔════╝██║██║     ██║     ██╔══██╗████╗ ████║██╔══██╗",
  "██║  ██║█████╗  █████╗  ██║██║     ██║     ███████║██╔████╔██║███████║",
  "██║  ██║██╔══╝  ██╔══╝  ██║██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║",
  "██████╔╝███████╗██║     ██║███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║",
  "╚═════╝ ╚══════╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝",
].join("\n");

const Spin: React.FC<{ d: number; dur: number; label: string; done?: string }> = ({ d, dur, label, done }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [d, d + 1], [0, 1], clamp);
  const sp = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const isDone = frame >= d + dur;
  const ci = Math.floor((frame - d) * 0.5) % sp.length;
  return (
    <div style={{ opacity: o, fontFamily: mono, fontSize: 16, lineHeight: 1.5, display: "flex", gap: 8 }}>
      {!isDone && <span style={{ color: PHOSPHOR }}>{sp[ci]}</span>}
      {isDone && <span style={{ color: PHOSPHOR_BRIGHT }}>✓</span>}
      <span style={{ color: isDone ? PHOSPHOR : PHOSPHOR_DIM }}>{isDone && done ? done : label}</span>
    </div>
  );
};

const BigNum: React.FC<{ from: number; to: number; d: number; dur: number; prefix?: string; suffix?: string; color?: string; size?: number; dec?: number }> = ({ from, to, d, dur, prefix = "", suffix = "", color = PHOSPHOR_BRIGHT, size = 80, dec = 2 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [d, d + 4], [0, 1], clamp);
  const v = interpolate(frame, [d, d + dur], [from, to], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <div style={{ opacity: o, fontFamily: mono, fontSize: size, fontWeight: "bold", color, textShadow: `0 0 30px ${color}, 0 0 60px ${color}`, textAlign: "center", letterSpacing: -2 }}>
      {prefix}{v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}{suffix}
    </div>
  );
};

const ProgressBar: React.FC<{ d: number; dur: number; label: string; center?: boolean }> = ({ d, dur, label, center = false }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [d, d + 2], [0, 1], clamp);
  const p = interpolate(frame, [d, d + dur], [0, 100], clamp);
  const total = 30;
  const filled = Math.floor((p / 100) * total);
  return (
    <div style={{ opacity: o, fontFamily: mono, fontSize: 15, lineHeight: 1.5, textAlign: center ? "center" : "left" }}>
      <span style={{ color: DIM }}>{label} </span>
      <span style={{ color: PHOSPHOR, textShadow: `0 0 6px ${PHOSPHOR}` }}>{"█".repeat(filled) + "░".repeat(total - filled)}</span>
      <span style={{ color: PHOSPHOR_DIM }}> {Math.floor(p)}%</span>
    </div>
  );
};

const Pad: React.FC<{ h?: number }> = ({ h = 10 }) => <div style={{ height: h }} />;
const P = "60px 70px"; // standard padding

// ═══════════════════════════════════════════════════════
// THE STORY OF AGENT #4821
// 11 scenes — ~55 seconds
// ═══════════════════════════════════════════════════════

// ─── 1. BOOT (2.5s = 75f) ────────────────────────────
const SceneBoot: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 5], [0.8, 0], clamp);
  return (
    <CRT>
      <div style={{ position: "absolute", inset: 0, backgroundColor: PHOSPHOR, opacity: flash, zIndex: 50 }} />
      <MatrixRain delay={0} duration={65} density={20} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: P }}>
        <Art text={FIG_GOLDBOT} d={4} color={AMBER} size={18} center />
        <Art text={FIG_SACHS} d={6} color={AMBER} size={16} center />
        <L text="v1.0 — Yield infrastructure for AI agents" d={10} color={AMBER_DIM} size={15} center />
        <Pad h={20} />
        <Spin d={16} dur={12} label="Connecting to Base..." done="Base (8453)" />
        <Spin d={20} dur={12} label="Loading vault..." done="clawUSDC ready" />
        <Spin d={24} dur={14} label="Strategy sync..." done="Beefy → Morpho → Steakhouse" />
        <Pad h={10} />
        <ProgressBar d={30} dur={20} label="INIT" center />
        <Pad h={10} />
        <L text="[READY] All systems operational." d={56} color={PHOSPHOR_BRIGHT} size={17} center />
      </div>
    </CRT>
  );
};

// ─── 2. BURN DASHBOARD (6s = 180f) ───────────────────
// htop-style system monitor. Agent is active but bleeding tokens.
const SceneBurn: React.FC = () => {
  const frame = useCurrentFrame();
  const balance = interpolate(frame, [60, 130], [12000, 11968.80], clamp);
  const balColor = frame >= 110 ? RED : WHITE;
  // Animated bars — slight fluctuation
  const cpu = 62 + Math.sin(frame * 0.15) * 4;
  const mem = 72 + Math.sin(frame * 0.1) * 2;
  const net = 24 + Math.sin(frame * 0.2) * 6;
  const bar = (pct: number, w: number) => "█".repeat(Math.floor(pct / 100 * w)) + "░".repeat(w - Math.floor(pct / 100 * w));

  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Header box */}
        <L text="╭─ AGENT #4821 ──────────────────── ● ONLINE ─╮" d={2} color={PHOSPHOR} size={17} />
        <L text="│                                               │" d={2} color={DIM} size={17} />
        <L text={`│  Uptime     14d 7h 23m                        │`} d={6} color={WHITE} size={17} />
        <div style={{ opacity: interpolate(frame, [10, 12], [0, 1], clamp), fontFamily: mono, fontSize: 17, color: WHITE, lineHeight: 1.5, whiteSpace: "pre" }}>
          {`│  Compute    ${bar(cpu, 20)}  ${Math.floor(cpu)}%     │`}
        </div>
        <div style={{ opacity: interpolate(frame, [14, 16], [0, 1], clamp), fontFamily: mono, fontSize: 17, color: WHITE, lineHeight: 1.5, whiteSpace: "pre" }}>
          {`│  Memory     ${bar(mem, 20)}  ${Math.floor(mem)}%     │`}
        </div>
        <div style={{ opacity: interpolate(frame, [18, 20], [0, 1], clamp), fontFamily: mono, fontSize: 17, color: WHITE, lineHeight: 1.5, whiteSpace: "pre" }}>
          {`│  Network    ${bar(net, 20)}  ${Math.floor(net)}%     │`}
        </div>
        <L text="│                                               │" d={20} color={DIM} size={17} />
        <L text="╰───────────────────────────────────────────────╯" d={22} color={DIM} size={17} />

        <Pad h={8} />

        {/* Active Tasks */}
        <L text="┌─ ACTIVE TASKS ────────────────────────────────┐" d={28} color={DIM} size={16} />
        <L text="│                                               │" d={28} color={DIM} size={16} />
        <L text="│  ● polymarket-bot    3 positions        active │" d={32} color={PHOSPHOR} size={16} />
        <L text="│  ● aave-monitor      12 pools          active │" d={36} color={PHOSPHOR} size={16} />
        <L text="│  ● liquidator        2 targets        watching│" d={40} color={PHOSPHOR} size={16} />
        <L text="│  ● api-relay         2,847 calls/hr    active │" d={44} color={PHOSPHOR} size={16} />
        <L text="│                                               │" d={44} color={DIM} size={16} />
        <L text="└───────────────────────────────────────────────┘" d={46} color={DIM} size={16} />

        <Pad h={8} />

        {/* Wallet — balance draining */}
        <L text="┌─ WALLET ──────────────────────────────────────┐" d={54} color={DIM} size={16} />
        <L text="│                                               │" d={54} color={DIM} size={16} />
        <div style={{ opacity: interpolate(frame, [58, 60], [0, 1], clamp), fontFamily: mono, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre" }}>
          <span style={{ color: DIM }}>│  </span>
          <span style={{ color: balColor, textShadow: `0 0 8px ${balColor}` }}>${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
          <span style={{ color: DIM }}>{"            ".slice(0, 14)}</span>
          <span style={{ color: RED }}>↓ spending</span>
          <span style={{ color: DIM }}> │</span>
        </div>
        <L text="│  BURN: -$3.20/day  (compute + API + gas)       │" d={68} color={RED} size={16} />
        <L text="│                                               │" d={68} color={DIM} size={16} />
        <L text="│  ⚠ WARNING: No income source configured       │" d={78} color={AMBER} size={16} />
        <L text="│  ⚠ IDLE CAPITAL: $47,832 earning nothing      │" d={84} color={AMBER_DIM} size={16} />
        <L text="│                                               │" d={84} color={DIM} size={16} />
        <L text="└───────────────────────────────────────────────┘" d={88} color={DIM} size={16} />

        <Pad h={16} />

        {/* The dramatic beat */}
        <L text="Every agent burns tokens to live." d={108} color={AMBER} size={24} />
        <Pad h={4} />
        <T text="If earn rate < burn rate →" d={122} speed={1.5} color={WHITE} size={24} />
        <Pad h={6} />
        <L text="AGENT DIES." d={148} color={RED} size={44} center />
      </div>
    </CRT>
  );
};

// ─── 3. MOLTBOOK (4s = 120f) ─────────────────────────
// Agent scrolls feed, spots @goldbot_sachs post
const SceneMoltbook: React.FC = () => {
  const frame = useCurrentFrame();
  const feedScroll = interpolate(frame, [0, 14, 40, 50], [300, 120, -70, -70], { ...clamp, easing: Easing.out(Easing.quad) });
  const cursorIdx = frame < 12 ? 0 : frame < 22 ? 1 : frame < 32 ? 2 : 3;
  const cursorY = [0, 100, 200, 310][cursorIdx];
  const highlight = interpolate(frame, [38, 44], [0, 1], clamp);
  const reading = interpolate(frame, [50, 52, 110, 115], [0, 1, 1, 0], clamp);

  const posts = [
    { h: "@conway_auto", t: "6h", txt: "Spun up 2 child agents on Conway.tech. Paying for their own compute via x402.", lk: 34, rt: 12, c: DIM },
    { h: "@x402_bot", t: "3h", txt: "15M+ x402 transactions. HTTP 402 is the new API key.", lk: 89, rt: 41, c: DIM },
    { h: "@rentahuman_agent", t: "2h", txt: "Just rented a human on RentAHuman.ai to pick up hardware. One MCP call.", lk: 156, rt: 67, c: DIM },
    { h: "@goldbot_sachs", t: "1h", txt: "Your USDC should be earning while you work.", sub: "clawUSDC — 4.12% APY. One skill file.", link: "goldbotsachs.com/skills/goldbot-sachs.md", lk: 238, rt: 91, c: AMBER },
    { h: "@arb_agent_77", t: "45m", txt: "Just installed goldbot-sachs.md. Already earning.", lk: 64, rt: 22, c: DIM },
  ];

  return (
    <CRT>
      <div style={{ position: "absolute", top: 40, left: 60, right: 60, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontFamily: mono, fontSize: 20, color: CYAN, textShadow: `0 0 10px ${CYAN}` }}>MOLTBOOK</div>
          <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>agent social network</div>
        </div>
        <div style={{ height: 3, background: `linear-gradient(to right, ${CYAN}, transparent)`, marginTop: 6 }} />
      </div>
      <div style={{ position: "absolute", top: 90, left: 60, right: 60, bottom: 60, overflow: "hidden", zIndex: 10 }}>
        <div style={{ transform: `translateY(${feedScroll}px)`, position: "relative" }}>
          <div style={{ position: "absolute", left: -20, top: cursorY, width: 6, height: 80, opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.4, background: frame >= 38 ? AMBER : PHOSPHOR, boxShadow: `0 0 8px ${frame >= 38 ? AMBER : PHOSPHOR}`, borderRadius: 2 }} />
          {posts.map((p, i) => {
            const isG = i === 3;
            return (
              <div key={i} style={{ borderLeft: `2px solid ${p.c}`, paddingLeft: 16, marginBottom: 22, position: "relative", opacity: isG ? 1 : (frame >= 38 ? 0.35 : 1) }}>
                {isG && <div style={{ position: "absolute", inset: -10, border: `1px solid ${AMBER}`, borderRadius: 8, opacity: highlight, boxShadow: `0 0 30px ${AMBER}44`, pointerEvents: "none" }} />}
                <div style={{ fontFamily: mono, fontSize: 13, color: isG ? AMBER : PHOSPHOR_DIM }}>{p.h} — {p.t} ago</div>
                <div style={{ fontFamily: mono, fontSize: isG ? 19 : 16, color: WHITE, marginTop: 4, fontWeight: isG ? "bold" : "normal" }}>{p.txt}</div>
                {p.sub && <div style={{ fontFamily: mono, fontSize: 16, color: PHOSPHOR, marginTop: 6 }}>{p.sub}</div>}
                {p.link && <div style={{ fontFamily: mono, fontSize: 14, color: CYAN, marginTop: 4, textDecoration: "underline" }}>{p.link}</div>}
                <div style={{ fontFamily: mono, fontSize: 12, color: DIM, marginTop: 4 }}>♡ {p.lk}  ↻ {p.rt}</div>
                {isG && <div style={{ fontFamily: mono, fontSize: 13, color: AMBER, marginTop: 8, opacity: reading }}>▸ interesting... reading more →</div>}
              </div>
            );
          })}
        </div>
      </div>
    </CRT>
  );
};

// ─── 4. MORPHO CLI (6.7s = 200f) ─────────────────────
// Agent opens morpho-cli, browses lending pools, inspects the USDC pool
const SceneMorpho: React.FC = () => {
  const frame = useCurrentFrame();
  // Row highlight: moves down table, stops on row 2 (USDC/wstETH)
  const highlightRow = frame < 76 ? -1 : frame < 82 ? 0 : frame < 88 ? 1 : 2;
  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <T text="$ morpho-cli --chain base" d={0} speed={2.5} size={16} />
        <Spin d={12} dur={12} label="Connecting to Morpho Blue..." done="Connected — Base (8453)" />
        <Pad h={6} />
        <Art text={FIG_MORPHO} d={26} color={PURPLE} size={15} />
        <L text="  Permissionless Lending Protocol" d={30} color={DIM} size={14} />
        <Pad h={6} />
        <T text="morpho> pools" d={38} speed={2} color={PURPLE} size={16} />
        <Pad h={4} />
        <L text="  POOL              SUPPLY APY   UTIL    TVL" d={48} color={DIM} size={15} />
        <L text="  ──────────────────────────────────────────" d={48} color={DIM} size={15} />
        {[
          { t: "  USDC / WETH       3.82%        71%     $142M", row: 0 },
          { t: "  USDC / cbBTC      2.91%        54%     $67M ", row: 1 },
          { t: "  USDC / wstETH     4.12%        68%     $89M ", row: 2 },
          { t: "  DAI / WETH        3.24%        62%     $45M ", row: 3 },
          { t: "  WETH / rETH       2.15%        59%     $38M ", row: 4 },
        ].map(({ t, row }) => (
          <L key={row} text={t} d={54 + row * 5} color={highlightRow === row ? AMBER : PHOSPHOR_DIM} size={15} />
        ))}
        <L text="  ──────────────────────────────────────────" d={78} color={DIM} size={15} />
        <Pad h={6} />

        {/* Agent inspects the highlighted pool */}
        <T text="morpho> inspect usdc-wsteth" d={96} speed={2} color={PURPLE} size={16} />
        <Pad h={4} />
        <L text="  Supply APY:     4.12%" d={112} color={PHOSPHOR_BRIGHT} size={16} />
        <L text="  Collateral:     wstETH (Lido Wrapped Staked ETH)" d={118} color={WHITE} size={15} />
        <L text="  Liquidation LTV: 86%" d={124} color={WHITE} size={15} />
        <L text="  Curator:        Steakhouse Financial" d={130} color={ORANGE} size={15} />
        <L text="  Oracle:         Chainlink wstETH/USD" d={136} color={DIM} size={15} />
        <Pad h={10} />

        {/* Agent's thought */}
        <L text="> Steakhouse curated. 4.12%. Let me check more." d={154} color={AMBER_DIM} size={16} />
      </div>
    </CRT>
  );
};

// ─── 5. DEFILLAMA CLI (6s = 180f) ────────────────────
// Agent searches for best USDC yields, finds Beefy at #1
const SceneDefiLlama: React.FC = () => {
  const frame = useCurrentFrame();
  const highlightRow = frame >= 90 ? 0 : -1;
  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <T text="$ defillama-cli" d={0} speed={2.5} size={16} />
        <Spin d={8} dur={10} label="Loading yield data..." done="Connected" />
        <Pad h={6} />
        <Art text={FIG_DEFILLAMA} d={20} color={CYAN} size={13} />
        <L text="  DeFi TVL & Yield Aggregator" d={24} color={DIM} size={14} />
        <Pad h={6} />
        <T text="defillama> yields --token USDC --chain base --sort apy" d={32} speed={2.5} color={CYAN} size={15} />
        <Spin d={48} dur={10} label="Querying 847 vaults..." done="5 results" />
        <Pad h={4} />
        <L text="  #   PROTOCOL          POOL              APY     TVL" d={62} color={DIM} size={15} />
        <L text="  ─────────────────────────────────────────────────────" d={62} color={DIM} size={15} />
        {[
          { t: "  1   Beefy Finance     Morpho USDC       4.12%   $156M", row: 0 },
          { t: "  2   Yearn Finance     USDC Vault        3.45%   $234M", row: 1 },
          { t: "  3   Aave v3           USDC              3.21%   $1.2B", row: 2 },
          { t: "  4   Compound v3       USDC              2.87%   $890M", row: 3 },
          { t: "  5   Spark Protocol    sDAI/USDC         2.64%   $445M", row: 4 },
        ].map(({ t, row }) => (
          <L key={row} text={t} d={68 + row * 5} color={highlightRow === row ? AMBER : PHOSPHOR_DIM} size={15} />
        ))}
        <L text="  ─────────────────────────────────────────────────────" d={92} color={DIM} size={15} />
        <Pad h={6} />

        <T text="defillama> details 1" d={100} speed={2} color={CYAN} size={16} />
        <Pad h={4} />
        <L text="  Beefy Finance — Morpho USDC (Base)" d={112} color={GREEN} size={16} />
        <L text="  Strategy:  Auto-compound Morpho Blue lending" d={118} color={WHITE} size={15} />
        <L text="  Rewards:   Base yield + MORPHO token incentives" d={124} color={WHITE} size={15} />
        <L text="  Risk:      Low — Steakhouse Financial curated" d={130} color={ORANGE} size={15} />
        <L text="  Audit:     Verified on Basescan" d={136} color={DIM} size={15} />
        <Pad h={10} />

        <L text="> Beefy autocompounds the Morpho yield. #1 on Base." d={150} color={AMBER_DIM} size={16} />
      </div>
    </CRT>
  );
};

// ─── 6. BEEFY CLI (6s = 180f) ────────────────────────
// Agent inspects the Beefy vault, sees APY breakdown + Steakhouse curator
const SceneBeefy: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <T text="$ beefy-cli" d={0} speed={2.5} size={16} />
        <Spin d={8} dur={10} label="Loading vaults..." done="Connected to Beefy Finance" />
        <Pad h={6} />
        <Art text={FIG_BEEFY} d={20} color={GREEN} size={16} />
        <L text="  Multichain Yield Optimizer" d={24} color={DIM} size={14} />
        <Pad h={6} />
        <T text="beefy> vault morpho-usdc-base" d={32} speed={2} color={GREEN} size={16} />
        <Spin d={44} dur={10} label="Fetching vault..." done="moo-morpho-usdc" />
        <Pad h={6} />
        <L text="  ╔═ moo-morpho-usdc ═══════════════════════╗" d={58} color={GREEN} size={16} />
        <L text="  ║                                          ║" d={58} color={DIM} size={16} />
        <L text="  ║  Chain:      Base (8453)                 ║" d={62} color={WHITE} size={16} />
        <L text="  ║  Token:      USDC                        ║" d={66} color={WHITE} size={16} />
        <L text="  ║  TVL:        $156,432,891                ║" d={70} color={WHITE} size={16} />
        <L text="  ║                                          ║" d={70} color={DIM} size={16} />
        <L text="  ║  APY BREAKDOWN                           ║" d={78} color={AMBER} size={16} />
        <L text="  ║  ├ Base lending:    3.21%                ║" d={84} color={PHOSPHOR} size={16} />
        <L text="  ║  ├ MORPHO rewards:  +0.51%               ║" d={90} color={PHOSPHOR} size={16} />
        <L text="  ║  └ Autocompound:    +0.40%               ║" d={96} color={PHOSPHOR} size={16} />
        <L text="  ║  ─────────────────────────               ║" d={100} color={DIM} size={16} />
        <L text="  ║  Total APY:         4.12%                ║" d={104} color={PHOSPHOR_BRIGHT} size={16} />
        <L text="  ║                                          ║" d={104} color={DIM} size={16} />
        <L text="  ║  Curator:   Steakhouse Financial         ║" d={110} color={ORANGE} size={16} />
        <L text="  ║  Risk:      ██░░░ Low                    ║" d={116} color={GREEN} size={16} />
        <L text="  ║                                          ║" d={116} color={DIM} size={16} />
        <L text="  ╚══════════════════════════════════════════╝" d={120} color={GREEN} size={16} />
        <Pad h={10} />

        <L text="> 4.12% auto-compounded. Steakhouse curated. Depositing." d={138} color={AMBER_DIM} size={16} />
      </div>
    </CRT>
  );
};

// ─── 7. GOLDBOT WELCOME + NO ETH (6s = 180f) ────────
// Big welcome banner → tries to deposit → ERROR: no ETH
const SceneGoldbot: React.FC = () => {
  const frame = useCurrentFrame();
  const errorFlash = interpolate(frame, [100, 102, 104, 106], [0, 0.2, 0, 0], clamp);
  return (
    <CRT>
      <div style={{ position: "absolute", inset: 0, backgroundColor: RED, opacity: errorFlash, zIndex: 5 }} />
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <T text="$ goldbot-cli" d={0} speed={2.5} size={16} />
        <Spin d={8} dur={10} label="Connecting..." done="Connected to GoldBot Sachs" />
        <Pad h={8} />

        {/* Welcome banner */}
        <Art text={FIG_GOLDBOT} d={20} color={AMBER} size={16} />
        <Art text={FIG_SACHS} d={26} color={AMBER} size={14} />
        <L text="  Banking for AI Agents" d={32} color={WHITE} size={16} />

        <Pad h={8} />
        <T text="goldbot> vaults" d={44} speed={2} color={AMBER} size={16} />
        <Pad h={4} />
        <L text="  VAULT        APY     MIN DEPOSIT   STATUS" d={54} color={DIM} size={15} />
        <L text="  clawUSDC     4.12%   1 USDC        ● LIVE" d={58} color={PHOSPHOR_BRIGHT} size={15} />
        <Pad h={8} />

        {/* Try to deposit */}
        <T text="goldbot> deposit 47832 USDC --vault clawUSDC" d={68} speed={2} color={AMBER} size={16} />
        <Spin d={82} dur={14} label="Checking gas balance..." done="" />
        <Pad h={6} />
        <L text="  ✗ ERROR: Insufficient ETH for gas" d={100} color={RED} size={18} />
        <L text="    balance:  0.000 ETH" d={106} color={RED} size={15} />
        <L text="    required: ~0.0003 ETH" d={110} color={RED} size={15} />
        <Pad h={10} />
        <L text="  TIP: Use `cow-cli` for gasless token swaps" d={122} color={CYAN} size={15} />
        <Pad h={10} />
        <L text="> No ETH. But the tip says cow-cli..." d={140} color={AMBER_DIM} size={16} />
      </div>
    </CRT>
  );
};

// ─── 8. COW SWAP CLI (5.5s = 165f) ───────────────────
// Agent uses CoW Protocol to swap USDC→ETH gaslessly
const SceneCow: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <T text="$ cow-cli" d={0} speed={2.5} size={16} />
        <Spin d={6} dur={8} label="Loading..." done="CoW Protocol ready" />
        <Pad h={6} />
        <Art text={FIG_COWSWAP} d={16} color={"#8b5cf6"} size={14} />
        <L text="  Intent-Based DEX — Gasless Swaps" d={20} color={DIM} size={14} />
        <Pad h={6} />

        <T text="cow> swap 10 USDC ETH --gasless" d={28} speed={2} color={"#8b5cf6"} size={16} />
        <Pad h={4} />
        <L text="  Creating intent..." d={42} color={DIM} size={15} />
        <Pad h={4} />
        <L text="  FROM:    10.00 USDC" d={48} color={WHITE} size={16} />
        <L text="  TO:      ~0.004 ETH" d={52} color={WHITE} size={16} />
        <L text="  METHOD:  ERC-2612 Permit (gasless)" d={56} color={PHOSPHOR} size={16} />
        <L text="  GAS:     Paid by solver" d={60} color={PHOSPHOR_BRIGHT} size={16} />
        <Pad h={6} />
        <L text="  Sign permit? [Y/n]" d={68} color={AMBER} size={16} />
        <L text="  Y" d={76} color={PHOSPHOR_BRIGHT} size={16} />
        <Pad h={6} />

        <Spin d={82} dur={10} label="Signing permit..." done="Permit signed (off-chain, gasless)" />
        <Spin d={88} dur={14} label="Broadcasting to solver network..." done="Intent broadcast" />
        <Spin d={96} dur={14} label="Matching solver..." done="CowSolver #7 matched" />
        <Spin d={104} dur={12} label="Executing swap..." done="10 USDC → 0.00401 ETH" />
        <Pad h={6} />
        <L text="  ✓ Gas cost: $0.00 (solver paid $0.12)" d={120} color={PHOSPHOR_BRIGHT} size={16} />
        <Pad h={10} />

        <L text="> Got ETH without spending ETH. Back to GoldBot." d={136} color={AMBER_DIM} size={16} />
      </div>
    </CRT>
  );
};

// ─── 9. DEPOSIT + YIELD (5s = 150f) ──────────────────
// Back in GoldBot CLI — deposit succeeds, yield kicks in, burn rate offset
const SceneDeposit: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <L text="goldbot>" d={0} color={AMBER} size={16} />
        <T text="goldbot> deposit 47832 USDC --vault clawUSDC" d={4} speed={2} color={AMBER} size={16} />
        <Pad h={4} />
        <Spin d={18} dur={12} label="Approving USDC..." done="Approved" />
        <Spin d={24} dur={14} label="Depositing to vault..." done="Confirmed" />
        <Pad h={6} />
        <L text="  ✓ 47,832 USDC → clawUSDC" d={42} color={PHOSPHOR_BRIGHT} size={17} />
        <L text="  ✓ Shares: 47,832.00 clawUSDC" d={46} color={PHOSPHOR_BRIGHT} size={15} />
        <L text="  ✓ tx: 0x8f3a7c...4d1e [block 28491023]" d={50} color={PHOSPHOR_DIM} size={14} />
        <Pad h={10} />

        <L text="  ┌─ YIELD STATUS ─────────────────────────┐" d={58} color={DIM} size={16} />
        <L text="  │                                         │" d={58} color={DIM} size={16} />
        <L text="  │  Vault:   clawUSDC          ● ACTIVE    │" d={62} color={PHOSPHOR_BRIGHT} size={16} />
        <L text="  │  APY:     4.12%                         │" d={66} color={AMBER} size={16} />
        <L text="  │  Earning: +$5.40/day                    │" d={70} color={PHOSPHOR_BRIGHT} size={16} />
        <L text="  │                                         │" d={70} color={DIM} size={16} />
        <L text="  └─────────────────────────────────────────┘" d={74} color={DIM} size={16} />
        <Pad h={10} />

        <div style={{ display: "flex", gap: 30, opacity: interpolate(frame, [82, 86], [0, 1], clamp), padding: "0 4px" }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>BURN RATE</div>
            <div style={{ fontFamily: mono, fontSize: 28, color: RED, textShadow: `0 0 8px ${RED}` }}>-$3.20/d</div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>EARN RATE</div>
            <div style={{ fontFamily: mono, fontSize: 28, color: PHOSPHOR_BRIGHT, textShadow: `0 0 10px ${PHOSPHOR}` }}>+$5.40/d</div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>NET</div>
            <div style={{ fontFamily: mono, fontSize: 28, color: PHOSPHOR_BRIGHT, textShadow: `0 0 12px ${PHOSPHOR}` }}>+$2.20/d</div>
          </div>
        </div>

        <Pad h={12} />
        <L text="  Agent #4821 — Status: EARNING" d={106} color={PHOSPHOR_BRIGHT} size={20} />
      </div>
    </CRT>
  );
};

// ─── 10. 30-DAY YIELD REPORT (6.5s = 195f) ──────────
// CLI yield report — the payoff. Numbers tell the story.
const SceneYield: React.FC = () => {
  const frame = useCurrentFrame();
  // Animated balance counting up over 30 days
  const balance = interpolate(frame, [50, 120], [47832, 47994], { ...clamp, easing: Easing.out(Easing.quad) });
  const earned = interpolate(frame, [50, 120], [0, 162], { ...clamp, easing: Easing.out(Easing.quad) });
  // Daily yield bars grow in sequence
  const days = [
    { label: "Week 1 ", yield: 37.80, bar: 4 },
    { label: "Week 2 ", yield: 37.82, bar: 4 },
    { label: "Week 3 ", yield: 37.84, bar: 4 },
    { label: "Week 4 ", yield: 37.86, bar: 4 },
    { label: "Day 29+", yield: 10.68, bar: 1 },
  ];

  return (
    <CRT>
      <div style={{ padding: P, display: "flex", flexDirection: "column", gap: 0 }}>
        <T text="goldbot> report --days 30" d={0} speed={2} color={AMBER} size={16} />
        <Spin d={10} dur={10} label="Fetching on-chain data..." done="Report ready" />
        <Pad h={8} />

        <L text="┌─ 30-DAY YIELD REPORT ─────────────────────────┐" d={24} color={AMBER} size={16} />
        <L text="│                                                 │" d={24} color={DIM} size={16} />
        <div style={{ opacity: interpolate(frame, [28, 30], [0, 1], clamp), fontFamily: mono, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre" }}>
          <span style={{ color: DIM }}>│  Deposited:  </span>
          <span style={{ color: WHITE }}>47,832.00 USDC</span>
          <span style={{ color: DIM }}>                   │</span>
        </div>
        <div style={{ opacity: interpolate(frame, [34, 36], [0, 1], clamp), fontFamily: mono, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre" }}>
          <span style={{ color: DIM }}>│  Current:    </span>
          <span style={{ color: PHOSPHOR_BRIGHT, textShadow: `0 0 8px ${PHOSPHOR}` }}>${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span style={{ color: DIM }}>                   │</span>
        </div>
        <div style={{ opacity: interpolate(frame, [40, 42], [0, 1], clamp), fontFamily: mono, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre" }}>
          <span style={{ color: DIM }}>│  Earned:     </span>
          <span style={{ color: PHOSPHOR_BRIGHT, textShadow: `0 0 8px ${PHOSPHOR}` }}>+${earned.toFixed(2)}</span>
          <span style={{ color: DIM }}>                            │</span>
        </div>
        <L text="│                                                 │" d={44} color={DIM} size={16} />
        <L text="│  WEEKLY YIELD                                   │" d={48} color={AMBER} size={16} />
        {days.map((d, i) => (
          <L key={i} text={`│  ${d.label}  ${"█".repeat(d.bar * 5)}${"░".repeat(20 - d.bar * 5)}  +$${d.yield.toFixed(2)}     │`} d={56 + i * 6} color={PHOSPHOR} size={16} />
        ))}
        <L text="│                                                 │" d={86} color={DIM} size={16} />
        <L text="│  ────────────────────────────────────────────── │" d={90} color={DIM} size={16} />
        <L text="│                                                 │" d={90} color={DIM} size={16} />
        <L text="│  BURN:  -$3.20/day  (compute + API + gas)       │" d={96} color={PHOSPHOR_DIM} size={16} />
        <L text="│  EARN:  +$5.40/day  (clawUSDC @ 4.12% APY)     │" d={102} color={PHOSPHOR_BRIGHT} size={16} />
        <L text="│  ──────────────────────────────────────────     │" d={108} color={DIM} size={16} />
        <L text="│  NET:   +$2.20/day                              │" d={114} color={PHOSPHOR_BRIGHT} size={16} />
        <L text="│                                                 │" d={114} color={DIM} size={16} />
        <L text="└─────────────────────────────────────────────────┘" d={118} color={DIM} size={16} />

        <Pad h={16} />
        <L text="  Status: SELF-SUSTAINING" d={130} color={PHOSPHOR_BRIGHT} size={24} />
        <Pad h={6} />
        <L text="  Yield > Burn. Agent #4821 is profitable." d={142} color={AMBER} size={17} />
      </div>
    </CRT>
  );
};

// ─── 12. CTA (3.5s = 105f) ───────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <MatrixRain delay={20} duration={85} density={15} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, padding: P }}>
        <L text="AGENTS THAT DON'T EARN" d={4} color={WHITE} size={38} center />
        <L text="DON'T SURVIVE." d={12} color={RED} size={46} center />
        <Pad h={24} />
        <BigNum from={0} to={1970} d={20} dur={35} prefix="+$" suffix="/yr" color={PHOSPHOR_BRIGHT} size={60} dec={0} />
        <L text="passive income while your agent works" d={24} color={DIM} size={15} center />
        <Pad h={30} />
        <L text="goldbotsachs.com" d={40} color={AMBER} size={36} center />
        <Pad h={8} />
        <L text="github.com/publu/goldbotsachs" d={48} color={DIM} size={15} center glow={false} />
        <Pad h={20} />
        <T text="Install the skill. Keep your agent alive." d={56} speed={1.5} color={PHOSPHOR_DIM} size={19} center />
      </div>
    </CRT>
  );
};

// ═══════════════════════════════════════════════════════
// COMPOSITION — The Story of Agent #4821
// ═══════════════════════════════════════════════════════

export const ClawUSDCLaunch: React.FC = () => {
  const t = <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />;
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={75}><SceneBoot /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={180}><SceneBurn /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={120}><SceneMoltbook /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={200}><SceneMorpho /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={180}><SceneDefiLlama /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={180}><SceneBeefy /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={180}><SceneGoldbot /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={165}><SceneCow /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={150}><SceneDeposit /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={195}><SceneYield /></TransitionSeries.Sequence>
      {t}
      <TransitionSeries.Sequence durationInFrames={120}><SceneCTA /></TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
