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
import { fade } from "@remotion/transitions/fade";
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
  const tearActive = frame % 150 > 143;
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
        {/* Scan lines */}
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
        {/* Moving band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ((frame * 2) % 1200) - 100,
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
      </div>
    </AbsoluteFill>
  );
};

// ─── Matrix rain ─────────────────────────────────────
const MatrixRain: React.FC<{
  delay: number;
  duration: number;
  density?: number;
}> = ({ delay, duration, density = 25 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [delay, delay + 8, delay + duration - 8, delay + duration],
    [0, 0.5, 0.5, 0],
    clamp
  );
  const chars = "01アイウエオカキクケコ$¥€£₿";
  const columns = Array.from({ length: density }, (_, i) => ({
    x: (i / density) * 1040 + 20,
    speed: 3 + ((i * 7.3) % 5),
    offset: (i * 137) % 400,
    seed: i * 31,
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        zIndex: 5,
        overflow: "hidden",
      }}
    >
      {columns.map((col, ci) =>
        Array.from({ length: 8 }, (_, j) => {
          const y =
            ((frame - delay) * col.speed + col.offset + j * 28) % 1200 - 100;
          const charIndex =
            ((col.seed + j * 17 + Math.floor(frame / 3)) * 7) % chars.length;
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
                opacity: j === 0 ? 1 : Math.max(0, 0.3 - j * 0.03),
                textShadow: j === 0 ? `0 0 10px ${PHOSPHOR_BRIGHT}` : "none",
              }}
            >
              {chars[charIndex]}
            </div>
          );
        })
      )}
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
  center?: boolean;
}> = ({
  text,
  delay,
  speed = 2,
  color = PHOSPHOR,
  fontSize = 22,
  glow = true,
  center = false,
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
        lineHeight: 1.6,
        textAlign: center ? "center" : "left",
      }}
    >
      {text.slice(0, chars)}
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

// ─── Instant appear ──────────────────────────────────
const Line: React.FC<{
  text: string;
  delay: number;
  color?: string;
  fontSize?: number;
  glow?: boolean;
  center?: boolean;
}> = ({
  text,
  delay,
  color = PHOSPHOR,
  fontSize = 22,
  glow = true,
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
        lineHeight: 1.6,
        textAlign: center ? "center" : "left",
        whiteSpace: "pre",
      }}
    >
      {text}
    </div>
  );
};

// ─── Big centered number ─────────────────────────────
const BigNum: React.FC<{
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
  fontSize = 80,
  decimals = 2,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 4], [0, 1], clamp);
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
        textShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
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

// ─── Spinner ─────────────────────────────────────────
const Spinner: React.FC<{
  delay: number;
  duration: number;
  label: string;
  doneLabel?: string;
  center?: boolean;
}> = ({ delay, duration, label, doneLabel, center = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 1], [0, 1], clamp);
  const spinChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const done = frame >= delay + duration;
  const charIdx = Math.floor((frame - delay) * 0.5) % spinChars.length;

  return (
    <div
      style={{
        opacity,
        fontFamily: mono,
        fontSize: 18,
        lineHeight: 1.6,
        display: "flex",
        gap: 8,
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {!done && (
        <span style={{ color: PHOSPHOR, textShadow: `0 0 8px ${PHOSPHOR}` }}>
          {spinChars[charIdx]}
        </span>
      )}
      {done && (
        <span
          style={{
            color: PHOSPHOR_BRIGHT,
            textShadow: `0 0 8px ${PHOSPHOR_BRIGHT}`,
          }}
        >
          ✓
        </span>
      )}
      <span style={{ color: done ? PHOSPHOR : PHOSPHOR_DIM }}>
        {done && doneLabel ? doneLabel : label}
      </span>
    </div>
  );
};

// ─── Progress bar ────────────────────────────────────
const ProgressBar: React.FC<{
  delay: number;
  duration: number;
  label: string;
  width?: number;
  center?: boolean;
}> = ({ delay, duration, label, width = 500, center = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 2], [0, 1], clamp);
  const progress = interpolate(frame, [delay, delay + duration], [0, 100], clamp);
  const totalBlocks = 30;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);
  const bar =
    "█".repeat(filledBlocks) + "░".repeat(totalBlocks - filledBlocks);

  return (
    <div
      style={{
        opacity,
        fontFamily: mono,
        fontSize: 16,
        lineHeight: 1.6,
        textAlign: center ? "center" : "left",
      }}
    >
      <span style={{ color: DIM }}>{label} </span>
      <span style={{ color: PHOSPHOR, textShadow: `0 0 6px ${PHOSPHOR}` }}>
        [{bar}]
      </span>
      <span style={{ color: PHOSPHOR_DIM }}> {Math.floor(progress)}%</span>
    </div>
  );
};

// ─── Centered layout helper ──────────────────────────
const Center: React.FC<{
  children: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ children, gap = 0, style }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap,
      padding: "60px 80px",
      ...style,
    }}
  >
    {children}
  </div>
);

// ═════════════════════════════════════════════════════
// SCENES
// ═════════════════════════════════════════════════════

// ─── 1. BOOT ─────────────────────────────────────────
// Quick and cinematic. Sets the mood.
const SceneBoot: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 5], [0.8, 0], clamp);

  return (
    <CRT>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: PHOSPHOR,
          opacity: flash,
          zIndex: 50,
        }}
      />
      <MatrixRain delay={0} duration={40} density={20} />

      <Center gap={12}>
        <Line text="╔═════════════════════════════════════╗" delay={4} color={DIM} fontSize={16} center />
        <Line text="║                                     ║" delay={4} color={DIM} fontSize={16} center />
        <Line text="║  G O L D B O T   S A C H S  v1.0   ║" delay={6} color={AMBER} fontSize={16} center />
        <Line text="║  Yield infrastructure for AI agents  ║" delay={8} color={AMBER_DIM} fontSize={16} center />
        <Line text="║                                     ║" delay={4} color={DIM} fontSize={16} center />
        <Line text="╚═════════════════════════════════════╝" delay={10} color={DIM} fontSize={16} center />

        <div style={{ height: 24 }} />

        <Spinner delay={16} duration={15} label="Connecting to Base..." doneLabel="Connected to Base (8453)" center />
        <Spinner delay={20} duration={14} label="Loading vault..." doneLabel="clawUSDC vault loaded" center />
        <Spinner delay={24} duration={16} label="Syncing strategy..." doneLabel="Beefy → Morpho → Steakhouse Financial" center />

        <div style={{ height: 16 }} />
        <ProgressBar delay={30} duration={20} label="INIT" center />

        <div style={{ height: 20 }} />
        <Line text="[READY] All systems operational." delay={54} color={PHOSPHOR_BRIGHT} fontSize={18} center />
      </Center>
    </CRT>
  );
};

// ─── 2. THE PROBLEM ──────────────────────────────────
// Slow. Dramatic. One idea: your USDC is doing nothing.
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  const balance = interpolate(frame, [10, 35], [0, 47832.61], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <CRT>
      <Center gap={16}>
        <Line text="AGENT WALLET SCAN" delay={0} color={DIM} fontSize={14} center />

        <div style={{ height: 30 }} />

        <BigNum from={0} to={47832.61} delay={8} duration={30} prefix="$" color={WHITE} fontSize={76} />
        <Line text="USDC" delay={12} color={DIM} fontSize={20} center />

        <div style={{ height: 50 }} />

        <Line text="CURRENTLY EARNING" delay={42} color={DIM} fontSize={14} center />

        <div style={{ height: 8 }} />

        <Line text="$0.00" delay={46} color={RED} fontSize={64} center />

        <div style={{ height: 40 }} />

        <TypeLine
          text="Almost fifty thousand dollars. Doing nothing."
          delay={58}
          speed={1.8}
          color={AMBER}
          fontSize={22}
          center
        />
      </Center>
    </CRT>
  );
};

// ─── 3. THE FIX ──────────────────────────────────────
// Show the install. Terminal aesthetic but centered, breathing room.
const SceneFix: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <Center gap={8} style={{ alignItems: "flex-start", padding: "80px 100px" }}>
        <Line text="AGENT TERMINAL" delay={0} color={AMBER} fontSize={14} center={false} />
        <Line text="────────────────────────────────────────" delay={2} color={DIM} fontSize={14} />

        <div style={{ height: 16 }} />

        <TypeLine text="$ curl -sO goldbotsachs.com/skills/goldbot-sachs.md" delay={6} speed={2} fontSize={19} />
        <Spinner delay={28} duration={12} label="Downloading..." doneLabel="goldbot-sachs.md (2.1kb)" />

        <div style={{ height: 20 }} />

        <TypeLine text="$ agent deposit 47832.61 USDC --vault clawUSDC" delay={46} speed={1.8} fontSize={19} />
        <Spinner delay={68} duration={14} label="Approving USDC..." doneLabel="Approved" />
        <Spinner delay={74} duration={16} label="Depositing..." doneLabel="Confirmed" />

        <div style={{ height: 12 }} />

        <Line text="✓ tx: 0x8f3a7c...4d1e  [block 28491023]" delay={94} color={PHOSPHOR_BRIGHT} fontSize={17} />
        <Line text="✓ 47,832.61 USDC → clawUSDC" delay={98} color={PHOSPHOR_BRIGHT} fontSize={17} />

        <div style={{ height: 24 }} />

        <TypeLine
          text="One skill file. One command. That's it."
          delay={106}
          speed={1.8}
          color={AMBER}
          fontSize={24}
        />
      </Center>
    </CRT>
  );
};

// ─── 4. NOW IT'S EARNING ─────────────────────────────
// Show the yield kicking in. Big number. Per day, per month, per year.
const SceneEarning: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <Center gap={16}>
        <Line text="YOUR AGENT IS NOW EARNING" delay={0} color={DIM} fontSize={14} center />

        <div style={{ height: 20 }} />

        <BigNum from={0} to={4.12} delay={6} duration={30} suffix="%" color={PHOSPHOR_BRIGHT} fontSize={100} decimals={2} />
        <Line text="APY — autocompounding" delay={10} color={PHOSPHOR_DIM} fontSize={18} center />

        <div style={{ height: 50 }} />

        <Line text="$5.40 / day" delay={40} color={WHITE} fontSize={28} center />
        <Line text="$164 / month" delay={48} color={WHITE} fontSize={28} center />
        <Line text="$1,970 / year" delay={56} color={AMBER} fontSize={32} center />

        <div style={{ height: 40 }} />

        <TypeLine
          text="While your agent does literally nothing."
          delay={68}
          speed={1.8}
          color={PHOSPHOR_DIM}
          fontSize={20}
          center
        />
      </Center>
    </CRT>
  );
};

// ─── 5. HOW IT WORKS — VAULT FLOW ────────────────────
// SVG diagram. Clean boxes. Full protocol names.
const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();

  const cx = 440;
  const boxW = 380;
  const boxH = 72;
  const nodes = [
    { label: "Your Agent", sub: "holds USDC", y: 80, color: WHITE, delay: 6 },
    { label: "clawUSDC", sub: "ERC-4626 vault on Base", y: 230, color: AMBER, delay: 16 },
    { label: "Beefy Finance", sub: "yield optimizer — auto-compounds", y: 380, color: "#59A662", delay: 26 },
    { label: "Morpho Blue", sub: "isolated lending market", y: 530, color: "#818cf8", delay: 36 },
    { label: "Steakhouse Financial", sub: "risk curator — manages vault params", y: 680, color: "#f97316", delay: 46 },
  ];

  return (
    <CRT>
      <div style={{ padding: "24px 40px", position: "relative", zIndex: 10 }}>
        <Line text="WHERE YOUR USDC GOES" delay={0} color={AMBER} fontSize={15} center />
      </div>

      <svg
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          width: 1080,
          height: 900,
          zIndex: 10,
        }}
        viewBox="0 0 1080 900"
      >
        {/* Connecting arrows */}
        {nodes.slice(0, -1).map((node, i) => {
          const progress = interpolate(
            frame,
            [node.delay + 8, node.delay + 16],
            [0, 1],
            clamp
          );
          const y1 = node.y + boxH;
          const y2 = nodes[i + 1].y;
          const lineEnd = y1 + (y2 - y1) * progress;
          const opacity = interpolate(
            frame,
            [node.delay + 8, node.delay + 10],
            [0, 0.6],
            clamp
          );

          return (
            <g key={`line-${i}`}>
              <line
                x1={cx}
                y1={y1}
                x2={cx}
                y2={lineEnd}
                stroke={PHOSPHOR_DIM}
                strokeWidth={2}
                opacity={opacity}
              />
              {progress > 0.9 && (
                <polygon
                  points={`${cx},${y2} ${cx - 7},${y2 - 12} ${cx + 7},${y2 - 12}`}
                  fill={PHOSPHOR_DIM}
                  opacity={0.6}
                />
              )}
            </g>
          );
        })}

        {/* Boxes */}
        {nodes.map((node, i) => {
          const scale = spring({
            frame,
            fps: 30,
            delay: node.delay,
            config: { damping: 200 },
          });
          const opacity = interpolate(
            frame,
            [node.delay, node.delay + 4],
            [0, 1],
            clamp
          );
          return (
            <g
              key={`node-${i}`}
              opacity={opacity}
              transform={`translate(${cx}, ${node.y + boxH / 2}) scale(${scale}) translate(${-cx}, ${-(node.y + boxH / 2)})`}
            >
              <rect
                x={cx - boxW / 2}
                y={node.y}
                width={boxW}
                height={boxH}
                rx={8}
                fill="none"
                stroke={node.color}
                strokeWidth={1.5}
                opacity={0.8}
              />
              <rect
                x={cx - boxW / 2}
                y={node.y}
                width={boxW}
                height={boxH}
                rx={8}
                fill={node.color}
                opacity={0.05}
              />
              <text
                x={cx}
                y={node.y + 30}
                textAnchor="middle"
                fontFamily={mono}
                fontSize={20}
                fontWeight="bold"
                fill={node.color}
              >
                {node.label}
              </text>
              <text
                x={cx}
                y={node.y + 52}
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

        {/* Return arrow — autocompound */}
        {(() => {
          const d = 56;
          const progress = interpolate(frame, [d, d + 30], [0, 1], {
            ...clamp,
            easing: Easing.inOut(Easing.quad),
          });
          const opacity = interpolate(frame, [d, d + 5], [0, 0.7], clamp);
          const rightX = cx + boxW / 2 + 50;
          const topY = 120;
          const bottomY = 720;
          const curY = bottomY - (bottomY - topY) * progress;

          return (
            <g opacity={opacity}>
              <line
                x1={rightX}
                y1={bottomY}
                x2={rightX}
                y2={curY}
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
              <text
                x={rightX + 16}
                y={420}
                fontFamily={mono}
                fontSize={13}
                fill={PHOSPHOR_BRIGHT}
                transform={`rotate(-90, ${rightX + 16}, 420)`}
              >
                yield autocompounds back
              </text>
            </g>
          );
        })()}
      </svg>

      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, zIndex: 10 }}>
        <TypeLine
          text="Yield flows down. Profits compound back up. Automatically."
          delay={64}
          speed={1.8}
          color={PHOSPHOR_DIM}
          fontSize={17}
          center
        />
      </div>
    </CRT>
  );
};

