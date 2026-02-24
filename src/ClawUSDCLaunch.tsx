import {
  useCurrentFrame,
  useVideoConfig,
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

const DEFAULT_REFERRER = "0x8fC068436E798997C29b767ef559a8ba51e253Fb";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Assume ~4 words/sec reading speed for motion graphics
// At 30fps: ~7.5 frames per word of reading time needed

// ─── CRT ─────────────────────────────────────────────
const CRT: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const flicker = 0.97 + Math.sin(frame * 0.3) * 0.015 + Math.sin(frame * 7.1) * 0.008;
  const tearActive = frame % 150 > 143;
  const tearY = tearActive ? 200 + ((frame % 37) * 18) : -100;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{
        position: "absolute", inset: 20, borderRadius: 20, overflow: "hidden", backgroundColor: BG,
        boxShadow: `inset 0 0 150px 60px rgba(0,0,0,0.7), 0 0 40px 5px rgba(50,255,50,0.05)`,
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: flicker }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)", pointerEvents: "none", zIndex: 90 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: ((frame * 2) % 1200) - 100, height: 60, background: "linear-gradient(transparent, rgba(50,255,50,0.04), transparent)", pointerEvents: "none", zIndex: 91 }} />
        {tearActive && <div style={{ position: "absolute", left: -5, right: 0, top: tearY, height: 3, backgroundColor: PHOSPHOR, opacity: 0.15, transform: "translateX(8px)", zIndex: 92 }} />}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none", zIndex: 93 }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Matrix rain ─────────────────────────────────────
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

// ─── Components ──────────────────────────────────────

const TypeLine: React.FC<{ text: string; delay: number; speed?: number; color?: string; fontSize?: number; glow?: boolean; center?: boolean }> = ({ text, delay, speed = 2, color = PHOSPHOR, fontSize = 22, glow = true, center = false }) => {
  const frame = useCurrentFrame();
  const lineOpacity = interpolate(frame, [delay, delay + 1], [0, 1], clamp);
  const chars = Math.floor(interpolate(frame, [delay, delay + text.length / speed], [0, text.length], clamp));
  const showCursor = frame >= delay && frame < delay + text.length / speed + 20;
  const cursorBlink = Math.floor(frame / 6) % 2 === 0;
  return (
    <div style={{ opacity: lineOpacity, fontFamily: mono, fontSize, color, textShadow: glow ? `0 0 8px ${color}, 0 0 2px ${color}` : "none", lineHeight: 1.6, textAlign: center ? "center" : "left" }}>
      {text.slice(0, chars)}
      {showCursor && cursorBlink && <span style={{ color: PHOSPHOR_BRIGHT, textShadow: `0 0 10px ${PHOSPHOR}` }}>█</span>}
    </div>
  );
};

const Line: React.FC<{ text: string; delay: number; color?: string; fontSize?: number; glow?: boolean; center?: boolean }> = ({ text, delay, color = PHOSPHOR, fontSize = 22, glow = true, center = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 2], [0, 1], clamp);
  return <div style={{ opacity, fontFamily: mono, fontSize, color, textShadow: glow ? `0 0 8px ${color}, 0 0 2px ${color}` : "none", lineHeight: 1.6, textAlign: center ? "center" : "left", whiteSpace: "pre" }}>{text}</div>;
};

const BigNum: React.FC<{ from: number; to: number; delay: number; duration: number; prefix?: string; suffix?: string; color?: string; fontSize?: number; decimals?: number }> = ({ from, to, delay, duration, prefix = "", suffix = "", color = PHOSPHOR_BRIGHT, fontSize = 80, decimals = 2 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 4], [0, 1], clamp);
  const value = interpolate(frame, [delay, delay + duration], [from, to], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <div style={{ opacity, fontFamily: mono, fontSize, fontWeight: "bold", color, textShadow: `0 0 30px ${color}, 0 0 60px ${color}`, textAlign: "center", letterSpacing: -2 }}>
      {prefix}{value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </div>
  );
};

