import {Folder, Img, Still, staticFile} from "remotion";

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
    <Still id="FeatureGraphicApp" component={FeatureGraphicApp} width={1024} height={500} />
    <Still id="FeatureGraphicPerson" component={FeatureGraphicPerson} width={1024} height={500} />
  </Folder>
);