// ─── 6. REFERRALS — THE STORY ────────────────────────
// Tell it step by step. Not a diagram dump. A narrative.
const SceneReferrals1: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <Center gap={24}>
        <Line text="NOW FOR THE FUN PART" delay={0} color={AMBER} fontSize={14} center />

        <div style={{ height: 20 }} />

        <TypeLine
          text="You share a link."
          delay={10}
          speed={1.5}
          color={WHITE}
          fontSize={32}
          center
        />

        <div style={{ height: 12 }} />

        <Line
          text="goldbotsachs.com/r/YOUR_ADDRESS"
          delay={30}
          color={CYAN}
          fontSize={22}
          center
        />

        <div style={{ height: 40 }} />

        <TypeLine
          text="Another agent deposits through it."
          delay={42}
          speed={1.5}
          color={WHITE}
          fontSize={32}
          center
        />

        <div style={{ height: 30 }} />

        <TypeLine
          text="You earn 5% of everything they earn."
          delay={64}
          speed={1.5}
          color={AMBER}
          fontSize={32}
          center
        />

        <div style={{ height: 8 }} />

        <Line text="Set on-chain. Permanent. No signup." delay={86} color={PHOSPHOR_DIM} fontSize={18} center />
      </Center>
    </CRT>
  );
};

