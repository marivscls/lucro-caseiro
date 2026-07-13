import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const C = {
  cream: "#fff9f5",
  brown: "#45281f",
  rose: "#cb6f82",
  roseDark: "#a9465c",
  blush: "#f6dfdc",
  green: "#58b78e",
  gold: "#d9a443",
  white: "#ffffff",
};

const ease = {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};
const appear = (frame: number, start = 0, duration = 16) => interpolate(frame, [start, start + duration], [0, 1], ease);

const SoftBackground = ({dark = false}: {dark?: boolean}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: dark ? C.brown : C.cream, overflow: "hidden"}}>
      <div style={{position: "absolute", width: 760, height: 760, borderRadius: "50%", background: dark ? "#5c382d" : C.blush, top: -380, right: -320, translate: `${interpolate(frame, [0, 110], [0, -55])}px ${interpolate(frame, [0, 110], [0, 70])}px`}} />
      <div style={{position: "absolute", width: 560, height: 560, borderRadius: "50%", border: `75px solid ${dark ? "#5c382d" : C.blush}`, bottom: -330, left: -290, translate: `${interpolate(frame, [0, 110], [0, 55])}px 0px`}} />
    </AbsoluteFill>
  );
};

const Kicker = ({children, light = false}: {children: React.ReactNode; light?: boolean}) => {
  const frame = useCurrentFrame();
  return <div style={{opacity: appear(frame), translate: `${interpolate(appear(frame), [0, 1], [-45, 0])}px 0px`, color: light ? "#f2b3bf" : C.roseDark, fontFamily: "Arial, sans-serif", fontSize: 31, fontWeight: 900, letterSpacing: 4.5, textTransform: "uppercase", textAlign: "center"}}>{children}</div>;
};

const Headline = ({children, light = false, size = 88}: {children: React.ReactNode; light?: boolean; size?: number}) => {
  const frame = useCurrentFrame();
  return <div style={{opacity: appear(frame, 3), scale: interpolate(appear(frame, 3), [0, 1], [0.93, 1]), color: light ? C.white : C.brown, fontFamily: "Georgia, serif", fontSize: size, fontWeight: 700, lineHeight: 0.98, letterSpacing: -2.5, textAlign: "center"}}>{children}</div>;
};

const Phone = ({src, crop = "top"}: {src: string; crop?: "top" | "center"}) => {
  const frame = useCurrentFrame();
  const p = appear(frame, 8, 20);
  return (
    <div style={{width: 690, height: 1110, borderRadius: 72, padding: 16, background: "#241a17", boxShadow: "0 42px 95px rgba(69,40,31,.28)", overflow: "hidden", opacity: p, translate: `0px ${interpolate(p, [0, 1], [110, 0])}px`, rotate: `${interpolate(p, [0, 1], [2.5, 0])}deg`}}>
      <Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: crop === "top" ? "top" : "center", borderRadius: 56, scale: interpolate(frame, [25, 100], [1.02, 1.08], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}} />
    </div>
  );
};

