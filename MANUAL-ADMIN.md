# Manual do Administrador - Clínica Saúde e Pilates

**Manual completo para gestão do sistema de agendamento**

Este manual foi criado para auxiliar os administradores da Clínica Saúde e Pilates na gestão completa do sistema. Aqui você encontrará instruções detalhadas sobre como gerenciar pacientes, agendamentos, créditos, pagamentos e muito mais.

---

## 1. Acesso ao Painel Administrativo

### 1.1 Como fazer login como admin

1. Acesse **clinicasaudeepilates.com.br/admin-login**
2. Faça login com sua conta autorizada (Google, Microsoft, etc.)
3. **Apenas usuários com role "admin" podem acessar o painel**
4. Se você não tiver permissão, será redirecionado automaticamente

### 1.2 Promover usuário a admin

Para promover um usuário comum a administrador:

1. Acesse o **banco de dados** através do painel de gerenciamento
2. Localize o usuário na tabela `users`
3. Altere o campo `role` de `"user"` para `"admin"`
4. Salve as alterações

**Atenção:** Apenas administradores de sistema devem ter acesso ao banco de dados.

---

## 2. Visão Geral do Painel Admin

O painel administrativo possui **7 abas principais**:

1. **Pacientes** - Gerenciar cadastros de pacientes
2. **Agendamentos** - Visualizar e gerenciar todos os agendamentos
3. **Hoje** - Ver agendamentos do dia atual
4. **Métricas** - Estatísticas e relatórios
5. **Migração** - Cadastrar pacientes e agendamentos manualmente
6. **Pagamentos** - Confirmar pagamentos manuais (dinheiro, PIX, transferência)
7. **Recorrentes** - Configurar agendamentos fixos semanais

---

## 3. Aba: Pacientes

Nesta aba você pode visualizar, buscar, editar e gerenciar todos os pacientes cadastrados.

### 3.1 Buscar pacientes

1. Use a **barra de busca** no topo da aba
2. Digite nome, email ou CPF
3. A lista será filtrada automaticamente

### 3.2 Visualizar lista de pacientes

A tabela exibe:
- **Nome**
- **Email**
- **CPF**
- **Telefone**
- **Créditos** (saldo atual)
- **Ajuste Rápido** (botões +1 e -1)
- **Ver Detalhes** (botão para abrir ficha completa)

### 3.3 Ajustar créditos rapidamente (Botões +1 / -1)

**Novidade:** Agora você pode ajustar créditos diretamente na tabela, sem abrir modais!

1. Na coluna **"Ajuste Rápido"**, clique em:
   - **-1** para remover 1 crédito
   - **+1** para adicionar 1 crédito
2. O saldo será atualizado instantaneamente
3. Um toast de confirmação aparecerá
4. A transação será registrada no histórico com descrição "Ajuste rápido: +1 crédito(s)" ou "Ajuste rápido: -1 crédito(s)"

**Quando usar:**
- Para correções rápidas de saldo
- Para ajustes pontuais sem precisar abrir a ficha do paciente
- Para compensar aulas perdidas ou bônus

### 3.4 Ver detalhes do paciente

1. Clique no botão **"Ver Detalhes"** ao lado do paciente
2. Será exibida a **ficha completa** com:
   - **Dados pessoais** (nome, email, CPF, telefone)
   - **Saldo de créditos**
   - **Histórico de agendamentos**
   - **Histórico de créditos** (todas as transações)
   - **Histórico de compras** (planos comprados)

### 3.5 Editar dados do paciente

Na ficha do paciente:

1. Edite os campos desejados:
   - **Nome**
   - **Email**
   - **CPF** (formato: 000.000.000-00)
   - **Telefone** (formato: (00) 00000-0000)
2. Clique em **"Salvar Alterações"**

**Validações:**
- CPF deve ser válido (11 dígitos)
- Telefone deve ter 10 ou 11 dígitos
- Email deve ser válido

### 3.6 Ajustar créditos manualmente (Modal)

Além dos botões +1/-1, você pode fazer ajustes maiores:

