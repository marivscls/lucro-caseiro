import {Folder, Img, Still, staticFile, useVideoConfig} from "remotion";

const palette = {
  rose: "#C4707E",
  roseDark: "#A85A67",
  roseSoft: "#F9E7EA",
  roseMist: "#FDF3F4",
  cream: "#FAFAF8",
  ink: "#2A2422",
  muted: "#6F6662",
  white: "#FFFFFF",
};

type StoreScreenshotProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly screenshot: string;
  readonly accentAsset: string;
  readonly device: "phone" | "tablet";
  readonly layout: "left" | "right";
};

const DecorativeBackdrop = ({layout}: Pick<StoreScreenshotProps, "layout">) => (
  <>
    <div
      style={{
        position: "absolute",
        width: 720,
        height: 720,
        borderRadius: "50%",
        background: palette.roseSoft,
        top: -350,
        left: layout === "left" ? -310 : undefined,
        right: layout === "right" ? -310 : undefined,
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 680,
        height: 680,
        borderRadius: "50%",
        border: `90px solid ${palette.roseMist}`,
        bottom: -430,
        left: layout === "right" ? -370 : undefined,
        right: layout === "left" ? -370 : undefined,
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 250,
        height: 250,
        borderRadius: 72,
        background: palette.roseSoft,
        rotate: "24deg",
        top: "40%",
        left: layout === "left" ? -155 : undefined,
        right: layout === "right" ? -155 : undefined,
      }}
    />
  </>
);

