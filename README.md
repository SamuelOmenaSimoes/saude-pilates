# Saúde e Pilates — Sistema de Agendamento

Sistema de agendamento de aulas para o estúdio Saúde e Pilates. Inclui cadastro de pacientes, planos e créditos de aulas, agendamento por unidade/sala/profissional, pagamentos via Stripe e painel administrativo.

## Stack

- **Backend:** Node.js, Express, tRPC, Drizzle ORM (MySQL)
- **Frontend:** React, Vite, Tailwind CSS
- **Pagamentos:** Stripe (checkout e webhooks)

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v24+)
- MySQL (local ou remoto)

## Configuração

1. **Clonar e instalar dependências**

   ```bash
   git clone <url-do-repositorio>
   cd saude-pilates
   npm install
   ```

2. **Variáveis de ambiente**

   Crie um arquivo `.env` na raiz do projeto. Exemplo mínimo:

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/saude_pilates"
   JWT_SECRET="sua-chave-secreta-jwt"
   ```

   Para pagamentos e e-mail (opcional em desenvolvimento):

   ```env
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SENDGRID_API_KEY=SG....
   SENDGRID_FROM_EMAIL=noreply@seudominio.com
   ```

3. **Banco de dados**

   Crie o banco MySQL e rode as migrações:

   ```bash
   npm run db:push
   ```

## Como rodar

**Desenvolvimento** (servidor + Vite com hot reload na porta 3000):

```bash
npm run dev
```

Acesse: **http://localhost:3000**

**Produção** (build e servidor):

```bash
npm run build
npm start
```

O servidor usa a porta definida em `PORT` no `.env` ou **3000** por padrão.

## Scripts

| Comando        | Descrição                               |
| -------------- | --------------------------------------- |
| `npm run dev`     | Sobe o servidor em modo desenvolvimento |
| `npm run build`   | Gera build do frontend e do servidor    |
| `npm start`       | Sobe o servidor em produção             |
| `npm run db:push` | Gera e aplica migrações Drizzle         |
| `npm run check`   | Verifica tipos TypeScript               |
| `npm test`        | Roda os testes                          |
