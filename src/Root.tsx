import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 60+105+165+135+180+105+75+120 = 945
// minus 7 transitions * 8 = 56
// = 889 frames / 30fps = ~30 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={889}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