1. Na ficha do paciente, vá até a seção **"Ajustar Créditos"**
2. Digite a **quantidade** (use negativo para remover, ex: -5)
3. Digite o **motivo** (ex: "Bônus de fidelidade", "Correção de erro")
4. Clique em **"Ajustar Créditos"**
5. O saldo será atualizado e a transação registrada no histórico

### 3.7 Excluir paciente

**Atenção:** Esta ação é irreversível!

1. Na ficha do paciente, clique em **"Excluir Paciente"**
2. Confirme a exclusão
3. **Todos os dados do paciente serão removidos**, incluindo:
   - Agendamentos
   - Histórico de créditos
   - Histórico de compras

**Use com cautela!** Recomenda-se apenas em casos de cadastros duplicados ou testes.

---

## 4. Aba: Agendamentos

Visualize e gerencie todos os agendamentos do sistema.

### 4.1 Visualizar agendamentos

A lista exibe:
- **Nome do paciente**
- **Email, CPF, telefone e créditos**
- **Data e horário**
- **Unidade, sala e profissional**
- **Status** (Agendado, Concluído, Cancelado)
- **Tipo** (Experimental, Plano, Avulsa)
- **Botão de ações** (Cancelar, Marcar como Concluído)

### 4.2 Cancelar agendamento

1. Clique no botão **"Cancelar"** ao lado do agendamento
2. Confirme o cancelamento

**Política de cancelamento:**
- Se cancelado com **24h ou mais de antecedência**, o crédito é **devolvido**
- Se cancelado com **menos de 24h**, o crédito **não é devolvido**
- Aulas experimentais **não devolvem crédito**

### 4.3 Marcar como concluído

1. Clique no botão **"Marcar como Concluído"**
2. O status mudará para **"Concluído"**
3. Se for aula experimental, o campo `hasTrialClass` do usuário será marcado como `true`

---

## 5. Aba: Hoje

Exibe apenas os **agendamentos do dia atual**, facilitando a gestão diária.

### 5.1 Funcionalidades

- Mesmas funcionalidades da aba "Agendamentos"
- Filtro automático para **data = hoje**
- Ideal para check-in de alunos

---

## 6. Aba: Métricas

Visualize estatísticas e relatórios do sistema.

### 6.1 Métricas disponíveis

#### 6.1.1 Ocupação por Horário

Gráfico de barras mostrando quantas aulas foram agendadas em cada horário do dia.

**Utilidade:**
- Identificar horários de pico
- Planejar alocação de profissionais
- Ajustar preços para horários menos populares

#### 6.1.2 Receita Mensal

Gráfico de linhas mostrando a receita dos últimos 12 meses.

**Utilidade:**
- Acompanhar crescimento financeiro
- Identificar sazonalidades
- Planejar campanhas de marketing

#### 6.1.3 Resumo Geral

Cards com:
- **Total de pacientes** cadastrados
- **Total de agendamentos** realizados
- **Receita total** acumulada
- **Créditos em circulação** (soma de todos os saldos de pacientes)

---

## 7. Aba: Migração

Use esta aba para **cadastrar pacientes e agendamentos manualmente**, facilitando a transição da agenda física para o sistema digital.

### 7.1 Criar paciente e agendamento

1. **Selecione um paciente existente** OU **crie um novo**:
   - Nome completo
   - Email (será o login)
   - CPF (formato: 000.000.000-00)
   - Telefone (formato: (00) 00000-0000)
2. Selecione **unidade, sala, data e horário**
3. Marque **"É aula experimental?"** se aplicável
4. Clique em **"Criar Paciente e Agendar"**

**Validações:**
- CPF deve ser único no sistema
- Email deve ser único
- Telefone e CPF devem ser válidos

**Importante:** Se o paciente já existir, apenas o agendamento será criado.

---

## 8. Aba: Pagamentos

Confirme pagamentos recebidos em **dinheiro, PIX ou transferência** e adicione créditos automaticamente.

### 8.1 Confirmar pagamento manual

1. Selecione o **paciente**
2. Selecione o **plano** (os créditos do plano serão adicionados automaticamente)
3. Selecione o **método de pagamento**:
   - Dinheiro
   - PIX
   - Transferência
4. (Opcional) Adicione **observações** (ex: "Pagamento recebido em 02/01/2025")
5. (Opcional) Defina **data de início** e **data de término** do plano
6. Clique em **"Confirmar Pagamento"**

