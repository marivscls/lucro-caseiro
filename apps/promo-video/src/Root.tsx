import "./index.css";
import { CampaignCompositions } from "./Campaigns";
import { MyComposition } from "./Composition";
import { TourComposition } from "./TourVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <CampaignCompositions />
      <TourComposition />
    </>
  );
};
