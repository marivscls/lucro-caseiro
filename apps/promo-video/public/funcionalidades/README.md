# Materiais de divulgação

Imagens e vídeos das funcionalidades do Lucro Caseiro, incluindo versões para edição e versões finais com voz natural.

Os MP4 desta pasta usam Git LFS, pois há um vídeo que excede o limite de tamanho de arquivo do GitHub. As imagens continuam no Git comum.

Para obter os vídeos após clonar o projeto, com Git LFS instalado:

```sh
git lfs install --local --skip-repo
git lfs pull
```

O hook de pre-push envia os objetos LFS e executa as verificações habituais do projeto. Não substitua o hook do Husky ao configurar Git LFS.