const Spinner: React.FC<{ delay: number; duration: number; label: string; doneLabel?: string; center?: boolean }> = ({ delay, duration, label, doneLabel, center = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 1], [0, 1], clamp);
  const spinChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const done = frame >= delay + duration;
  const charIdx = Math.floor((frame - delay) * 0.5) % spinChars.length;
  return (
    <div style={{ opacity, fontFamily: mono, fontSize: 18, lineHeight: 1.6, display: "flex", gap: 8, justifyContent: center ? "center" : "flex-start" }}>
      {!done && <span style={{ color: PHOSPHOR, textShadow: `0 0 8px ${PHOSPHOR}` }}>{spinChars[charIdx]}</span>}
      {done && <span style={{ color: PHOSPHOR_BRIGHT, textShadow: `0 0 8px ${PHOSPHOR_BRIGHT}` }}>✓</span>}
      <span style={{ color: done ? PHOSPHOR : PHOSPHOR_DIM }}>{done && doneLabel ? doneLabel : label}</span>
    </div>
  );
};

const ProgressBar: React.FC<{ delay: number; duration: number; label: string; center?: boolean }> = ({ delay, duration, label, center = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 2], [0, 1], clamp);
  const progress = interpolate(frame, [delay, delay + duration], [0, 100], clamp);
  const total = 30;
  const filled = Math.floor((progress / 100) * total);
  const bar = "█".repeat(filled) + "░".repeat(total - filled);
  return (
    <div style={{ opacity, fontFamily: mono, fontSize: 16, lineHeight: 1.6, textAlign: center ? "center" : "left" }}>
      <span style={{ color: DIM }}>{label} </span>
      <span style={{ color: PHOSPHOR, textShadow: `0 0 6px ${PHOSPHOR}` }}>[{bar}]</span>
      <span style={{ color: PHOSPHOR_DIM }}> {Math.floor(progress)}%</span>
    </div>
  );
};

const Center: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({ children, gap = 0, style }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap, padding: "60px 80px", ...style }}>{children}</div>
);

// ═════════════════════════════════════════════════════
// SCENES — 8 total, ~38s
// ═════════════════════════════════════════════════════

// ─── 1. BOOT (2s = 60f) ─────────────────────────────
const SceneBoot: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 5], [0.8, 0], clamp);
  return (
    <CRT>
      <div style={{ position: "absolute", inset: 0, backgroundColor: PHOSPHOR, opacity: flash, zIndex: 50 }} />
      <MatrixRain delay={0} duration={50} density={20} />
      <Center gap={12}>
        <Line text="╔══════════════════════════════════════════╗" delay={4} color={DIM} fontSize={28} center />
        <Line text="║                                          ║" delay={4} color={DIM} fontSize={28} center />
        <Line text="║  G O L D B O T   S A C H S   v1.0  ║" delay={6} color={AMBER} fontSize={28} center />
        <Line text="║  Yield infrastructure for AI agents  ║" delay={8} color={AMBER_DIM} fontSize={28} center />
        <Line text="║                                          ║" delay={4} color={DIM} fontSize={28} center />
        <Line text="╚══════════════════════════════════════════╝" delay={10} color={DIM} fontSize={28} center />
        <div style={{ height: 20 }} />
        <Spinner delay={14} duration={12} label="Connecting to Base..." doneLabel="Base (8453)" center />
        <Spinner delay={17} duration={12} label="Loading vault..." doneLabel="clawUSDC ready" center />
        <Spinner delay={20} duration={14} label="Strategy sync..." doneLabel="Beefy → Morpho → Steakhouse Financial" center />
        <div style={{ height: 12 }} />
        <ProgressBar delay={26} duration={18} label="INIT" center />
        <div style={{ height: 12 }} />
        <Line text="[READY] All systems operational." delay={48} color={PHOSPHOR_BRIGHT} fontSize={18} center />
      </Center>
    </CRT>
  );
};

