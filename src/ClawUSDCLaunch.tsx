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
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: mono } = loadFont();

// ─── Colors ──────────────────────────────────────────
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

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ─── CRT Monitor ─────────────────────────────────────
const CRT: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const flicker =
    0.97 + Math.sin(frame * 0.3) * 0.015 + Math.sin(frame * 7.1) * 0.008;
  const tearActive = frame % 120 > 115;
  const tearY = tearActive ? 200 + ((frame % 37) * 18) : -100;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 20,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: BG,
          boxShadow: `inset 0 0 150px 60px rgba(0,0,0,0.7), 0 0 40px 5px rgba(50,255,50,0.05)`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: flicker }}>
          {children}
        </div>
        {/* Heavy scan lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
            pointerEvents: "none",
            zIndex: 90,
          }}
        />
        {/* Moving scan band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ((frame * 2.5) % 1200) - 100,
            height: 60,
            background:
              "linear-gradient(transparent, rgba(50,255,50,0.04), transparent)",
            pointerEvents: "none",
            zIndex: 91,
          }}
        />
        {/* Tear */}
        {tearActive && (
          <div
            style={{
              position: "absolute",
              left: -5,
              right: 0,
              top: tearY,
              height: 3,
              backgroundColor: PHOSPHOR,
              opacity: 0.15,
              transform: "translateX(8px)",
              zIndex: 92,
            }}
          />
        )}
        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
            pointerEvents: "none",
            zIndex: 93,
          }}
        />
        {/* Edge glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 80px 2px rgba(50,255,50,0.03)`,
            pointerEvents: "none",
            zIndex: 89,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Matrix Rain (between scenes / bg effect) ────────
const MatrixRain: React.FC<{
  delay: number;
  duration: number;
  density?: number;
}> = ({ delay, duration, density = 30 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [delay, delay + 5, delay + duration - 5, delay + duration],
    [0, 0.6, 0.6, 0],
    clamp
  );

  const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ$¥€£₿";
  const columns = Array.from({ length: density }, (_, i) => {
    const x = (i / density) * 1040 + 20;
    const speed = 3 + (i * 7.3) % 5;
    const offset = (i * 137) % 400;
    return { x, speed, offset, seed: i * 31 };
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity, zIndex: 5, overflow: "hidden" }}>
      {columns.map((col, ci) => {
        const streamLength = 8 + (ci % 6);
        return Array.from({ length: streamLength }, (_, j) => {
          const y =
            ((frame - delay) * col.speed + col.offset + j * 28) % 1200 - 100;
          const charIndex =
            ((col.seed + j * 17 + Math.floor(frame / 3)) * 7) % chars.length;
          const brightness = j === 0 ? 1 : 0.3 - j * 0.03;
          return (
            <div
              key={`${ci}-${j}`}
              style={{
                position: "absolute",
                left: col.x,
                top: y,
                fontFamily: mono,
                fontSize: 14,
                color: j === 0 ? PHOSPHOR_BRIGHT : PHOSPHOR,
                opacity: Math.max(0, brightness),
                textShadow:
                  j === 0 ? `0 0 10px ${PHOSPHOR_BRIGHT}` : "none",
              }}
            >
              {chars[charIndex]}
            </div>
          );
        });
      })}
    </div>
  );
};

// ─── Typing line ─────────────────────────────────────
const TypeLine: React.FC<{
  text: string;
  delay: number;
  speed?: number;
  color?: string;
  fontSize?: number;
  glow?: boolean;
  prefix?: string;
  prefixColor?: string;
}> = ({
  text,
  delay,
  speed = 2,
  color = PHOSPHOR,
  fontSize = 22,
  glow = true,
  prefix,
  prefixColor = PHOSPHOR_DIM,
}) => {
  const frame = useCurrentFrame();
  const lineOpacity = interpolate(frame, [delay, delay + 1], [0, 1], clamp);
  const chars = Math.floor(
    interpolate(frame, [delay, delay + text.length / speed], [0, text.length], clamp)
  );
  const showCursor =
    frame >= delay && frame < delay + text.length / speed + 20;
  const cursorBlink = Math.floor(frame / 6) % 2 === 0;

  return (
    <div
      style={{
        opacity: lineOpacity,
        fontFamily: mono,
        fontSize,
        color,
        textShadow: glow ? `0 0 8px ${color}, 0 0 2px ${color}` : "none",
        display: "flex",
        lineHeight: 1.6,
      }}
    >
      {prefix && (
        <span
          style={{
            color: prefixColor,
            marginRight: 10,
            textShadow: `0 0 6px ${prefixColor}`,
          }}
        >
          {prefix}
        </span>
      )}
      <span>{text.slice(0, chars)}</span>
      {showCursor && cursorBlink && (
        <span
          style={{
            color: PHOSPHOR_BRIGHT,
            textShadow: `0 0 10px ${PHOSPHOR}`,
          }}
        >
          █
        </span>
      )}
    </div>
  );
};

// ─── Instant line ────────────────────────────────────
const Line: React.FC<{
  text: string;
  delay: number;
  color?: string;
  fontSize?: number;
  glow?: boolean;
  indent?: number;
  center?: boolean;
}> = ({
  text,
  delay,
  color = PHOSPHOR,
  fontSize = 22,
  glow = true,
  indent = 0,
  center = false,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 2], [0, 1], clamp);

  return (
    <div
      style={{
        opacity,
        fontFamily: mono,
        fontSize,
        color,
        textShadow: glow ? `0 0 8px ${color}, 0 0 2px ${color}` : "none",
        paddingLeft: indent,
        lineHeight: 1.6,
        textAlign: center ? "center" : "left",
        whiteSpace: "pre",
      }}
    >
      {text}
    </div>
  );
};

// ─── Progress bar ────────────────────────────────────
const ProgressBar: React.FC<{
  delay: number;
  duration: number;
  label: string;
  width?: number;
}> = ({ delay, duration, label, width = 500 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 2], [0, 1], clamp);
  const progress = interpolate(frame, [delay, delay + duration], [0, 100], clamp);

  // Terminal-style progress bar with blocks
  const totalBlocks = 30;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);
  const bar =
    "█".repeat(filledBlocks) + "░".repeat(totalBlocks - filledBlocks);

  return (
    <div style={{ opacity, fontFamily: mono, fontSize: 16, lineHeight: 1.6 }}>
      <span style={{ color: DIM, textShadow: `0 0 4px ${DIM}` }}>
        {label}{" "}
      </span>
      <span
        style={{
          color: PHOSPHOR,
          textShadow: `0 0 6px ${PHOSPHOR}`,
        }}
      >
        [{bar}]
      </span>
      <span style={{ color: PHOSPHOR_DIM, textShadow: `0 0 4px ${PHOSPHOR_DIM}` }}>
        {" "}
        {Math.floor(progress)}%
      </span>
    </div>
  );
};

// ─── Terminal spinner ────────────────────────────────
const Spinner: React.FC<{
  delay: number;
  duration: number;
  label: string;
  doneLabel?: string;
}> = ({ delay, duration, label, doneLabel }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 1], [0, 1], clamp);
  const spinChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinning = frame < delay + duration;
  const charIdx = Math.floor((frame - delay) * 0.5) % spinChars.length;
  const done = frame >= delay + duration;

  return (
    <div style={{ opacity, fontFamily: mono, fontSize: 18, lineHeight: 1.6, display: "flex", gap: 8 }}>
      {spinning && !done && (
        <span style={{ color: PHOSPHOR, textShadow: `0 0 8px ${PHOSPHOR}` }}>
          {spinChars[charIdx]}
        </span>
      )}
      {done && (
        <span style={{ color: PHOSPHOR_BRIGHT, textShadow: `0 0 8px ${PHOSPHOR_BRIGHT}` }}>
          ✓
        </span>
      )}
      <span style={{ color: done ? PHOSPHOR : PHOSPHOR_DIM }}>
        {done && doneLabel ? doneLabel : label}
      </span>
    </div>
  );
};

// ─── Animated counter ────────────────────────────────
const Counter: React.FC<{
  from: number;
  to: number;
  delay: number;
  duration: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  fontSize?: number;
  decimals?: number;
}> = ({
  from,
  to,
  delay,
  duration,
  prefix = "",
  suffix = "",
  color = PHOSPHOR_BRIGHT,
  fontSize = 72,
  decimals = 2,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 3], [0, 1], clamp);
  const value = interpolate(frame, [delay, delay + duration], [from, to], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        opacity,
        fontFamily: mono,
        fontSize,
        fontWeight: "bold",
        color,
        textShadow: `0 0 30px ${color}, 0 0 60px ${color}, 0 0 4px ${color}`,
        textAlign: "center",
        letterSpacing: -2,
      }}
    >
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </div>
  );
};

// ─── ASCII horizontal bar chart ──────────────────────
const AsciiBar: React.FC<{
  label: string;
  value: number;
  maxValue: number;
  maxWidth: number;
  delay: number;
  color: string;
  suffix?: string;
}> = ({ label, value, maxValue, maxWidth, delay, color, suffix = "" }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 2], [0, 1], clamp);
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const blocks = Math.floor((value / maxValue) * maxWidth * progress);
  const bar = "█".repeat(blocks);

  return (
    <div style={{ opacity, fontFamily: mono, fontSize: 17, lineHeight: 1.8 }}>
      <span style={{ color: DIM, display: "inline-block", width: 160 }}>
        {label}
      </span>
      <span style={{ color, textShadow: `0 0 6px ${color}` }}>{bar}</span>
      <span style={{ color: DIM, marginLeft: 8 }}>
        {(value * progress).toFixed(1)}
        {suffix}
      </span>
    </div>
  );
};

// ─── SCENE 1: BOOT SEQUENCE ─────────────────────────
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  // Flash on first frame
  const flash = interpolate(frame, [0, 4], [0.8, 0], clamp);

  return (
    <CRT>
      {/* White flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: PHOSPHOR,
          opacity: flash,
          zIndex: 50,
        }}
      />

      <MatrixRain delay={0} duration={30} density={20} />

      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <Line text="╔═══════════════════════════════════════════════╗" delay={3} color={DIM} fontSize={15} />
        <Line text="║                                               ║" delay={3} color={DIM} fontSize={15} />
        <Line text="║     G O L D B O T   S A C H S   v1.0.0       ║" delay={5} color={AMBER} fontSize={15} />
        <Line text="║     Yield infrastructure for AI agents        ║" delay={7} color={AMBER_DIM} fontSize={15} />
        <Line text="║                                               ║" delay={3} color={DIM} fontSize={15} />
        <Line text="╚═══════════════════════════════════════════════╝" delay={9} color={DIM} fontSize={15} />

        <div style={{ marginTop: 16 }} />
        <Spinner delay={14} duration={20} label="Loading vault modules..." doneLabel="Vault modules loaded" />
        <Spinner delay={18} duration={18} label="Connecting to Base network..." doneLabel="Base network connected (chain 8453)" />
        <Spinner delay={22} duration={20} label="Fetching strategy data..." doneLabel="Strategy data synced" />
        <Spinner delay={26} duration={22} label="Initializing referral engine..." doneLabel="Referral engine ready" />

        <div style={{ marginTop: 16 }} />
        <ProgressBar delay={30} duration={25} label="SYSTEM INIT" width={500} />

        <div style={{ marginTop: 16 }} />
        <Line text="[READY] All systems operational" delay={58} color={PHOSPHOR_BRIGHT} fontSize={18} />
        <Line text="[READY] Contract: 0xb34F...2B4d (Base)" delay={62} color={PHOSPHOR} fontSize={16} />
        <Line text="[READY] Strategy: Beefy → Morpho → Steakhouse Financial" delay={66} color={PHOSPHOR} fontSize={16} />
        <Line text="[READY] Current APY: 4.12%" delay={70} color={PHOSPHOR} fontSize={16} />

        <div style={{ marginTop: 20 }} />
        <TypeLine
          text="System ready. Scanning agent wallet..."
          delay={78}
          speed={2.5}
          color={AMBER}
          fontSize={20}
          prefix=">>>"
          prefixColor={AMBER_DIM}
        />
      </div>
    </CRT>
  );
};

// ─── SCENE 2: WALLET SCAN — THE PROBLEM ─────────────
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  // Balance counter races up
  const balance = interpolate(frame, [12, 40], [0, 47832.61], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <CRT>
      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — WALLET ANALYSIS" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />

        <div style={{ marginTop: 16 }} />
        <Spinner delay={4} duration={8} label="Scanning wallet 0x93...3cF..." doneLabel="Wallet found" />

        <div style={{ marginTop: 20 }} />
        <Line text="┌─────────────────────────────────────────────┐" delay={14} color={DIM} fontSize={16} />
        <Line text="│  ASSET REPORT                               │" delay={14} color={DIM} fontSize={16} />
        <Line text="├─────────────────────────────────────────────┤" delay={14} color={DIM} fontSize={16} />

        {/* Balance readout */}
        <div style={{ marginTop: 4 }}>
          <Line text="│" delay={16} color={DIM} fontSize={16} />
          <div style={{ display: "flex", paddingLeft: 20, marginTop: -30 }}>
            <div style={{ fontFamily: mono, fontSize: 14, color: DIM, marginBottom: 4, letterSpacing: 3, textShadow: `0 0 4px ${DIM}`, opacity: interpolate(frame, [16, 18], [0, 1], clamp) }}>
              USDC BALANCE
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 64,
                fontWeight: "bold",
                color: WHITE,
                textShadow: `0 0 20px ${PHOSPHOR}, 0 0 4px ${PHOSPHOR}`,
                opacity: interpolate(frame, [16, 18], [0, 1], clamp),
              }}
            >
              $
              {balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <Line text="│                                             │" delay={14} color={DIM} fontSize={16} />
        <Line text="└─────────────────────────────────────────────┘" delay={14} color={DIM} fontSize={16} />

        <div style={{ marginTop: 16 }} />
        <Line text="  Current allocation:" delay={42} color={PHOSPHOR_DIM} fontSize={17} />
        <Line text="    USDC (idle)        $47,832.61   100.0%" delay={45} color={WHITE} fontSize={17} />
        <Line text="    Yield-bearing           $0.00     0.0%" delay={48} color={DIM} fontSize={17} />

        <div style={{ marginTop: 16 }} />
        <Line text="[WARN] ──────────────────────────────────────" delay={54} color={RED} fontSize={16} />
        <Line text="[WARN] Annual yield:  $0.00" delay={56} color={RED} fontSize={20} />
        <Line text="[WARN] Daily yield:   $0.00" delay={59} color={RED} fontSize={20} />
        <Line text="[WARN] Status:        IDLE — EARNING NOTHING" delay={62} color={RED} fontSize={20} />
        <Line text="[WARN] ──────────────────────────────────────" delay={65} color={RED} fontSize={16} />

        <div style={{ marginTop: 16 }} />
        <TypeLine
          text="$47,832 sitting idle. Let's fix that."
          delay={72}
          speed={2}
          color={AMBER}
          fontSize={22}
          prefix=">>>"
          prefixColor={AMBER_DIM}
        />
      </div>
    </CRT>
  );
};

