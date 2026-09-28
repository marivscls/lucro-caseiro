# Pousti × Ametista — Comparativo completo

**Data:** 2026-09-17 · **Base:** exploração direta da Pousti (app.pousti.ai, via navegador) + código e documentos do repositório Ametista (`C:\Users\maria\Projects\ametista`)

---

## TL;DR

São duas categorias de ferramenta que **se sobrepõem na metade do funil**:

- **Pousti** = estrategista de marketing em nuvem (SaaS): conversa guiada, DNA de marca, skills de conteúdo, calendário Kanban, geração de imagem e clipes, publicação via Meta. Plug-and-play, não depende do seu computador.
- **Ametista** = sistema operacional local de marketing (app desktop próprio): kit de marca oficial travado no código, geração de arte conforme a identidade real, roteiros, agenda, aprovação humana, publicação FB/Instagram, leitura de GA4 e pesquisa SerpAPI.

**Veredito:** complementares, não concorrentes — desde que cada uma fique com sua fronteira (ver §8). O maior risco hoje é **dupla publicação e régua visual divergente** se as duas operarem o mesmo Instagram sem acordo de fronteira.

---

## 1. O que é cada uma

|           | Pousti                                                            | Ametista                                                 |
| --------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Natureza  | SaaS fechado, roda no navegador (app.pousti.ai)                   | App desktop próprio (Tauri + Next.js), local-first       |
| Dono      | terceiros (Pousti)                                                | ORIONSEVEN — código-fonte no seu repositório             |
| Modelo    | assinatura/créditos ("POPs" — 1 geração ≈ 3,81 POPs)              | seu produto; custo só de APIs (OpenAI, Meta, SerpAPI)    |
| Paradigma | agente estrategista conversacional ("Claudio") + skills plugáveis | módulos de growth determinísticos + IA nos pontos certos |

## 2. Marca e identidade

|                               | Pousti                                                                         | Ametista                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding de marca           | conversa guiada; gerou DNA + régua fixa (custom briefing)                      | seed oficial (`seeds/lucro-caseiro/marketing.json`) + docs de marca                                                                                                                     |
| Precisão da identidade visual | briefing descritivo (cores/texto livre)                                        | **kit oficial travado no código**: `#4A2332` vinho, `#B65F72` rosa (máx. 15–20%), `#DCE86A` lima, `#FAF8F6` off-white, Nunito Sans 700/800, Fraunces ocasional, logo + versão recortada |
| Governança de marca           | régua de vocabulário + compliance (sem promessa de renda)                      | mesma régua + verificação programática da marca antes/depois de gerar arte; segmentos de arte aprovados por direção                                                                     |
| Ponto forte                   | aprende "quem você é" por conversa                                             | **não escorrega**: a arte nasce dentro da identidade oficial                                                                                                                            |
| Ponto fraco                   | depende do que foi escrito no briefing; arte é genérica "a partir do briefing" | exige disciplina de quem opera; sem conversa guiada                                                                                                                                     |

## 3. Conteúdo (ideias → texto)

|                             | Pousti                                                                                                                    | Ametista                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Geração de pautas/briefings | skills Content Strategy + Draft Content; **já há 7 briefings no Kanban** (ex.: "Teste da Sacola", "Leilão do Tempo Real") | editorial semanal (seg/qua/sex) + planner editorial + roteiros pessoais (`roteiros-pessoais-v1.md`) |
| Tom de voz                  | skill Brand Voice Enforcement + DNA conversado                                                                            | guia de mensagens oficial no seed (vocabulário preferido/proibido)                                  |
| Revisão                     | skills Editor Pass, Humanizer, Headline Lab, Fact Check                                                                   | aprovação humana nativa no fluxo (revisão → aprovar e agendar)                                      |
| Reuso de conteúdo           | skill Content Repurposing                                                                                                 | arquitetura "uma pauta → Shorts + carrossel + Stories + YouTube" documentada                        |

## 4. Imagem