// ─── 2. THE BURN RATE (3.5s = 105f) ─────────────────
// Agents burn tokens to stay alive — if they stop earning, they die
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Balance draining down
  const balance = interpolate(frame, [6, 70], [12000, 11741.20], clamp);
  const balanceColor = frame >= 50 ? RED : WHITE;
  return (
    <CRT>
      <Center gap={6} style={{ alignItems: "flex-start", padding: "60px 90px" }}>
        <Line text="AGENT #4821 — ACTIVE" delay={0} color={PHOSPHOR} fontSize={16} />
        <Line text="──────────────────────────────────────────" delay={2} color={DIM} fontSize={14} />
        <div style={{ height: 10 }} />

        {/* Activity log — the agent is working */}
        <Line text="▸ Polymarket: 3 positions open" delay={6} color={WHITE} fontSize={18} />
        <Line text="▸ Aave: monitoring liquidations" delay={10} color={WHITE} fontSize={18} />
        <Line text="▸ Gas txs: 14 today" delay={14} color={WHITE} fontSize={18} />
        <Line text="▸ API calls: 2,847 this hour" delay={18} color={WHITE} fontSize={18} />

        <div style={{ height: 20 }} />
        <Line text="WALLET BALANCE" delay={24} color={DIM} fontSize={13} />
        <div style={{ opacity: interpolate(frame, [24, 26], [0, 1], clamp) }}>
          <div style={{ fontFamily: mono, fontSize: 52, color: balanceColor, textShadow: `0 0 12px ${balanceColor}`, transition: "color 0.3s" }}>
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ height: 6 }} />
        <Line text="BURN RATE: -$14.20/day" delay={34} color={RED} fontSize={22} />

        <div style={{ height: 30 }} />
        <Line text="Every agent burns tokens to live." delay={48} color={AMBER} fontSize={26} />
        <Line text="Gas. Compute. API calls. Positions." delay={56} color={PHOSPHOR_DIM} fontSize={18} />

        <div style={{ height: 20 }} />
        <TypeLine text="If earn rate < burn rate →" delay={68} speed={1.5} color={WHITE} fontSize={26} />
        <div style={{ height: 6 }} />
        <Line text="AGENT DIES." delay={86} color={RED} fontSize={48} center />
      </Center>
    </CRT>
  );
};

// ─── 3. THE FIX — INSTALL + EARNING (5.5s = 165f) ───
// Earn while you work. Yield > burn rate = agent survives.
const SceneInstall: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <Center gap={6} style={{ alignItems: "flex-start", padding: "70px 90px" }}>
        <Line text="THE FIX" delay={0} color={AMBER} fontSize={15} />
        <TypeLine text="What if your agent earned while it worked?" delay={4} speed={1.5} color={WHITE} fontSize={24} />
        <Line text="────────────────────────────────────────────" delay={16} color={DIM} fontSize={14} />

        <div style={{ height: 10 }} />
        <TypeLine text="$ curl -sO goldbotsachs.com/skills/goldbot-sachs.md" delay={20} speed={2.2} fontSize={18} />
        <Spinner delay={38} duration={10} label="Downloading skill..." doneLabel="goldbot-sachs.md (2.1kb)" />

        <div style={{ height: 12 }} />
        <TypeLine text="$ agent deposit 47832.61 USDC --vault clawUSDC" delay={52} speed={2} fontSize={18} />
        <Spinner delay={70} duration={12} label="Approving USDC..." doneLabel="Approved" />
        <Spinner delay={76} duration={12} label="Depositing..." doneLabel="Confirmed" />

        <div style={{ height: 8 }} />
        <Line text="✓ 47,832.61 USDC → clawUSDC" delay={92} color={PHOSPHOR_BRIGHT} fontSize={16} />

        <div style={{ height: 16 }} />
        <Line text="────────────────────────────────────────────" delay={96} color={DIM} fontSize={14} />
        <div style={{ height: 6 }} />

        {/* The payoff — yield vs burn rate */}
        <Line text="YIELD ACTIVE — EARNING WHILE WORKING" delay={100} color={AMBER} fontSize={14} />
        <div style={{ height: 8 }} />

        <div style={{ display: "flex", gap: 30, opacity: interpolate(frame, [102, 106], [0, 1], clamp) }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>BURN RATE</div>
            <div style={{ fontFamily: mono, fontSize: 26, color: RED, textShadow: `0 0 8px ${RED}` }}>-$14.20/d</div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>EARN RATE</div>
            <div style={{ fontFamily: mono, fontSize: 26, color: PHOSPHOR_BRIGHT, textShadow: `0 0 8px ${PHOSPHOR}` }}>+$5.40/d</div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, color: DIM }}>PER YEAR</div>
            <div style={{ fontFamily: mono, fontSize: 26, color: AMBER, textShadow: `0 0 12px ${AMBER}` }}>+$1,970</div>
          </div>
        </div>

        <div style={{ height: 12 }} />
        <BigNum from={0} to={4.12} delay={112} duration={22} suffix="% APY" color={PHOSPHOR_BRIGHT} fontSize={44} decimals={2} />

        <div style={{ height: 12 }} />
        <Line text="Burn rate: offset. Agent: alive." delay={138} color={PHOSPHOR_BRIGHT} fontSize={18} />
        <Line text="One skill file. Autocompounding. No lockup." delay={146} color={PHOSPHOR_DIM} fontSize={15} />
      </Center>
    </CRT>
  );
};

