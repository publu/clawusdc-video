import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 90+120+90+90+75+90 = 555 minus 5*4 = 20 = 535 frames
// 535 / 30fps = ~17.8 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={535}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
