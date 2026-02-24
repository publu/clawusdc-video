import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 75+120+150+120+120+120+150+120+135+90+120 = 1320
// minus 10 transitions * 8 = 80
// = 1240 frames / 30fps = ~41 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={1240}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
