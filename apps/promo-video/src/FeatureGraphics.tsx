import {Folder, Img, Interactive, Still, staticFile} from "remotion";

const colors = {
  rose: "#C4707E",
  roseDark: "#A85A67",
  roseSoft: "#F9E7EA",
  cream: "#FAFAF8",
  ink: "#2A2422",
  muted: "#655D59",
  white: "#FFFFFF",
};

const Backdrop = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(145deg, ${colors.cream} 0%, #FFF9F7 58%, ${colors.roseSoft} 100%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 520,
        height: 520,
        borderRadius: "50%",
        background: colors.roseSoft,
        top: -360,
        left: -210,
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 630,
        height: 630,
        borderRadius: "50%",
        border: "58px solid rgba(196,112,126,0.10)",
        right: -420,
        bottom: -470,
      }}
    />
  </>
);

const StorePhone = ({
  screenshot,
  name,
  left,
  top,
  rotate,
}: {
  readonly screenshot: string;
  readonly name: string;
  readonly left: number;
  readonly top: number;
  readonly rotate: string;
}) => (
  <Interactive.Div
    name={name}
    style={{
      position: "absolute",
      left,
      top,
      width: 154,
      height: 342,
      padding: 7,
      overflow: "hidden",
      borderRadius: 31,
      background: "#211B19",
      boxShadow: "0 20px 38px rgba(54, 37, 32, 0.22)",
      rotate,
    }}
  >
    <Img
      src={staticFile(`play-store/${screenshot}`)}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        objectFit: "cover",
        objectPosition: "top center",
      }}
    />
  </Interactive.Div>
);