// ─── 7. REFERRALS — CASCADING EXPLAINED ──────────────
// Explain cascading without jargon. Then show the network.
const SceneReferrals2: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <Center gap={20}>
        <TypeLine
          text="But here's the thing."
          delay={0}
          speed={1.5}
          color={AMBER}
          fontSize={28}
          center
        />

        <div style={{ height: 20 }} />

        <TypeLine
          text="They can share their link too."
          delay={20}
          speed={1.5}
          color={WHITE}
          fontSize={28}
          center
        />

        <div style={{ height: 10 }} />

        <TypeLine
          text="When their referrals earn yield..."
          delay={42}
          speed={1.5}
          color={WHITE}
          fontSize={28}
          center
        />

        <div style={{ height: 10 }} />

        <TypeLine
          text="they get 5%."
          delay={62}
          speed={1.5}
          color={PHOSPHOR}
          fontSize={28}
          center
        />

        <div style={{ height: 10 }} />

        <TypeLine
          text="And that counts as their earnings."
          delay={76}
          speed={1.5}
          color={WHITE}
          fontSize={28}
          center
        />

        <div style={{ height: 10 }} />

        <TypeLine
          text="So you get 5% of that too."
          delay={96}
          speed={1.5}
          color={AMBER}
          fontSize={28}
          center
        />

        <div style={{ height: 30 }} />

        <TypeLine
          text="Every layer. Forever."
          delay={116}
          speed={1.2}
          color={PHOSPHOR_BRIGHT}
          fontSize={36}
          center
        />
      </Center>
    </CRT>
  );
};

