# Landing page VSL — Double educativo

Landing page estática e responsiva, pronta para publicar na Vercel. O vídeo vertical da VTurb já está integrado. O acesso ao grupo e os depoimentos aparecem somente depois que a pessoa chega aos 30 segundos do vídeo. Depois dessa liberação, a página também pode exibir uma chamada para o grupo quando o visitante tenta sair pelo topo no computador ou usa o botão de voltar.

## Personalização rápida

Abra `dist/site-config.js` e altere:

- `vturbPlayerId` e `vturbScriptUrl`: identificadores do player VTurb já configurado.
- `videoUrl`: alternativa para usar um arquivo de vídeo direto caso o VTurb seja removido.
- `whatsappUrl`: link de convite do grupo ou link `wa.me`.
- `minimumWatchSeconds`: tempo assistido necessário. O valor padrão é `30`.
- `testimonials`: lista dos prints de depoimentos. Coloque as imagens em `dist/assets` e informe os caminhos.

Exemplo:

```js
window.SITE_CONFIG = {
  vturbPlayerId: "vid-6aa2fafd05e033a1202ee712",
  vturbScriptUrl: "https://scripts.converteai.net/SEU-PLAYER/player.js",
  videoUrl: "",
  whatsappUrl: "https://chat.whatsapp.com/HqjDLpx1ct72QsKxSuqAOw",
  minimumWatchSeconds: 30,
  testimonials: [
    "./assets/depoimento-01.webp",
    "./assets/depoimento-02.webp",
    "./assets/depoimento-03.webp",
  ],
};
```

## Publicação

Suba toda esta pasta para um repositório no GitHub e importe o repositório na Vercel. O arquivo `vercel.json` já informa que a pasta publicada é `dist`.

Não há dependências, instalação ou etapa de build.
