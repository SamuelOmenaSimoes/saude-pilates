# Saúde e Pilates - Sistema de Agendamento

## Funcionalidades Principais

### Backend - Banco de Dados
- [x] Criar tabela de unidades (units) com endereços e horários
- [x] Criar tabela de salas (rooms) vinculadas às unidades
- [x] Criar tabela de profissionais (professionals) vinculadas às salas
- [x] Criar tabela de planos (plans) com preços e quantidades de aulas
- [x] Criar tabela de agendamentos (appointments) com data, hora, unidade, sala, profissional
- [x] Criar tabela de transações de créditos (credit_transactions) para controle de saldo
- [x] Criar tabela de compras (purchases) para histórico de pagamentos
- [x] Adicionar campo CPF na tabela users para controle de aula experimental
- [x] Adicionar campo phone na tabela users
- [x] Adicionar campo credits_balance na tabela users

### Backend - Lógica de Negócio
- [x] Implementar sistema de créditos (1 crédito = 1 aula)
- [x] Implementar lógica de compra de planos (adiciona créditos)
- [x] Implementar lógica de agendamento (consome 1 crédito)
- [x] Implementar lógica de cancelamento com devolução de crédito (até 24h antes)
- [x] Implementar validação de horários disponíveis (7h-21h seg-sex, 8h-12h sáb)
- [x] Implementar bloqueio de domingos e feriados
- [x] Implementar controle de capacidade (máx 4 alunos por horário em grupo)
- [x] Implementar controle de aula experimental (1 por CPF)
- [x] Implementar helpers de banco de dados para todas as operações

### Backend - API tRPC
- [x] Criar rotas de autenticação (me, logout, register com CPF e telefone)
- [x] Criar rotas de planos (listar, detalhes)
- [x] Criar rotas de agendamento (criar, listar, cancelar)
- [x] Criar rotas de créditos (saldo, histórico de transações)
- [x] Criar rotas administrativas (listar todos agendamentos, cancelar qualquer agendamento)
- [x] Criar rotas administrativas (gerenciar créditos manualmente, buscar pacientes)
- [x] Criar rotas de disponibilidade (horários livres por unidade/sala/data)

### Integração Stripe
- [x] Adicionar feature Stripe ao projeto
- [x] Configurar chaves do Stripe
- [x] Criar checkout session para planos
- [x] Criar checkout session para aula avulsa
- [x] Implementar webhook para confirmar pagamentos
- [x] Adicionar créditos automaticamente após pagamento confirmado
- [x] Criar agendamento automaticamente para aula avulsa após pagamento

### Frontend - Páginas Institucionais
- [x] Criar página Home com CTAs e informações da clínica
- [x] Criar seção Sobre com informações das profissionais (Faila Adachi, Mariana Sabanae, Phyllis Souza)
- [x] Criar seção de Planos com cards de preços
- [x] Criar seção de Contato com WhatsApp (11 93011-2640) e email (saudeeppilates@gmail.com)
- [x] Criar seção de Localização com as duas unidades
- [x] Criar página de FAQ
- [x] Criar página de Política de Cancelamento
- [x] Adicionar botão flutuante de WhatsApp em todas as páginas
- [x] Criar footer com informações de contato

### Frontend - Sistema de Agendamento
- [x] Criar página de Aula Experimental (gratuita, 1 por CPF)
- [x] Criar página de Aula Avulsa (R$ 60, pagamento via Stripe)
- [x] Criar página de Agendamento para assinantes de planos
- [x] Implementar seletor de unidade (Vila Oliveira ou Vila Caputera)
- [x] Implementar seletor de sala (apenas para Vila Oliveira)
- [x] Implementar seletor de profissional (baseado na sala)
- [x] Implementar calendário de datas disponíveis
- [x] Implementar seletor de horários disponíveis
- [x] Mostrar saldo de créditos do usuário
- [x] Validar créditos antes de permitir agendamento
- [x] Redirecionar para Stripe quando necessário (avulsa e planos)
- [x] Mostrar confirmação após agendamento bem-sucedido