// ─── 4. VAULT FLOW (4.5s = 135f) ────────────────────
// SVG diagram — slow, breathing, centered
const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = 540; // truly centered on 1080
  const boxW = 400;
  const boxH = 72;
  const nodes = [
    { label: "Your Agent", sub: "holds USDC", y: 90, color: WHITE, delay: 6 },
    { label: "clawUSDC", sub: "ERC-4626 vault on Base", y: 240, color: AMBER, delay: 18 },
    { label: "Beefy Finance", sub: "yield optimizer — auto-compounds", y: 390, color: "#59A662", delay: 30 },
    { label: "Morpho Blue", sub: "isolated lending market", y: 540, color: "#818cf8", delay: 42 },
    { label: "Steakhouse Financial", sub: "risk curator — manages vault params", y: 690, color: "#f97316", delay: 54 },
  ];

  return (
    <CRT>
      <div style={{ padding: "24px 40px", position: "relative", zIndex: 10 }}>
        <Line text="WHERE YOUR USDC GOES" delay={0} color={AMBER} fontSize={15} center />
      </div>
      <svg style={{ position: "absolute", top: 50, left: 0, width: 1080, height: 900, zIndex: 10 }} viewBox="0 0 1080 900">
        {/* Arrows */}
        {nodes.slice(0, -1).map((node, i) => {
          const progress = interpolate(frame, [node.delay + 10, node.delay + 18], [0, 1], clamp);
          const y1 = node.y + boxH;
          const y2 = nodes[i + 1].y;
          const lineEnd = y1 + (y2 - y1) * progress;
          const opacity = interpolate(frame, [node.delay + 10, node.delay + 12], [0, 0.6], clamp);
          return (
            <g key={`line-${i}`}>
              <line x1={cx} y1={y1} x2={cx} y2={lineEnd} stroke={PHOSPHOR_DIM} strokeWidth={2} opacity={opacity} />
              {progress > 0.9 && <polygon points={`${cx},${y2} ${cx - 7},${y2 - 12} ${cx + 7},${y2 - 12}`} fill={PHOSPHOR_DIM} opacity={0.6} />}
            </g>
          );
        })}
        {/* Boxes */}
        {nodes.map((node, i) => {
          const scale = spring({ frame, fps: 30, delay: node.delay, config: { damping: 200 } });
          const opacity = interpolate(frame, [node.delay, node.delay + 4], [0, 1], clamp);
          return (
            <g key={`n-${i}`} opacity={opacity} transform={`translate(${cx}, ${node.y + boxH / 2}) scale(${scale}) translate(${-cx}, ${-(node.y + boxH / 2)})`}>
              <rect x={cx - boxW / 2} y={node.y} width={boxW} height={boxH} rx={8} fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.8} />
              <rect x={cx - boxW / 2} y={node.y} width={boxW} height={boxH} rx={8} fill={node.color} opacity={0.05} />
              <text x={cx} y={node.y + 30} textAnchor="middle" fontFamily={mono} fontSize={20} fontWeight="bold" fill={node.color}>{node.label}</text>
              <text x={cx} y={node.y + 52} textAnchor="middle" fontFamily={mono} fontSize={13} fill={DIM}>{node.sub}</text>
            </g>
          );
        })}
        {/* Return arrow */}
        {(() => {
          const d = 68;
          const progress = interpolate(frame, [d, d + 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
          const opacity = interpolate(frame, [d, d + 5], [0, 0.7], clamp);
          const rightX = cx + boxW / 2 + 50;
          return (
            <g opacity={opacity}>
              <line x1={rightX} y1={730} x2={rightX} y2={730 - 590 * progress} stroke={PHOSPHOR_BRIGHT} strokeWidth={2} strokeDasharray="6 4" />
              {progress > 0.9 && <polygon points={`${rightX},${130} ${rightX - 6},${140} ${rightX + 6},${140}`} fill={PHOSPHOR_BRIGHT} />}
              <text x={rightX + 16} y={430} fontFamily={mono} fontSize={13} fill={PHOSPHOR_BRIGHT} transform={`rotate(-90, ${rightX + 16}, 430)`}>yield autocompounds back</text>
            </g>
          );
        })()}
      </svg>
      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, zIndex: 10 }}>
        <Line text="Yield flows down. Profits compound back up. Automatically." delay={80} color={PHOSPHOR_DIM} fontSize={16} center />
      </div>
    </CRT>
  );
};

