import "./index.css";
import { AvatarDemoComposition } from "./AvatarDemo";
import { CadernosReelCompositions } from "./reel-cadernos/CadernosReel";
import { CampaignCompositions } from "./Campaigns";
import { FeatureGraphicCompositions } from "./FeatureGraphics";
import { MyComposition } from "./Composition";
import { PixDepoisReelCompositions } from "./PixDepoisReel";
import { PlayStoreComposition } from "./PlayStoreVideo";
import { ReelsCharacterComposition, ReelsComposition } from "./ReelsVideo";
import { StoreScreenshotCompositions } from "./StoreScreenshots";
import { TourComposition } from "./TourVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ReelsCharacterComposition />
      <ReelsComposition />
      <AvatarDemoComposition />
      <MyComposition />
      <CampaignCompositions />
      <FeatureGraphicCompositions />
      <TourComposition />
      <PlayStoreComposition />
      <StoreScreenshotCompositions />
      <PixDepoisReelCompositions />
      <CadernosReelCompositions />
    </>
  );
};
