import {Video} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {AbsoluteFill, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";

const enter = (frame: number, delay = 0) => interpolate(frame, [delay, delay + 18], [0, 1], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"});

const Background = () => <AbsoluteFill style={{background: "#fff8f4", overflow: "hidden"}}><div style={{position: "absolute", width: 720, height: 720, borderRadius: "50%", background: "#f3deda", right: -330, top: -380}} /><div style={{position: "absolute", width: 560, height: 560, borderRadius: "50%", border: "75px solid #f3deda", left: -310, bottom: -340}} /></AbsoluteFill>;

const Intro = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><Background /><AbsoluteFill style={{padding: "180px 80px", justifyContent: "center", alignItems: "center", gap: 48}}><Img src={staticFile("icon.png")} style={{width: 380, height: 380, borderRadius: 95, boxShadow: "0 35px 80px rgba(75,45,35,.2)", opacity: enter(frame), scale: interpolate(enter(frame), [0, 1], [0.75, 1])}} /><div style={{color: "#a9465c", fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 31, letterSpacing: 4.5, textTransform: "uppercase", opacity: enter(frame, 6)}}>Navegação real no aplicativo</div><div style={{color: "#45281f", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 100, lineHeight: 0.98, letterSpacing: -3, textAlign: "center", opacity: enter(frame, 10)}}>Veja como é simples organizar seu negócio</div></AbsoluteFill></AbsoluteFill>;
};

const AppTour = () => {
  const frame = useCurrentFrame();
  const phoneIn = enter(frame);
  return <AbsoluteFill><Background /><AbsoluteFill style={{padding: "85px 70px 70px", alignItems: "center", gap: 28}}><div style={{color: "#a9465c", fontFamily: "Arial, sans-serif", fontSize: 31, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", opacity: phoneIn}}>O Lucro Caseiro em ação</div><div style={{color: "#45281f", fontFamily: "Georgia, serif", fontSize: 70, fontWeight: 700, textAlign: "center", lineHeight: 1}}>Tudo em um só lugar</div><div style={{width: 750, height: 1665, borderRadius: 76, background: "#211916", padding: 15, overflow: "hidden", boxShadow: "0 42px 95px rgba(69,40,31,.28)", opacity: phoneIn, translate: `0px ${interpolate(phoneIn, [0, 1], [90, 0])}px`}}><Video src={staticFile("lucro-tour.mp4")} trimBefore={60} playbackRate={2.3} muted style={{width: "100%", height: "100%", borderRadius: 60}} objectFit="cover" /></div></AbsoluteFill></AbsoluteFill>;
};

const Close = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: "#45281f"}}><AbsoluteFill style={{padding: "180px 80px", justifyContent: "center", alignItems: "center", gap: 46}}><Img src={staticFile("icon.png")} style={{width: 340, height: 340, borderRadius: 86, opacity: enter(frame), scale: interpolate(enter(frame), [0, 1], [0.72, 1])}} /><div style={{color: "white", fontFamily: "Georgia, serif", fontSize: 98, fontWeight: 700, lineHeight: 1, textAlign: "center", opacity: enter(frame, 6)}}>Experimente no seu negócio</div><div style={{color: "white", background: "#cb6f82", padding: "30px 62px", borderRadius: 999, fontFamily: "Arial, sans-serif", fontSize: 42, fontWeight: 900, opacity: enter(frame, 16), scale: interpolate(enter(frame, 16), [0, 1], [0.84, 1])}}>Baixe grátis no Android</div></AbsoluteFill></AbsoluteFill>;
};

const transition = linearTiming({durationInFrames: 10});

export const ScreenTour = () => <TransitionSeries><TransitionSeries.Sequence durationInFrames={70}><Intro /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={transition} /><TransitionSeries.Sequence durationInFrames={480}><AppTour /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={transition} /><TransitionSeries.Sequence durationInFrames={70}><Close /></TransitionSeries.Sequence></TransitionSeries>;

export const TourComposition = () => <Composition id="LucroCaseiroTourReal" component={ScreenTour} durationInFrames={600} fps={30} width={1080} height={1920} />;
