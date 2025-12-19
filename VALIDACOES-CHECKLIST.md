# Checklist de Validações do Sistema

## ✅ Validações Implementadas

### Dados Únicos
- [x] Email único (criar e editar paciente)
- [x] CPF único (criar e editar paciente)
- [x] Telefone único (criar e editar paciente)

### Autenticação e Sessão
- [x] Verificação de usuário excluído (invalida sessão automaticamente)
- [x] Proteção de rotas admin (apenas role='admin')
- [x] Login admin com senha (admin261/pacientes1)

### Agendamentos
- [x] Verificar disponibilidade de vagas antes de agendar
- [x] Consumir créditos apenas para aulas de plano
- [x] Não consumir créditos para aula experimental e avulsa
- [x] Devolver créditos ao cancelar aula de plano
- [x] Impedir exclusão de paciente com agendamentos ativos

### Créditos
- [x] Adicionar créditos ao comprar plano
- [x] Adicionar 1 crédito ao comprar aula avulsa
- [x] Devolver créditos ao cancelar aula de plano
- [x] Admin pode ajustar créditos manualmente

### Pagamentos Stripe
- [x] Webhook para processar pagamentos
- [x] Validação de assinatura do webhook
- [x] Adicionar créditos após pagamento bem-sucedido

## ⚠️ Possíveis Melhorias Futuras

### Validações Adicionais
- [ ] Validar formato de CPF (atualmente aceita qualquer string)
- [ ] Validar formato de telefone (atualmente aceita qualquer string)
- [ ] Validar formato de email no frontend (além do backend)
- [ ] Limitar número de agendamentos simultâneos por usuário
- [ ] Impedir agendamento em horários passados

### Segurança
- [ ] Rate limiting para login admin
- [ ] Logs de auditoria (quem criou/editou/excluiu)
- [ ] Confirmação por email ao criar conta
- [ ] Recuperação de senha

### UX
- [ ] Notificações por email/SMS de agendamento
- [ ] Lembretes 24h antes da aula
- [ ] Confirmação de presença
- [ ] Avaliação pós-aula

### Dados
- [ ] Backup automático do banco de dados
- [ ] Soft delete (marcar como excluído ao invés de deletar)
- [ ] Histórico de alterações de dados
