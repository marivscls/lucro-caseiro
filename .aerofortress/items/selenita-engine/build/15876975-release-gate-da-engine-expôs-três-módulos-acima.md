---
id: 15876975-2d6d-418e-a36c-72df22e05291
slug: selenita-engine/build
type: scar
title: Release gate da Engine expôs três módulos acima de 500 linhas
tags: release, rust-gate, source-size, refactor
provenance: observado
evidence: C:/Users/maria/Documents/projects/selenita-engine/crates/selenita-tools/src/quality.rs; C:/Users/maria/Documents/projects/selenita-engine/crates/selenita-tools/src/template_tools.rs; C:/Users/maria/Documents/projects/selenita-engine/crates/selenita-tools/src/template_variants.rs
decay: stable
created: 2026-08-09T22:18:08.878954900+00:00
updated: 2026-08-09T22:18:08.878954900+00:00
validated: 2026-08-09T22:18:08.878954900+00:00
links:
---

FALHA REAL OBSERVADA em 2026-08-09 ao publicar a integração visual: `cargo run -p selenita-cli --bin rust-gate` reprovou `quality.rs` (535 linhas de produção), `template_tools.rs` (557) e `template_variants.rs` (1269), acima do máximo 500. `cargo fmt --all --check`, Clippy do crate alterado e `cargo test --workspace` passaram; portanto a pendência é estrutural, não funcional. Antes de declarar o gate de release totalmente verde, extrair responsabilidades desses três módulos em arquivos com testes locais, sem elevar ou silenciar o limite.
