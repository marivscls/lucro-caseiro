import type { Caption } from "@remotion/captions";
import { useCallback, useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { MARKETING_COLORS, MARKETING_FONTS } from "./marketing-brand";

const CaptionPage = ({ caption }: { caption: Caption }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 74px 86px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 930,
          padding: "22px 34px 25px",
          borderRadius: 34,
          background: "rgba(36, 24, 30, 0.88)",
          boxShadow: "0 18px 48px rgba(36, 24, 30, 0.24)",
          color: MARKETING_COLORS.lime,
          fontFamily: MARKETING_FONTS.body,
          fontSize: 50,
          fontWeight: 800,
          lineHeight: 1.12,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          opacity: interpolate(frame, [0, 6], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: `0 ${interpolate(frame, [0, 8], [28, 0], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px`,
        }}
      >
        {caption.text}
      </div>
    </AbsoluteFill>
  );
};

export const AvatarDemoCaptions = () => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading avatar captions"));
  const { fps } = useVideoConfig();

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile("avatar-demo-captions.json"));
      if (!response.ok) {
        throw new Error(`Failed to load captions: ${response.status}`);
      }
      setCaptions((await response.json()) as Caption[]);
      continueRender(handle);
    } catch (error) {
      cancelRender(error);
    }
  }, [cancelRender, continueRender, handle]);

  useEffect(() => {
    void fetchCaptions();
  }, [fetchCaptions]);

  if (!captions) {
    return null;
  }

  return (
    <AbsoluteFill>
      {captions.map((caption, index) => {
        const startFrame = Math.round((caption.startMs / 1000) * fps);
        const endFrame = Math.round((caption.endMs / 1000) * fps);
        const durationInFrames = endFrame - startFrame;

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={`${caption.startMs}-${index}`}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <CaptionPage caption={caption} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
