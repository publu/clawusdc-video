import { Composition } from "remotion";
import { ClawUSDCLaunch } from "./ClawUSDCLaunch";

// 60+120+110+165+135+130+110+165+100 = 1095
// minus 8 transitions * 8 = 64
// = 1031 frames / 30fps = ~34.4 seconds
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawUSDCLaunch"
        component={ClawUSDCLaunch}
        durationInFrames={1031}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
