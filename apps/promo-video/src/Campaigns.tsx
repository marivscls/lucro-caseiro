import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {AbsoluteFill, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";

type Palette = {bg: string; ink: string; accent: string; soft: string; green: string};

const palettes = {
  finance: {bg: "#201916", ink: "#fff8f2", accent: "#d7899a", soft: "#382b26", green: "#67c89c"},
  catalog: {bg: "#fff8f4", ink: "#472b22", accent: "#c96f82", soft: "#f3dfda", green: "#65c49d"},
  pro: {bg: "#f6f1df", ink: "#26351d", accent: "#78943f", soft: "#dfe7bf", green: "#78943f"},
} satisfies Record<string, Palette>;

const easing = {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};
const show = (frame: number, delay = 0, duration = 18) => interpolate(frame, [delay, delay + duration], [0, 1], easing);

const Backdrop = ({p}: {p: Palette}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: p.bg, overflow: "hidden"}}><div style={{position: "absolute", width: 760, height: 760, borderRadius: "50%", background: p.soft, top: -390, right: -330, translate: `${interpolate(frame, [0, 140], [0, -65])}px ${interpolate(frame, [0, 140], [0, 80])}px`}} /><div style={{position: "absolute", width: 590, height: 590, borderRadius: "50%", border: `78px solid ${p.soft}`, bottom: -355, left: -320}} /></AbsoluteFill>;
};

const Copy = ({p, kicker, title, subtitle}: {p: Palette; kicker: string; title: React.ReactNode; subtitle?: string}) => {
  const frame = useCurrentFrame();
  return <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 23}}><div style={{color: p.accent, fontFamily: "Arial, sans-serif", fontSize: 31, fontWeight: 900, letterSpacing: 4.5, textTransform: "uppercase", textAlign: "center", opacity: show(frame), translate: `${interpolate(show(frame), [0, 1], [-45, 0])}px 0px`}}>{kicker}</div><div style={{color: p.ink, fontFamily: "Georgia, serif", fontSize: 88, fontWeight: 700, lineHeight: 0.98, letterSpacing: -2.5, textAlign: "center", opacity: show(frame, 3), scale: interpolate(show(frame, 3), [0, 1], [0.92, 1])}}>{title}</div>{subtitle ? <div style={{color: p.ink, opacity: show(frame, 10) * 0.76, fontFamily: "Arial, sans-serif", fontSize: 39, lineHeight: 1.2, textAlign: "center", maxWidth: 860}}>{subtitle}</div> : null}</div>;
};

const Screen = ({src, height = 1070}: {src: string; height?: number}) => {
  const frame = useCurrentFrame();
  const enter = show(frame, 9, 20);
  return <div style={{width: 690, height, borderRadius: 68, padding: 15, background: "#211916", boxShadow: "0 40px 90px rgba(25,15,12,.28)", overflow: "hidden", opacity: enter, translate: `0px ${interpolate(enter, [0, 1], [100, 0])}px`}}><Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", borderRadius: 54, scale: interpolate(frame, [25, 130], [1.01, 1.07], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}} /></div>;
};

const HeroIcon = ({src, size = 630}: {src: string; size?: number}) => {
  const frame = useCurrentFrame();
  return <Img src={staticFile(src)} style={{width: size, height: size, objectFit: "contain", opacity: show(frame, 7), scale: interpolate(show(frame, 7), [0, 1], [0.7, 1]), rotate: `${interpolate(frame, [20, 100], [-4, 4], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}deg`, filter: "drop-shadow(0 40px 38px rgba(30,20,15,.22))"}} />;
};

const Intro = ({p, kicker, title, subtitle, icon}: {p: Palette; kicker: string; title: React.ReactNode; subtitle: string; icon: string}) => <AbsoluteFill><Backdrop p={p} /><AbsoluteFill style={{padding: "175px 80px 120px", alignItems: "center", justifyContent: "center", gap: 70}}><Copy p={p} kicker={kicker} title={title} subtitle={subtitle} /><HeroIcon src={icon} /></AbsoluteFill></AbsoluteFill>;

