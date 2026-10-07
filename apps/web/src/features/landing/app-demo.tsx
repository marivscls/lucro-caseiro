"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";

import styles from "./app-demo.module.css";

/** Chapter starts mirror the cues in `public/landing/demo/app-demo.pt-BR.vtt`. */
const chapters = [
  {
    start: 0,
    end: 18.792,
    title: "Cadastre o produto",
    text: "Nome, categoria, preço e estoque em uma tela.",
  },
  {
    start: 18.792,
    end: 41.625,
    title: "Calcule o preço",
    text: "Custos, seu trabalho, despesas e taxas entram na conta.",
  },
  {
    start: 41.625,
    end: 55.375,
    title: "Registre a venda",
    text: "Escolha o item, informe o Pix e revise antes de confirmar.",
  },
  {
    start: 55.375,
    end: 59.625,
    title: "Confira o que entrou",
    text: "A venda aparece na lista com o valor recebido.",
  },
  {
    start: 59.625,
    end: 64.417,
    title: "Organize o catálogo",
    text: "O produto vai para a vitrine que você compartilha.",
  },
] as const;

function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Real local-build footage; no account, API or autoplay is needed. */
export function AppDemo() {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);

  const active = chapters.findIndex((chapter) => time < chapter.end);
  const current = active === -1 ? chapters.length - 1 : active;

  function seek(start: number) {
    const element = video.current;
    if (!element) return;
    element.currentTime = start + 0.05;
    setTime(start + 0.05);
    void element.play().catch(() => undefined);
  }

  return (
    <section className={styles.section} aria-labelledby="app-demo-title" id="demonstracao">
      <div className={styles.copy}>
        <h2 id="app-demo-title">Veja o app funcionando em um minuto.</h2>
        <p className={styles.lede}>
          Um produto cadastrado, com preço calculado e venda registrada. Toque em uma
          etapa para pular direto para ela.
        </p>
        <ol className={styles.chapters}>
          {chapters.map((chapter, index) => {
            const isCurrent = started && index === current;
            const progress = isCurrent
              ? Math.min(1, Math.max(0, (time - chapter.start) / (chapter.end - chapter.start)))
              : 0;
            return (
              <li key={chapter.title}>
                <button
                  type="button"
                  className={styles.chapter}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-controls="app-demo-video"
                  data-analytics="demo_chapter"
                  onClick={() => seek(chapter.start)}
                >
                  <span className={styles.time}>{formatTime(chapter.start)}</span>
                  <span className={styles.chapterCopy}>
                    <strong>{chapter.title}</strong>
                    <span>{chapter.text}</span>
                  </span>
                  <span
                    className={styles.chapterProgress}
                    style={{ transform: `scaleX(${progress})` }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <figure className={styles.figure}>
        <div className={styles.frame}>
          <video
            id="app-demo-video"
            ref={video}
            className={styles.video}
            controls
            playsInline
            muted
            preload="none"
            width={720}
            height={1280}
            poster="/landing/demo/app-demo-poster.jpg"
            aria-label="Demonstração do Lucro Caseiro: produto, preço, venda e catálogo"
            aria-describedby="app-demo-note"
            onPlay={() => setStarted(true)}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          >
            <source src="/landing/demo/app-demo.mp4" type="video/mp4" />
            <track
              kind="captions"
              src="/landing/demo/app-demo.pt-BR.vtt"
              srcLang="pt-BR"
              label="Português"
              default
            />
            Seu navegador não reproduz este vídeo. Use o link abaixo para abrir o arquivo.
          </video>
          {started ? null : (
            <button
              type="button"
              className={styles.play}
              onClick={() => seek(0)}
              data-analytics="demo_play"
            >
              <Play aria-hidden="true" size={22} fill="currentColor" />
              Assistir · 1 min
            </button>
          )}
        </div>
        <figcaption>
          <p id="app-demo-note">
            Sem áudio, com legendas. Dados fictícios de demonstração; o link público do
            catálogo fica desativado no vídeo.
          </p>
          <div className={styles.captionLinks}>
            <a href="/landing/demo/app-demo.mp4">Baixar o vídeo (2,6 MB)</a>
            <details>
              <summary>Ler a demonstração</summary>
              <p>
                O exemplo cadastra Brigadeiro DEMO com 24 unidades. Com material,
                embalagem, trabalho, despesas e taxa de venda informados, o app sugere R$
                7,90. Esse preço é aplicado ao produto. Uma unidade é registrada como venda
                paga, com Pix como forma de pagamento; não há cobrança ou transferência
                real. A lista mostra uma venda de R$ 7,90. O catálogo exibe o produto com o
                link público desativado.
              </p>
            </details>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
