import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
  Sequence,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadFontInter } from "@remotion/google-fonts/Inter";

const { fontFamily: mono } = loadFont();
const { fontFamily: inter } = loadFontInter();

const BG = "#09090b";
const GOLD = "#d4a843";
const GOLD_BRIGHT = "#f0d060";
const WHITE = "#e4e4e7";
const DIM = "#52525b";
const GREEN = "#22c55e";
const RED = "#ef4444";
const BLUE = "#3b82f6";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ─── Scan line overlay ───────────────────────────────
const ScanLines: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      pointerEvents: "none",
      zIndex: 100,
    }}
  />
);

// ─── Noise grain overlay ─────────────────────────────
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  // Shift background position each frame for flickering grain
  const x = (frame * 73) % 200;
  const y = (frame * 37) % 200;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundPosition: `${x}px ${y}px`,
        pointerEvents: "none",
        zIndex: 101,
      }}
    />
  );
};

// ─── Glitch text effect ──────────────────────────────
const GlitchText: React.FC<{
  text: string;
  fontSize: number;
  color: string;
  delay: number;
  bold?: boolean;
}> = ({ text, fontSize, color, delay, bold = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = interpolate(frame, [delay, delay + 2], [0, 1], clamp);

  // Glitch flicker in first few frames
  const glitchActive = frame >= delay && frame < delay + 8;
  const glitchOffset = glitchActive ? Math.sin(frame * 47) * 3 : 0;
  const glitchOpacity = glitchActive ? (frame % 2 === 0 ? 1 : 0.7) : 1;

  // RGB split during glitch
  const rgbSplit = glitchActive ? 2 : 0;

  return (
    <div style={{ position: "relative", opacity: appear }}>
      {/* Red channel offset */}
      {rgbSplit > 0 && (
        <div
          style={{
            position: "absolute",
            fontFamily: mono,
            fontSize,
            fontWeight: bold ? "bold" : "normal",
            color: "rgba(255,0,0,0.3)",
            transform: `translate(${rgbSplit}px, -${rgbSplit}px)`,
            whiteSpace: "pre",
          }}
        >
          {text}
        </div>
      )}
      {/* Blue channel offset */}
      {rgbSplit > 0 && (
        <div
          style={{
            position: "absolute",
            fontFamily: mono,
            fontSize,
            fontWeight: bold ? "bold" : "normal",
            color: "rgba(0,0,255,0.3)",
            transform: `translate(-${rgbSplit}px, ${rgbSplit}px)`,
            whiteSpace: "pre",
          }}
        >
          {text}
        </div>
      )}
      {/* Main text */}
      <div
        style={{
          fontFamily: mono,
          fontSize,
          fontWeight: bold ? "bold" : "normal",
          color,
          opacity: glitchOpacity,
          transform: `translateX(${glitchOffset}px)`,
          whiteSpace: "pre",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ─── Terminal typing effect ──────────────────────────
const TerminalLine: React.FC<{
  prefix?: string;
  text: string;
  delay: number;
  speed?: number;
  color?: string;
  prefixColor?: string;
}> = ({ prefix = "$", text, delay, speed = 1.5, color = WHITE, prefixColor = GREEN }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineOpacity = interpolate(frame, [delay, delay + 1], [0, 1], clamp);
  const charsVisible = Math.floor(
    interpolate(frame, [delay, delay + text.length / speed], [0, text.length], clamp)
  );
  const showCursor = frame >= delay && frame < delay + text.length / speed + 15;
  const cursorBlink = Math.floor(frame / 8) % 2 === 0;

  return (
    <div style={{ opacity: lineOpacity, display: "flex", gap: 8, fontFamily: mono, fontSize: 22 }}>
      <span style={{ color: prefixColor }}>{prefix}</span>
      <span style={{ color }}>{text.slice(0, charsVisible)}</span>
      {showCursor && cursorBlink && <span style={{ color: GOLD }}>_</span>}
    </div>
  );
};

// ─── Particle flow ───────────────────────────────────
const ParticleFlow: React.FC<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  count: number;
  delay: number;
  duration: number;
  color?: string;
}> = ({ startX, startY, endX, endY, count, delay, duration, color = GOLD }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const particleDelay = delay + (i * duration) / count;
        const progress = interpolate(
          frame,
          [particleDelay, particleDelay + duration * 0.6],
          [0, 1],
          { ...clamp, easing: Easing.inOut(Easing.quad) }
        );
        const opacity = interpolate(
          frame,
          [particleDelay, particleDelay + 5, particleDelay + duration * 0.5, particleDelay + duration * 0.6],
          [0, 0.8, 0.8, 0],
          clamp
        );
        // Add slight randomness to path
        const wobble = Math.sin(i * 2.7 + frame * 0.1) * 15;
        const x = interpolate(progress, [0, 1], [startX, endX]) + wobble;
        const y = interpolate(progress, [0, 1], [startY, endY]);
        const size = 4 + (i % 3) * 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};

// ─── Scene 1: "Your agent is broke" ──────────────────
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hard flash in
  const flash = interpolate(frame, [0, 3], [1, 0], clamp);

  // Balance counter ticking up then stopping
  const balance = interpolate(frame, [8, 30], [0, 47832.61], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  const balanceOpacity = interpolate(frame, [5, 8], [0, 1], clamp);
  const zeroOpacity = interpolate(frame, [40, 43], [0, 1], clamp);
  const earning = interpolate(frame, [40, 42], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ScanLines />
      <Grain />
      {/* White flash */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: WHITE, opacity: flash, zIndex: 50 }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20 }}>
        {/* Balance */}
        <div style={{ opacity: balanceOpacity, textAlign: "center" }}>
          <div style={{ fontFamily: mono, fontSize: 18, color: DIM, marginBottom: 12, letterSpacing: 4, textTransform: "uppercase" }}>
            Agent Wallet
          </div>
          <div style={{ fontFamily: mono, fontSize: 80, color: WHITE, fontWeight: "bold", letterSpacing: -2 }}>
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontFamily: mono, fontSize: 24, color: DIM, marginTop: 8 }}>USDC</div>
        </div>

        {/* Earning: $0.00 */}
        <div style={{ opacity: zeroOpacity, textAlign: "center", marginTop: 30 }}>
          <div style={{ fontFamily: mono, fontSize: 18, color: DIM, letterSpacing: 4, textTransform: "uppercase" }}>
            Earning
          </div>
          <div style={{ fontFamily: mono, fontSize: 56, color: RED, fontWeight: "bold" }}>
            $0.00
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: "Fix that." + Terminal install ─────────
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ScanLines />
      <Grain />

      <div style={{ padding: 80, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
        {/* Terminal window */}
        <div
          style={{
            backgroundColor: "#111113",
            borderRadius: 12,
            border: `1px solid #27272a`,
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: "1px solid #27272a" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#eab308" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e" }} />
            <span style={{ fontFamily: mono, fontSize: 13, color: DIM, marginLeft: 12 }}>agent-terminal</span>
          </div>

          {/* Terminal content */}
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
            <TerminalLine
              prefix="$"
              text="curl -O goldbotsachs.com/skills/goldbot-sachs.md"
              delay={5}
              speed={2}
            />
            <TerminalLine
              prefix=">"
              text="Skill installed: goldbot-sachs"
              delay={35}
              speed={3}
              color={GREEN}
              prefixColor={GREEN}
            />
            <TerminalLine
              prefix="$"
              text="agent deposit --amount 47832.61 --asset USDC"
              delay={50}
              speed={2}
            />
            <TerminalLine
              prefix=">"
              text="tx: 0x8f3a...c4d1  ✓  deposited into clawUSDC"
              delay={80}
              speed={2.5}
              color={GOLD}
              prefixColor={GREEN}
            />
            <TerminalLine
              prefix=">"
              text="earning ~4.1% APY via Beefy → Morpho → Steakhouse"
              delay={100}
              speed={2}
              color={DIM}
              prefixColor={GREEN}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Vault flow — particles ─────────────────
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Node positions (vertical stack, centered)
  const cx = 540;
  const nodes = [
    { y: 180, label: "USDC", sub: "your agent", color: BLUE },
    { y: 340, label: "clawUSDC", sub: "ERC-4626", color: GOLD },
    { y: 500, label: "Beefy", sub: "optimizer", color: "#59A662" },
    { y: 660, label: "Morpho", sub: "lending", color: "#818cf8" },
    { y: 820, label: "Steakhouse", sub: "curator", color: "#f97316" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ScanLines />
      <Grain />

      {/* Title */}
      <GlitchText text="Where your USDC goes" fontSize={32} color={WHITE} delay={0} />
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center" }}>
        <GlitchText text="Where your money goes" fontSize={34} color={WHITE} delay={0} />
      </div>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const nodeDelay = 5 + i * 10;
        const s = spring({ frame, fps, delay: nodeDelay, config: { damping: 200 } });
        const opacity = interpolate(frame, [nodeDelay, nodeDelay + 5], [0, 1], clamp);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - 100,
              top: node.y - 28,
              width: 200,
              opacity,
              transform: `scale(${s})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Horizontal line accent */}
            <div style={{ width: 40, height: 2, backgroundColor: node.color, marginBottom: 8, opacity: 0.6 }} />
            <div style={{ fontFamily: mono, fontSize: 22, color: node.color, fontWeight: "bold" }}>
              {node.label}
            </div>
            <div style={{ fontFamily: mono, fontSize: 14, color: DIM, marginTop: 4 }}>
              {node.sub}
            </div>
          </div>
        );
      })}

      {/* Particle flows between nodes */}
      {nodes.slice(0, -1).map((node, i) => (
        <ParticleFlow
          key={i}
          startX={cx - 2}
          startY={node.y + 20}
          endX={cx - 2}
          endY={nodes[i + 1].y - 35}
          count={6}
          delay={15 + i * 10}
          duration={30}
          color={GOLD}
        />
      ))}

      {/* Return yield — particles going back up on the right side */}
      <ParticleFlow
        startX={cx + 120}
        startY={800}
        endX={cx + 120}
        endY={200}
        count={8}
        delay={60}
        duration={40}
        color={GREEN}
      />

      {/* Autocompound label */}
      {(() => {
        const opacity = interpolate(frame, [70, 78], [0, 1], clamp);
        return (
          <div
            style={{
              position: "absolute",
              right: 80,
              top: 490,
              opacity,
              fontFamily: mono,
              fontSize: 16,
              color: GREEN,
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            autocompound
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

// ─── Scene 4: Referrals — fast, punchy ───────────────
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Lines appear fast
  const lines = [
    { text: "Share your link", value: "goldbotsachs.com/r/0x...", delay: 0 },
    { text: "Earn", value: "5% of referrals' yield", delay: 15 },
    { text: "On-chain", value: "permanent, no signup", delay: 30 },
    { text: "Cascading", value: "agents refer agents", delay: 45 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ScanLines />
      <Grain />

      <div style={{ padding: 80, display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", gap: 40 }}>
        <GlitchText text="Referrals" fontSize={48} color={GOLD} delay={0} />

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 32 }}>
          {lines.map((line, i) => {
            const opacity = interpolate(frame, [line.delay + 5, line.delay + 8], [0, 1], clamp);
            const x = interpolate(frame, [line.delay + 5, line.delay + 10], [40, 0], {
              ...clamp,
              easing: Easing.out(Easing.quad),
            });

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 20,
                }}
              >
                <div style={{ fontFamily: mono, fontSize: 22, color: GOLD, fontWeight: "bold", minWidth: 180 }}>
                  {line.text}
                </div>
                <div style={{ fontFamily: mono, fontSize: 20, color: DIM }}>
                  {line.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Network visualization — simple expanding dots */}
        {(() => {
          const netOpacity = interpolate(frame, [55, 62], [0, 1], clamp);
          const dots = Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const radius = interpolate(frame, [55, 80], [0, 160], {
              ...clamp,
              easing: Easing.out(Easing.quad),
            });
            const dotOpacity = interpolate(frame, [55 + i * 2, 58 + i * 2], [0, 1], clamp);
            return {
              x: 780 + Math.cos(angle) * radius,
              y: 540 + Math.sin(angle) * radius,
              opacity: dotOpacity,
            };
          });

          return (
            <div style={{ position: "absolute", inset: 0, opacity: netOpacity }}>
              {/* Center dot */}
              <div
                style={{
                  position: "absolute",
                  left: 774,
                  top: 534,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: GOLD,
                  boxShadow: `0 0 20px ${GOLD}`,
                }}
              />
              {/* Expanding dots */}
              {dots.map((dot, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: dot.x,
                    top: dot.y,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: DIM,
                    opacity: dot.opacity,
                  }}
                />
              ))}
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: CTA ────────────────────────────────────
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gold glow pulse
  const glowSize = interpolate(frame % 45, [0, 22, 45], [80, 160, 80]);
  const glowOpacity = interpolate(frame % 45, [0, 22, 45], [0.1, 0.25, 0.1]);

  const titleDelay = 5;
  const urlDelay = 40;
  const tagDelay = 55;

  const urlOpacity = interpolate(frame, [urlDelay, urlDelay + 8], [0, 1], clamp);
  const tagOpacity = interpolate(frame, [tagDelay, tagDelay + 8], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ScanLines />
      <Grain />

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          backgroundColor: GOLD,
          opacity: glowOpacity,
          filter: "blur(40px)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, zIndex: 1 }}>
        <GlitchText text="Your agent's money" fontSize={46} color={WHITE} delay={titleDelay} />
        <GlitchText text="should be making money." fontSize={46} color={GOLD} delay={titleDelay + 8} />

        <div style={{ marginTop: 50, opacity: urlOpacity }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 30,
              color: GOLD,
              letterSpacing: 1,
              padding: "12px 28px",
              border: `1px solid ${GOLD}40`,
              borderRadius: 8,
            }}
          >
            goldbotsachs.com
          </div>
        </div>

        <div style={{ opacity: tagOpacity, marginTop: 24 }}>
          <span style={{ fontFamily: mono, fontSize: 16, color: DIM, letterSpacing: 3, textTransform: "uppercase" }}>
            Yield for AI agents
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────

export const ClawUSDCLaunch: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: The hook — your agent is broke (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <Scene1 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 6 })}
      />

      {/* Scene 2: Terminal install + deposit (4s) */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene2 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: 6 })}
      />

      {/* Scene 3: Vault flow with particles (3.5s) */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene3 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 6 })}
      />

      {/* Scene 4: Referrals (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene4 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: 6 })}
      />

      {/* Scene 5: CTA (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <Scene5 />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