const Hook = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.brown, overflow: "hidden"}}>
      <Img src={staticFile("bolo-chocolate.png")} style={{width: "100%", height: "100%", objectFit: "cover", opacity: 0.62, scale: interpolate(frame, [0, 95], [1.18, 1.03]), translate: `0px ${interpolate(frame, [0, 95], [25, -25])}px`}} />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(40,20,15,.15) 0%, rgba(40,20,15,.55) 42%, rgba(40,20,15,.97) 100%)"}} />
      <AbsoluteFill style={{padding: "170px 86px 150px", justifyContent: "flex-end", alignItems: "center", gap: 28}}>
        <Kicker light>Para quem vende por encomenda</Kicker>
        <Headline light size={98}>Você sabe quanto realmente lucra?</Headline>
        <div style={{opacity: appear(frame, 18), color: "#f5d9d3", fontFamily: "Arial, sans-serif", fontSize: 43, lineHeight: 1.2, textAlign: "center", maxWidth: 850}}>Não deixe o seu trabalho virar prejuízo.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Chaos = () => {
  const frame = useCurrentFrame();
  const iconIn = appear(frame, 5, 20);
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{padding: "150px 82px", alignItems: "center", justifyContent: "center"}}>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 44}}>
          <Kicker>Chega de adivinhar</Kicker>
          <Headline>Caderno, calculadora e WhatsApp?</Headline>
          <div style={{position: "relative", width: 740, height: 680, marginTop: 30}}>
            <Img src={staticFile("calculadora.png")} style={{position: "absolute", width: 540, left: 100, top: 25, opacity: iconIn, scale: interpolate(iconIn, [0, 1], [0.75, 1]), rotate: `${interpolate(frame, [20, 80], [-4, 3], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}deg`, filter: "drop-shadow(0 38px 40px rgba(69,40,31,.2))"}} />
            {["Custos", "Pedidos", "Pagamentos"].map((item, index) => <div key={item} style={{position: "absolute", left: index === 1 ? 465 : 0, top: 130 + index * 160, background: C.white, color: C.brown, padding: "20px 34px", borderRadius: 999, fontFamily: "Arial, sans-serif", fontSize: 34, fontWeight: 800, boxShadow: "0 18px 40px rgba(69,40,31,.13)", opacity: appear(frame, 16 + index * 7), translate: `${interpolate(appear(frame, 16 + index * 7), [0, 1], [index === 1 ? 60 : -60, 0])}px 0px`}}>{item}</div>)}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProductScene = ({type}: {type: "pricing" | "agenda" | "control"}) => {
  const frame = useCurrentFrame();
  const config = type === "pricing"
    ? {kicker: "Preço sem chute", title: <>Calcule custos<br />e margem de lucro</>, subtitle: "Venda com segurança e valorize cada receita.", screen: "precificacao.png", icon: "calculadora.png"}
    : type === "agenda"
      ? {kicker: "Nada fica para trás", title: <>Organize todas<br />as encomendas</>, subtitle: "Datas, clientes, sinais e valores em um só lugar.", screen: "agenda.png", icon: "agenda-3d.png"}
      : {kicker: "Gestão completa", title: <>Seu negócio<br />na palma da mão</>, subtitle: "Vendas, produtos, finanças, receitas e muito mais.", screen: "inicio.png", icon: "vendas-3d.png"};
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{padding: "118px 80px 85px", alignItems: "center"}}>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 22}}>
          <Kicker>{config.kicker}</Kicker>
          <Headline size={82}>{config.title}</Headline>
          <div style={{color: "#8d725f", fontFamily: "Arial, sans-serif", fontSize: 39, lineHeight: 1.2, textAlign: "center", maxWidth: 850, opacity: appear(frame, 8)}}>{config.subtitle}</div>
          <div style={{position: "relative", marginTop: 18}}>
            <Phone src={config.screen} crop={type === "agenda" ? "center" : "top"} />
            <Img src={staticFile(config.icon)} style={{position: "absolute", width: 265, height: 265, objectFit: "contain", right: -110, bottom: 75, opacity: appear(frame, 22), scale: interpolate(appear(frame, 22), [0, 1], [0.55, 1]), rotate: `${interpolate(appear(frame, 22), [0, 1], [12, -4])}deg`, filter: "drop-shadow(0 25px 28px rgba(69,40,31,.25))"}} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Closing = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SoftBackground dark />
      <AbsoluteFill style={{padding: "170px 82px", alignItems: "center", justifyContent: "center"}}>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 45}}>
          <Img src={staticFile("icon.png")} style={{width: 390, height: 390, borderRadius: 98, boxShadow: "0 35px 80px rgba(0,0,0,.28)", opacity: appear(frame), scale: interpolate(appear(frame), [0, 1], [0.72, 1]), rotate: `${interpolate(appear(frame), [0, 1], [-7, 0])}deg`}} />
          <div style={{color: C.white, fontFamily: "Georgia, serif", fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: -2.5, textAlign: "center", opacity: appear(frame, 7)}}>Transforme trabalho<br />em lucro de verdade.</div>
          <div style={{background: C.rose, color: C.white, padding: "30px 62px", borderRadius: 999, fontFamily: "Arial, sans-serif", fontSize: 42, fontWeight: 900, boxShadow: "0 22px 50px rgba(0,0,0,.28)", opacity: appear(frame, 18), scale: interpolate(appear(frame, 18), [0, 1], [0.82, 1])}}>Baixe grátis no Android</div>
          <div style={{display: "flex", alignItems: "center", gap: 18, opacity: appear(frame, 26)}}><div style={{width: 13, height: 13, borderRadius: "50%", background: C.green}} /><div style={{color: "#f5d9d3", fontFamily: "Arial, sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: 3}}>LUCRO CASEIRO</div></div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const transition = linearTiming({durationInFrames: 12});

export const PromoVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={95}><Hook /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={80}><Chaos /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: "from-right"})} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={105}><ProductScene type="pricing" /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: "from-bottom"})} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={105}><ProductScene type="agenda" /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: "from-right"})} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={90}><ProductScene type="control" /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={95}><Closing /></TransitionSeries.Sequence>
  </TransitionSeries>
);

export const MyComposition = () => (
  <Composition id="LucroCaseiroPromo" component={PromoVideo} durationInFrames={510} fps={30} width={1080} height={1920} />
);
