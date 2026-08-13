import {Folder, Img, Interactive, Still, staticFile} from "remotion";

import {MARKETING_COLORS, MARKETING_FONTS} from "./marketing-brand";

const Backdrop = () => (
  <div style={{position: "absolute", inset: 0, background: MARKETING_COLORS.canvas}} />
);

const StorePhone = ({
  screenshot,
  name,
  left,
  top,
  rotate,
  scale = 1,
}: {
  readonly screenshot: string;
  readonly name: string;
  readonly left: number;
  readonly top: number;
  readonly rotate: string;
  readonly scale?: number;
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
      scale,
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

const ListingBackdrop = () => (
  <>
    <div style={{position: "absolute", inset: 0, background: MARKETING_COLORS.canvas}} />
    <div
      style={{
        position: "absolute",
        width: 570,
        height: 620,
        right: -70,
        top: -58,
        borderRadius: "250px 0 0 250px",
        background: MARKETING_COLORS.wine,
      }}
    />
  </>
);

export const FeatureGraphicListing = () => (
  <div
    style={{
      position: "relative",
      width: 1024,
      height: 500,
      overflow: "hidden",
      background: MARKETING_COLORS.canvas,
    }}
  >
    <ListingBackdrop />
    <Interactive.Div
      name="Marca e mensagem"
      style={{
        position: "absolute",
        zIndex: 2,
        left: 54,
        top: 40,
        width: 470,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 14}}>
        <div
          style={{
            width: 64,
            height: 64,
            overflow: "hidden",
            borderRadius: 18,
            boxShadow: "0 12px 26px rgba(74, 35, 50, 0.16)",
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
            fontSize: 29,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: -0.8,
          }}
        >
          lucro caseiro
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 28,
          color: MARKETING_COLORS.rose,
          fontFamily: MARKETING_FONTS.body,
          fontSize: 15,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: 2.1,
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: MARKETING_COLORS.lime,
          }}
        />
        Tudo no seu ritmo
      </div>
      <div
        style={{
          marginTop: 17,
          color: MARKETING_COLORS.ink,
          fontFamily: MARKETING_FONTS.display,
          fontSize: 46,
          lineHeight: 0.96,
          fontWeight: 800,
          letterSpacing: -1.8,
        }}
      >
        Gestão simples
        <br />
        para o seu
        <br />
        <span style={{fontFamily: MARKETING_FONTS.accent, fontWeight: 700}}>negócio.</span>
      </div>
      <div
        style={{
          maxWidth: 405,
          marginTop: 17,
          color: MARKETING_COLORS.muted,
          fontFamily: MARKETING_FONTS.body,
          fontSize: 20,
          lineHeight: 1.22,
          fontWeight: 700,
        }}
      >
        Controle vendas, agenda, produtos e lucro em um só lugar.
      </div>
    </Interactive.Div>
    <Interactive.Div name="Interface real do aplicativo">
      <StorePhone
        screenshot="01-home.png"
        name="Início"
        left={605}
        top={78}
        rotate="-3deg"
        scale={1.18}
      />
      <StorePhone
        screenshot="07-precificacao.png"
        name="Precificação"
        left={824}
        top={108}
        rotate="4deg"
        scale={0.96}
      />
    </Interactive.Div>
  </div>
);

const BrandLockup = () => (
  <div
    style={{
      position: "relative",
      zIndex: 5,
      display: "flex",
      alignItems: "center",
      gap: 13,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        overflow: "hidden",
        borderRadius: 16,
        boxShadow: "0 10px 24px rgba(74, 35, 50, 0.15)",
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
        fontSize: 27,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: -0.7,
      }}
    >
      lucro caseiro
    </div>
  </div>
);

const SignalLine = ({children}: {readonly children: React.ReactNode}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: MARKETING_COLORS.rose,
      fontFamily: MARKETING_FONTS.body,
      fontSize: 14,
      lineHeight: 1,
      fontWeight: 800,
      letterSpacing: 2,
      textTransform: "uppercase",
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        flex: "0 0 10px",
        borderRadius: "50%",
        background: MARKETING_COLORS.lime,
      }}
    />
    <div>{children}</div>
  </div>
);