**O que acontece:**
- Os **créditos do plano** são adicionados ao saldo do paciente
- Uma **transação de crédito** é criada no histórico
- Um **registro de pagamento manual** é salvo no sistema
- O paciente pode começar a usar os créditos imediatamente

### 8.2 Visualizar histórico de pagamentos manuais

Abaixo do formulário, você verá uma lista com:
- **Paciente** (nome e email)
- **Plano** (nome e quantidade de créditos)
- **Valor pago**
- **Método de pagamento**
- **Data de confirmação**
- **Admin responsável**
- **Observações**

---

## 9. Aba: Recorrentes

**Novidade:** Configure agendamentos automáticos para pacientes em dias fixos da semana.

### 9.1 O que são agendamentos recorrentes?

São agendamentos fixos que se repetem toda semana. Por exemplo:
- Paciente João sempre vem às **terças e quintas às 9h**
- Paciente Maria sempre vem às **segundas, quartas e sextas às 18h**

### 9.2 Como criar um agendamento recorrente

1. Selecione o **paciente**
2. Selecione **unidade e sala**
3. O **profissional** será exibido automaticamente
4. Selecione o **horário** (ex: 09:00)
5. Selecione os **dias da semana** (clique nos botões para marcar/desmarcar):
   - Segunda
   - Terça
   - Quarta
   - Quinta
   - Sexta
   - Sábado
6. Clique em **"Criar Agendamento Recorrente"**

**O que acontece:**
- O sistema cria um registro para cada dia selecionado
- Exemplo: Se você selecionar "Terça" e "Quinta", serão criados 2 registros recorrentes

### 9.3 Visualizar agendamentos recorrentes

A lista exibe:
- **Nome do paciente** e email
- **Dia da semana** (ex: Terça)
- **Horário** (ex: 09:00)
- **Unidade, sala e profissional**
- **Status** (✅ Ativo ou ⏸️ Pausado)
- **Botões de ação**:
  - **Pausar/Ativar** - Desativa temporariamente o agendamento recorrente
  - **Excluir** - Remove permanentemente o agendamento recorrente

### 9.4 Pausar ou ativar agendamento recorrente

1. Clique no botão **"Pausar"** para desativar temporariamente
2. O status mudará para **⏸️ Pausado**
3. Para reativar, clique em **"Ativar"**

**Quando pausar:**
- Paciente está de férias
- Paciente mudou de horário temporariamente
- Sala está em manutenção

### 9.5 Excluir agendamento recorrente

1. Clique no botão **"Excluir"**
2. Confirme a exclusão
3. O agendamento recorrente será removido permanentemente

**Atenção:** Esta ação não cancela agendamentos já criados, apenas remove a regra de recorrência.

### 9.6 Como funciona o sistema de recorrência?

**Importante:** O sistema de agendamento recorrente **não cria automaticamente os appointments** toda semana. Ele apenas armazena as **regras de recorrência**.

Para criar os appointments automaticamente, você tem duas opções:

#### Opção 1: Criar manualmente toda semana
1. Acesse a aba "Recorrentes"
2. Veja a lista de agendamentos recorrentes ativos
3. Use a aba "Migração" para criar os appointments manualmente

#### Opção 2: Implementar cron job (futuro)
Um desenvolvedor pode adicionar um script que roda toda semana e cria os appointments automaticamente com base nas regras de recorrência.

---

## 10. Gestão de Unidades, Salas e Profissionais

### 10.1 Unidades cadastradas

- **Centro Mogi** - Rua Laurinda Cardoso Mello Freire, 261 - Vila Oliveira
- **Vila Caputera** - R. Kikuji Iwanami, 256 D

### 10.2 Salas cadastradas

- **Centro Mogi - Sala 1**
- **Centro Mogi - Sala 2**
- **Vila Caputera - Sala Única**

### 10.3 Profissionais cadastrados

- **Saúde e Pilates** (profissional padrão)

**Nota:** Para adicionar novas unidades, salas ou profissionais, é necessário acessar o banco de dados ou criar uma interface de cadastro.

---

## 11. Gestão de Planos

