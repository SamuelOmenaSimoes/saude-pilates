# ✅ Checklist de Deploy - Hostinger VPS

## Pré-Deploy (Preparação)

### 1. Stripe - Configuração Inicial
- [ ] Reivindicar sandbox em: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xU1l5SVlBRGdpSkVkSWs1LDE3NjUxMjcwODcv100guKH2IGI
- [ ] Acessar Dashboard Stripe (modo teste)
- [ ] Copiar chaves de teste:
  - [ ] Publishable key (pk_test_...)
  - [ ] Secret key (sk_test_...)
- [ ] Criar webhook de teste apontando para: `https://clinicasaudeepilates.com.br/api/stripe/webhook`
- [ ] Selecionar eventos: `checkout.session.completed` e `payment_intent.succeeded`
- [ ] Copiar Webhook Secret (whsec_...)

### 2. Banco de Dados
- [ ] Criar banco MySQL 8.0+ ou TiDB Cloud
- [ ] Anotar credenciais: host, port, user, password, database
- [ ] Testar conexão remota
- [ ] Copiar string de conexão: `mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}`

### 3. Domínio
- [ ] Apontar DNS de **clinicasaudeepilates.com.br** para IP do VPS Hostinger
- [ ] Apontar DNS de **www.clinicasaudeepilates.com.br** para IP do VPS Hostinger
- [ ] Aguardar propagação DNS (pode levar até 48h)

---

## Deploy no Servidor

### 4. Preparar Servidor Hostinger
```bash
# Conectar via SSH
ssh root@seu-ip-hostinger

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2
npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y
```

### 5. Fazer Upload do Projeto
```bash
# Criar diretório
mkdir -p /var/www/saude-pilates
cd /var/www/saude-pilates

# Fazer upload via FTP/SFTP ou Git
# Opção 1: Upload via painel Hostinger
# Opção 2: Git clone (se tiver repositório)
```

### 6. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env na raiz do projeto
nano /var/www/saude-pilates/.env
```

Copiar e preencher:
```bash
# Database
DATABASE_URL="mysql://user:password@host:port/database?ssl={\"rejectUnauthorized\":true}"

# JWT
JWT_SECRET="sua-chave-secreta-aleatoria-aqui-min-32-caracteres"

# Manus OAuth (já configurado)
VITE_APP_ID="seu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"

# Stripe (TESTE)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-api-key"
VITE_FRONTEND_FORGE_API_KEY="sua-frontend-key"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"

# Analytics
VITE_ANALYTICS_ENDPOINT="https://analytics.manus.im"
VITE_ANALYTICS_WEBSITE_ID="seu-website-id"
```

### 7. Instalar Dependências e Build
```bash
cd /var/www/saude-pilates

# Instalar dependências
pnpm install

# Executar migrações do banco
pnpm db:push

# Build de produção
pnpm build
```

### 8. Configurar PM2
```bash
# Criar arquivo ecosystem.config.js
nano ecosystem.config.js
```

Conteúdo:
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

```bash
# Criar diretório de logs
mkdir -p logs

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
```

### 9. Configurar Nginx
```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/saude-pilates
```

Conteúdo:
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

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/saude-pilates /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 10. Configurar SSL (HTTPS)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d clinicasaudeepilates.com.br -d www.clinicasaudeepilates.com.br

# Seguir instruções na tela
# Escolher opção 2 para redirecionar HTTP para HTTPS automaticamente
```

---

## Pós-Deploy (Testes)

### 11. Testar Sistema
- [ ] Acessar https://clinicasaudeepilates.com.br
- [ ] Verificar se site carrega corretamente
- [ ] Testar login admin: admin261 / pacientes1
- [ ] Verificar painel admin (pacientes, agendamentos, métricas)
- [ ] Criar conta de teste (usar CPF fictício: 111.111.111-11)
- [ ] Testar aula experimental gratuita
- [ ] Testar compra de plano com cartão teste: 4242 4242 4242 4242
- [ ] Verificar se créditos foram adicionados após pagamento
- [ ] Testar agendamento de aula usando créditos
- [ ] Verificar webhook do Stripe em: https://dashboard.stripe.com/webhooks

### 12. Monitoramento
```bash
# Ver logs em tempo real
pm2 logs saude-pilates

# Ver status
pm2 status

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## Migração para Produção (Stripe Real)

### 13. Ativar Stripe Produção
- [ ] Completar cadastro da empresa no Stripe
- [ ] Adicionar informações bancárias (C6 Bank)
- [ ] Enviar documentação necessária
- [ ] Aguardar aprovação do Stripe
- [ ] Alternar para modo **Live** no Dashboard
- [ ] Copiar chaves de produção:
  - [ ] Publishable key (pk_live_...)
  - [ ] Secret key (sk_live_...)
- [ ] Criar webhook de produção: `https://clinicasaudeepilates.com.br/api/stripe/webhook`
- [ ] Copiar novo Webhook Secret (whsec_...)

### 14. Atualizar .env com Chaves de Produção
```bash
# Editar .env no servidor
nano /var/www/saude-pilates/.env
```

Substituir chaves de teste por chaves de produção:
```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

```bash
# Reiniciar aplicação
pm2 restart saude-pilates
```

### 15. Testar Pagamentos Reais
- [ ] Fazer compra de plano com cartão real (valor baixo)
- [ ] Verificar se pagamento foi processado
- [ ] Verificar se créditos foram adicionados
- [ ] Verificar se dinheiro entrou na conta bancária (2 dias úteis)

---

## Backup e Manutenção

### 16. Configurar Backups Automáticos
```bash
# Criar script de backup
nano /var/www/saude-pilates/backup.sh
```

Conteúdo:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/saude-pilates"
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u user -p'password' database > $BACKUP_DIR/db_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/saude-pilates

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Dar permissão de execução
chmod +x /var/www/saude-pilates/backup.sh

# Adicionar ao cron (executar diariamente às 3h)
crontab -e
# Adicionar linha:
0 3 * * * /var/www/saude-pilates/backup.sh
```

---

## Contatos de Suporte

- **Email:** saudeeppilates@gmail.com
- **WhatsApp:** (11) 93011-2640
- **Domínio:** clinicasaudeepilates.com.br
- **Stripe Dashboard:** https://dashboard.stripe.com

---

## Comandos Úteis

```bash
# Reiniciar aplicação
pm2 restart saude-pilates

# Ver logs
pm2 logs saude-pilates

# Parar aplicação
pm2 stop saude-pilates

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status do Nginx
sudo systemctl status nginx

# Renovar SSL manualmente (se necessário)
sudo certbot renew
```
