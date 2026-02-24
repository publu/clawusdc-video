import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 75+120+105+90+75 = 465 minus 4*6 = 24 transitions = 441 frames
// 441 / 30fps = 14.7 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={441}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