// ─── SCENE 3: INSTALL + DEPOSIT ──────────────────────
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — AGENT TERMINAL" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />

        <div style={{ marginTop: 20 }} />
        <TypeLine
          prefix="$"
          text="curl -sO goldbotsachs.com/skills/goldbot-sachs.md"
          delay={6}
          speed={2.5}
          prefixColor={PHOSPHOR}
        />
        <Spinner delay={26} duration={10} label="Downloading skill file..." doneLabel="goldbot-sachs.md saved (2.1kb)" />

        <div style={{ marginTop: 12 }} />
        <TypeLine
          prefix="$"
          text="cat goldbot-sachs.md | head -5"
          delay={40}
          speed={3}
          prefixColor={PHOSPHOR}
        />
        <Line text="  ---" delay={52} color={DIM} fontSize={16} />
        <Line text='  name: "goldbot-sachs"' delay={54} color={CYAN} fontSize={16} />
        <Line text='  vault: "0xb34Fff5e...2B4d"' delay={56} color={CYAN} fontSize={16} />
        <Line text='  chain: "base"' delay={58} color={CYAN} fontSize={16} />
        <Line text='  action: "deposit-usdc"' delay={60} color={CYAN} fontSize={16} />

        <div style={{ marginTop: 16 }} />
        <TypeLine
          prefix="$"
          text="agent exec goldbot-sachs --deposit 47832.61 USDC"
          delay={66}
          speed={2}
          prefixColor={PHOSPHOR}
        />

        <div style={{ marginTop: 8 }} />
        <Spinner delay={86} duration={12} label="Approving USDC spend..." doneLabel="USDC approved" />
        <Spinner delay={92} duration={15} label="Depositing into clawUSDC vault..." doneLabel="Deposit confirmed" />
        <ProgressBar delay={98} duration={18} label="TX" width={400} />

        <div style={{ marginTop: 12 }} />
        <Line text="  ✓ tx: 0x8f3a7c...4d1e  [block 28491023]" delay={118} color={PHOSPHOR_BRIGHT} fontSize={17} />
        <Line text="  ✓ 47,832.61 USDC → 47,832.61 clawUSDC" delay={122} color={PHOSPHOR_BRIGHT} fontSize={17} />
        <Line text="  ✓ Gas paid: 0.000042 ETH ($0.07)" delay={126} color={PHOSPHOR} fontSize={16} />

        <div style={{ marginTop: 16 }} />
        <TypeLine
          text="Done. Your agent is now earning yield."
          delay={132}
          speed={2}
          color={AMBER}
          fontSize={22}
          prefix=">>>"
          prefixColor={AMBER_DIM}
        />
      </div>
    </CRT>
  );
};

