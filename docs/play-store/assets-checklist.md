# Play Store Assets — Checklist

Imagens obrigatorias e recomendadas pra **Main store listing**. Tudo PNG/JPEG, RGB, sem transparencia exceto onde indicado.

## Obrigatorios

### Icone do app

- **Tamanho**: 512 × 512 px
- **Formato**: PNG 32-bit (com canal alpha)
- **Tamanho de arquivo**: max 1 MB
- **Conteudo**: o icone do app (ja existe em `apps/mobile/assets/icon.png` — confirmar que esta em 512×512)

### Feature graphic

- **Tamanho**: 1024 × 500 px
- **Formato**: PNG ou JPEG 24-bit (sem alpha)
- **Tamanho de arquivo**: max 1 MB
- **Conteudo**: banner que aparece no topo da pagina do app na Play Store. Deve incluir:
  - Logo "Lucro Caseiro" + tagline curta
  - Visualmente consistente com o icone (cor verde primaria do app)
  - Sem texto pequeno (vai ser visto em telefone)

> **Sugestao de layout**: fundo verde escuro com glow, icone do diamante a esquerda, texto "Lucro Caseiro — Gestao do seu negocio caseiro" centralizado.

### Screenshots de telefone (minimo 2, max 8)

- **Resolucao**: minimo 320 px de menor dimensao, max 3840 px
- **Aspect ratio**: 16:9 ou 9:16 (recomendado portrait 9:16, ex: 1080×1920)
- **Formato**: PNG ou JPEG 24-bit, sem alpha
- **Conteudo recomendado** (ordem importa — primeira aparece em destaque):
  1. **Home / Dashboard** — mostra "Hoje" com vendas, lucro, quick access
  2. **Nova venda em 3 toques** — selecao de produto + quantidade + cliente
  3. **Lista de vendas** com filtros
  4. **Precificacao** — calculo de preco com margem
  5. **Cadastro de cliente** simples
  6. **Premium / Paywall** — mostra trial gratis e beneficios

> **Dica**: capture com device frame (ex: tela dentro do contorno de um celular Android). Apps como [appmockup.com](https://app-mockup.com) ou Figma + Device Frames fazem isso facil.

## Recomendados (nao obrigatorios mas ajudam discoverability)

### Screenshots de tablet 7"

- 1024×600 ou similar
- Pode pular se app nao for otimizado pra tablet

### Screenshots de tablet 10"

- 1920×1080 ou similar
- Pode pular

### Video promocional

- Link YouTube
- 30 segundos a 2 minutos
- Mostra fluxo principal (criar venda em 3 toques, dashboard, paywall)

> Pode adicionar depois — nao e gargalo do lancamento.

## Como gerar screenshots

### Opcao 1 — Device fisico

1. `eas build --profile preview --platform android` (build APK)
2. Instala no celular
3. Tira screenshots normais (Power + Volume Down)
4. Edita pra adicionar device frame (opcional) em [appmockup.com](https://app-mockup.com)

### Opcao 2 — Emulador Android (mais controle)

1. Abre Android Studio → AVD Manager → cria emulador Pixel 7 Pro (1080×2400)
2. Roda `pnpm dev:mobile` apontando pra Railway
3. Naviga pelas telas
4. Screenshot via tecla Ctrl+S (ou botao na barra do emulador)
5. Saida ja em 1080×2400, pronto

### Opcao 3 — Designer

Se for usar Figma/Photoshop pra fazer mockups bonitos com texto explicativo ("3 toques pra registrar venda!"), recomendo pra primeiras 2-3 screenshots de destaque. As demais podem ser screenshots reais simples.

## Checklist final

- [ ] Icon 512×512 PNG
- [ ] Feature graphic 1024×500 PNG/JPG
- [ ] Min 2 screenshots phone (portrait 1080×1920)
- [ ] Privacy policy URL live e acessivel
- [ ] Account deletion URL live e acessivel
- [ ] Email de contato funcional (`contato@orionseven.com.br`)
- [ ] (Opcional) Video YouTube ate 2 min
- [ ] (Opcional) Tablet 7" e 10" screenshots
