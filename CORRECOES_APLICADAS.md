# Correções Aplicadas - 09/12/2025 22:30

## 🔧 Correções Implementadas

### 1. Redirecionamento após Login/Registro
- ✅ Corrigido rota inexistente `/meus-agendamentos` → `/my-appointments`
- Arquivos: `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`

### 2. Tabela de Horários de Funcionamento
- ✅ Criada tabela `operatingHours` no banco de dados
- ✅ Inseridos horários para Vila Oliveira (seg-sex 7h-21h, sáb 8h-12h)
- ✅ Inseridos horários para Vila Caputera (seg-sex 8h-21h, sáb 8h-12h)

### 3. Bug de Mutação de Date
- ✅ Corrigido problema com `Date.setHours()` que modificava objeto original
- Arquivo: `server/routers.ts` (função `getAvailableSlots`)

### 4. Conversão Date → Timestamp
- ✅ Implementada conversão para evitar erro "Maximum call stack size exceeded"
- Schema tRPC agora aceita `number` (timestamp) em vez de `Date`
- Arquivos: `server/routers.ts`, `client/src/pages/TrialClass.tsx`, `BookClass.tsx`, `SingleClass.tsx`

### 5. Proteção de Rotas
- ✅ Restaurada proteção `RequireAuth` na rota `/trial-class`
- Arquivo: `client/src/App.tsx`

## 🔴 Problemas Pendentes

### BUG CRÍTICO: Horários não aparecem
**Status:** EM INVESTIGAÇÃO

**Sintomas:**
- Usuário seleciona unidade → sala → data
- Calendário funciona corretamente
- Data fica marcada em verde
- MAS horários disponíveis nunca aparecem

**Causa Provável:**
- Componente está sendo desmontado/remontado
- Estado `selectedDate` pode estar sendo perdido
- useEffect pode não estar sendo disparado

**Próximos Passos:**
1. Adicionar logs no console do navegador
2. Verificar se há re-renders desnecessários
3. Testar com React DevTools
4. Simplificar lógica de carregamento de slots

### Sistema de Login
**Status:** PENDENTE INVESTIGAÇÃO

Usuário relata que login não funciona. Precisa:
1. Testar login com OAuth do Manus
2. Testar registro de novo usuário
3. Verificar se sessão está sendo mantida

## 📝 Arquivos Modificados

```
client/src/pages/Login.tsx
client/src/pages/Register.tsx
client/src/pages/TrialClass.tsx
client/src/pages/BookClass.tsx
client/src/pages/SingleClass.tsx
client/src/App.tsx
server/routers.ts
```

## 🗄️ Banco de Dados

### Tabela `operatingHours` criada:
```sql
CREATE TABLE operatingHours (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  dayOfWeek INT NOT NULL,
  openTime TIME NOT NULL,
  closeTime TIME NOT NULL,
  FOREIGN KEY (unitId) REFERENCES units(id)
);
```

### Dados inseridos:
- Vila Oliveira: Segunda a Sexta 07:00-21:00, Sábado 08:00-12:00
- Vila Caputera: Segunda a Sexta 08:00-21:00, Sábado 08:00-12:00