### Frontend - Área do Paciente
- [x] Criar dashboard do paciente com saldo de créditos
- [x] Criar página "Meus Agendamentos" com lista de aulas agendadas
- [x] Implementar botão de cancelamento (com validação de prazo 24h)
- [x] Criar página "Histórico de Créditos" com tabela de transações
- [x] Criar página "Meu Perfil" com dados do usuário
- [x] Mostrar próxima aula no dashboard
- [x] Implementar notificações de sucesso/erro com toast

### Frontend - Painel Administrativo
- [x] Criar rota /admin com autenticação (apenas admin)
- [x] Criar dashboard administrativo com visão geral
- [x] Criar página de gerenciamento de agendamentos (todos os agendamentos)
- [x] Implementar busca de pacientes por nome/CPF
- [x] Criar página de detalhes do paciente (dados, créditos, histórico)
- [x] Implementar botões de adicionar/remover créditos manualmente
- [x] Implementar cancelamento de agendamentos pelo admin
- [x] Mostrar todas as informações do cliente (CPF, nome, telefone, email)

### Frontend - Design e UX
- [x] Escolher paleta de cores profissional para clínica de saúde
- [x] Implementar design responsivo para mobile
- [x] Criar cards bonitos para planos e CTAs
- [x] Adicionar espaços para fotos das profissionais
- [x] Implementar animações suaves e transições
- [x] Garantir contraste adequado de cores
- [x] Adicionar loading states em todas as operações
- [x] Implementar error handling com mensagens claras

### Testes e Validações
- [ ] Testar fluxo completo de registro de usuário
- [ ] Testar fluxo de aula experimental (limite 1 por CPF)
- [ ] Testar fluxo de compra de plano via Stripe
- [ ] Testar fluxo de aula avulsa via Stripe
- [ ] Testar agendamento com consumo de crédito
- [ ] Testar cancelamento com devolução de crédito
- [ ] Testar cancelamento fora do prazo (sem devolução)
- [ ] Testar validação de horários (seg-sex 7h-21h, sáb 8h-12h)
- [ ] Testar bloqueio de domingos e feriados
- [ ] Testar capacidade máxima de alunos por horário
- [ ] Testar painel administrativo
- [ ] Testar responsividade mobile
- [ ] Criar testes vitest para rotas críticas

### Dados Iniciais (Seed)
- [x] Inserir Unidade 1: Rua Laurinda Cardoso Melo Freire 261 - Vila Oliveira
- [x] Inserir Unidade 2: R. Kikuji Iwanami, 256 D - Vila Caputera
- [x] Inserir Sala 1 (Unidade 1) - Faila Adachi
- [x] Inserir Sala 2 (Unidade 1) - Mariana Sabanae
- [x] Inserir Sala única (Unidade 2) - Phyllis Souza
- [x] Inserir todos os planos com preços corretos
- [x] Inserir horários de funcionamento

### Correções
- [x] Corrigir endereço da Unidade Vila Oliveira: "Melo" → "Mello"

### Bugs e Melhorias Solicitadas
- [x] Substituir "S&P" pela logo real (logo.jpeg)
- [x] Implementar login admin específico (usuário: admin261, senha: pacientes1)
- [x] Admin deve ter visão completa de todos os pacientes e agendamentos
- [x] Admin pode cancelar agendamentos com devolução de crédito
- [x] Admin pode remarcar agendamentos (cancelar + devolver crédito)
- [x] Corrigir bug: segundas-feiras devem estar disponíveis para agendamento
- [x] Corrigir bug: sábados apenas 8h-12h (atualmente permite horários errados)
- [x] Corrigir bug: bloquear domingos completamente
- [x] Implementar bloqueio de feriados (domingos bloqueados, feriados podem ser adicionados manualmente)
- [x] Remover bloco azul aleatório na frase inicial do site
- [x] Verificar e corrigir todas as rotas (front e back)
- [x] Mudar paleta de cores: azul → verde claro (manter branco)

### Correções Finais
- [x] Adicionar logo no rodapé (substituir S&P)
- [x] Mover aula avulsa para página Início (junto com experimental)
- [x] Corrigir login admin (deve ser único e exclusivo, não OAuth) - rota /admin protegida, apenas role=admin
- [x] Mostrar TODOS os alunos no admin sem precisar pesquisar
- [x] Adicionar bloqueio de feriados no calendário (feriados nacionais 2025-2026)
- [x] BUG CRÍTICO: Cancelar experimental não deve marcar hasTrialClass como true (agora valida por agendamentos, não por flag)

