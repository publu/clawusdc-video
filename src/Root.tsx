import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// Total: 105+120+120+105+90+105 = 645 frames minus 5 transitions * 12 = 60
// = 585 frames at 30fps ≈ 19.5 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={585}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
