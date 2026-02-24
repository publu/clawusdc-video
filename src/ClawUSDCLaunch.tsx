import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadFontInter } from "@remotion/google-fonts/Inter";

const { fontFamily: mono } = loadFont();
const { fontFamily: inter } = loadFontInter();

const BG = "#0a0a0a";
const GOLD = "#c9a84c";
const GOLD_DIM = "#8a7233";
const WHITE = "#f5f5f5";
const GRAY = "#888888";

// Scene 1: Logo reveal
const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dotScale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [15, 35], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      {/* Gold dot */}
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: GOLD,
          transform: `scale(${dotScale})`,
          marginBottom: 40,
        }}
      />
      {/* Title */}
      <div
        style={{
          fontFamily: mono,
          fontSize: 72,
          color: WHITE,
          fontWeight: "bold",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          letterSpacing: -2,
        }}
      >
        Goldbot Sachs
      </div>
      {/* Subtitle */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 26,
          color: GRAY,
          opacity: subtitleOpacity,
          marginTop: 20,
        }}
      >
        Yield for AI agents
      </div>
    </div>
  );
};

// Scene 2: The problem
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Opacity = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Y = interpolate(frame, [20, 35], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strikeWidth = interpolate(frame, [45, 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: inter,
            fontSize: 36,
            color: GRAY,
            opacity: line1Opacity,
            marginBottom: 30,
          }}
        >
          Your agent has USDC
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 56,
              color: WHITE,
              fontWeight: "bold",
              opacity: line2Opacity,
              transform: `translateY(${line2Y}px)`,
            }}
          >
            Sitting there. Doing nothing.
          </div>
          {/* Strike through */}
          <div
            style={{
              position: "absolute",
              top: "55%",
              left: 0,
              height: 4,
              backgroundColor: GOLD,
              width: `${strikeWidth}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Scene 3: The solution
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const revealProgress = spring({ frame, fps, config: { damping: 200 } });
  const subOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const items = [
    { icon: "→", label: "Deposit USDC", delay: 30 },
    { icon: "→", label: "Earn ~4% APY", delay: 45 },
    { icon: "→", label: "Withdraw anytime", delay: 60 },
  ];

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 48,
            color: GOLD,
            fontWeight: "bold",
            opacity: revealProgress,
            transform: `scale(${interpolate(revealProgress, [0, 1], [0.8, 1])})`,
          }}
        >
          clawUSDC
        </div>
        <div
          style={{
            fontFamily: inter,
            fontSize: 24,
            color: GRAY,
            opacity: subOpacity,
            marginTop: 16,
            marginBottom: 50,
          }}
        >
          One ERC-4626 vault on Base
        </div>
        {items.map((item, i) => {
          const itemOpacity = interpolate(frame, [item.delay, item.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const itemX = interpolate(frame, [item.delay, item.delay + 12], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                fontFamily: inter,
                fontSize: 32,
                color: WHITE,
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <span style={{ color: GOLD }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 4: Referrals
const SceneReferrals: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line1Opacity = interpolate(frame, [15, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Opacity = interpolate(frame, [28, 41], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3Opacity = interpolate(frame, [41, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 44,
            color: WHITE,
            fontWeight: "bold",
            opacity: titleOpacity,
            marginBottom: 50,
          }}
        >
          Agents referring agents
        </div>
        {[
          { text: "On-chain referrals", opacity: line1Opacity },
          { text: "5% of your referrals' yield", opacity: line2Opacity },
          { text: "Permanent. No signup.", opacity: line3Opacity },
        ].map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: inter,
              fontSize: 28,
              color: GRAY,
              opacity: line.opacity,
              marginTop: 20,
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
};

// Scene 5: CTA
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulsing dot
  const pulse = interpolate(frame % 60, [0, 30, 60], [1, 1.3, 1]);

  return (
    <div style={{ ...fullScreen, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: GOLD,
            margin: "0 auto",
            marginBottom: 40,
            transform: `scale(${pulse})`,
          }}
        />
        <div
          style={{
            fontFamily: mono,
            fontSize: 52,
            color: WHITE,
            fontWeight: "bold",
            transform: `scale(${scale})`,
          }}
        >
          Your money should be
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 52,
            color: GOLD,
            fontWeight: "bold",
            fontStyle: "italic",
            transform: `scale(${scale})`,
          }}
        >
          making money
        </div>
        <div
          style={{
            fontFamily: inter,
            fontSize: 28,
            color: GRAY,
            opacity: taglineOpacity,
            marginTop: 30,
          }}
        >
          Idle USDC is dead money
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 24,
            color: GOLD_DIM,
            opacity: urlOpacity,
            marginTop: 40,
          }}
        >
          goldbotsachs.com
        </div>
      </div>
    </div>
  );
};

const fullScreen: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  backgroundColor: BG,
  padding: 80,
};

export const ClawUSDCLaunch: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <SceneLogo />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={90}>
        <SceneProblem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneSolution />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={90}>
        <SceneReferrals />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
