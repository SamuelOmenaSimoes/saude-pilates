# Guia de Deploy - Hostinger VPS

## Pré-requisitos

- VPS Hostinger com Ubuntu 22.04
- Node.js 22.x instalado
- MySQL 8.0+ ou TiDB Cloud configurado
- Domínio configurado (opcional)

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz do projeto com:

```bash
# Database
DATABASE_URL="mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}"

# JWT
JWT_SECRET="sua-chave-secreta-aleatoria-aqui"

# Manus OAuth (já configurado)
VITE_APP_ID="seu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"

# Stripe (C6 Bank já configurado)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-api-key"
VITE_FRONTEND_FORGE_API_KEY="sua-frontend-key"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"

# Analytics
VITE_ANALYTICS_ENDPOINT="https://analytics.manus.im"
VITE_ANALYTICS_WEBSITE_ID="seu-website-id"
```

## Passos de Deploy

### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2 para gerenciar processos
npm install -g pm2
```

### 2. Clonar e Configurar Projeto

```bash
# Criar diretório para o projeto
mkdir -p /var/www/saude-pilates
cd /var/www/saude-pilates

# Copiar arquivos do projeto (via FTP, Git, etc)
# Ou fazer upload via painel Hostinger

# Instalar dependências
pnpm install

# Criar arquivo .env com as variáveis acima
nano .env
```

### 3. Configurar Banco de Dados

```bash
# Executar migrações
pnpm db:push

# Popular dados iniciais (se necessário)
node seed-db.mjs
```

### 4. Build do Projeto

```bash
# Fazer build de produção
pnpm build
```

### 5. Configurar PM2

Criar arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'saude-pilates',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Iniciar aplicação:

```bash
# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

### 6. Configurar Nginx como Proxy Reverso

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração do site
sudo nano /etc/nginx/sites-available/saude-pilates
```

Conteúdo do arquivo:

```nginx
server {
    listen 80;
    server_name clinicasaudeepilates.com.br www.clinicasaudeepilates.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar site:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/saude-pilates /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 7. Configurar SSL com Let's Encrypt (Opcional mas Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d clinicasaudeepilates.com.br -d www.clinicasaudeepilates.com.br

# Renovação automática já está configurada
```

### 8. Configurar Webhook do Stripe

No painel do Stripe (https://dashboard.stripe.com/webhooks):

1. Adicionar endpoint: `https://clinicasaudeepilates.com.br/api/stripe/webhook`
2. Selecionar eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
3. Copiar o `webhook secret` e adicionar ao `.env` como `STRIPE_WEBHOOK_SECRET`

## Monitoramento

```bash
# Ver logs em tempo real
pm2 logs saude-pilates

# Ver status da aplicação
pm2 status

# Reiniciar aplicação
pm2 restart saude-pilates

# Parar aplicação
pm2 stop saude-pilates
```

## Backup

```bash
# Fazer backup do banco de dados
mysqldump -u user -p database > backup_$(date +%Y%m%d).sql

# Fazer backup dos arquivos
tar -czf saude-pilates_$(date +%Y%m%d).tar.gz /var/www/saude-pilates
```

## Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs saude-pilates --lines 100

# Verificar variáveis de ambiente
pm2 env 0

# Reiniciar
pm2 restart saude-pilates
```

### Erro de conexão com banco de dados

- Verificar `DATABASE_URL` no `.env`
- Verificar se o banco está acessível
- Verificar firewall/regras de segurança

### Webhook Stripe não funciona

- Verificar se a URL está acessível publicamente
- Verificar `STRIPE_WEBHOOK_SECRET` no `.env`
- Ver logs do Stripe Dashboard

## Integração Stripe Completa

✅ **Já Configurado no Código:**
- Checkout de planos (8 planos disponíveis)
- Checkout de aula avulsa (R$ 60)
- Webhook para confirmar pagamentos automaticamente
- Adição automática de créditos após pagamento
- Criação automática de agendamento para aula avulsa
- Redirecionamento para página de sucesso/cancelamento

**Passos para Ativar Stripe:**

### 1. Reivindicar Sandbox de Teste

Acesse: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xU1l5SVlBRGdpSkVkSWs1LDE3NjUxMjcwODcv100guKH2IGI

**Importante:** Link expira em 2026-01-29. Reivindique o quanto antes!

### 2. Obter Chaves de Teste

No Dashboard Stripe (modo teste):
1. Acesse **Developers → API Keys**
2. Copie:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### 3. Configurar Webhook de Teste

1. Acesse **Developers → Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://clinicasaudeepilates.com.br/api/stripe/webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copie o **Signing secret** (whsec_...)

### 4. Atualizar .env com Chaves de Teste

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 5. Testar Pagamentos

Use cartões de teste do Stripe:
- **Sucesso:** 4242 4242 4242 4242
- **Falha:** 4000 0000 0000 0002
- **Requer autenticação:** 4000 0025 0000 3155
- **Qualquer data futura e CVC (ex: 12/34, 123)**

### 6. Migrar para Produção

Quando estiver pronto para aceitar pagamentos reais:

1. **Ativar conta Stripe:**
   - Complete o cadastro da empresa
   - Adicione informações bancárias (C6 Bank já configurado)
   - Envie documentação necessária

2. **Obter chaves de produção:**
   - Alterne para **modo Live** no Dashboard
   - Copie as chaves de produção (pk_live_... e sk_live_...)

3. **Configurar webhook de produção:**
   - Crie novo endpoint em modo Live
   - Use a mesma URL: `https://clinicasaudeepilates.com.br/api/stripe/webhook`
   - Copie o novo webhook secret

4. **Atualizar .env de produção:**
   ```bash
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   ```

5. **Reiniciar aplicação:**
   ```bash
   pm2 restart saude-pilates
   ```

### 7. Monitorar Pagamentos

- **Dashboard Stripe:** https://dashboard.stripe.com/payments
- **Logs de Webhook:** https://dashboard.stripe.com/webhooks
- **Logs da aplicação:** `pm2 logs saude-pilates`

### 8. Taxas do Stripe no Brasil

- **Cartão de crédito:** 4,99% + R$ 0,99 por transação
- **Parcelamento:** Taxa adicional de 1,99% por parcela
- **Transferências bancárias:** Automáticas a cada 2 dias úteis

### Troubleshooting Stripe

**Pagamento não confirma:**
- Verificar se webhook está recebendo eventos (Dashboard → Webhooks → Logs)
- Verificar `STRIPE_WEBHOOK_SECRET` no `.env`
- Verificar logs: `pm2 logs saude-pilates | grep stripe`

**Erro de chave inválida:**
- Verificar se está usando chaves corretas (test vs live)
- Verificar se chaves não têm espaços extras

**Webhook retorna 401/403:**
- Verificar se URL do webhook está acessível publicamente
- Verificar se HTTPS está configurado (Stripe requer HTTPS)

## Suporte

Para problemas ou dúvidas:
- Email: saudeeppilates@gmail.com
- WhatsApp: (11) 93011-2640