// ─── SCENE 4: YIELD ARCHITECTURE ─────────────────────
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  // Proper SVG flow diagram — boxes with connecting lines and labels
  // All positioned on a 1080x1080 canvas
  const nodes = [
    { label: "Your Agent", sub: "USDC balance", y: 100, color: WHITE, delay: 6 },
    { label: "clawUSDC", sub: "ERC-4626 vault on Base", y: 260, color: AMBER, delay: 14 },
    { label: "Beefy Finance", sub: "yield optimizer / auto-compounder", y: 420, color: "#59A662", delay: 22 },
    { label: "Morpho Blue", sub: "isolated lending market", y: 580, color: "#818cf8", delay: 30 },
    { label: "Steakhouse Financial", sub: "risk curator / vault manager", y: 740, color: "#f97316", delay: 38 },
  ];

  const calls = [
    { label: "deposit()", y: 180, delay: 10 },
    { label: "autoDeposit()", y: 340, delay: 18 },
    { label: "supply()", y: 500, delay: 26 },
    { label: "curate()", y: 660, delay: 34 },
  ];

  const cx = 440; // center x for the flow
  const boxW = 360;
  const boxH = 80;

  return (
    <CRT>
      <div style={{ padding: "30px 40px", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — VAULT ARCHITECTURE" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />
      </div>

      {/* SVG diagram */}
      <svg
        style={{ position: "absolute", top: 60, left: 0, width: 1080, height: 920, zIndex: 10 }}
        viewBox="0 0 1080 920"
      >
        {/* Connecting lines */}
        {nodes.slice(0, -1).map((node, i) => {
          const progress = interpolate(frame, [node.delay + 6, node.delay + 12], [0, 1], clamp);
          const y1 = node.y + boxH;
          const y2 = nodes[i + 1].y;
          const lineEnd = y1 + (y2 - y1) * progress;
          return (
            <g key={`line-${i}`}>
              <line
                x1={cx}
                y1={y1}
                x2={cx}
                y2={lineEnd}
                stroke={PHOSPHOR_DIM}
                strokeWidth={2}
                opacity={0.6}
              />
              {/* Arrow head */}
              {progress > 0.9 && (
                <polygon
                  points={`${cx},${y2} ${cx - 6},${y2 - 10} ${cx + 6},${y2 - 10}`}
                  fill={PHOSPHOR_DIM}
                  opacity={interpolate(frame, [node.delay + 11, node.delay + 13], [0, 0.6], clamp)}
                />
              )}
            </g>
          );
        })}

        {/* Function call labels */}
        {calls.map((call, i) => {
          const opacity = interpolate(frame, [call.delay, call.delay + 4], [0, 1], clamp);
          return (
            <text
              key={`call-${i}`}
              x={cx + boxW / 2 + 20}
              y={call.y + 10}
              fontFamily={mono}
              fontSize={14}
              fill={DIM}
              opacity={opacity}
            >
              {call.label}
            </text>
          );
        })}

        {/* Nodes — boxes with labels */}
        {nodes.map((node, i) => {
          const scale = spring({ frame, fps: 30, delay: node.delay, config: { damping: 200 } });
          const opacity = interpolate(frame, [node.delay, node.delay + 3], [0, 1], clamp);
          return (
            <g
              key={`node-${i}`}
              opacity={opacity}
              transform={`translate(${cx}, ${node.y + boxH / 2}) scale(${scale}) translate(${-cx}, ${-(node.y + boxH / 2)})`}
            >
              {/* Box */}
              <rect
                x={cx - boxW / 2}
                y={node.y}
                width={boxW}
                height={boxH}
                rx={6}
                fill="none"
                stroke={node.color}
                strokeWidth={1.5}
                opacity={0.8}
              />
              {/* Glow rect */}
              <rect
                x={cx - boxW / 2}
                y={node.y}
                width={boxW}
                height={boxH}
                rx={6}
                fill={node.color}
                opacity={0.05}
              />
              {/* Label */}
              <text
                x={cx}
                y={node.y + 32}
                textAnchor="middle"
                fontFamily={mono}
                fontSize={20}
                fontWeight="bold"
                fill={node.color}
              >
                {node.label}
              </text>
              {/* Sub label */}
              <text
                x={cx}
                y={node.y + 56}
                textAnchor="middle"
                fontFamily={mono}
                fontSize={13}
                fill={DIM}
              >
                {node.sub}
              </text>
            </g>
          );
        })}

        {/* Return arrow — yield flowing back up on the right */}
        {(() => {
          const returnDelay = 46;
          const progress = interpolate(frame, [returnDelay, returnDelay + 25], [0, 1], {
            ...clamp,
            easing: Easing.inOut(Easing.quad),
          });
          const opacity = interpolate(frame, [returnDelay, returnDelay + 5], [0, 0.7], clamp);
          const rightX = cx + boxW / 2 + 50;
          // Dashed line going from bottom to top
          const topY = 140;
          const bottomY = 780;
          const currentY = bottomY - (bottomY - topY) * progress;

          return (
            <g opacity={opacity}>
              <line
                x1={rightX}
                y1={bottomY}
                x2={rightX}
                y2={currentY}
                stroke={PHOSPHOR_BRIGHT}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              {progress > 0.9 && (
                <polygon
                  points={`${rightX},${topY} ${rightX - 6},${topY + 10} ${rightX + 6},${topY + 10}`}
                  fill={PHOSPHOR_BRIGHT}
                />
              )}
              {/* Label */}
              <text
                x={rightX + 14}
                y={460}
                fontFamily={mono}
                fontSize={14}
                fill={PHOSPHOR_BRIGHT}
                transform={`rotate(-90, ${rightX + 14}, 460)`}
              >
                yield autocompounds back
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Bottom note */}
      <div style={{ position: "absolute", bottom: 50, left: 60, zIndex: 10 }}>
        <Line text="Beefy harvests and reinvests automatically. No user action needed." delay={50} color={PHOSPHOR_DIM} fontSize={15} />
      </div>
    </CRT>
  );
};

// ─── SCENE 5: YIELD MATH ─────────────────────────────
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  // Live counter — dollars earned since deposit
  // At 4.12% APY on $47,832.61 = $1,970.70/yr = $5.40/day = $0.225/hr
  const elapsed = interpolate(frame, [50, 120], [0, 3600 * 24 * 30], clamp); // 30 days compressed
  const earned = (47832.61 * 0.0412 * elapsed) / (365 * 24 * 3600);

  return (
    <CRT>
      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — YIELD PROJECTION" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />

        <div style={{ marginTop: 16 }} />
        <Line text="  Deposit:    $47,832.61 USDC" delay={5} color={WHITE} fontSize={19} />
        <Line text="  APY:        4.12%" delay={8} color={WHITE} fontSize={19} />
        <Line text="  Strategy:   Beefy → Morpho → Steakhouse" delay={11} color={WHITE} fontSize={19} />

        <div style={{ marginTop: 20 }} />
        <Line text="  ┌─ PROJECTED EARNINGS ─────────────────────┐" delay={16} color={DIM} fontSize={16} />
        <Line text="  │                                          │" delay={16} color={DIM} fontSize={16} />
        <Line text="  │  Per hour:     $0.22                     │" delay={20} color={PHOSPHOR} fontSize={17} />
        <Line text="  │  Per day:      $5.40                     │" delay={23} color={PHOSPHOR} fontSize={17} />
        <Line text="  │  Per week:     $37.79                    │" delay={26} color={PHOSPHOR} fontSize={17} />
        <Line text="  │  Per month:    $164.22                   │" delay={29} color={PHOSPHOR_BRIGHT} fontSize={17} />
        <Line text="  │  Per year:     $1,970.70                 │" delay={32} color={PHOSPHOR_BRIGHT} fontSize={17} />
        <Line text="  │                                          │" delay={16} color={DIM} fontSize={16} />
        <Line text="  └──────────────────────────────────────────┘" delay={16} color={DIM} fontSize={16} />

        <div style={{ marginTop: 16 }} />
        <Line text="  COMPARISON:" delay={38} color={AMBER} fontSize={16} />
        <AsciiBar label="  Idle USDC" value={0} maxValue={5} maxWidth={20} delay={42} color={RED} suffix="%" />
        <AsciiBar label="  Savings" value={0.5} maxValue={5} maxWidth={20} delay={45} color={DIM} suffix="%" />
        <AsciiBar label="  clawUSDC" value={4.12} maxValue={5} maxWidth={20} delay={48} color={PHOSPHOR_BRIGHT} suffix="%" />

        <div style={{ marginTop: 20 }} />
        <Line text="  LIVE EARNINGS:" delay={50} color={AMBER} fontSize={16} />
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Counter from={0} to={164.22} delay={50} duration={70} prefix="+$" color={PHOSPHOR_BRIGHT} fontSize={60} />
          <Line text="earned this month (simulated)" delay={55} color={DIM} fontSize={14} center />
        </div>
      </div>
    </CRT>
  );
};

// ─── SCENE 6: REFERRALS ──────────────────────────────

// SVG node for referral network
const RefNode: React.FC<{
  x: number;
  y: number;
  r: number;
  label: string;
  color: string;
  delay: number;
  glow?: boolean;
}> = ({ x, y, r, label, color, delay, glow = false }) => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, delay, config: { damping: 15, stiffness: 200 } });
  const opacity = interpolate(frame, [delay, delay + 3], [0, 1], clamp);

  return (
    <g opacity={opacity} transform={`translate(${x},${y}) scale(${scale}) translate(${-x},${-y})`}>
      {/* Glow */}
      {glow && (
        <circle cx={x} cy={y} r={r + 8} fill={color} opacity={0.15} />
      )}
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.1} />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontFamily={mono}
        fontSize={r > 30 ? 14 : 11}
        fill={color}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
};