### 11.1 Planos cadastrados

Os planos são definidos apenas pela **quantidade de aulas** (créditos). Não há data de validade.

**Exemplos de planos:**
- 4 aulas
- 8 aulas
- 12 aulas
- 16 aulas

### 11.2 Como criar um novo plano

1. Acesse o banco de dados
2. Insira um novo registro na tabela `plans` com:
   - `name` - Nome do plano (ex: "Plano 8 Aulas")
   - `credits` - Quantidade de créditos (ex: 8)
   - `priceInCents` - Preço em centavos (ex: 40000 para R$ 400,00)
   - `description` - Descrição (opcional)
3. Salve o registro

**Nota:** Uma interface de cadastro de planos pode ser desenvolvida no futuro.

---

## 12. Horários de Funcionamento

### 12.1 Horários cadastrados

- **Segunda a Sexta:** 7h às 21h (intervalos de 1 hora)
- **Sábado:** 8h às 12h
- **Domingo:** Fechado

**Exceção:** Vila Caputera inicia às 8h (não tem horário das 7h).

### 12.2 Capacidade por horário

- Cada horário comporta até **4 alunos**
- Quando 4 alunos estão agendados, o horário fica **indisponível**

---

## 13. Sistema de Créditos

### 13.1 Como funcionam os créditos

- Cada **aula agendada** consome **1 crédito**
- Créditos são adicionados ao comprar **planos** ou **aulas avulsas**
- Créditos podem ser ajustados manualmente pelo admin
- **Não há data de validade** para os créditos

### 13.2 Tipos de transações de crédito

- **plan_purchase** - Compra de plano via Stripe
- **manual_payment** - Pagamento manual confirmado pelo admin
- **appointment_booking** - Agendamento de aula (debita 1 crédito)
- **appointment_cancellation** - Cancelamento com devolução (credita 1 crédito)
- **manual_adjustment** - Ajuste manual pelo admin
- **single_class_purchase** - Compra de aula avulsa via Stripe

### 13.3 Política de devolução de créditos

- **Cancelamento com 24h ou mais de antecedência:** Crédito devolvido
- **Cancelamento com menos de 24h:** Crédito NÃO devolvido
- **Aula experimental:** Crédito NÃO devolvido ao cancelar

---

## 14. Integração com Stripe

### 14.1 Como funciona o pagamento online

1. Cliente clica em "Comprar Plano" ou "Aula Avulsa"
2. Sistema cria uma sessão de checkout no Stripe
3. Cliente é redirecionado para o Stripe
4. Cliente preenche dados do cartão
5. Stripe processa o pagamento
6. Cliente é redirecionado de volta para o site
7. Sistema recebe webhook do Stripe
8. **Créditos são adicionados automaticamente** ao saldo do cliente

### 14.2 Webhook do Stripe

O sistema possui um endpoint `/api/stripe/webhook` que recebe notificações do Stripe quando:
- Pagamento é confirmado
- Pagamento falha
- Reembolso é processado

**Importante:** Não é necessário adicionar créditos manualmente após pagamentos via Stripe. O sistema faz isso automaticamente.

---

## 15. Merge Automático de Contas

### 15.1 O que é merge de contas?

Quando um usuário faz login via OAuth (Google, Microsoft, etc.) e preenche um **CPF que já existe** no sistema, o sistema **automaticamente**:

1. Transfere todos os **créditos** do cadastro antigo para a nova conta
2. Transfere todos os **agendamentos** do cadastro antigo para a nova conta
3. **Exclui o cadastro antigo**

### 15.2 Por que isso acontece?

Evita duplicação de contas. Por exemplo:
- Admin cria cadastro manual para "João Silva" com CPF 123.456.789-00
- João faz login via Google e preenche o mesmo CPF
- Sistema detecta duplicação e faz merge automático

### 15.3 O que é transferido?

- **Créditos** (saldo total)
- **Agendamentos** (todos os agendamentos futuros e passados)
- **Histórico de créditos** (todas as transações)
- **Histórico de compras** (todos os planos comprados)

---

## 16. Validação de Dados Obrigatórios

### 16.1 Campos obrigatórios