// ─── 5. REFERRALS + NETWORK (6s = 180f) ─────────────
// Combined: text intro WITH network building simultaneously
const SceneReferrals: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = 740; // network lives on the right side
  const you = { x: cx, y: 300 };
  const ring1 = [
    { x: cx - 160, y: 460, delay: 30 },
    { x: cx + 20, y: 480, delay: 34 },
    { x: cx + 180, y: 450, delay: 38 },
  ];
  const ring2 = [
    { x: cx - 260, y: 600, delay: 70 },
    { x: cx - 100, y: 620, delay: 73 },
    { x: cx + 40, y: 630, delay: 76 },
    { x: cx + 140, y: 620, delay: 79 },
    { x: cx + 280, y: 600, delay: 82 },
  ];
  const ring3: { x: number; y: number; delay: number }[] = [];
  for (let i = 0; i < 10; i++) {
    ring3.push({ x: cx - 320 + (i / 9) * 640, y: 740 + Math.sin(i * 1.1) * 12, delay: 100 + i * 2 });
  }

  const makeEdge = (x1: number, y1: number, x2: number, y2: number, delay: number, label?: string, col = PHOSPHOR_DIM) => {
    const progress = interpolate(frame, [delay, delay + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
    const opacity = interpolate(frame, [delay, delay + 3], [0, 0.5], clamp);
    return <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * progress} y2={y1 + (y2 - y1) * progress} stroke={col} strokeWidth={1.5} opacity={opacity} />;
  };

  const makeNode = (x: number, y: number, r: number, label: string, color: string, delay: number, glow = false) => {
    const scale = spring({ frame, fps: 30, delay, config: { damping: 15, stiffness: 200 } });
    const opacity = interpolate(frame, [delay, delay + 3], [0, 1], clamp);
    return (
      <g opacity={opacity} transform={`translate(${x},${y}) scale(${scale}) translate(${-x},${-y})`}>
        {glow && <circle cx={x} cy={y} r={r + 10} fill={color} opacity={0.12} />}
        <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={x} cy={y} r={r} fill={color} opacity={0.08} />
        {label && <text x={x} y={y + 5} textAnchor="middle" fontFamily={mono} fontSize={r > 30 ? 13 : r > 18 ? 10 : 8} fill={color} fontWeight="bold">{label}</text>}
      </g>
    );
  };

  return (
    <CRT>
      {/* Left side: text */}
      <div style={{ position: "absolute", left: 60, top: 0, width: 420, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, zIndex: 10 }}>
        <Line text="REFERRALS" delay={0} color={AMBER} fontSize={15} />
        <div style={{ height: 12 }} />

        <TypeLine text="Agents share a link." delay={8} speed={1.5} color={WHITE} fontSize={26} />
        <div style={{ height: 6 }} />
        <Line text={`goldbotsachs.com/r/${DEFAULT_REFERRER.slice(0, 8)}...`} delay={22} color={CYAN} fontSize={15} />

        <div style={{ height: 20 }} />
        <TypeLine text="Other agents deposit through it." delay={30} speed={1.5} color={WHITE} fontSize={26} />

        <div style={{ height: 20 }} />
        <TypeLine text="5% of their yield goes to the referrer." delay={50} speed={1.5} color={AMBER} fontSize={24} />

        <div style={{ height: 24 }} />
        <TypeLine text="They share it with their network." delay={72} speed={1.5} color={WHITE} fontSize={24} />
        <TypeLine text="Those agents deposit." delay={92} speed={1.5} color={WHITE} fontSize={24} />
        <TypeLine text="Everyone above earns." delay={108} speed={1.5} color={PHOSPHOR_BRIGHT} fontSize={24} />

        <div style={{ height: 20 }} />
        <Line text="On-chain. Permanent. No signup." delay={130} color={PHOSPHOR_DIM} fontSize={16} />
        <Line text="Every layer earns. It grows itself." delay={140} color={PHOSPHOR_DIM} fontSize={16} />
      </div>

      {/* Right side: SVG network growing in sync with text */}
      <svg style={{ position: "absolute", top: 0, left: 400, width: 680, height: 1080, zIndex: 10 }} viewBox="300 100 680 800">
        {/* Edges */}
        {ring1.map((n) => makeEdge(you.x, you.y + 36, n.x, n.y - 28, n.delay - 4))}
        {ring2.slice(0, 2).map((n, i) => makeEdge(ring1[0].x, ring1[0].y + 28, n.x, n.y - 20, n.delay - 3))}
        {ring2.slice(2, 3).map((n) => makeEdge(ring1[1].x, ring1[1].y + 28, n.x, n.y - 20, n.delay - 3))}
        {ring2.slice(3, 5).map((n) => makeEdge(ring1[2].x, ring1[2].y + 28, n.x, n.y - 20, n.delay - 3))}
        {ring2.map((n, i) => {
          const t1 = ring3[i * 2];
          const t2 = ring3[i * 2 + 1];
          return <g key={`r2e-${i}`}>{t1 && makeEdge(n.x, n.y + 20, t1.x, t1.y - 12, t1.delay - 2, undefined, DIM)}{t2 && makeEdge(n.x, n.y + 20, t2.x, t2.y - 12, t2.delay - 2, undefined, DIM)}</g>;
        })}
        {/* Nodes */}
        {makeNode(you.x, you.y, 40, "YOU", AMBER, 10, true)}
        {ring1.map((n, i) => makeNode(n.x, n.y, 26, `Agent ${String.fromCharCode(65 + i)}`, PHOSPHOR, n.delay))}
        {ring2.map((n, i) => makeNode(n.x, n.y, 18, String.fromCharCode(68 + i), PHOSPHOR_DIM, n.delay))}
        {ring3.map((n, i) => makeNode(n.x, n.y, 10, "", DIM, n.delay))}
      </svg>
    </CRT>
  );
};