const ScreenScene = ({p, kicker, title, subtitle, screen, icon}: {p: Palette; kicker: string; title: React.ReactNode; subtitle: string; screen: string; icon: string}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><Backdrop p={p} /><AbsoluteFill style={{padding: "105px 78px 75px", alignItems: "center"}}><Copy p={p} kicker={kicker} title={title} subtitle={subtitle} /><div style={{position: "relative", marginTop: 34}}><Screen src={screen} /><Img src={staticFile(icon)} style={{position: "absolute", width: 260, height: 260, objectFit: "contain", right: -105, bottom: 70, filter: "drop-shadow(0 25px 25px rgba(30,20,15,.25))", opacity: show(frame, 24), scale: interpolate(show(frame, 24), [0, 1], [0.55, 1]), rotate: `${interpolate(show(frame, 24), [0, 1], [12, -5])}deg`}} /></div></AbsoluteFill></AbsoluteFill>;
};

const FeatureStack = ({p, title, items, icons}: {p: Palette; title: React.ReactNode; items: string[]; icons: string[]}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><Backdrop p={p} /><AbsoluteFill style={{padding: "150px 76px", alignItems: "center", gap: 65}}><Copy p={p} kicker="Recursos profissionais" title={title} /><div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, width: "100%"}}>{items.map((item, i) => <div key={item} style={{height: 300, borderRadius: 48, background: p.soft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 22px 50px rgba(38,53,29,.11)", opacity: show(frame, 10 + i * 7), translate: `0px ${interpolate(show(frame, 10 + i * 7), [0, 1], [60, 0])}px`}}><Img src={staticFile(icons[i])} style={{width: 185, height: 185, objectFit: "contain"}} /><div style={{color: p.ink, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 34}}>{item}</div></div>)}</div></AbsoluteFill></AbsoluteFill>;
};

const Close = ({p, title, subtitle = "Baixe grátis no Android"}: {p: Palette; title: React.ReactNode; subtitle?: string}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><Backdrop p={p} /><AbsoluteFill style={{padding: "170px 80px", alignItems: "center", justifyContent: "center", gap: 48}}><Img src={staticFile("icon.png")} style={{width: 370, height: 370, borderRadius: 92, boxShadow: "0 35px 80px rgba(30,20,15,.24)", opacity: show(frame), scale: interpolate(show(frame), [0, 1], [0.72, 1])}} /><div style={{color: p.ink, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 94, lineHeight: 1, letterSpacing: -2.5, textAlign: "center", opacity: show(frame, 6)}}>{title}</div><div style={{color: "white", background: p.accent, padding: "30px 62px", borderRadius: 999, fontFamily: "Arial, sans-serif", fontSize: 42, fontWeight: 900, boxShadow: "0 22px 50px rgba(30,20,15,.2)", opacity: show(frame, 17), scale: interpolate(show(frame, 17), [0, 1], [0.84, 1])}}>{subtitle}</div><div style={{color: p.green, fontFamily: "Arial, sans-serif", fontSize: 34, fontWeight: 900, letterSpacing: 3, opacity: show(frame, 24)}}>LUCRO CASEIRO</div></AbsoluteFill></AbsoluteFill>;
};

const transition = linearTiming({durationInFrames: 10});

export const FinanceCampaign = () => {
  const p = palettes.finance;
  return <TransitionSeries><TransitionSeries.Sequence durationInFrames={100}><Intro p={p} kicker="Seu dinheiro merece clareza" title={<>Vende bastante,<br />mas o lucro some?</>} subtitle="Descubra exatamente para onde seu dinheiro está indo." icon="insights-3d.png" /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={transition} /><TransitionSeries.Sequence durationInFrames={130}><ScreenScene p={p} kicker="Visão financeira" title={<>Lucro, entradas<br />e saídas</>} subtitle="Acompanhe os números do mês sem depender de planilhas." screen="financeiro.png" icon="vendas-3d.png" /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={slide({direction: "from-bottom"})} timing={transition} /><TransitionSeries.Sequence durationInFrames={130}><FeatureStack p={p} title={<>Relatórios que ajudam<br />você a decidir</>} items={["Lucro real", "Ticket médio", "PDF e Excel", "Histórico"]} icons={["insights-3d.png", "vendas-3d.png", "orcamentos-3d.png", "calculadora.png"]} /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={transition} /><TransitionSeries.Sequence durationInFrames={120}><Close p={p} title={<>Controle o dinheiro.<br />Faça o negócio crescer.</>} /></TransitionSeries.Sequence></TransitionSeries>;
};

export const CatalogCampaign = () => {
  const p = palettes.catalog;
  return <TransitionSeries><TransitionSeries.Sequence durationInFrames={100}><Intro p={p} kicker="Venda até quando estiver ocupada" title={<>Sua vitrine<br />sempre aberta</>} subtitle="Mostre seus produtos e receba pedidos pelo WhatsApp." icon="produtos-3d.png" /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={slide({direction: "from-right"})} timing={transition} /><TransitionSeries.Sequence durationInFrames={130}><ScreenScene p={p} kicker="Catálogo online" title={<>Um link com<br />a sua marca</>} subtitle="Compartilhe com clientes e transforme interesse em pedido." screen="catalogo.png" icon="produtos-3d.png" /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={slide({direction: "from-bottom"})} timing={transition} /><TransitionSeries.Sequence durationInFrames={130}><ScreenScene p={p} kicker="Venda mais rápido" title={<>Registre pedidos<br />em poucos passos</>} subtitle="Produtos frequentes, código de barras e valores organizados." screen="nova-venda.png" icon="vendas-3d.png" /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={transition} /><TransitionSeries.Sequence durationInFrames={120}><Close p={p} title={<>Do catálogo<br />direto para a venda.</>} /></TransitionSeries.Sequence></TransitionSeries>;
};

export const ProCampaign = () => {
  const p = palettes.pro;
  return <TransitionSeries><TransitionSeries.Sequence durationInFrames={100}><Intro p={p} kicker="Para quem quer crescer" title={<>Seu negócio já<br />não cabe no caderno</>} subtitle="Profissionalize a operação sem complicar sua rotina." icon="vendas-3d.png" /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={slide({direction: "from-right"})} timing={transition} /><TransitionSeries.Sequence durationInFrames={120}><FeatureStack p={p} title={<>Controle toda<br />a produção</>} items={["Receitas", "Insumos", "Fornecedores", "Compras"]} icons={["receitas-3d.png", "insumos-3d.png", "fornecedores-3d.png", "compras-3d.png"]} /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={slide({direction: "from-bottom"})} timing={transition} /><TransitionSeries.Sequence durationInFrames={120}><FeatureStack p={p} title={<>Venda com mais<br />profissionalismo</>} items={["Orçamentos", "Catálogo", "Relatórios", "Precificação"]} icons={["orcamentos-3d.png", "produtos-3d.png", "insights-3d.png", "calculadora.png"]} /></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={transition} /><TransitionSeries.Sequence durationInFrames={140}><Close p={p} title={<>Mais controle.<br />Mais tempo.<br />Mais lucro.</>} subtitle="Conheça o plano Profissional" /></TransitionSeries.Sequence></TransitionSeries>;
};

export const CampaignCompositions = () => <><Composition id="LucroCaseiroFinanceiro" component={FinanceCampaign} durationInFrames={450} fps={30} width={1080} height={1920} /><Composition id="LucroCaseiroCatalogo" component={CatalogCampaign} durationInFrames={450} fps={30} width={1080} height={1920} /><Composition id="LucroCaseiroProfissional" component={ProCampaign} durationInFrames={450} fps={30} width={1080} height={1920} /></>;
