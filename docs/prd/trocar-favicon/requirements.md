# Requirements — trocar favicon

## Contexto
O domínio próprio (`condominiomiguelarcanjo.com.br`) já está no ar, mas a aba
do navegador mostra o ícone padrão do Lovable (coração laranja/azul) em vez do
ícone do condomínio. Investigação: `public/icon-192.png` e
`public/icon-512.png` já têm o "M" dourado correto, mas `public/favicon.ico`
ficou com o ícone do template original do Lovable — nunca foi substituído.

## Perguntas em aberto
Nenhuma — usuário só perguntou "como troco a imagem do ícone do site" após
ver o ícone errado na aba.

## Requisitos

- [ ] `public/favicon.ico` passa a conter o ícone do condomínio (o mesmo "M"
      dourado sobre fundo azul-marinho usado em `icon-192.png`/`icon-512.png`),
      não mais o coração do Lovable.
- [ ] A aba do navegador mostra o novo ícone ao carregar
      `https://condominiomiguelarcanjo.com.br` (após rebuild/deploy).

## Fora de escopo
- Redesenhar o ícone/logo em si (usa o "M" já existente nos PNGs).
- Mexer em `manifest.json`, `apple-touch-icon` ou outros metadados — já
  apontam para os PNGs corretos.
