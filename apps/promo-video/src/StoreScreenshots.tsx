import {Folder, Img, Still, staticFile, useVideoConfig} from "remotion";

import {MARKETING_COLORS, MARKETING_FONTS} from "./marketing-brand";

type StoreScreenshotProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly screenshot: string;
  readonly device: "phone" | "tablet";
  readonly layout: "left" | "right";
};

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
        background: "linear-gradient(145deg, #171315 0%, #3A3035 48%, #120F11 100%)",
        boxShadow: "0 52px 100px rgba(74, 35, 50, 0.18), 0 16px 30px rgba(74, 35, 50, 0.12)",
        rotate: isPhone ? (layout === "left" ? "-1.6deg" : "1.6deg") : "0deg",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: radius - padding,
          background: MARKETING_COLORS.white,
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
        background: MARKETING_COLORS.canvas,
        color: MARKETING_COLORS.ink,
        fontFamily: MARKETING_FONTS.body,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: isPhone ? 650 : 680,
          bottom: 0,
          borderRadius: "120px 120px 0 0",
          border: "2px solid rgba(182, 95, 114, 0.12)",
          borderBottom: 0,
          background: `linear-gradient(180deg, ${MARKETING_COLORS.roseSoft} 0%, ${MARKETING_COLORS.surface} 42%, ${MARKETING_COLORS.canvas} 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          zIndex: 3,
          top: 66,
          left: 68,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 82,
            height: 82,
            overflow: "hidden",
            borderRadius: 23,
            boxShadow: "0 14px 28px rgba(74, 35, 50, 0.15)",
          }}
        >
          <Img
            src={staticFile("play-store/icon.png")}
            style={{width: "100%", height: "100%", scale: 1.18}}
          />
        </div>
        <div
          style={{
            color: MARKETING_COLORS.wine,
            fontFamily: MARKETING_FONTS.display,
            fontSize: 37,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          lucro caseiro
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 2,
          top: isPhone ? 200 : 196,
          left: 68,
          right: 68,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: MARKETING_COLORS.rose,
            fontSize: isPhone ? 24 : 23,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: 3.4,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              flex: "0 0 16px",
              borderRadius: "50%",
              background: MARKETING_COLORS.lime,
            }}
          />
          <div>{eyebrow}</div>
        </div>
        <div
          style={{
            maxWidth: isPhone ? 930 : 900,
            marginTop: 30,
            color: MARKETING_COLORS.ink,
            fontFamily: MARKETING_FONTS.display,
            fontSize: isPhone ? 76 : 70,
            lineHeight: 0.96,
            fontWeight: 800,
            letterSpacing: -2.5,
            textWrap: "balance",
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxWidth: 850,
            marginTop: 22,
            color: MARKETING_COLORS.muted,
            fontFamily: MARKETING_FONTS.body,
            fontSize: isPhone ? 31 : 29,
            lineHeight: 1.2,
            fontWeight: 700,
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
          left: layout === "left" ? -54 : 54,
          right: 0,
          bottom: isPhone ? -72 : -30,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <DeviceFrame screenshot={screenshot} device={device} layout={layout} />
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
  layout: "left" | "right";
}> = [
  {
    id: "StorePhone01Inicio",
    eyebrow: "Gestão simples",
    title: "Seu negócio na palma da mão",
    subtitle: "Vendas, agenda e resultados em um só lugar.",
    screenshot: "play-store/01-home.png",
    layout: "right",
  },
  {
    id: "StorePhone02NovaVenda",
    eyebrow: "Venda sem complicação",
    title: "Registre cada pedido em poucos passos",
    subtitle: "Cliente, produto, pagamento e status organizados.",
    screenshot: "play-store/02-nova-venda.png",
    layout: "left",
  },
  {
    id: "StorePhone03Vendas",
    eyebrow: "Controle de vendas",
    title: "Saiba o que vendeu e recebeu",
    subtitle: "Acompanhe pedidos pagos, pendentes e cancelados.",
    screenshot: "play-store/03-vendas.png",
    layout: "right",
  },
  {
    id: "StorePhone04Agenda",
    eyebrow: "Agenda organizada",
    title: "Nenhuma entrega fica para trás",
    subtitle: "Visualize prazos e pedidos importantes do seu dia.",
    screenshot: "play-store/04-agenda.png",
    layout: "left",
  },
  {
    id: "StorePhone05Financeiro",
    eyebrow: "Dinheiro sem mistério",
    title: "Entenda para onde vai seu dinheiro",
    subtitle: "Entradas, despesas e resultados apresentados com clareza.",
    screenshot: "play-store/05-financeiro.png",
    layout: "right",
  },
  {
    id: "StorePhone06Produtos",
    eyebrow: "Produção centralizada",
    title: "Seus produtos sempre organizados",
    subtitle: "Consulte receitas, preços e informações importantes.",
    screenshot: "play-store/06-produtos.png",
    layout: "left",
  },
  {
    id: "StorePhone07Precificacao",
    eyebrow: "Preço com clareza",
    title: "Calcule um preço mais consciente",
    subtitle: "Considere custos, embalagem e quanto você quer ganhar.",
    screenshot: "play-store/07-precificacao.png",
    layout: "right",
  },
  {
    id: "StorePhone08Insights",
    eyebrow: "Decisões melhores",
    title: "Acompanhe seu negócio com números claros",
    subtitle: "Indicadores simples para entender seus resultados.",
    screenshot: "play-store/08-insights.png",
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
          device: "tablet",
          layout: "left",
        }}
      />
    </Folder>
  </Folder>
);