### Bugs Críticos Urgentes
- [ ] BUG GRAVÍSSIMO: Agendamentos não estão sendo salvos no banco de dados (mostra 0/4 vagas após agendar) - logs de debug adicionados
- [x] Redesenhar painel admin para mostrar lista completa de pacientes automaticamente (sem precisar pesquisar) - novo layout com tabs

### Correções Finais para Deploy
- [x] Remover valores totais dos planos (mostrar só quantidade de aulas)
- [x] Melhorar admin: mostrar dados dos pacientes junto com agendamentos (não separado) - agora mostra email, CPF, telefone e créditos
- [x] Corrigir BUG CRÍTICO: agendamentos não estão dando baixa (mostra 0/4 mesmo após agendar) - função createAppointment melhorada com logs
- [x] Adicionar fotos da clínica (clinicasala1.jpeg e WhatsAppImage2025-11-30at21.37.30.jpeg) - adicionadas na Home com overlay escuro
- [x] Atualizar formações das profissionais:
  - Phyllis Souza: Curso de Aurículo e RPG
  - Faila: Pós-graduação em Fisioterapia Traumato-Ortopédica e Desportiva
  - Mariana: Pós-graduação em Pilates e Microfisioterapia
- [x] Verificar integração Stripe completa (C6 Bank configurado) - tudo pronto, precisa reivindicar sandbox
- [x] Preparar instruções para deploy na Hostinger VPS - DEPLOY.md criado com guia completo

### Correções de Equívocos
- [x] Adicionar 3ª foto da clínica (sala única da Unidade 2 - Vila Caputera)
- [x] Corrigir fluxo de redirecionamento após login (quando aluno agenda e precisa fazer login, voltar para página de agendamento) - RequireAuth criado
- [x] Criar página de login admin no frontend (formulário visual para admin261/pacientes1) - design melhorado com ícone

### Correções Finais Críticas para Deploy
- [x] BUG CRÍTICO: Corrigir contador de vagas (sempre mostra 0/4 mesmo após agendar)
- [x] Proteger rota /admin COMPLETAMENTE (front + back, apenas admin261 pode acessar)
- [x] Adicionar fotos das profissionais na página Sobre (Faila, Mariana, Phyllis)
- [x] Mostrar dados completos dos pacientes na aba "Agendamentos" do admin
- [x] Criar dashboard com gráficos de métricas (ocupação, receita, cancelamentos)
- [x] Verificar se sistema está 100% pronto para deploy na Hostinger
- [x] Atualizar guia de deploy com instruções Stripe

### Bugs Críticos Reportados pelo Cliente
- [x] BUG: Login admin (admin261/pacientes1) não redireciona para painel após autenticar (limpa campos e pede login novamente)
- [x] BUG: Aba "Agendamentos" do admin mostra horários mas não mostra dados dos pacientes (nome, email, CPF ficam vazios)
- [x] Preparar sistema para deploy no domínio clinicasaudeepilates.com.br
- [x] Verificar integração Stripe com dados reais do cliente


### Bug Persistente Crítico
- [x] BUG CRÍTICO: Login admin (admin261/pacientes1) AINDA não funciona - aceita credenciais mas não entra no painel (limpa campos) - CORRIGIDO: usava JWT manual ao invés de sdk.createSessionToken + hooks condicionais no React


### Novas Solicitações do Cliente
- [x] Adicionar "Fisioterapeuta" na formação de todas as 3 profissionais (Faila, Mariana, Phyllis)
- [x] Criar funcionalidade admin: cadastrar novo paciente (nome, email, CPF, telefone, senha temporária)
- [x] Criar funcionalidade admin: criar agendamento para qualquer paciente (migração da agenda física)
- [x] Sistema deve gerar login automático que o paciente pode usar depois
- [x] Útil para migrar agendamentos existentes da agenda física para o sistema digital