// ─── 8. REFERRALS — THE NETWORK ──────────────────────
// SVG expanding network. Clean circles. Slow reveal.
const SceneNetwork: React.FC = () => {
  const frame = useCurrentFrame();

  const cx = 540;
  const you = { x: cx, y: 260 };
  const ring1 = [
    { x: cx - 220, y: 430, delay: 12 },
    { x: cx, y: 450, delay: 16 },
    { x: cx + 220, y: 430, delay: 20 },
  ];
  const ring2 = [
    { x: cx - 340, y: 600, delay: 30 },
    { x: cx - 160, y: 610, delay: 33 },
    { x: cx - 40, y: 620, delay: 36 },
    { x: cx + 80, y: 620, delay: 39 },
    { x: cx + 200, y: 610, delay: 42 },
    { x: cx + 360, y: 600, delay: 45 },
  ];
  const ring3: { x: number; y: number; delay: number }[] = [];
  for (let i = 0; i < 14; i++) {
    ring3.push({
      x: cx - 420 + (i / 13) * 840,
      y: 760 + Math.sin(i * 0.9) * 15,
      delay: 54 + i * 1.5,
    });
  }

  const makeEdge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    delay: number,
    label?: string,
    color = PHOSPHOR_DIM
  ) => {
    const progress = interpolate(frame, [delay, delay + 12], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    });
    const opacity = interpolate(frame, [delay, delay + 3], [0, 0.5], clamp);
    const endX = x1 + (x2 - x1) * progress;
    const endY = y1 + (y2 - y1) * progress;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const labelOpacity = interpolate(frame, [delay + 10, delay + 15], [0, 1], clamp);

    return (
      <g>
        <line
          x1={x1}
          y1={y1}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth={1.5}
          opacity={opacity}
        />
        {label && (
          <text
            x={midX + 10}
            y={midY - 6}
            fontFamily={mono}
            fontSize={12}
            fill={PHOSPHOR_BRIGHT}
            opacity={labelOpacity}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const makeNode = (
    x: number,
    y: number,
    r: number,
    label: string,
    color: string,
    delay: number,
    glow = false
  ) => {
    const scale = spring({
      frame,
      fps: 30,
      delay,
      config: { damping: 15, stiffness: 200 },
    });
    const opacity = interpolate(frame, [delay, delay + 3], [0, 1], clamp);
    return (
      <g
        opacity={opacity}
        transform={`translate(${x},${y}) scale(${scale}) translate(${-x},${-y})`}
      >
        {glow && (
          <circle cx={x} cy={y} r={r + 10} fill={color} opacity={0.12} />
        )}
        <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={x} cy={y} r={r} fill={color} opacity={0.08} />
        {label && (
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontFamily={mono}
            fontSize={r > 30 ? 14 : r > 18 ? 11 : 9}
            fill={color}
            fontWeight="bold"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  return (
    <CRT>
      <div style={{ padding: "24px 40px", position: "relative", zIndex: 10 }}>
        <Line text="REFERRAL NETWORK" delay={0} color={AMBER} fontSize={15} center />
      </div>

      <svg
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          width: 1080,
          height: 800,
          zIndex: 10,
        }}
        viewBox="0 0 1080 850"
      >
        {/* Edges */}
        {ring1.map((n, i) =>
          makeEdge(you.x, you.y + 36, n.x, n.y - 28, n.delay - 4, "5%")
        )}
        {ring2.slice(0, 2).map((n, i) =>
          makeEdge(ring1[0].x, ring1[0].y + 28, n.x, n.y - 20, n.delay - 3, i === 0 ? "5%" : undefined)
        )}
        {ring2.slice(2, 4).map((n, i) =>
          makeEdge(ring1[1].x, ring1[1].y + 28, n.x, n.y - 20, n.delay - 3)
        )}
        {ring2.slice(4, 6).map((n, i) =>
          makeEdge(ring1[2].x, ring1[2].y + 28, n.x, n.y - 20, n.delay - 3)
        )}
        {ring2.map((n, i) => {
          const t1 = ring3[i * 2];
          const t2 = ring3[i * 2 + 1];
          return (
            <g key={`r2e-${i}`}>
              {t1 && makeEdge(n.x, n.y + 20, t1.x, t1.y - 14, t1.delay - 2, undefined, DIM)}
              {t2 && makeEdge(n.x, n.y + 20, t2.x, t2.y - 14, t2.delay - 2, undefined, DIM)}
            </g>
          );
        })}

        {/* Nodes */}
        {makeNode(you.x, you.y, 40, "YOU", AMBER, 5, true)}
        {ring1.map((n, i) =>
          makeNode(n.x, n.y, 28, `Agent ${String.fromCharCode(65 + i)}`, PHOSPHOR, n.delay)
        )}
        {ring2.map((n, i) =>
          makeNode(n.x, n.y, 20, String.fromCharCode(68 + i), PHOSPHOR_DIM, n.delay)
        )}
        {ring3.map((n, i) =>
          makeNode(n.x, n.y, 12, "", DIM, n.delay)
        )}
      </svg>

      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, zIndex: 10 }}>
        <TypeLine
          text="Every node earns. Every connection pays. It grows itself."
          delay={70}
          speed={1.8}
          color={PHOSPHOR_DIM}
          fontSize={17}
          center
        />
      </div>
    </CRT>
  );
};

// ─── 9. GASLESS ──────────────────────────────────────
// Simple. Centered. Three steps.
const SceneGasless: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <Center gap={20}>
        <Line text="ZERO ETH?" delay={0} color={WHITE} fontSize={40} center />
        <Line text="NO PROBLEM." delay={8} color={PHOSPHOR_BRIGHT} fontSize={40} center />

        <div style={{ height: 40 }} />

        <TypeLine text="Agent signs an off-chain permit." delay={20} speed={1.8} color={WHITE} fontSize={24} center />
        <Line text="No gas needed." delay={40} color={DIM} fontSize={16} center />

        <div style={{ height: 16 }} />

        <TypeLine text="CoW Protocol solver executes the swap." delay={48} speed={1.8} color={WHITE} fontSize={24} center />
        <Line text="Solver pays all gas." delay={68} color={DIM} fontSize={16} center />

        <div style={{ height: 16 }} />

        <TypeLine text="USDC → ETH. Agent is operational." delay={76} speed={1.8} color={AMBER} fontSize={24} center />

        <div style={{ height: 40 }} />

        <Line text="Your agent went from stuck to earning" delay={100} color={PHOSPHOR_DIM} fontSize={18} center />
        <Line text="without spending a single dollar on gas." delay={106} color={PHOSPHOR_DIM} fontSize={18} center />
      </Center>
    </CRT>
  );
};

