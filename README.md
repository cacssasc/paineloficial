# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Pagamentos Pix com PagPix Hub

Cadastre `PAGPIXHUB_API_KEY` como variável secreta no ambiente do servidor (Vercel: **Project → Settings → Environment Variables**) e habilite-a nos ambientes desejados. Gere a chave em `/dashboard/api-keys` no PagPix Hub. Não coloque essa chave no navegador, no repositório ou em mensagens.

Depois de configurar a chave, aplique a migration `drizzle/migrations/0008_pagpix_hub.sql` ao banco Supabase. O checkout cria a cobrança Pix com chave de idempotência; quando o provedor responde que o código está sendo gerado, a página consulta a transação até o código ficar disponível. O pedido só é marcado como pago após a API retornar `status: PAID`. O cartão continua usando Stripe.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