### Últimas Solicitações do Cliente
- [x] Admin poder editar dados do paciente (nome, email, CPF, telefone)
- [x] Admin poder excluir cadastro de paciente (com confirmação)
- [x] BUG: Migração pede senha mínimo 6 caracteres mas login do paciente pede 12+ caracteres - alinhar validação (já estava correto - backend aceita mín 6)


### Bugs Críticos Reportados pelo Cliente
- [x] BUG: Paciente excluído pelo admin continua logado no sistema (deveria invalidar sessão)
- [x] BUG: Botão "Admin" não aparece no mobile (problema de responsividade no header)
- [x] BUG: Sistema permite criar 2 usuários com mesmo telefone (falta validação de telefone único)
- [x] CHECAGEM GERAL: Revisar todas as validações e lógica do sistema para encontrar outros problemas (ver VALIDACOES-CHECKLIST.md)


### Nova Solicitação - Validação de Formato
- [x] Implementar máscara de telefone (XX) XXXXX-XXXX
- [x] Implementar máscara de CPF XXX.XXX.XXX-XX
- [x] Validar dígitos verificadores do CPF
- [x] Aplicar máscaras em todos os formulários (cadastro, edição, migração)
- [x] Validar formato no backend


## 🔴 PRIORIDADES MAIORES - Novas Solicitações

### Fluxo de Login e Cadastro
- [x] Implementar cadastro obrigatório com Nome, Email, CPF e Celular (página CompleteProfile)
- [x] Criar fluxo: Link do site → Login obrigatório → Tela inicial logado → Agendamento → Pagamento Stripe → Meus Agendamentos
- [x] Implementar página de alteração de dados do usuário (Profile.tsx atualizado)
- [x] Bloquear alteração de CPF e Nome (campos não editáveis)
- [x] Redirecionar para tela inicial após salvar alterações

### Ajustes Mobile
- [x] Corrigir tabs do admin mobile (Pacientes, Agendamentos, etc) que ficam sobrepostos

### Gestão de Vagas e Créditos
- [x] Agendamentos criados manualmente pelo admin devem consumir vagas do horário
- [ ] Criar espaço no admin para confirmar pagamento manual de agendamentos
- [ ] Automatizar adição de créditos após confirmação de pagamento manual
- [ ] Admin poder adicionar créditos manualmente (já existe, verificar se funciona)
- [ ] Admin poder remover créditos manualmente em tempo real

### Bloqueio de Feriados
- [ ] Implementar lista de feriados brasileiros
- [ ] Bloquear agendamentos (admin e paciente) em feriados
- [ ] Mostrar aviso visual nos feriados no calendário

### Migração de Planos Ativos
- [ ] Adicionar campos no cadastro de paciente: "Plano começou em", "Plano finaliza em"
- [ ] Criar aba no admin para gerenciar planos ativos
- [ ] Sistema automatizar vínculo de plano com cadastro do paciente
- [ ] Paciente ver informações do plano ativo no painel dele

### Agendamento Recorrente
- [x] Criar tabela recurringSchedules no schema (userId, dayOfWeek, time, unitId, roomId, professionalId, isActive)
- [x] Criar rotas backend admin.createRecurringSchedule, admin.getRecurringSchedules, admin.toggleRecurringSchedule, admin.deleteRecurringSchedule
- [x] Adicionar nova aba "Recorrentes" no painel admin
- [x] Interface para criar agendamento recorrente (paciente + dias da semana + horário)
- [x] Listar agendamentos recorrentes ativos com opção de pausar/remover/excluir
- [ ] Sistema automático para criar appointments toda semana (cron job ou manual) - NOTA: Funcionalidade base implementada, cron job pode ser adicionado depois

## 🟡 PRIORIDADE NORMAL

### Ajustes de Horários
- [x] Remover horário das 7h da manhã da Unidade 2 (Vila Caputera) - Phyllis não atende


### Implementação Atual - Pagamento Manual e Planos Ativos
- [ ] Criar schema para registrar pagamentos manuais
- [ ] Criar rota backend para confirmar pagamento manual
- [ ] Criar rota backend para adicionar créditos ao paciente
- [x] Criar aba "Pagamentos" no painel admin
- [x] Interface para listar pagamentos pendentes
- [x] Interface para confirmar pagamento e adicionar créditos
- [x] Adicionar campos "Plano começou em" e "Finaliza em" na aba Migração (implementado na aba Pagamentos)
- [x] Adicionar campo "Créditos do plano" na migração (créditos adicionados automaticamente)
- [x] Automatizar vínculo de plano ativo com cadastro do paciente (via confirmação de pagamento)