const PhoneArtwork = () => (
  <div
    style={{
      position: "absolute",
      width: 430,
      height: 500,
      right: 0,
      top: 0,
      clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 100%)",
      background: `linear-gradient(145deg, ${MARKETING_COLORS.roseSoft} 0%, ${MARKETING_COLORS.surface} 54%, ${MARKETING_COLORS.canvas} 100%)`,
      overflow: "hidden",
    }}
  >
    <StorePhone
      screenshot="01-home.png"
      name="Início em destaque"
      left={105}
      top={54}
      rotate="-3deg"
      scale={1.18}
    />
    <StorePhone
      screenshot="07-precificacao.png"
      name="Precificação em apoio"
      left={274}
      top={116}
      rotate="4deg"
      scale={0.82}
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
      background: MARKETING_COLORS.canvas,
    }}
  >
    <Backdrop />
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        width: 540,
        left: 54,
        top: 38,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <BrandLockup />
      <div style={{marginTop: 29}}>
        <SignalLine>Gestão no mesmo lugar</SignalLine>
      </div>
      <div
        style={{
          marginTop: 17,
          color: MARKETING_COLORS.ink,
          fontFamily: MARKETING_FONTS.display,
          fontSize: 51,
          lineHeight: 0.94,
          fontWeight: 700,
          letterSpacing: -1.8,
        }}
      >
        Venda mais.
        <br />
        Organize <span style={{fontFamily: MARKETING_FONTS.accent, fontWeight: 700}}>melhor.</span>
      </div>
      <div
        style={{
          maxWidth: 470,
          marginTop: 19,
          color: MARKETING_COLORS.muted,
          fontFamily: MARKETING_FONTS.body,
          fontSize: 21,
          lineHeight: 1.22,
          fontWeight: 700,
        }}
      >
        Pedidos, produtos e caixa organizados em um só app.
      </div>
    </div>
    <PhoneArtwork />
  </div>
);

const PersonArtwork = () => (
  <div
    style={{
      position: "absolute",
      width: 440,
      height: 500,
      right: 0,
      top: 0,
      clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 100%)",
      background: `linear-gradient(145deg, ${MARKETING_COLORS.roseSoft} 0%, ${MARKETING_COLORS.surface} 100%)`,
      overflow: "hidden",
    }}
  >
    <Img
      src={staticFile("feature-graphics/pedido-lucro-square.png")}
      style={{
        position: "absolute",
        width: 740,
        height: 740,
        left: -315,
        top: 0,
        objectFit: "cover",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, rgba(250,248,246,0.36) 0%, rgba(250,248,246,0) 23%)",
      }}
    />
  </div>
);

const Benefit = ({children}: {readonly children: React.ReactNode}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 13,
      color: MARKETING_COLORS.muted,
      fontFamily: MARKETING_FONTS.body,
      fontSize: 18,
      lineHeight: 1.1,
      fontWeight: 700,
    }}
  >
    <div
      style={{
        width: 24,
        flex: "0 0 24px",
        color: MARKETING_COLORS.rose,
        fontSize: 20,
        lineHeight: 1,
        fontWeight: 800,
        textAlign: "center",
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
      background: MARKETING_COLORS.canvas,
    }}
  >
    <Backdrop />
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        width: 530,
        left: 54,
        top: 38,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <BrandLockup />
      <div style={{marginTop: 27}}>
        <SignalLine>Seu negócio organizado</SignalLine>
      </div>
      <div
        style={{
          marginTop: 16,
          color: MARKETING_COLORS.ink,
          fontFamily: MARKETING_FONTS.display,
          fontSize: 50,
          lineHeight: 0.94,
          fontWeight: 700,
          letterSpacing: -1.8,
        }}
      >
        Do pedido
        <br />
        ao <span style={{fontFamily: MARKETING_FONTS.accent, fontWeight: 700}}>lucro.</span>
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: 11, marginTop: 20}}>
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