**Todos os usuários** (incluindo OAuth) devem preencher:
- **Nome completo**
- **Email**
- **CPF**
- **Telefone**

### 16.2 Como funciona a validação?

1. Usuário faz login via OAuth
2. Sistema verifica se falta algum dado
3. Se faltar, redireciona para `/complete-profile`
4. Usuário preenche os dados faltantes
5. Após salvar, usuário é redirecionado para a página inicial

**Importante:** Usuários sem dados completos **não conseguem agendar aulas** ou comprar planos.

---

## 17. Relatórios e Exportação

### 17.1 Exportar dados

Atualmente, o sistema não possui funcionalidade de exportação automática. Para exportar dados:

1. Acesse o **banco de dados**
2. Execute queries SQL para extrair dados
3. Exporte para CSV ou Excel

**Sugestão de melhoria:** Implementar botões de exportação nas abas de Pacientes, Agendamentos e Métricas.

---

## 18. Backup e Segurança

### 18.1 Backup do banco de dados

**Recomendação:** Configure backups automáticos diários do banco de dados.

### 18.2 Segurança de dados

- **Senhas:** Não armazenadas (autenticação via OAuth)
- **CPF:** Armazenado de forma segura, não editável após cadastro
- **Pagamentos:** Processados via Stripe (PCI-compliant)

---

## 19. Suporte Técnico

### 19.1 Problemas comuns e soluções

#### Problema: Paciente não consegue fazer login
**Solução:** Verifique se o email está correto no cadastro. Se necessário, edite o email na aba "Pacientes".

#### Problema: Créditos não foram adicionados após pagamento
**Solução:** Verifique o histórico de webhooks do Stripe. Se o webhook falhou, adicione os créditos manualmente na aba "Pagamentos".

#### Problema: Horário aparece como disponível, mas já tem 4 alunos
**Solução:** Verifique se há agendamentos cancelados que não foram removidos corretamente. Cancele manualmente se necessário.

#### Problema: Paciente cadastrado duas vezes
**Solução:** Use a funcionalidade de "Excluir Paciente" para remover o cadastro duplicado. Antes, transfira manualmente os créditos e agendamentos para o cadastro correto.

---

## 20. Boas Práticas

### 20.1 Gestão de pacientes

- **Confirme pagamentos rapidamente:** Pacientes que pagam em dinheiro ou PIX esperam ter os créditos disponíveis imediatamente
- **Use os botões +1/-1:** Para ajustes rápidos de créditos, evite abrir modais desnecessariamente
- **Verifique dados antes de excluir:** Exclusão de pacientes é irreversível

### 20.2 Gestão de agendamentos

- **Marque aulas como concluídas:** Isso ajuda a manter o histórico organizado
- **Cancele com antecedência:** Avise os pacientes sobre cancelamentos para evitar deslocamentos desnecessários
- **Use agendamentos recorrentes:** Para pacientes fixos, configure recorrência para facilitar a gestão

### 20.3 Gestão de créditos

- **Documente ajustes manuais:** Sempre adicione um motivo claro ao ajustar créditos
- **Verifique saldo antes de agendar:** Evite agendar aulas para pacientes sem créditos
- **Acompanhe o histórico:** Use o histórico de créditos para auditar transações

---

## 21. Contato para Suporte Técnico

Se você encontrar bugs, problemas técnicos ou precisar de ajuda com o sistema, entre em contato com:

- **Email:** saudeeppilates@gmail.com
- **WhatsApp:** (11) 93011-2640

---

## 22. Atualizações Futuras

### 22.1 Funcionalidades planejadas

- **Exportação de relatórios** (CSV, Excel, PDF)
- **Interface de cadastro de planos** (sem precisar acessar banco de dados)
- **Cron job para agendamentos recorrentes** (criar appointments automaticamente)
- **Notificações por email/SMS** (lembrete de aulas, confirmação de pagamento)
- **Dashboard de métricas avançadas** (taxa de ocupação, pacientes mais ativos, etc.)

---

**Parabéns!** Você agora domina todas as funcionalidades do sistema de agendamento da Clínica Saúde e Pilates. 🎉

Se tiver dúvidas, consulte este manual ou entre em contato com o suporte técnico.

---

*Última atualização: Janeiro de 2025*