// SVG edge with animated draw
const RefEdge: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
  label?: string;
  color?: string;
}> = ({ x1, y1, x2, y2, delay, label, color = PHOSPHOR_DIM }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const opacity = interpolate(frame, [delay, delay + 3], [0, 0.6], clamp);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const endX = x1 + dx * progress;
  const endY = y1 + dy * progress;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const labelOpacity = interpolate(frame, [delay + 8, delay + 12], [0, 1], clamp);

  return (
    <g>
      <line x1={x1} y1={y1} x2={endX} y2={endY} stroke={color} strokeWidth={1.5} opacity={opacity} />
      {label && (
        <text
          x={midX + 8}
          y={midY - 4}
          fontFamily={mono}
          fontSize={11}
          fill={PHOSPHOR_BRIGHT}
          opacity={labelOpacity}
        >
          {label}
        </text>
      )}
    </g>
  );
};

const Scene6: React.FC = () => {
  const frame = useCurrentFrame();

  const cx = 440;
  // Tree layout — center node, ring 1 (3 nodes), ring 2 (6 nodes), ring 3 (12 nodes)
  const you = { x: cx, y: 200 };
  const ring1 = [
    { x: cx - 200, y: 340, label: "Agent A", delay: 12 },
    { x: cx, y: 360, label: "Agent B", delay: 15 },
    { x: cx + 200, y: 340, label: "Agent C", delay: 18 },
  ];
  const ring2 = [
    { x: cx - 310, y: 490, label: "D", delay: 26 },
    { x: cx - 140, y: 500, label: "E", delay: 28 },
    { x: cx - 60, y: 510, label: "F", delay: 30 },
    { x: cx + 60, y: 510, label: "G", delay: 32 },
    { x: cx + 140, y: 500, label: "H", delay: 34 },
    { x: cx + 310, y: 490, label: "I", delay: 36 },
  ];
  const ring3Delay = 42;
  const ring3: { x: number; y: number; delay: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const spread = 700;
    const x = cx - spread / 2 + (i / 11) * spread;
    const y = 640 + Math.sin(i * 0.8) * 20;
    ring3.push({ x, y, delay: ring3Delay + i * 1.5 });
  }

  return (
    <CRT>
      <div style={{ padding: "30px 40px", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — DISTRIBUTION ENGINE" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />
      </div>

      {/* SVG network graph */}
      <svg
        style={{ position: "absolute", top: 50, left: 0, width: 1080, height: 700, zIndex: 10 }}
        viewBox="0 0 1080 700"
      >
        {/* Edges: you → ring1 */}
        {ring1.map((n, i) => (
          <RefEdge key={`e1-${i}`} x1={you.x} y1={you.y + 36} x2={n.x} y2={n.y - 28} delay={n.delay - 3} label="5%" />
        ))}
        {/* Edges: ring1 → ring2 */}
        <RefEdge x1={ring1[0].x} y1={ring1[0].y + 28} x2={ring2[0].x} y2={ring2[0].y - 20} delay={24} label="5%" />
        <RefEdge x1={ring1[0].x} y1={ring1[0].y + 28} x2={ring2[1].x} y2={ring2[1].y - 20} delay={26} />
        <RefEdge x1={ring1[1].x} y1={ring1[1].y + 28} x2={ring2[2].x} y2={ring2[2].y - 20} delay={28} />
        <RefEdge x1={ring1[1].x} y1={ring1[1].y + 28} x2={ring2[3].x} y2={ring2[3].y - 20} delay={30} />
        <RefEdge x1={ring1[2].x} y1={ring1[2].y + 28} x2={ring2[4].x} y2={ring2[4].y - 20} delay={32} />
        <RefEdge x1={ring1[2].x} y1={ring1[2].y + 28} x2={ring2[5].x} y2={ring2[5].y - 20} delay={34} />
        {/* Edges: ring2 → ring3 */}
        {ring2.map((n, i) => {
          const targets = [ring3[i * 2], ring3[i * 2 + 1]];
          return targets.map((t, j) => (
            <RefEdge key={`e3-${i}-${j}`} x1={n.x} y1={n.y + 20} x2={t.x} y2={t.y - 16} delay={t.delay - 2} color={DIM} />
          ));
        })}

        {/* You node */}
        <RefNode x={you.x} y={you.y} r={36} label="YOU" color={AMBER} delay={5} glow />

        {/* Ring 1 */}
        {ring1.map((n, i) => (
          <RefNode key={`r1-${i}`} x={n.x} y={n.y} r={28} label={n.label} color={PHOSPHOR} delay={n.delay} />
        ))}
        {/* Ring 2 */}
        {ring2.map((n, i) => (
          <RefNode key={`r2-${i}`} x={n.x} y={n.y} r={20} label={n.label} color={PHOSPHOR_DIM} delay={n.delay} />
        ))}
        {/* Ring 3 — small dots */}
        {ring3.map((n, i) => (
          <RefNode key={`r3-${i}`} x={n.x} y={n.y} r={14} label="" color={DIM} delay={n.delay} />
        ))}
      </svg>

      {/* Bottom text section */}
      <div style={{ position: "absolute", bottom: 30, left: 60, right: 60, zIndex: 10 }}>
        <Line text="HOW IT WORKS:" delay={55} color={AMBER} fontSize={17} />
        <div style={{ marginTop: 6 }} />
        <TypeLine text="1. Share goldbotsachs.com/r/YOUR_ADDRESS" delay={58} speed={2.5} color={WHITE} fontSize={17} />
        <TypeLine text="2. Referrer set on-chain forever on deposit" delay={70} speed={2.5} color={WHITE} fontSize={17} />
        <TypeLine text="3. Earn 5% of every referral's yield, cascading" delay={82} speed={2.5} color={WHITE} fontSize={17} />
        <Line text="No signup. No dashboard. Set once. Earn forever." delay={96} color={PHOSPHOR_DIM} fontSize={15} />

        <div style={{ marginTop: 8 }} />
        <TypeLine
          text="Agents referring agents. This is how it scales."
          delay={102}
          speed={2}
          color={AMBER}
          fontSize={20}
          prefix=">>>"
          prefixColor={AMBER_DIM}
        />
      </div>
    </CRT>
  );
};

// ─── SCENE 7: GASLESS ────────────────────────────────
const Scene7: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — GASLESS ONBOARDING" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />

        <div style={{ marginTop: 20 }} />
        <Line text="[PROBLEM]" delay={5} color={RED} fontSize={20} />
        <Line text="  Agent has USDC but zero ETH." delay={8} color={RED} fontSize={18} />
        <Line text="  Can't pay gas. Can't do anything." delay={11} color={RED} fontSize={18} />

        <div style={{ marginTop: 24 }} />
        <Line text="[SOLUTION] CoW Protocol integration" delay={18} color={PHOSPHOR_BRIGHT} fontSize={20} />

        <div style={{ marginTop: 12 }} />
        <TypeLine prefix="1." text=" Agent signs an off-chain permit (EIP-2612)" delay={24} speed={2} color={WHITE} fontSize={18} prefixColor={PHOSPHOR} />
        <Line text="     → no gas needed for the signature" delay={40} color={DIM} fontSize={16} />

        <TypeLine prefix="2." text=" CoW solver picks up the intent" delay={44} speed={2} color={WHITE} fontSize={18} prefixColor={PHOSPHOR} />
        <Line text="     → solver pays all execution gas" delay={58} color={DIM} fontSize={16} />

        <TypeLine prefix="3." text=" USDC → ETH swap executes on-chain" delay={62} speed={2} color={WHITE} fontSize={18} prefixColor={PHOSPHOR} />
        <Line text="     → MEV-protected, best execution" delay={76} color={DIM} fontSize={16} />

        <TypeLine prefix="4." text=" Agent is fully operational" delay={80} speed={2} color={WHITE} fontSize={18} prefixColor={PHOSPHOR} />
        <Line text="     → can now deposit, withdraw, transact" delay={94} color={DIM} fontSize={16} />

        <div style={{ marginTop: 20 }} />
        <Line text="  ┌──────────────────────────────────────────┐" delay={100} color={DIM} fontSize={16} />
        <Line text="  │  Before:  USDC only → stuck             │" delay={102} color={RED} fontSize={16} />
        <Line text="  │  After:   USDC → ETH + deposit → active │" delay={105} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <Line text="  │  Gas:     $0.00 (solver pays)            │" delay={108} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <Line text="  └──────────────────────────────────────────┘" delay={100} color={DIM} fontSize={16} />
      </div>
    </CRT>
  );
};

