import styles from "./app-demo.module.css";

/** Real local-build footage; no account, API or autoplay is needed. */
export function AppDemo() {
  return (
    <section className={styles.section} aria-labelledby="app-demo-title" id="demonstracao">
      <div className={styles.copy}>
        <h2 id="app-demo-title">Do produto à primeira venda.</h2>
        <p>Veja como cadastrar um produto, calcular o preço e registrar uma venda no Lucro Caseiro.</p>
        <ol>
          <li>Cadastre o produto e confira os custos.</li>
          <li>Aplique o preço e revise a venda antes de confirmar.</li>
          <li>Acompanhe o recebimento e organize o catálogo.</li>
        </ol>
        <p id="app-demo-note" className={styles.note}>
          Telas reais de um build local, com dados fictícios. Nesta demonstração, o link público do catálogo está desativado. O ganho calculado é uma estimativa com os custos informados.
        </p>
      </div>
      <figure className={styles.figure}>
        <video
          className={styles.video}
          controls
          playsInline
          preload="none"
          width={720}
          height={1280}
          poster="/landing/demo/app-demo-poster.jpg"
          aria-label="Demonstração do Lucro Caseiro: produto, preço, venda e catálogo"
          aria-describedby="app-demo-note app-demo-caption"
        >
          <source src="/landing/demo/app-demo.mp4" type="video/mp4" />
          <track kind="captions" src="/landing/demo/app-demo.pt-BR.vtt" srcLang="pt-BR" label="Português" />
          Seu navegador não reproduz este vídeo. Use o link abaixo para abrir o arquivo.
        </video>
        <figcaption id="app-demo-caption">
          Demonstração sem áudio · 64 segundos.
          <a href="/landing/demo/app-demo.mp4">Abrir ou baixar o vídeo (2,6 MB)</a>
          <details>
            <summary>Ler a demonstração</summary>
            <p>O exemplo cadastra Brigadeiro DEMO com 24 unidades. Com material, embalagem, trabalho, despesas e taxa de venda informados, o app sugere R$ 7,90. Esse preço é aplicado ao produto. Uma unidade é registrada como venda paga, com Pix como forma de pagamento; não há cobrança ou transferência real. A lista mostra uma venda de R$ 7,90. O catálogo exibe o produto com o link público desativado.</p>
          </details>
        </figcaption>
      </figure>
    </section>
  );
}
