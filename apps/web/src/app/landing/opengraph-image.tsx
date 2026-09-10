import { ImageResponse } from "next/og";

export const alt = "Lucro Caseiro: saiba quanto cobrar e o que sobra de cada venda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SocialImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#4A2332",
        color: "#FAF8F6",
        padding: "62px",
        fontFamily: "sans-serif",
        gap: "48px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "650px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: 28 }}>
          <span
            style={{
              display: "flex",
              width: 18,
              height: 18,
              background: "#DCE86A",
              borderRadius: 9,
            }}
          />
          lucro caseiro
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 62,
            fontWeight: 700,
            letterSpacing: "-2px",
            lineHeight: 1.08,
          }}
        >
          <span>Saiba quanto cobrar</span>
          <span>e o que sobra</span>
          <span style={{ color: "#DCE86A" }}>de cada venda.</span>
        </div>
        <div style={{ fontSize: 24 }}>Comece grátis · Android e navegador</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "355px",
          background: "#FAF8F6",
          color: "#4A2332",
          borderRadius: 28,
          padding: 30,
          gap: 22,
        }}
      >
        <div style={{ fontSize: 24 }}>Caixa de brigadeiros</div>
        <div style={{ fontSize: 18 }}>EXEMPLO ILUSTRATIVO</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
          <span>Custo</span>
          <span>R$ 23,10</span>
        </div>
        <div style={{ fontSize: 22 }}>Preço sugerido</div>
        <div style={{ fontSize: 48, fontWeight: 700 }}>R$ 30,49</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 18,
            background: "#DCE86A",
            borderRadius: 16,
            fontSize: 22,
          }}
        >
          <span>Sobra por caixa</span>
          <span style={{ fontSize: 34, fontWeight: 700 }}>R$ 7,39</span>
        </div>
        <div style={{ fontSize: 17 }}>32% sobre o custo · Sem taxas</div>
      </div>
    </div>,
    size,
  );
}
