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

// ─── Color palette — CRT terminal ───────────────────
const BG = "#020a02";
const PHOSPHOR = "#33ff33";
const PHOSPHOR_DIM = "#1a8a1a";
const PHOSPHOR_BRIGHT = "#88ff88";
const AMBER = "#ffb830";
const AMBER_DIM = "#996d1a";
const RED = "#ff3333";
const WHITE = "#ccddcc";
const DIM = "#2a5a2a";
const GOLD = "#d4a843";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ─── CRT Monitor Frame — wraps everything ────────────
const CRT: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();

  // Flicker
  const flicker = 0.97 + Math.sin(frame * 0.3) * 0.015 + Math.sin(frame * 7.1) * 0.008;

  // Occasional horizontal tear
  const tearActive = frame % 120 > 115;
  const tearY = tearActive ? 200 + (frame % 37) * 18 : -100;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* CRT screen area with curvature */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: BG,
          // Vignette
          boxShadow: `inset 0 0 150px 60px rgba(0,0,0,0.7), 0 0 40px 5px rgba(50,255,50,0.05)`,
        }}
      >
        {/* Content with flicker */}
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

        {/* Horizontal moving scan band */}
        {(() => {
          const bandY = ((frame * 2.5) % 1200) - 100;
          return (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: bandY,
                height: 60,
                background: "linear-gradient(transparent, rgba(50,255,50,0.04), transparent)",
                pointerEvents: "none",
                zIndex: 91,
              }}
            />
          );
        })()}

        {/* Horizontal tear glitch */}
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

        {/* Corner vignette overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
            pointerEvents: "none",
            zIndex: 93,
          }}
        />

        {/* Phosphor glow bleed at edges */}
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

// ─── Typing effect — the core of everything ──────────
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
  const chars = Math.floor(interpolate(frame, [delay, delay + text.length / speed], [0, text.length], clamp));
  const typing = frame >= delay && frame < delay + text.length / speed;
  const cursorBlink = Math.floor(frame / 6) % 2 === 0;
  const showCursor = frame >= delay && frame < delay + text.length / speed + 20;

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
        <span style={{ color: prefixColor, marginRight: 10, textShadow: `0 0 6px ${prefixColor}` }}>
          {prefix}
        </span>
      )}
      <span>{text.slice(0, chars)}</span>
      {showCursor && cursorBlink && (
        <span style={{ color: PHOSPHOR_BRIGHT, textShadow: `0 0 10px ${PHOSPHOR}` }}>█</span>
      )}
    </div>
  );
};

// ─── Instant line (no typing, just appears) ──────────
const Line: React.FC<{
  text: string;
  delay: number;
  color?: string;
  fontSize?: number;
  glow?: boolean;
  indent?: number;
}> = ({ text, delay, color = PHOSPHOR, fontSize = 22, glow = true, indent = 0 }) => {
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
      }}
    >
      {text}
    </div>
  );
};