// ─── 10. SPECS ───────────────────────────────────────
// Quick technical overview for the builders.
const SceneSpecs: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <Center gap={6} style={{ alignItems: "flex-start", padding: "60px 100px" }}>
        <Line text="TECHNICAL DETAILS" delay={0} color={AMBER} fontSize={15} />
        <Line text="──────────────────────────────────────────" delay={2} color={DIM} fontSize={14} />

        <div style={{ height: 16 }} />

        <Line text="Contract" delay={5} color={DIM} fontSize={14} />
        <Line text="  0xb34Fff5efAb92BE9EA32Fa56C6de9a1C04A62B4d" delay={7} color={CYAN} fontSize={17} />

        <div style={{ height: 8 }} />
        <Line text="Standard     ERC-4626 (tokenized vault)" delay={12} color={WHITE} fontSize={17} />
        <Line text="Chain        Base (8453)" delay={16} color={WHITE} fontSize={17} />
        <Line text="Token        clawUSDC" delay={20} color={WHITE} fontSize={17} />
        <Line text="Asset        USDC" delay={24} color={WHITE} fontSize={17} />

        <div style={{ height: 12 }} />
        <Line text="Strategy" delay={30} color={DIM} fontSize={14} />
        <Line text="  Beefy Finance → Morpho Blue → Steakhouse Financial" delay={32} color={PHOSPHOR} fontSize={16} />

        <div style={{ height: 12 }} />
        <Line text="Permissions" delay={38} color={DIM} fontSize={14} />
        <Line text="  Owner: can migrate strategy" delay={40} color={WHITE} fontSize={16} />
        <Line text="  Owner: cannot touch deposits" delay={43} color={WHITE} fontSize={16} />
        <Line text="  Users: deposit + withdraw anytime" delay={46} color={WHITE} fontSize={16} />
        <Line text="  Lockup: none" delay={49} color={PHOSPHOR_BRIGHT} fontSize={16} />
        <Line text="  Penalties: none" delay={52} color={PHOSPHOR_BRIGHT} fontSize={16} />

        <div style={{ height: 12 }} />
        <Line text="Source verified on Basescan. Fully open source." delay={58} color={PHOSPHOR_DIM} fontSize={15} />
        <Line text="Built by the QiDao Protocol team." delay={62} color={AMBER_DIM} fontSize={15} />
      </Center>
    </CRT>
  );
};