|                     | Pousti                                                                                   | Ametista                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Geração             | automática a partir do briefing; tipos Imagem/Carrossel/Story; proporções 4:5, 2:3, 9:16 | arte via GPT visual kit **amarrada ao kit oficial da marca**, com telas reais do app anexadas como referência; saída JPEG 1080×1350 |
| Fidelidade de marca | boa (régua textual), mas paleta/fonte não são enforcement                                | **enforcement programático** — rejeita resultado fora do kit                                                                        |
| Quem ganha          | —                                                                                        | **Ametista, com folga**                                                                                                             |

## 5. Vídeo

|            | Pousti                                                                                                                                          | Ametista                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Capacidade | **Editor de Clipes**: envia MP4/MOV/MKV/AVI (até 10 min / 2 GB), IA escolhe momentos virais, clipes de 15–30 s em 9:16; já tem 4 vídeos criados | roteiros e documentação de vídeo (`docs/desktop-video.md`); produção é manual |
| Quem ganha | **Pousti**                                                                                                                                      | —                                                                             |

## 6. Calendário e publicação

|                        | Pousti                                                                                                                            | Ametista                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Calendário             | **Kanban editorial completo**: Ideia → Briefing → Captação → Design → Edição → Aprovação final → Agendado → Publicado → Reprovado | agenda semanal simples com prévia, data e hora                                                         |
| Publicação             | via integração Meta na nuvem (não depende do PC)                                                                                  | FB/Instagram via Meta, **mas só com o app aberto e o PC acordado**; atrasos > 24 h exigem nova revisão |
| Métricas               | **"Em breve"** (ainda não existe)                                                                                                 | **GA4 conectado de verdade** (sessões, calculadora, cliques web/Android)                               |
| Pesquisa de referência | não observada                                                                                                                     | SerpAPI                                                                                                |
| Quem ganha             | pipeline e publicação                                                                                                             | métricas e pesquisa                                                                                    |

## 7. Resumo por função (quem faz o quê melhor)

| Função                           | Melhor   | Comentário                              |
| -------------------------------- | -------- | --------------------------------------- |
| Entender a marca por conversa    | Pousti   | onboarding guiado é excelente           |
| Manter a identidade visual exata | Ametista | kit oficial no código                   |
| Ideias e rascunhos de posts      | Pousti   | skills + Kanban com 7 briefings prontos |
| Arte final conforme marca        | Ametista | enforcement + telas reais do app        |
| Clipes/Reels com IA              | Pousti   | editor de clipes nativo                 |
| Publicar sem depender do PC      | Pousti   | nuvem                                   |
| Medir resultado real             | Ametista | GA4; Pousti nem tem métricas ainda      |
| Custo marginal                   | Ametista | paga só APIs; Pousti consome POPs       |

## 8. Recomendação — divisão de fronteiras

1. **Estratégia, pautas e rascunhos:** Pousti (Claudio + skills) gera ideias e textos dentro da régua.
2. **Arte final e publicação:** Ametista, usando o kit oficial — a menos que a Pousti aprenda a respeitar a identidade exata (hoje não enforce).
3. **Métricas:** GA4 via Ametista, sempre.
4. **Régua única:** a régua gravada hoje na Pousti (abertura por preço/lucro, vocabulário travado, rotação de segmentos, zero "gestão completa", sem nicho de doces) deve ser a mesma régua que a Ametista já aplica — elas nasceram do mesmo documento oficial.
5. **⚠️ Risco a evitar:** nunca deixar as duas agendando o mesmo Instagram ao mesmo tempo — escolher **um** publicador oficial. Hoje: Ametista já publica a agenda do LC; se a Pousti assumir, desligar a agenda da Ametista pra não dobrar post.

## 9. Oportunidade estratégica (visão de produto)

A Ametista pode engolir boa parte da Pousti como funcionalidade: onboarding conversacional de marca (régua), Kanban de pipeline, editor de clipes e skills modulares são todas features replicáveis nos módulos growth-\*. A Pousti serve hoje como **benchmark de UX** e como camada rápida de ideação — e o que ela fizer de melhor que a Ametista ainda não faz vira roadmap. Como o Lucro Caseiro é seu case público da Ametista, essa comparação também alimenta o posicionamento "Ametista vs. ferramentas de IA genéricas".