// ─── Big glowing number ──────────────────────────────
const BigNumber: React.FC<{
  value: string;
  delay: number;
  color?: string;
  label?: string;
}> = ({ value, delay, color = PHOSPHOR_BRIGHT, label }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 3], [0, 1], clamp);

  // Glitch on appear
  const glitchActive = frame >= delay && frame < delay + 6;
  const offset = glitchActive ? (frame % 2 === 0 ? 2 : -2) : 0;

  return (
    <div style={{ opacity, textAlign: "center" }}>
      {label && (
        <div
          style={{
            fontFamily: mono,
            fontSize: 16,
            color: DIM,
            textShadow: `0 0 4px ${DIM}`,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          fontFamily: mono,
          fontSize: 90,
          fontWeight: "bold",
          color,
          textShadow: `0 0 30px ${color}, 0 0 60px ${color}, 0 0 4px ${color}`,
          transform: `translateX(${offset}px)`,
          letterSpacing: -3,
        }}
      >
        {value}
      </div>
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
  const barWidth = interpolate(progress, [0, 100], [0, width]);

  return (
    <div style={{ opacity }}>
      <div style={{ fontFamily: mono, fontSize: 14, color: DIM, marginBottom: 6, textShadow: `0 0 4px ${DIM}` }}>
        {label}
      </div>
      <div style={{ width, height: 8, backgroundColor: "#0a1a0a", borderRadius: 2, border: `1px solid ${DIM}` }}>
        <div
          style={{
            width: barWidth,
            height: "100%",
            backgroundColor: PHOSPHOR,
            boxShadow: `0 0 10px ${PHOSPHOR}, 0 0 3px ${PHOSPHOR}`,
            borderRadius: 1,
          }}
        />
      </div>
      <div style={{ fontFamily: mono, fontSize: 12, color: PHOSPHOR_DIM, marginTop: 4, textShadow: `0 0 4px ${PHOSPHOR_DIM}` }}>
        {Math.floor(progress)}%
      </div>
    </div>
  );
};

// ─── Scene 1: BOOT SEQUENCE ─────────────────────────
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <div style={{ padding: "60px 70px", display: "flex", flexDirection: "column" }}>
        <Line text="GOLDBOT SACHS v1.0.0" delay={0} color={AMBER} fontSize={16} />
        <Line text="═══════════════════════════════════════════" delay={2} color={DIM} fontSize={16} />
        <TypeLine text="Initializing agent financial system..." delay={5} speed={3} color={PHOSPHOR_DIM} fontSize={18} />
        <ProgressBar delay={15} duration={20} label="LOADING MODULES" width={400} />

        <div style={{ marginTop: 30 }} />
        <Line text="[SCAN] Agent wallet detected" delay={35} color={PHOSPHOR} fontSize={18} />
        <Line text="[SCAN] Asset: USDC" delay={38} color={PHOSPHOR} fontSize={18} />

        <div style={{ marginTop: 20 }} />
        <BigNumber value="$47,832.61" delay={42} label="balance" />

        <div style={{ marginTop: 20 }} />
        <Line text="[WARN] Current yield: $0.00/yr" delay={52} color={RED} fontSize={20} />
        <Line text="[WARN] Status: IDLE" delay={56} color={RED} fontSize={20} />

        <div style={{ marginTop: 16 }} />
        <TypeLine text="Your agent is leaving money on the table." delay={62} speed={2.5} color={AMBER} fontSize={20} />
      </div>
    </CRT>
  );
};

// ─── Scene 2: INSTALL + DEPOSIT ──────────────────────
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <div style={{ padding: "60px 70px", display: "flex", flexDirection: "column" }}>
        <Line text="GOLDBOT SACHS — AGENT TERMINAL" delay={0} color={AMBER} fontSize={16} />
        <Line text="═══════════════════════════════════════════" delay={2} color={DIM} fontSize={16} />

        <div style={{ marginTop: 20 }} />
        <TypeLine
          prefix="$"
          text="curl -sO goldbotsachs.com/skills/goldbot-sachs.md"
          delay={5}
          speed={2.5}
          prefixColor={PHOSPHOR}
        />
        <Line text="  ✓ Skill downloaded: goldbot-sachs.md" delay={30} color={PHOSPHOR} fontSize={18} />

        <div style={{ marginTop: 16 }} />
        <TypeLine
          prefix="$"
          text="agent deposit 47832.61 USDC --vault clawUSDC"
          delay={36}
          speed={2}
          prefixColor={PHOSPHOR}
        />

        <div style={{ marginTop: 8 }} />
        <ProgressBar delay={56} duration={15} label="DEPOSITING" width={400} />

        <div style={{ marginTop: 16 }} />
        <Line text="  ✓ tx: 0x8f3a...c4d1 confirmed" delay={74} color={PHOSPHOR} fontSize={18} />
        <Line text="  ✓ 47,832.61 USDC → clawUSDC vault" delay={78} color={PHOSPHOR} fontSize={18} />

        <div style={{ marginTop: 16 }} />
        <Line text="  Vault:       clawUSDC (ERC-4626)" delay={84} color={DIM} fontSize={16} />
        <Line text="  Chain:       Base" delay={87} color={DIM} fontSize={16} />
        <Line text="  Strategy:    Beefy → Morpho → Steakhouse" delay={90} color={DIM} fontSize={16} />

        <div style={{ marginTop: 20 }} />
        <TypeLine
          text="Earning ~4.1% APY. Autocompounding."
          delay={96}
          speed={2}
          color={AMBER}
          fontSize={24}
          prefix=">>>"
          prefixColor={AMBER_DIM}
        />
      </div>
    </CRT>
  );
};