const DeviceFrame = ({
  screenshot,
  device,
  layout,
}: Pick<StoreScreenshotProps, "screenshot" | "device" | "layout">) => {
  const isPhone = device === "phone";
  const width = isPhone ? 630 : 820;
  const padding = isPhone ? 26 : 38;
  const radius = isPhone ? 78 : 64;
  const screenWidth = width - padding * 2;
  const height = screenWidth * (isPhone ? 20 / 9 : 16 / 9) + padding * 2;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        padding,
        borderRadius: radius,
        background: "linear-gradient(145deg, #1E1A19 0%, #4B4240 50%, #171312 100%)",
        boxShadow: "0 46px 90px rgba(78, 45, 47, 0.25), 0 12px 26px rgba(78, 45, 47, 0.16)",
        rotate: isPhone ? (layout === "left" ? "-2.2deg" : "2.2deg") : "0deg",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: radius - padding,
          background: palette.white,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.32)",
        }}
      >
        <Img
          src={staticFile(screenshot)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "top",
          }}
        />
      </div>
      {isPhone ? (
        <>
          <div
            style={{
              position: "absolute",
              top: 185,
              right: -5,
              width: 6,
              height: 112,
              borderRadius: 8,
              background: "#211C1B",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 176,
              left: -5,
              width: 6,
              height: 74,
              borderRadius: 8,
              background: "#211C1B",
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export const StoreScreenshot = ({
  eyebrow,
  title,
  subtitle,
  screenshot,
  accentAsset,
  device,
  layout,
}: StoreScreenshotProps) => {
  const isPhone = device === "phone";
  const {width} = useVideoConfig();

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: "absolute",
        inset: 0,
        scale: width / 1080,
        transformOrigin: "top left",
        overflow: "hidden",
        background: `linear-gradient(155deg, ${palette.cream} 0%, #FFF9F7 58%, ${palette.roseSoft} 100%)`,
        color: palette.ink,
        fontFamily: "NunitoSansPromo, Arial, sans-serif",
      }}
    >
      <DecorativeBackdrop layout={layout} />

      <div
        style={{
          position: "absolute",
          zIndex: 2,
          top: isPhone ? 74 : 64,
          left: 70,
          right: 70,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            padding: "12px 25px",
            borderRadius: 999,
            background: palette.roseSoft,
            color: palette.roseDark,
            fontSize: isPhone ? 24 : 23,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: 3.4,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            maxWidth: isPhone ? 930 : 900,
            marginTop: 26,
            fontFamily: "FrauncesPromo, Georgia, serif",
            fontSize: isPhone ? 77 : 70,
            lineHeight: 0.98,
            letterSpacing: -2.1,
            textWrap: "balance",
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxWidth: 850,
            marginTop: 20,
            color: palette.muted,
            fontSize: isPhone ? 31 : 29,
            lineHeight: 1.18,
            fontWeight: 600,
            textWrap: "balance",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 1,
          left: 0,
          right: 0,
          bottom: isPhone ? 24 : 20,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <DeviceFrame screenshot={screenshot} device={device} layout={layout} />
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 3,
          width: isPhone ? 190 : 180,
          height: isPhone ? 190 : 180,
          left: layout === "left" ? 42 : undefined,
          right: layout === "right" ? 42 : undefined,
          bottom: isPhone ? 115 : 105,
          padding: 12,
          borderRadius: 50,
          background: "rgba(255,255,255,0.86)",
          boxShadow: "0 24px 58px rgba(91, 55, 58, 0.18)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Img
          src={staticFile(accentAsset)}
          style={{width: "100%", height: "100%", objectFit: "contain"}}
        />
      </div>
    </div>
  );
};

const phoneScreens: Array<{
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  screenshot: string;
  accentAsset: string;
  layout: "left" | "right";
}> = [
  {
    id: "StorePhone01Inicio",
    eyebrow: "Gestão simples",
    title: "Seu negócio na palma da mão",
    subtitle: "Vendas, agenda e resultados em um só lugar.",
    screenshot: "play-store/01-home.png",
    accentAsset: "agenda-3d.png",
    layout: "right",
  },
  {
    id: "StorePhone02NovaVenda",
    eyebrow: "Venda sem complicação",
    title: "Registre cada pedido em poucos passos",
    subtitle: "Cliente, produto, pagamento e status organizados.",
    screenshot: "play-store/02-nova-venda.png",
    accentAsset: "vendas-3d.png",
    layout: "left",
  },
  {
    id: "StorePhone03Vendas",
    eyebrow: "Controle de vendas",
    title: "Saiba o que vendeu e recebeu",
    subtitle: "Acompanhe pedidos pagos, pendentes e cancelados.",
    screenshot: "play-store/03-vendas.png",
    accentAsset: "vendas-3d.png",
    layout: "right",
  },
  {
    id: "StorePhone04Agenda",
    eyebrow: "Agenda organizada",
    title: "Nenhuma entrega fica para trás",
    subtitle: "Visualize prazos e pedidos importantes do seu dia.",
    screenshot: "play-store/04-agenda.png",
    accentAsset: "agenda-3d.png",
    layout: "left",
  },
  {
    id: "StorePhone05Financeiro",
    eyebrow: "Dinheiro sem mistério",
    title: "Entenda para onde vai seu dinheiro",
    subtitle: "Entradas, despesas e resultados apresentados com clareza.",
    screenshot: "play-store/05-financeiro.png",
    accentAsset: "insights-3d.png",
    layout: "right",
  },
  {
    id: "StorePhone06Produtos",
    eyebrow: "Produção centralizada",
    title: "Seus produtos sempre organizados",
    subtitle: "Consulte receitas, preços e informações importantes.",
    screenshot: "play-store/06-produtos.png",
    accentAsset: "produtos-3d.png",
    layout: "left",
  },
  {
    id: "StorePhone07Precificacao",
    eyebrow: "Preço com clareza",
    title: "Calcule um preço mais consciente",
    subtitle: "Considere custos, embalagem e quanto você quer ganhar.",
    screenshot: "play-store/07-precificacao.png",
    accentAsset: "calculadora.png",
    layout: "right",
  },
  {
    id: "StorePhone08Insights",
    eyebrow: "Decisões melhores",
    title: "Acompanhe seu negócio com números claros",
    subtitle: "Indicadores simples para entender seus resultados.",
    screenshot: "play-store/08-insights.png",
    accentAsset: "insights-3d.png",
    layout: "left",
  },
];

export const StoreScreenshotCompositions = () => (
  <Folder name="Play-Store-Screenshots">
    <Folder name="Celular">
      {phoneScreens.map((screen) => (
        <Still
          key={screen.id}
          id={screen.id}
          component={StoreScreenshot}
          width={1080}
          height={1920}
          defaultProps={{
            eyebrow: screen.eyebrow,
            title: screen.title,
            subtitle: screen.subtitle,
            screenshot: screen.screenshot,
            accentAsset: screen.accentAsset,
            device: "phone",
            layout: screen.layout,
          }}
        />
      ))}
    </Folder>

    <Folder name="Tablet-7">
      <Still
        id="StoreTablet7Recursos"
        component={StoreScreenshot}
        width={1080}
        height={1920}
        defaultProps={{
          eyebrow: "Tudo no mesmo app",
          title: "Organização para cada parte do negócio",
          subtitle: "Vendas, produção e ferramentas sempre por perto.",
          screenshot: "play-store/tablets/tablet-7-01-recursos.png",
          accentAsset: "produtos-3d.png",
          device: "tablet",
          layout: "right",
        }}
      />
      <Still
        id="StoreTablet7Precificacao"
        component={StoreScreenshot}
        width={1080}
        height={1920}
        defaultProps={{
          eyebrow: "Preço com clareza",
          title: "Descubra quanto cobrar",
          subtitle: "Custos e ganhos por unidade em uma conta simples.",
          screenshot: "play-store/tablets/tablet-7-02-precificacao.png",
          accentAsset: "calculadora.png",
          device: "tablet",
          layout: "left",
        }}
      />
      <Still
        id="StoreTablet7Vendas"
        component={StoreScreenshot}
        width={1080}
        height={1920}
        defaultProps={{
          eyebrow: "Controle de vendas",
          title: "Acompanhe o que vendeu e recebeu",
          subtitle: "Pedidos pagos, pendentes e cancelados sempre à vista.",
          screenshot: "play-store/tablets/tablet-7-03-vendas.png",
          accentAsset: "vendas-3d.png",
          device: "tablet",
          layout: "right",
        }}
      />
      <Still
        id="StoreTablet7Agenda"
        component={StoreScreenshot}
        width={1080}
        height={1920}
        defaultProps={{
          eyebrow: "Agenda organizada",
          title: "Organize pedidos e entregas",
          subtitle: "Prazos, valores e status reunidos em uma só tela.",
          screenshot: "play-store/tablets/tablet-7-04-agenda.png",
          accentAsset: "agenda-3d.png",
          device: "tablet",
          layout: "left",
        }}
      />
    </Folder>

    <Folder name="Tablet-10">
      <Still
        id="StoreTablet10PrecificacaoSimples"
        component={StoreScreenshot}
        width={1440}
        height={2560}
        defaultProps={{
          eyebrow: "Precificação simples",
          title: "Comece pelos custos da unidade",
          subtitle: "Uma conta direta para chegar a um preço mais consciente.",
          screenshot: "play-store/tablets/tablet-10-01-precificacao.png",
          accentAsset: "calculadora.png",
          device: "tablet",
          layout: "right",
        }}
      />
      <Still
        id="StoreTablet10PrecificacaoCompleta"
        component={StoreScreenshot}
        width={1440}
        height={2560}
        defaultProps={{
          eyebrow: "Visão completa",
          title: "Considere tudo o que custa produzir",
          subtitle: "Mão de obra, gastos mensais e lucro desejado na mesma conta.",
          screenshot: "play-store/tablets/tablet-10-02-precificacao-completa.png",
          accentAsset: "insights-3d.png",
          device: "tablet",
          layout: "left",
        }}
      />
      <Still
        id="StoreTablet10Vendas"
        component={StoreScreenshot}
        width={1440}
        height={2560}
        defaultProps={{
          eyebrow: "Controle de vendas",
          title: "Acompanhe o que vendeu e recebeu",
          subtitle: "Pedidos pagos, pendentes e cancelados sempre à vista.",
          screenshot: "play-store/tablets/tablet-10-03-vendas.png",
          accentAsset: "vendas-3d.png",
          device: "tablet",
          layout: "right",
        }}
      />
      <Still
        id="StoreTablet10Agenda"
        component={StoreScreenshot}
        width={1440}
        height={2560}
        defaultProps={{
          eyebrow: "Agenda organizada",
          title: "Organize pedidos e entregas",
          subtitle: "Prazos, valores e status reunidos em uma só tela.",
          screenshot: "play-store/tablets/tablet-10-04-agenda.png",
          accentAsset: "agenda-3d.png",
          device: "tablet",
          layout: "left",
        }}
      />
    </Folder>
  </Folder>
);
