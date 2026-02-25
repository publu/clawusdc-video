import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 75+180+120+200+180+180+180+165+150+195+120 = 1745
// minus 10 transitions * 8 = 80
// = 1665 frames / 30fps = ~55.5 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={1665}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