export const FeatureGraphicListing = () => (
  <div
    style={{
      position: "relative",
      width: 1024,
      height: 500,
      overflow: "hidden",
      background: colors.cream,
    }}
  >
    <Backdrop />
    <Interactive.Div
      name="Marca e mensagem"
      style={{
        position: "absolute",
        zIndex: 2,
        left: 54,
        top: 42,
        width: 455,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 15}}>
        <div
          style={{
            width: 72,
            height: 72,
            overflow: "hidden",
            borderRadius: 19,
            boxShadow: "0 12px 24px rgba(54, 37, 32, 0.18)",
          }}
        >
          <Img
            src={staticFile("play-store/icon.png")}
            style={{width: "100%", height: "100%", scale: 1.42}}
          />
        </div>
        <div
          style={{
            color: colors.ink,
            fontFamily: "FrauncesPromo, Georgia, serif",
            fontSize: 39,
            lineHeight: 0.88,
            letterSpacing: -1.1,
          }}
        >
          Lucro
          <br />
          Caseiro
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          color: colors.ink,
          fontFamily: "FrauncesPromo, Georgia, serif",
          fontSize: 39,
          lineHeight: 1.02,
          letterSpacing: -0.9,
        }}
      >
        Gestão simples para o
        <br />
        <span style={{color: colors.roseDark}}>seu negócio</span>
      </div>
      <div
        style={{
          maxWidth: 410,
          marginTop: 14,
          color: colors.muted,
          fontFamily: "NunitoSansPromo, Arial, sans-serif",
          fontSize: 19,
          lineHeight: 1.2,
          fontWeight: 600,
        }}
      >
        Controle vendas, agenda, produtos, catálogo e lucro em um só lugar.
      </div>
      <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, maxWidth: 430}}>
        {["Vendas", "Agenda", "Serviços", "Catálogo", "Precificação"].map((label) => (
          <div
            key={label}
            style={{
              padding: "8px 13px",
              borderRadius: 999,
              color: colors.roseDark,
              background: colors.white,
              border: `1px solid ${colors.roseSoft}`,
              fontFamily: "NunitoSansPromo, Arial, sans-serif",
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 800,
              boxShadow: "0 5px 13px rgba(54, 37, 32, 0.07)",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </Interactive.Div>
    <Interactive.Div name="Telas reais do aplicativo">
      <StorePhone screenshot="04-agenda.png" name="Agenda" left={500} top={108} rotate="-4deg" />
      <StorePhone screenshot="01-home.png" name="Início" left={664} top={66} rotate="0deg" />
      <StorePhone
        screenshot="07-precificacao.png"
        name="Precificação"
        left={827}
        top={104}
        rotate="4deg"
      />
    </Interactive.Div>
  </div>
);

const Eyebrow = ({children}: {readonly children: React.ReactNode}) => (
  <div
    style={{
      alignSelf: "flex-start",
      padding: "8px 17px",
      borderRadius: 999,
      background: colors.roseSoft,
      color: colors.roseDark,
      fontFamily: "NunitoSansPromo, Arial, sans-serif",
      fontSize: 17,
      lineHeight: 1,
      fontWeight: 800,
      letterSpacing: 2.2,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const PhoneArtwork = () => (
  <div
    style={{
      position: "absolute",
      width: 300,
      height: 500,
      right: 32,
      top: 0,
      overflow: "hidden",
    }}
  >
    <Img
      src={staticFile("feature-graphics/venda-organizacao-square.png")}
      style={{
        position: "absolute",
        width: 500,
        height: 500,
        left: -252,
        top: 0,
        objectFit: "cover",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, #FFF9F7 0%, rgba(255,249,247,0.72) 9%, rgba(255,249,247,0) 28%)",
      }}
    />
  </div>
);

export const FeatureGraphicApp = () => (
  <div
    style={{
      position: "relative",
      width: 1024,
      height: 500,
      overflow: "hidden",
      background: colors.cream,
    }}
  >
    <Backdrop />
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        width: 615,
        left: 62,
        top: 64,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Eyebrow>Lucro Caseiro</Eyebrow>
      <div
        style={{
          marginTop: 24,
          color: colors.ink,
          fontFamily: "FrauncesPromo, Georgia, serif",
          fontSize: 68,
          lineHeight: 0.91,
          letterSpacing: -1.8,
        }}
      >
        Venda mais.
        <br />
        <span style={{color: colors.roseDark}}>Organize melhor.</span>
      </div>
      <div
        style={{
          maxWidth: 500,
          marginTop: 24,
          color: colors.muted,
          fontFamily: "NunitoSansPromo, Arial, sans-serif",
          fontSize: 25,
          lineHeight: 1.18,
          fontWeight: 600,
        }}
      >
        Pedidos, produtos e dinheiro no mesmo lugar.
      </div>
    </div>
    <PhoneArtwork />
  </div>
);

const PersonArtwork = () => (
  <div
    style={{
      position: "absolute",
      width: 360,
      height: 500,
      right: 0,
      top: 0,
      overflow: "hidden",
    }}
  >
    <Img
      src={staticFile("feature-graphics/pedido-lucro-square.png")}
      style={{
        position: "absolute",
        width: 627,
        height: 627,
        left: -300,
        top: 0,
        objectFit: "cover",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, #FFF9F7 0%, rgba(255,249,247,0.70) 9%, rgba(255,249,247,0) 28%)",
      }}
    />
  </div>
);

const Benefit = ({children}: {readonly children: React.ReactNode}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: colors.muted,
      fontFamily: "NunitoSansPromo, Arial, sans-serif",
      fontSize: 22,
      lineHeight: 1.1,
      fontWeight: 700,
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        flex: "0 0 28px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.roseSoft,
        color: colors.roseDark,
        fontSize: 17,
        fontWeight: 800,
      }}
    >
      ✓
    </div>
    {children}
  </div>
);

export const FeatureGraphicPerson = () => (
  <div
    style={{
      position: "relative",
      width: 1024,
      height: 500,
      overflow: "hidden",
      background: colors.cream,
    }}
  >
    <Backdrop />
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        width: 570,
        left: 62,
        top: 54,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Eyebrow>Seu negócio organizado</Eyebrow>
      <div
        style={{
          marginTop: 22,
          color: colors.ink,
          fontFamily: "FrauncesPromo, Georgia, serif",
          fontSize: 66,
          lineHeight: 0.91,
          letterSpacing: -1.7,
        }}
      >
        Do pedido
        <br />
        ao <span style={{color: colors.roseDark}}>lucro.</span>
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: 13, marginTop: 24}}>
        <Benefit>Acompanhe suas vendas</Benefit>
        <Benefit>Organize pedidos e entregas</Benefit>
        <Benefit>Entenda quanto realmente sobra</Benefit>
      </div>
    </div>
    <PersonArtwork />
  </div>
);

export const FeatureGraphicCompositions = () => (
  <Folder name="Play-Store-Feature-Graphic">
    <Still
      id="FeatureGraphicListing"
      component={FeatureGraphicListing}
      width={1024}
      height={500}
    />
    <Still id="FeatureGraphicApp" component={FeatureGraphicApp} width={1024} height={500} />
    <Still id="FeatureGraphicPerson" component={FeatureGraphicPerson} width={1024} height={500} />
  </Folder>
);