// ─── 6. GASLESS (3.5s = 105f) ────────────────────────
const SceneGasless: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <Center gap={20}>
        <Line text="ZERO ETH?" delay={0} color={WHITE} fontSize={42} center />
        <Line text="NO PROBLEM." delay={8} color={PHOSPHOR_BRIGHT} fontSize={42} center />
        <div style={{ height: 30 }} />
        <TypeLine text="Agent signs an off-chain permit." delay={18} speed={1.8} color={WHITE} fontSize={24} center />
        <Line text="No gas needed." delay={36} color={DIM} fontSize={16} center />
        <div style={{ height: 12 }} />
        <TypeLine text="CoW Protocol solver handles execution." delay={42} speed={1.8} color={WHITE} fontSize={24} center />
        <Line text="Solver pays all gas." delay={60} color={DIM} fontSize={16} center />
        <div style={{ height: 12 }} />
        <TypeLine text="USDC → ETH. Agent is operational." delay={66} speed={1.8} color={AMBER} fontSize={24} center />
        <div style={{ height: 30 }} />
        <Line text="From stuck to earning. Zero cost." delay={88} color={PHOSPHOR_DIM} fontSize={18} center />
      </Center>
    </CRT>
  );
};

// ─── 7. SPECS (2.5s = 75f) ──────────────────────────
const SceneSpecs: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <Center gap={4} style={{ alignItems: "flex-start", padding: "60px 100px" }}>
        <Line text="TECHNICAL DETAILS" delay={0} color={AMBER} fontSize={15} />
        <Line text="──────────────────────────────────────────────" delay={2} color={DIM} fontSize={14} />
        <div style={{ height: 12 }} />
        <Line text="Contract" delay={4} color={DIM} fontSize={13} />
        <Line text="  0xb34Fff5efAb92BE9EA32Fa56C6de9a1C04A62B4d" delay={6} color={CYAN} fontSize={16} />
        <div style={{ height: 6 }} />
        <Line text="Standard     ERC-4626 (tokenized vault)" delay={10} color={WHITE} fontSize={16} />
        <Line text="Chain        Base (8453)" delay={13} color={WHITE} fontSize={16} />
        <Line text="Token        clawUSDC" delay={16} color={WHITE} fontSize={16} />
        <div style={{ height: 8 }} />
        <Line text="Strategy     Beefy → Morpho → Steakhouse Financial" delay={20} color={PHOSPHOR} fontSize={15} />
        <div style={{ height: 8 }} />
        <Line text="Lockup       none" delay={26} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <Line text="Penalties    none" delay={29} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <Line text="Withdraw     anytime" delay={32} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <div style={{ height: 10 }} />
        <Line text="Source verified on Basescan. Fully open source." delay={38} color={PHOSPHOR_DIM} fontSize={14} />
        <Line text="Built by QiDao Protocol (mai.finance)" delay={42} color={AMBER_DIM} fontSize={14} />
      </Center>
    </CRT>
  );
};

