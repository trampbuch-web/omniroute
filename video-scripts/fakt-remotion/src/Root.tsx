import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Fakt } from "./Fakt";
import { Data } from "./lib";

type Props = { slug: string; data?: Data };

const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const data: Data = await (await fetch(staticFile(`${props.slug}/data.json`))).json();
  return { durationInFrames: data.durationInFrames, fps: data.fps, props: { ...props, data } };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Fakt"
    component={Fakt as any}
    durationInFrames={1800}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ slug: "kprf" } as Props}
    calculateMetadata={calculateMetadata}
  />
);
