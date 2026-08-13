---
id: 68454c1f-4223-4871-9643-67bf622b0759
slug: scripts
type: scar
title: PowerShell System.Drawing deve usar construtor tipado para Font
tags: powershell, system.drawing, font, script, overload
provenance: observado
evidence: Falha e correção observadas em 2026-08-12 ao montar folha de contato temporária dos avatares VEED
decay: stable
created: 2026-08-12T15:34:15.608253200+00:00
updated: 2026-08-12T15:34:15.608253200+00:00
validated: 2026-08-12T15:34:15.608253200+00:00
links:
---

FALHA REAL (2026-08-12): `New-Object Drawing.Font 'Arial',24,[Drawing.FontStyle]::Bold` falhou com “Multiple ambiguous overloads” e deixou DrawString sem fonte. CORREÇÃO: usar o construtor tipado explícito `[Drawing.Font]::new('Arial',24,[Drawing.FontStyle]::Bold,[Drawing.GraphicsUnit]::Pixel)` e passar coordenadas `[single]` ao DrawString. COMO EVITAR: para classes .NET com sobrecargas ambíguas no PowerShell, preferir `::new` com todos os tipos/argumentos explícitos.