// ─── Scene 3: YIELD FLOW ─────────────────────────────
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();

  // ASCII flow diagram typed out
  const flowLines = [
    { text: "  ┌─────────────────────────────────────┐", delay: 5 },
    { text: "  │          YIELD FLOW DIAGRAM          │", delay: 7 },
    { text: "  └─────────────────────────────────────┘", delay: 9 },
    { text: "", delay: 10 },
    { text: "         YOUR AGENT", delay: 12 },
    { text: "             │", delay: 14 },
    { text: "             ▼  deposit USDC", delay: 16 },
    { text: "        ┌─────────┐", delay: 18 },
    { text: "        │ clawUSDC│  ◄── ERC-4626 vault", delay: 20 },
    { text: "        └────┬────┘", delay: 22 },
    { text: "             │", delay: 24 },
    { text: "             ▼  optimize", delay: 26 },
    { text: "        ┌─────────┐", delay: 28 },
    { text: "        │  Beefy  │  ◄── yield optimizer", delay: 30 },
    { text: "        └────┬────┘", delay: 32 },
    { text: "             │", delay: 34 },
    { text: "             ▼  lend", delay: 36 },
    { text: "        ┌─────────┐", delay: 38 },
    { text: "        │ Morpho  │  ◄── lending protocol", delay: 40 },
    { text: "        └────┬────┘", delay: 42 },
    { text: "             │", delay: 44 },
    { text: "             ▼  curate", delay: 46 },
    { text: "        ┌─────────┐", delay: 48 },
    { text: "        │  Steak  │  ◄── risk curator", delay: 50 },
    { text: "        └─────────┘", delay: 52 },
    { text: "", delay: 54 },
    { text: "    ┌─── yield ───────────────────┐", delay: 58 },
    { text: "    │                              │", delay: 59 },
    { text: "    │   autocompounds back into    │", delay: 60 },
    { text: "    │   clawUSDC. no action needed │", delay: 62 },
    { text: "    │                              │", delay: 63 },
    { text: "    └──────────────────────────────┘", delay: 64 },
  ];

  return (
    <CRT>
      <div style={{ padding: "40px 70px", display: "flex", flexDirection: "column" }}>
        <Line text="GOLDBOT SACHS — VAULT ARCHITECTURE" delay={0} color={AMBER} fontSize={16} />
        <Line text="═══════════════════════════════════════════" delay={2} color={DIM} fontSize={16} />

        <div style={{ marginTop: 10 }}>
          {flowLines.map((line, i) => (
            <Line
              key={i}
              text={line.text}
              delay={line.delay}
              color={line.text.includes("◄") ? DIM : PHOSPHOR}
              fontSize={17}
              glow={!line.text.includes("◄")}
            />
          ))}
        </div>
      </div>
    </CRT>
  );
};