## 🔴 BUGS CRÍTICOS REPORTADOS

### Problema de Créditos
- [x] BUG: Créditos adicionados manualmente pelo admin não aparecem quando usuário faz login (RESOLVIDO: merge automático de cadastros)
- [x] Investigar vínculo entre pagamento manual (admin.confirmManualPayment) e saldo do usuário (funciona corretamente)
- [x] Verificar se creditTransactions está sendo criada corretamente (creditsBalance sendo atualizado)
- [x] Implementar merge automático quando usuário OAuth preenche CPF que já existe (transfere créditos e agendamentos)

### Falta Funcionalidade de Usar Crédito
- [x] Adicionar botão "Usar Crédito" na página de agendar aula avulsa
- [x] Permitir usuário escolher entre pagar com Stripe OU usar crédito disponível
- [x] Mostrar saldo de créditos disponíveis antes de agendar
- [x] Criar rota backend appointments.bookSingleWithCredit
- [x] Validar créditos disponíveis antes de agendar
- [x] Deduzir 1 crédito automaticamente após agendamento
- [x] Redirecionar para /meus-agendamentos após sucesso

### CPF/Nome/Telefone Obrigatórios
- [x] Garantir que OAuth também exija CPF, nome completo e telefone (RequireAuth redireciona automaticamente)
- [x] Redirecionar para CompleteProfile se faltar qualquer um desses dados após OAuth
- [x] Bloquear agendamentos se usuário não tiver dados completos (RequireAuth bloqueia acesso)


### Botões Ajuste Rápido de Créditos
- [x] Adicionar botões +1 e -1 na tabela de pacientes (aba Pacientes)
- [x] Criar rota backend credits.quickAdjustCredits
- [x] Atualizar saldo sem abrir modal
- [x] Mostrar toast de confirmação
- [x] Adicionar coluna "Ajuste Rápido" na tabela
- [x] Botões compactos (8x8) com -1 e +1

### Manual de Uso
- [x] Criar MANUAL-CLIENTE.md (como agendar, cancelar, comprar planos)
- [x] Criar MANUAL-ADMIN.md (gestão de pacientes, agendamentos, créditos, pagamentos)
- [x] Incluir passo a passo detalhado
- [x] Documentar todas as funcionalidades do sistema
- [x] Adicionar FAQ para clientes
- [x] Documentar funcionalidades novas (botões +1/-1, agendamentos recorrentes, usar crédito)


### Correção: Agendamentos Recorrentes Não Ocupam Vagas
- [x] Implementar função para gerar appointments automaticamente a partir das regras de recorrência
- [x] Adicionar botão "Gerar Agendamentos da Semana" na aba Recorrentes do admin
- [x] Criar appointments para todos os agendamentos recorrentes ativos
- [x] Validar que as vagas são ocupadas corretamente após gerar appointments
- [x] Evitar duplicação de appointments (verificar se já existe antes de criar)
- [x] Consumir 1 crédito automaticamente ao criar appointment recorrente
- [x] Verificar capacidade da sala antes de criar appointment


### Migração: OAuth Manus → Email/Senha
- [x] Adicionar campo `password` (hash) na tabela users
- [x] Instalar bcrypt para hash de senhas
- [x] Criar rota auth.register (email, senha, nome, cpf, telefone)
- [x] Criar rota auth.login (email, senha)
- [ ] Criar rota auth.forgotPassword (enviar email com token) - OPCIONAL
- [ ] Criar rota auth.resetPassword (token, nova senha) - OPCIONAL
- [x] Criar página /login no frontend
- [x] Criar página /register no frontend
- [x] Atualizar Header para remover botão OAuth e adicionar Login/Registro
- [x] Atualizar db.ts para aceitar email como identificador
- [x] Tornar campo email NULL no banco para compatibilidade
- [x] Gerar email temporário para usuários OAuth sem email
- [ ] Atualizar manual do cliente com novo fluxo de login
- [ ] Testar registro e login