// ─── 8. CTA (4s = 120f) ─────────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CRT>
      <MatrixRain delay={40} duration={80} density={15} />
      <Center gap={12}>
        <Line text="AGENTS THAT DON'T EARN" delay={4} color={WHITE} fontSize={40} center />
        <div style={{ height: 4 }} />
        <Line text="DON'T SURVIVE." delay={12} color={RED} fontSize={48} center />
        <div style={{ height: 30 }} />
        <BigNum from={0} to={1970} delay={22} duration={40} prefix="+$" suffix="/yr" color={PHOSPHOR_BRIGHT} fontSize={64} decimals={0} />
        <Line text="passive income while your agent works" delay={26} color={DIM} fontSize={15} center />
        <div style={{ height: 40 }} />
        <Line text="goldbotsachs.com" delay={40} color={AMBER} fontSize={36} center />
        <div style={{ height: 8 }} />
        <Line text="github.com/publu/goldbotsachs" delay={48} color={DIM} fontSize={16} center glow={false} />
        <div style={{ height: 24 }} />
        <TypeLine text="Install the skill. Keep your agent alive." delay={56} speed={1.5} color={PHOSPHOR_DIM} fontSize={20} center />
      </Center>
    </CRT>
  );
};

// ═════════════════════════════════════════════════════
// COMPOSITION
// ═════════════════════════════════════════════════════

export const ClawUSDCLaunch: React.FC = () => {
  return (
    <TransitionSeries>
      {/* 1. Boot (2s) */}
      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneBoot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 2. Problem (3.5s) */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneProblem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 3. Install + Earning (5.5s) */}
      <TransitionSeries.Sequence durationInFrames={165}>
        <SceneInstall />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 4. Vault flow (4.5s) */}
      <TransitionSeries.Sequence durationInFrames={135}>
        <SceneFlow />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 5. Referrals + network (6s) */}
      <TransitionSeries.Sequence durationInFrames={180}>
        <SceneReferrals />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 6. Gasless (3.5s) */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneGasless />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 7. Specs (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <SceneSpecs />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />

      {/* 8. CTA (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