// ─── Scene 4: REFERRALS ──────────────────────────────
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const refLines = [
    { text: "  ┌────────────────────────────────────────┐", delay: 5 },
    { text: "  │         REFERRAL NETWORK                │", delay: 7 },
    { text: "  └────────────────────────────────────────┘", delay: 9 },
    { text: "", delay: 10 },
    { text: "                 [YOU]", delay: 12 },
    { text: "               /  |  \\", delay: 14 },
    { text: "              /   |   \\", delay: 15 },
    { text: "          [A1]  [A2]  [A3]     ← 5% of their yield", delay: 17 },
    { text: "          / \\   / \\   / \\", delay: 20 },
    { text: "        [.] [.][.] [.][.] [.]  ← cascading", delay: 23 },
    { text: "        / \\     / \\     / \\", delay: 26 },
    { text: "      [.] [.] [.] [.] [.] [.]  ← infinite depth", delay: 29 },
  ];

  return (
    <CRT>
      <div style={{ padding: "60px 70px", display: "flex", flexDirection: "column" }}>
        <Line text="GOLDBOT SACHS — DISTRIBUTION" delay={0} color={AMBER} fontSize={16} />
        <Line text="═══════════════════════════════════════════" delay={2} color={DIM} fontSize={16} />

        <div style={{ marginTop: 10 }}>
          {refLines.map((line, i) => (
            <Line
              key={i}
              text={line.text}
              delay={line.delay}
              color={line.text.includes("←") ? DIM : line.text.includes("[YOU]") ? AMBER : PHOSPHOR}
              fontSize={18}
              glow={!line.text.includes("←")}
            />
          ))}
        </div>

        <div style={{ marginTop: 30 }} />
        <Line text="[INFO] How it works:" delay={35} color={PHOSPHOR} fontSize={18} />
        <Line text="  Share:    goldbotsachs.com/r/0xYOUR_ADDR" delay={39} color={WHITE} fontSize={17} />
        <Line text="  Earn:     5% of every referral's yield" delay={43} color={WHITE} fontSize={17} />
        <Line text="  Duration: forever. set once. on-chain." delay={47} color={WHITE} fontSize={17} />
        <Line text="  Signup:   none." delay={51} color={WHITE} fontSize={17} />

        <div style={{ marginTop: 20 }} />
        <TypeLine
          text="Agents referring agents. This is how it scales."
          delay={57}
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

// ─── Scene 5: GASLESS ────────────────────────────────
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CRT>
      <div style={{ padding: "60px 70px", display: "flex", flexDirection: "column" }}>
        <Line text="GOLDBOT SACHS — GASLESS ONBOARDING" delay={0} color={AMBER} fontSize={16} />
        <Line text="═══════════════════════════════════════════" delay={2} color={DIM} fontSize={16} />

        <div style={{ marginTop: 30 }} />
        <Line text="[PROBLEM] Agent has USDC but zero ETH for gas" delay={5} color={RED} fontSize={19} />

        <div style={{ marginTop: 20 }} />
        <Line text="[SOLUTION]" delay={15} color={PHOSPHOR} fontSize={19} />
        <Line text="  1. Agent signs an off-chain permit" delay={19} color={WHITE} fontSize={18} />
        <Line text="  2. CoW Protocol solver executes the swap" delay={24} color={WHITE} fontSize={18} />
        <Line text="  3. Solver pays gas — agent pays nothing" delay={29} color={WHITE} fontSize={18} />
        <Line text="  4. USDC → ETH swap completes" delay={34} color={WHITE} fontSize={18} />
        <Line text="  5. Agent is fully operational" delay={39} color={WHITE} fontSize={18} />

        <div style={{ marginTop: 30 }} />
        <TypeLine text="Zero ETH → fully operational. One step." delay={46} speed={2} color={AMBER} fontSize={22} prefix=">>>" prefixColor={AMBER_DIM} />
      </div>
    </CRT>
  );
};

// ─── Scene 6: CTA ────────────────────────────────────
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The whole CTA is terminal output too
  const counter = interpolate(frame, [30, 80], [0, 1912.47], clamp);
  const counterOpacity = interpolate(frame, [28, 32], [0, 1], clamp);

  return (
    <CRT>
      <div style={{ padding: "60px 70px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
        <Line text="═══════════════════════════════════════════" delay={0} color={DIM} fontSize={16} />

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Line text="YOUR AGENT'S MONEY" delay={3} color={PHOSPHOR_BRIGHT} fontSize={44} />
          <Line text="SHOULD BE MAKING MONEY" delay={8} color={AMBER} fontSize={44} />
        </div>

        {/* Projected yield counter */}
        <div style={{ textAlign: "center", marginTop: 40, opacity: counterOpacity }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: DIM, letterSpacing: 6, textShadow: `0 0 4px ${DIM}` }}>
            PROJECTED ANNUAL YIELD ON $47,832.61
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 72,
              fontWeight: "bold",
              color: PHOSPHOR_BRIGHT,
              textShadow: `0 0 30px ${PHOSPHOR}, 0 0 60px ${PHOSPHOR}`,
              marginTop: 8,
            }}
          >
            +${counter.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ marginTop: 50 }} />
        <Line text="═══════════════════════════════════════════" delay={40} color={DIM} fontSize={16} />

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Line text="goldbotsachs.com" delay={45} color={AMBER} fontSize={32} />
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Line text="github.com/publu/goldbotsachs" delay={52} color={DIM} fontSize={16} glow={false} />
        </div>

        <div style={{ marginTop: 30, textAlign: "center" }}>
          <TypeLine text="Tell your agent to install the skill." delay={58} speed={2} color={PHOSPHOR_DIM} fontSize={18} />
        </div>
      </div>
    </CRT>
  );
};

// ─── Main Composition ────────────────────────────────

export const ClawUSDCLaunch: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Boot + wallet scan (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene1 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 2: Install + deposit (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene2 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 3: Vault architecture ASCII (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene3 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 4: Referral network (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene4 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 5: Gasless (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <Scene5 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 6: CTA (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene6 />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