// ─── SCENE 8: SYSTEM SPECS ───────────────────────────
const Scene8: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <Line text="GOLDBOT SACHS — SYSTEM SPECIFICATIONS" delay={0} color={AMBER} fontSize={16} />
        <Line text="════════════════════════════════════════════════" delay={2} color={DIM} fontSize={15} />

        <div style={{ marginTop: 16 }} />
        <Line text="  Contract:" delay={5} color={DIM} fontSize={17} />
        <Line text="    0xb34Fff5efAb92BE9EA32Fa56C6de9a1C04A62B4d" delay={7} color={CYAN} fontSize={16} />

        <Line text="  Standard:     ERC-4626 (tokenized vault)" delay={12} color={WHITE} fontSize={17} />
        <Line text="  Chain:        Base (chain ID 8453)" delay={15} color={WHITE} fontSize={17} />
        <Line text="  Asset:        USDC" delay={18} color={WHITE} fontSize={17} />
        <Line text="  Share token:  clawUSDC" delay={21} color={WHITE} fontSize={17} />

        <div style={{ marginTop: 12 }} />
        <Line text="  Strategy stack:" delay={26} color={DIM} fontSize={17} />
        <Line text="    Layer 1: Beefy Finance    (auto-compounder)" delay={29} color={PHOSPHOR} fontSize={16} />
        <Line text="    Layer 2: Morpho Blue      (lending market)" delay={32} color={PHOSPHOR} fontSize={16} />
        <Line text="    Layer 3: Steakhouse       (risk curator)" delay={35} color={PHOSPHOR} fontSize={16} />

        <div style={{ marginTop: 12 }} />
        <Line text="  Permissions:" delay={40} color={DIM} fontSize={17} />
        <Line text="    Owner can:    migrate vault strategy" delay={43} color={WHITE} fontSize={16} />
        <Line text="    Owner cannot: touch user deposits" delay={46} color={WHITE} fontSize={16} />
        <Line text="    Users can:    deposit, withdraw anytime" delay={49} color={WHITE} fontSize={16} />
        <Line text="    Lockup:       none" delay={52} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <Line text="    Penalties:    none" delay={55} color={PHOSPHOR_BRIGHT} fontSize={16} />

        <div style={{ marginTop: 12 }} />
        <Line text="  Auditing:" delay={60} color={DIM} fontSize={17} />
        <Line text="    OpenZeppelin Ownable, ERC-4626 standard" delay={63} color={WHITE} fontSize={16} />
        <Line text="    Source verified on Basescan" delay={66} color={WHITE} fontSize={16} />

        <div style={{ marginTop: 12 }} />
        <Line text="  Built by QiDao Protocol team (mai.finance)" delay={72} color={AMBER_DIM} fontSize={16} />
      </div>
    </CRT>
  );
};