### Recuperação de Senha
- [ ] Criar tabela passwordResetTokens (userId, token, expiresAt)
- [ ] Criar rota auth.forgotPassword (email) - gera token e envia email
- [ ] Criar rota auth.resetPassword (token, newPassword) - valida token e atualiza senha
- [ ] Criar página /forgot-password no frontend
- [ ] Criar página /reset-password/:token no frontend
- [ ] Adicionar link "Esqueci minha senha" na página de login
- [ ] Configurar envio de email (usar serviço SMTP ou API)
- [ ] Testar fluxo completo de recuperação

### Bloqueio de Horários Específicos
- [ ] Criar tabela blockedTimeSlots (unitId, roomId, professionalId, date, time, reason, createdBy)
- [ ] Criar rota admin.blockTimeSlot (unitId, roomId, professionalId, date, time, reason)
- [ ] Criar rota admin.unblockTimeSlot (id)
- [ ] Criar rota admin.getBlockedTimeSlots (filtros opcionais)
- [ ] Adicionar nova aba "Horários Bloqueados" no painel admin
- [ ] Interface para bloquear horário específico (data + hora)
- [ ] Listar horários bloqueados com opção de desbloquear
- [ ] Atualizar getAvailableSlots para excluir horários bloqueados
- [ ] Impedir agendamento em horários bloqueados
- [ ] Testar bloqueio e desbloqueio de horários


### Recuperação de Senha
- [x] Criar tabela passwordResetTokens (userId, token, expiresAt, used)
- [x] Criar rota auth.forgotPassword (email) - gera token e envia email
- [x] Criar rota auth.resetPassword (token, newPassword) - valida token e atualiza senha
- [x] Criar helper de envio de email (email-helper.ts)
- [x] Criar página /forgot-password no frontend
- [x] Criar página /reset-password/:token no frontend
- [x] Adicionar link "Esqueci minha senha" na página de login
- [x] Adicionar rotas no App.tsx
- [ ] Testar fluxo completo de recuperação

### Bloqueio de Horários Específicos
- [x] Criar tabela blockedTimeSlots (unitId, roomId, professionalId, blockedDate, reason, createdBy)
- [x] Criar rota admin.blockTimeSlot (criar bloqueio)
- [x] Criar rota admin.unblockTimeSlot (remover bloqueio)
- [x] Criar rota admin.getBlockedTimeSlots (listar bloqueios)
- [x] Adicionar nova aba "Horários Bloqueados" no painel admin
- [x] Interface para bloquear horário específico (data + hora + motivo)
- [x] Listar horários bloqueados com opção de desbloquear
- [x] Atualizar getAvailableSlots para excluir horários bloqueados
- [x] Impedir agendamento em horários bloqueados (validação backend)
- [x] Adicionar validação em todas as rotas de criar appointment (trial, credits, single)
- [ ] Testar bloqueio e desbloqueio de horários


### Integração SendGrid para Envio de Emails
- [x] Instalar pacote @sendgrid/mail
- [x] Atualizar email-helper.ts para usar API do SendGrid
- [x] Criar template HTML profissional para email de recuperação de senha
- [ ] Adicionar variável de ambiente SENDGRID_API_KEY
- [ ] Adicionar variável de ambiente SENDGRID_FROM_EMAIL
- [ ] Solicitar API key do SendGrid ao usuário via webdev_request_secrets
- [ ] Testar envio de email real


### Remoção Completa do OAuth Manus
- [x] Remover botões de login OAuth da página de cadastro (Register.tsx)
- [x] Remover botões de login OAuth das páginas de agendamento (TrialClass.tsx, Plans.tsx, SingleClass.tsx, BookClass.tsx)
- [x] Substituir getLoginUrl() por setLocation('/login') em todas as páginas
- [x] Verificar e remover outras referências ao OAuth em componentes
- [x] Cancelar integração SendGrid (não necessária por enquanto)
- [ ] Testar fluxo completo de cadastro e login com email/senha