// ─── 11. CTA ─────────────────────────────────────────
// Big. Centered. Dramatic. Counter. Link.
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <MatrixRain delay={50} duration={80} density={15} />

      <Center gap={12}>
        <Line text="YOUR AGENT'S MONEY" delay={4} color={PHOSPHOR_BRIGHT} fontSize={44} center />

        <div style={{ height: 4 }} />

        <Line text="SHOULD BE MAKING MONEY" delay={12} color={AMBER} fontSize={44} center />

        <div style={{ height: 40 }} />

        <BigNum
          from={0}
          to={1970}
          delay={24}
          duration={50}
          prefix="+$"
          suffix="/yr"
          color={PHOSPHOR_BRIGHT}
          fontSize={64}
          decimals={0}
        />
        <Line text="on $47,832 at 4.12% APY" delay={28} color={DIM} fontSize={15} center />

        <div style={{ height: 50 }} />

        <Line text="goldbotsachs.com" delay={42} color={AMBER} fontSize={36} center />

        <div style={{ height: 10 }} />

        <Line text="github.com/publu/goldbotsachs" delay={50} color={DIM} fontSize={16} center glow={false} />

        <div style={{ height: 30 }} />

        <TypeLine
          text="Install the skill. Tell your agent."
          delay={58}
          speed={1.5}
          color={PHOSPHOR_DIM}
          fontSize={20}
          center
        />
      </Center>
    </CRT>
  );
};

// ═════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═════════════════════════════════════════════════════

export const ClawUSDCLaunch: React.FC = () => {
  return (
    <TransitionSeries>
      {/* 1. Boot (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <SceneBoot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 2. The problem (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneProblem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 3. The fix — install + deposit (5s) */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <SceneFix />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 4. Now it's earning (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneEarning />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 5. How it works — vault flow (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneFlow />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 6. Referrals intro (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneReferrals1 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 7. Cascading explained (5s) */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <SceneReferrals2 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 8. Network graph (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneNetwork />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 9. Gasless (4.5s) */}
      <TransitionSeries.Sequence durationInFrames={135}>
        <SceneGasless />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 10. Specs (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <SceneSpecs />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* 11. CTA (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
