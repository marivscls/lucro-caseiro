# Patches de seguranca de dependencias

Os patches sao aplicados pelo pnpm via `pnpm.patchedDependencies` e ficam
vinculados ao hash no `pnpm-lock.yaml`. Validar apos qualquer atualizacao com:

```sh
node --test scripts/security-dependency-patches.test.mjs
```

## image-size 1.2.1

- Advisories: [ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) e
  [JXL/HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq).
- Em 2026-09-10, o registro npm ainda nao disponibiliza uma versao corrigida.
- O patch valida o cabecalho e o tamanho minimo das entradas ICNS. Para caixas
  ISO BMFF, exige um cabecalho completo e normaliza tamanho zero para o restante
  do arquivo antes de retornar a caixa, garantindo que o consumidor avance.
- As provas de regressao reproduziram loop infinito em ICNS e JXL no pacote
  original, em processos filhos encerrados apos dois segundos. O pacote corrigido
  rejeita essas entradas e continua lendo ICNS e PNG validos.
- A dependencia chega pelo Metro, durante leitura de assets locais no build/dev
  do Expo. Um arquivo malformado com extensao de imagem aceita pelo Metro pode
  acionar o parser, pois o formato e detectado pelo conteudo. Nao e o parser
  utilizado pelo servidor Next, que usa `sharp` (atualizado para 0.35.4).
- Licenca MIT original preservada no pacote.

## decode-uri-component 0.2.2

- Advisory: [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
- O decoder linear foi extraido do `index.js` da distribuicao oficial
  `decode-uri-component@0.5.0` no npm, sob MIT. A licenca original e a licenca
  dessa versao possuem a mesma atribuicao e foram preservadas.
- O backport substitui apenas o algoritmo recursivo, mantendo `module.exports`,
  conversao de `+` para espaco e o restante do contrato da versao 0.2.2.
  A atualizacao direta para 0.5.0 introduziria ESM em uma dependencia CommonJS
  de `query-string`, usada pelo React Navigation/Expo Router.
- O teste com 10.000 bytes percent-encoded invalidos reproduziu estouro de pilha
  no original e concluiu com a resposta esperada apos o patch. Tambem verifica
  UTF-8 valido, sequencias incompletas, BOM, sinal de mais e entrada nao textual.

O `pnpm audit` consulta versoes no registro e continua listando estes tres
advisories, sem inspecionar os patches locais. Nenhum advisory foi silenciado.
O gate `pnpm security:audit` preserva o JSON original em um diretorio temporario
e informa seu caminho. Ele aceita estes advisories como mitigados somente quando
o pacote, a versao e o identificador correspondem exatamente, o SHA-256 do patch
e os hashes dos arquivos instalados correspondem ao codigo revisado, todas as
referencias no lockfile usam o patch e os testes de regressao passam. A verificacao
segue cada caminho de dependencia informado pelo audit ate o pacote instalado.
Qualquer falha de verificacao bloqueia o gate; advisories novos high/critical
continuam bloqueando. `pnpm security:patches` tambem testa essa politica.
Remover os patches somente ao atualizar para versoes compativeis corrigidas,
executando novamente os testes de regressao e os builds.
