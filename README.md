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
   ```  ```bash
   git clone <url-do-repositorio>
   cd saude-pilates
   npm install
   ```
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

### Logs em produção

No modo produção (`npm start`), o servidor duplica tudo que vai para `console.*` para um arquivo de texto (além do stdout/stderr).

**Onde fica o arquivo**

- **Padrão:** pasta temporária do sistema, arquivo `saude-pilates-server.log`.
  - Linux/macOS: em geral `/tmp/saude-pilates-server.log`
  - Windows: pasta retornada pela variável de ambiente `TEMP` ou `TMP`
- **Personalizar o caminho:** defina `SERVER_LOG_FILE` no `.env` (caminho absoluto recomendado, por exemplo `/var/log/saude-pilates/server.log`).
- **Desligar o arquivo:** `SERVER_LOG_TO_FILE=false`

**Como ver ou baixar**

- **Na mesma máquina:** `tail -f /tmp/saude-pilates-server.log` (ajuste o caminho se usar `SERVER_LOG_FILE`).
- **SSH:** copie para sua máquina com `scp`, por exemplo:
  `scp usuario@servidor:/tmp/saude-pilates-server.log ./server.log`
- **Docker:** use o caminho **dentro do container** (o padrão continua sendo `/tmp/saude-pilates-server.log` salvo se você definir `SERVER_LOG_FILE`):
  `docker cp <nome_ou_id_do_container>:/tmp/saude-pilates-server.log ./server.log`  
  Se montar um volume no diretório do log, o arquivo também fica acessível no host nesse caminho.

## Scripts

| Comando           | Descrição                               |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Sobe o servidor em modo desenvolvimento |
| `npm run build`   | Gera build do frontend e do servidor    |
| `npm start`       | Sobe o servidor em produção             |
| `npm run db:push` | Gera e aplica migrações Drizzle         |
| `npm run check`   | Verifica tipos TypeScript               |
| `npm test`        | Roda os testes                          |
