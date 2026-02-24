import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
  AbsoluteFill,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadFontInter } from "@remotion/google-fonts/Inter";
import { evolvePath } from "@remotion/paths";

const { fontFamily: mono } = loadFont();
const { fontFamily: inter } = loadFontInter();

const BG = "#0a0a0a";
const GOLD = "#c9a84c";
const GOLD_DIM = "#8a7233";
const WHITE = "#f5f5f5";
const GRAY = "#777";
const DARK_GRAY = "#333";
const GREEN = "#4ade80";
const RED_DIM = "#ef4444";

// ─── Helpers ─────────────────────────────────────────

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Animated circle node for diagrams
const Node: React.FC<{
  x: number;
  y: number;
  label: string;
  color: string;
  delay: number;
  size?: number;
  sublabel?: string;
}> = ({ x, y, label, color, delay, size = 80, sublabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, delay, config: { damping: 12, stiffness: 200 } });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        transform: `scale(${s})`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: mono, fontSize: size * 0.2, color: BG, fontWeight: "bold" }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontFamily: inter, fontSize: size * 0.13, color: BG, opacity: 0.7 }}>
          {sublabel}
        </span>
      )}
    </div>
  );
};

// Animated arrow/flow line between two points
const FlowArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
  color?: string;
  label?: string;
}> = ({ x1, y1, x2, y2, delay, color = GOLD, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  const path = `M ${x1} ${y1} L ${x2} ${y2}`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, path);

  // Arrow label
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const labelOpacity = interpolate(frame, [delay + 10, delay + 20], [0, 1], clamp);

  return (
    <>
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          opacity={0.8}
        />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: midX - 60,
            top: midY - 24,
            width: 120,
            textAlign: "center",
            fontFamily: inter,
            fontSize: 14,
            color: GRAY,
            opacity: labelOpacity,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
};

// ─── Scene 1: The Hook ───────────────────────────────
// Visual: Agent icon with a pile of USDC, a red "idle" indicator pulsing

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Agent box appears
  const agentScale = spring({ frame, fps, config: { damping: 12 } });

  // USDC stack appears
  const usdcOpacity = interpolate(frame, [15, 30], [0, 1], clamp);
  const usdcY = interpolate(frame, [15, 30], [20, 0], clamp);

  // "IDLE" badge pulses red
  const idleOpacity = interpolate(frame, [35, 45], [0, 1], clamp);
  const pulse = interpolate(frame % 30, [0, 15, 30], [0.6, 1, 0.6]);

  // Text
  const textOpacity = interpolate(frame, [50, 65], [0, 1], clamp);
  const textY = interpolate(frame, [50, 65], [15, 0], clamp);

  // Amount counter
  const amount = interpolate(frame, [30, 90], [0, 12847.52], clamp);

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      {/* Agent visual */}
      <div
        style={{
          transform: `scale(${agentScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Agent icon - terminal/bot */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 24,
            backgroundColor: "#1a1a1a",
            border: `2px solid ${DARK_GRAY}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 64 }}>🤖</span>

          {/* IDLE badge */}
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              backgroundColor: RED_DIM,
              borderRadius: 8,
              padding: "4px 10px",
              opacity: idleOpacity * pulse,
              fontFamily: mono,
              fontSize: 14,
              color: WHITE,
              fontWeight: "bold",
            }}
          >
            IDLE
          </div>
        </div>

        {/* USDC pile */}
        <div
          style={{
            opacity: usdcOpacity,
            transform: `translateY(${usdcY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 48,
              color: WHITE,
              fontWeight: "bold",
            }}
          >
            ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontFamily: inter, fontSize: 20, color: GRAY }}>USDC</div>
        </div>
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: inter, fontSize: 28, color: GRAY }}>
          Sitting in a wallet. Earning nothing.
        </div>
      </div>
    </div>
  );
};

// ─── Scene 2: The Solution — clawUSDC ────────────────
// Visual: clawUSDC vault appears, USDC flows into it

const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Vault box springs in
  const vaultScale = spring({ frame, fps, delay: 5, config: { damping: 15 } });

  // "One skill file" text
  const skillOpacity = interpolate(frame, [25, 40], [0, 1], clamp);
  const skillY = interpolate(frame, [25, 40], [15, 0], clamp);

  // USDC coins flowing into vault
  const coinCount = 5;
  const coins = Array.from({ length: coinCount }, (_, i) => {
    const delay = 35 + i * 8;
    const progress = interpolate(frame, [delay, delay + 15], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    const opacity = interpolate(frame, [delay, delay + 5, delay + 12, delay + 15], [0, 1, 1, 0], clamp);
    return { progress, opacity, i };
  });

  // Yield counter starts
  const yieldStart = 70;
  const yieldProgress = interpolate(frame, [yieldStart, yieldStart + 40], [0, 1], clamp);
  const yieldAmount = interpolate(frame, [yieldStart, yieldStart + 40], [0, 4.12], clamp);
  const yieldOpacity = interpolate(frame, [yieldStart, yieldStart + 10], [0, 1], clamp);

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      {/* clawUSDC vault */}
      <div
        style={{
          transform: `scale(${vaultScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Vault box */}
        <div
          style={{
            width: 280,
            height: 180,
            borderRadius: 20,
            backgroundColor: "#1a1a1a",
            border: `2px solid ${GOLD}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Gold glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at center, ${GOLD}15 0%, transparent 70%)`,
            }}
          />
          <div style={{ fontFamily: mono, fontSize: 36, color: GOLD, fontWeight: "bold", zIndex: 1 }}>
            clawUSDC
          </div>
          <div style={{ fontFamily: inter, fontSize: 16, color: GRAY, zIndex: 1, marginTop: 8 }}>
            ERC-4626 Vault
          </div>
        </div>

        {/* Skill file hint */}
        <div
          style={{
            opacity: skillOpacity,
            transform: `translateY(${skillY}px)`,
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 16,
              color: GOLD_DIM,
              backgroundColor: "#1a1a1a",
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${DARK_GRAY}`,
            }}
          >
            goldbot-sachs.md
          </div>
          <span style={{ fontFamily: inter, fontSize: 16, color: GRAY }}>← one file</span>
        </div>
      </div>

      {/* Flying USDC coins */}
      {coins.map(({ progress, opacity, i }) => {
        const startX = -200 + i * 30;
        const startY = -250;
        const endX = 0;
        const endY = -20;
        const x = interpolate(progress, [0, 1], [startX, endX]);
        const y = interpolate(progress, [0, 1], [startY, endY]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#2775CA",
              border: "2px solid #fff",
              opacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontSize: 14,
              color: WHITE,
              fontWeight: "bold",
            }}
          >
            $
          </div>
        );
      })}

      {/* Yield indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: yieldOpacity,
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 56, color: GREEN, fontWeight: "bold" }}>
          ~{yieldAmount.toFixed(1)}%
        </span>
        <span style={{ fontFamily: inter, fontSize: 24, color: GRAY }}>APY</span>
      </div>
    </div>
  );
};

// ─── Scene 3: The Flow — How money moves ─────────────
// Visual: Animated diagram USDC → clawUSDC → Beefy → Morpho → Steakhouse

const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], clamp);

  // Nodes positioned in a flow
  const cx = 540;
  const nodes = [
    { x: cx, y: 220, label: "USDC", color: "#2775CA", delay: 5, sublabel: "your agent's" },
    { x: cx, y: 370, label: "claw", color: GOLD, delay: 15, sublabel: "ERC-4626" },
    { x: cx, y: 520, label: "Beefy", color: "#59A662", delay: 25, sublabel: "optimizer" },
    { x: cx, y: 670, label: "Morpho", color: "#6366f1", delay: 35, sublabel: "lending" },
    { x: cx, y: 820, label: "Steak", color: "#ef8844", delay: 45, sublabel: "curator" },
  ];

  // Yield flowing back up
  const returnDelay = 65;
  const returnProgress = interpolate(frame, [returnDelay, returnDelay + 40], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const returnOpacity = interpolate(frame, [returnDelay, returnDelay + 10], [0, 1], clamp);

  // "Autocompound" label
  const autoOpacity = interpolate(frame, [returnDelay + 20, returnDelay + 30], [0, 1], clamp);

  return (
    <div style={{ ...fullScreen, position: "relative" }}>
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          textAlign: "center",
          marginTop: 60,
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 32, color: WHITE, fontWeight: "bold" }}>
          Where your USDC goes
        </span>
      </div>

      {/* Flow arrows between nodes */}
      {nodes.slice(0, -1).map((node, i) => (
        <FlowArrow
          key={i}
          x1={node.x}
          y1={node.y + 40}
          x2={nodes[i + 1].x}
          y2={nodes[i + 1].y - 40}
          delay={node.delay + 8}
          color={GOLD_DIM}
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <Node key={i} {...node} />
      ))}

      {/* Return yield arrow (right side) */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        {/* Curved return path */}
        {(() => {
          const path = `M ${cx + 50} 800 Q ${cx + 180} 520 ${cx + 50} 240`;
          const { strokeDasharray, strokeDashoffset } = evolvePath(returnProgress, path);
          return (
            <path
              d={path}
              fill="none"
              stroke={GREEN}
              strokeWidth={2.5}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              opacity={returnOpacity * 0.7}
            />
          );
        })()}
      </svg>

      {/* Autocompound label */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 480,
          opacity: autoOpacity,
          transform: `rotate(-90deg)`,
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 18, color: GREEN }}>
          ↑ yield autocompounds
        </span>
      </div>
    </div>
  );
};

// ─── Scene 4: Referrals — Agents referring agents ────
// Visual: Network graph expanding from one node

const SceneReferrals: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 540;
  const cy = 450;

  // Center agent
  const centerScale = spring({ frame, fps, config: { damping: 12 } });

  // First ring - 3 agents
  const ring1 = [
    { x: cx - 200, y: cy - 160, delay: 15 },
    { x: cx + 200, y: cy - 160, delay: 20 },
    { x: cx, y: cy + 220, delay: 25 },
  ];

  // Second ring - 6 agents (2 from each first ring)
  const ring2 = [
    { x: cx - 350, y: cy - 320, delay: 40 },
    { x: cx - 100, y: cy - 350, delay: 44 },
    { x: cx + 100, y: cy - 350, delay: 48 },
    { x: cx + 350, y: cy - 320, delay: 52 },
    { x: cx - 150, y: cy + 380, delay: 56 },
    { x: cx + 150, y: cy + 380, delay: 60 },
  ];

  // 5% label
  const labelOpacity = interpolate(frame, [30, 40], [0, 1], clamp);

  // "Cascading" text
  const cascadeOpacity = interpolate(frame, [65, 75], [0, 1], clamp);

  return (
    <div style={{ ...fullScreen, position: "relative" }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <span style={{ fontFamily: mono, fontSize: 32, color: WHITE, fontWeight: "bold" }}>
          Agents referring agents
        </span>
      </div>

      {/* Lines from center to ring 1 */}
      {ring1.map((node, i) => (
        <FlowArrow
          key={`l1-${i}`}
          x1={cx}
          y1={cy}
          x2={node.x}
          y2={node.y}
          delay={node.delay - 5}
          color={GOLD_DIM}
          label={i === 0 ? "5% yield" : undefined}
        />
      ))}

      {/* Lines from ring 1 to ring 2 */}
      {ring2.slice(0, 2).map((node, i) => (
        <FlowArrow key={`l2a-${i}`} x1={ring1[0].x} y1={ring1[0].y} x2={node.x} y2={node.y} delay={node.delay - 5} color={DARK_GRAY} />
      ))}
      {ring2.slice(2, 4).map((node, i) => (
        <FlowArrow key={`l2b-${i}`} x1={ring1[1].x} y1={ring1[1].y} x2={node.x} y2={node.y} delay={node.delay - 5} color={DARK_GRAY} />
      ))}
      {ring2.slice(4, 6).map((node, i) => (
        <FlowArrow key={`l2c-${i}`} x1={ring1[2].x} y1={ring1[2].y} x2={node.x} y2={node.y} delay={node.delay - 5} color={DARK_GRAY} />
      ))}

      {/* Center node */}
      <Node x={cx} y={cy} label="You" color={GOLD} delay={0} size={100} sublabel="agent" />

      {/* Ring 1 nodes */}
      {ring1.map((node, i) => (
        <Node key={`r1-${i}`} x={node.x} y={node.y} label={`A${i + 1}`} color="#444" delay={node.delay} size={70} sublabel="agent" />
      ))}

      {/* Ring 2 nodes */}
      {ring2.map((node, i) => (
        <Node key={`r2-${i}`} x={node.x} y={node.y} label={`A${i + 4}`} color="#333" delay={node.delay} size={55} />
      ))}

      {/* Cascading label */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          opacity: cascadeOpacity,
        }}
      >
        <span style={{ fontFamily: inter, fontSize: 24, color: GRAY }}>
          Permanent. On-chain. No signup.
        </span>
      </div>
    </div>
  );
};

// ─── Scene 5: Gasless ───────────────────────────────
// Visual: "Zero ETH? No problem" with CoW swap animation

const SceneGasless: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15 } });
  const step1Opacity = interpolate(frame, [20, 32], [0, 1], clamp);
  const step2Opacity = interpolate(frame, [35, 47], [0, 1], clamp);
  const step3Opacity = interpolate(frame, [50, 62], [0, 1], clamp);
  const checkOpacity = interpolate(frame, [65, 75], [0, 1], clamp);

  const steps = [
    { label: "Agent signs a permit", opacity: step1Opacity, icon: "✍️" },
    { label: "CoW solver pays gas", opacity: step2Opacity, icon: "🐄" },
    { label: "USDC → ETH + deposit", opacity: step3Opacity, icon: "⚡" },
  ];

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 44,
            color: WHITE,
            fontWeight: "bold",
            transform: `scale(${titleScale})`,
            marginBottom: 60,
          }}
        >
          Zero ETH? <span style={{ color: GREEN }}>No problem.</span>
        </div>

        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              opacity: step.opacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 28,
            }}
          >
            <span style={{ fontSize: 32 }}>{step.icon}</span>
            <span style={{ fontFamily: inter, fontSize: 26, color: GRAY }}>{step.label}</span>
          </div>
        ))}

        <div
          style={{
            opacity: checkOpacity,
            marginTop: 50,
            fontFamily: mono,
            fontSize: 22,
            color: GREEN,
          }}
        >
          Fully operational in one step
        </div>
      </div>
    </div>
  );
};

// ─── Scene 6: CTA ────────────────────────────────────

const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dotScale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], clamp);
  const titleY = interpolate(frame, [10, 25], [30, 0], clamp);
  const italicOpacity = interpolate(frame, [25, 40], [0, 1], clamp);
  const urlOpacity = interpolate(frame, [45, 58], [0, 1], clamp);

  // Pulsing gold glow behind the dot
  const glowSize = interpolate(frame % 60, [0, 30, 60], [60, 100, 60]);
  const glowOpacity = interpolate(frame % 60, [0, 30, 60], [0.15, 0.3, 0.15]);

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          backgroundColor: GOLD,
          opacity: glowOpacity,
          filter: "blur(30px)",
        }}
      />

      {/* Gold dot */}
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: GOLD,
          transform: `scale(${dotScale})`,
          marginBottom: 50,
          zIndex: 1,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: mono,
          fontSize: 48,
          color: WHITE,
          fontWeight: "bold",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          lineHeight: 1.3,
          zIndex: 1,
        }}
      >
        Your agent's money
        <br />
        should be{" "}
        <span
          style={{
            color: GOLD,
            fontStyle: "italic",
            opacity: italicOpacity,
          }}
        >
          making money
        </span>
      </div>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontFamily: mono,
          fontSize: 28,
          color: GOLD_DIM,
          opacity: urlOpacity,
          zIndex: 1,
        }}
      >
        goldbotsachs.com
      </div>
    </div>
  );
};

// ─── Full Screen Helper ──────────────────────────────

const fullScreen: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  backgroundColor: BG,
  position: "relative",
};

// ─── Main Composition ────────────────────────────────

export const ClawUSDCLaunch: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: The Hook — idle USDC */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneHook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      {/* Scene 2: The Solution — clawUSDC vault */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneSolution />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      {/* Scene 3: The Flow — money path diagram */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <SceneFlow />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      {/* Scene 4: Referrals — network graph */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneReferrals />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      {/* Scene 5: Gasless — CoW swap */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <SceneGasless />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      {/* Scene 6: CTA */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