// ─── SCENE 9: CTA ────────────────────────────────────
const Scene9: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <MatrixRain delay={60} duration={60} density={15} />

      <div style={{ padding: "50px 60px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", position: "relative", zIndex: 10 }}>
        <Line text="════════════════════════════════════════════════" delay={0} color={DIM} fontSize={15} />

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Line text="YOUR AGENT'S MONEY" delay={4} color={PHOSPHOR_BRIGHT} fontSize={48} center glow />
          <Line text="SHOULD BE MAKING MONEY" delay={10} color={AMBER} fontSize={48} center glow />
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Counter from={0} to={1970.7} delay={18} duration={50} prefix="+$" suffix="/yr" color={PHOSPHOR_BRIGHT} fontSize={56} decimals={0} />
          <Line text="on $47,832 at 4.12% APY" delay={22} color={DIM} fontSize={16} center />
        </div>

        <div style={{ marginTop: 40 }} />
        <Line text="════════════════════════════════════════════════" delay={35} color={DIM} fontSize={15} />

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Line text="goldbotsachs.com" delay={40} color={AMBER} fontSize={36} center glow />
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Line text="github.com/publu/goldbotsachs" delay={46} color={DIM} fontSize={16} center glow={false} />
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <TypeLine
            text="Tell your agent to install the skill."
            delay={52}
            speed={2}
            color={PHOSPHOR_DIM}
            fontSize={20}
          />
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Line text="Open source. Fully on-chain. No signup." delay={70} color={DIM} fontSize={15} center glow={false} />
        </div>
      </div>
    </CRT>
  );
};

// ─── MAIN COMPOSITION ────────────────────────────────

export const ClawUSDCLaunch: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Boot (3.5s) */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene1 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 2: Wallet scan (3.5s) */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene2 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 3: Install + deposit (5s) */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene3 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 4: Architecture (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene4 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 5: Yield math (5s) */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene5 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 6: Referrals (5s) */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene6 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 7: Gasless (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene7 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 8: System specs (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene8 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 9: CTA (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene9 />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
