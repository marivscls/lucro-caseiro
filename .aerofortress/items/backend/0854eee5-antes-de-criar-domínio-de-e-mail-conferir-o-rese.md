---
id: 0854eee5-40f4-4d69-9120-2f7241d655e8
slug: backend
type: scar
title: Antes de criar domínio de e-mail, conferir o Resend já configurado
tags: email, resend, dns, dominio, correcao
provenance: dito
evidence: Capturas do painel Resend enviadas pela usuária em 2026-08-06: Domains mostra lucrocaseiro.com.br Verified, região São Paulo; API keys mostra supabase-smtp e Onboarding com Sending access
decay: stable
created: 2026-08-06T13:11:23.878421100+00:00
updated: 2026-08-06T13:22:54.834288+00:00
validated: 2026-08-06T13:22:54.834288+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-08-06): foi assumido que o Lucro Caseiro ainda não tinha provedor/domínio de e-mail e a implementação apontou para `updates.lucrocaseiro.com.br`. A captura do painel mostrou que o Resend já existia, com `lucrocaseiro.com.br` verificado na região São Paulo (`sa-east-1`) havia 25 dias e chaves de Sending access já usadas por Supabase SMTP/Onboarding. CORREÇÃO: usar o domínio raiz verificado com `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>`; criar apenas uma nova chave Sending access restrita ao domínio para a API, sem mexer nas chaves existentes nem no DNS. PREVENÇÃO: antes de desenhar configuração externa, pedir/inspecionar primeiro os painéis de Domains e API keys do provedor; presença de variáveis no Railway não prova ausência de configuração em outro serviço.
