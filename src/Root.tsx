import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 105+105+150+90+150+150+120+90+120 = 1080 minus 8*4=32 = 1048 frames
// 1048 / 30fps = ~35 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={1048}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