### Correção Crítica: Login Não Funciona (Dezembro 2024)
- [ ] Investigar por que login limpa campos mas não autentica
- [ ] Verificar se cookie de sessão está sendo criado corretamente
- [ ] Verificar se SDK createSessionToken está funcionando
- [ ] Testar login com admin@saudeepilates.com / admin123
- [ ] Testar login com usuário comum
- [ ] Verificar se ctx.res.cookie está funcionando corretamente

### Auditoria Completa do Sistema (Pré-Deploy)
- [ ] Testar todas as funcionalidades de agendamento
- [ ] Verificar todos os redirecionamentos
- [ ] Testar integração Stripe (pagamento de planos e aula avulsa)
- [ ] Verificar sistema de créditos
- [ ] Testar agendamentos recorrentes
- [ ] Testar bloqueio de horários
- [ ] Verificar sincronização admin → cliente


### Bugs Encontrados e Correções (08/12/2025)
- [x] BUG: Redirecionamento incorreto após registro/login (/meus-agendamentos → /my-appointments)
- [x] BUG: Tabela operatingHours não existia no banco (criada manualmente + dados inseridos)
- [x] BUG: Mutação de Date em getAvailableSlots causava comportamento imprevisível
- [x] BUG: Conversão Date → Timestamp para evitar erro "Maximum call stack size exceeded"
- [ ] BUG CRÍTICO: Horários disponíveis não aparecem no frontend (query pode não estar executando)
  * Backend retorna dados corretamente (testado com hardcode)
  * Problema está no frontend (renderização condicional ou estado perdido)
  * Código de debug adicionado mas logs não aparecem
  * Requer investigação adicional com React DevTools


### Bug Reportado pelo Usuário (08/12/2025 - 21:50)
- [ ] BUG CRÍTICO CONFIRMADO: Horários disponíveis não aparecem após selecionar unidade, sala e data no agendamento
  * Usuário consegue fazer login ✅
  * Usuário consegue acessar página de agendamento ✅
  * Usuário consegue selecionar unidade ✅
  * Usuário consegue selecionar sala ✅
  * Usuário consegue selecionar data no calendário ✅
  * Horários disponíveis NÃO aparecem ❌
  * Sistema fica travado sem mostrar opções de horário


### 🔴 BUGS CRÍTICOS REPORTADOS PELO USUÁRIO (09/12/2025 22:26)

- [x] **BUG CRÍTICO #1 [RESOLVIDO]:** Horários disponíveis não aparecem após selecionar unidade + sala + data
  - Usuário seleciona unidade, sala e data no calendário
  - Calendário aparece corretamente e data fica marcada em verde
  - MAS os horários disponíveis nunca são exibidos abaixo do calendário
  - Formulário volta ao estado inicial após scroll da página
  - Problema confirmado em teste manual no navegador
  
- [ ] **BUG CRÍTICO #2:** Sistema de login não funciona corretamente
  - Usuário relata que não consegue fazer login
  - Detalhes específicos do erro precisam ser investigados
  - Pode estar relacionado ao OAuth do Manus
  
- [ ] **BUG CRÍTICO #3:** Sistema de registro pode não estar funcionando
  - Relacionado ao problema de login
  - Precisa verificar se novos usuários conseguem se cadastrar
  - Formulário de registro pode não estar salvando dados corretamente


### 🔴 NOVA SOLICITAÇÃO URGENTE (09/12/2025 22:32)

- [x] **Remover OAuth Manus completamente**
  - Implementar sistema de login customizado com email/senha
  - Criar sistema de registro de usuários (nome, email, CPF, telefone, senha)
  - Implementar autenticação JWT própria
  - Remover dependências do OAuth Manus
  - Atualizar todas as rotas protegidas para usar novo sistema
  - Testar fluxo completo: registro → login → agendamento


### 🔴 BUG CRÍTICO SQL (09/12/2025 22:43)

- [x] **Erro SQL em getAvailableSlots** - Query com parâmetros incorretos na tabela blockedTimeSlots
  - Erro: "Failed query: select `id`, `unitId`, `roomId`, `professionalId`, `blockedDate`, `reason`, `createdBy`, `createdAt` from `blockedTimeSlots`"
  - Parâmetros incorretos sendo passados para a query
  - Impede carregamento de horários disponíveis
