import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 75+180+120+200+180+180+180+165+150+195+180+105 = 1910
// minus 11 transitions * 8 = 88
// = 1822 frames / 30fps = ~60.7 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={1822}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
