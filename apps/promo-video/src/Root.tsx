import "./index.css";
import { CampaignCompositions } from "./Campaigns";
import { FeatureGraphicCompositions } from "./FeatureGraphics";
import { MyComposition } from "./Composition";
import { PlayStoreComposition } from "./PlayStoreVideo";
import { StoreScreenshotCompositions } from "./StoreScreenshots";
import { TourComposition } from "./TourVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <CampaignCompositions />
      <FeatureGraphicCompositions />
      <TourComposition />
      <PlayStoreComposition />
      <StoreScreenshotCompositions />
    </>
  );
};
