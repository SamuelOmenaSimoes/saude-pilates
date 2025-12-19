# Próximas Implementações Necessárias

## 1. Botão "Usar Crédito" ao Agendar Aula Avulsa

### Backend (server/routers.ts)

Adicionar nova rota no router `appointments`:

```typescript
bookSingleWithCredit: protectedProcedure
  .input(z.object({
    unitId: z.number(),
    roomId: z.number(),
    professionalId: z.number(),
    appointmentDate: z.date(),
  }))
  .mutation(async ({ ctx, input }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    
    // Verificar se tem crédito disponível
    if (user.creditsBalance < 1) {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'Você não tem créditos suficientes' 
      });
    }
    
    // Verificar vagas disponíveis
    const existingAppointments = await db.getAppointmentsByRoomAndDate(
      input.roomId,
      input.appointmentDate
    );
    const room = await db.getRoomById(input.roomId);
    if (existingAppointments.length >= (room?.capacity || 4)) {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'Não há vagas disponíveis neste horário' 
      });
    }
    
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    
    // Criar agendamento
    await dbInstance.insert(appointments).values({
      userId: ctx.user.id,
      unitId: input.unitId,
      roomId: input.roomId,
      professionalId: input.professionalId,
      appointmentDate: input.appointmentDate,
      type: 'single',
      status: 'scheduled',
    });
    
    // Descontar crédito
    await dbInstance.update(users)
      .set({ creditsBalance: user.creditsBalance - 1 })
      .where(eq(users.id, ctx.user.id));
    
    return { success: true, message: 'Aula agendada com sucesso!' };
  }),
```

### Frontend (client/src/pages/SingleClass.tsx)

Modificar a página para mostrar duas opções de pagamento:

1. Adicionar query para buscar saldo de créditos do usuário
2. Mostrar saldo de créditos disponíveis
3. Adicionar dois botões:
   - "Pagar com Cartão (R$ 60)" - usa Stripe
   - "Usar 1 Crédito" - usa a nova rota `bookSingleWithCredit`
4. Desabilitar botão de crédito se saldo = 0

Exemplo de código:

```typescript
const { data: user } = trpc.auth.me.useQuery();
const bookWithCreditMutation = trpc.appointments.bookSingleWithCredit.useMutation({
  onSuccess: () => {
    toast.success('Aula agendada com sucesso!');
    navigate('/my-appointments');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// No JSX, adicionar:
<div className="space-y-4">
  <p className="text-sm text-muted-foreground">
    Você tem {user?.creditsBalance || 0} crédito(s) disponível(is)
  </p>
  
  <div className="grid grid-cols-2 gap-4">
    <Button
      onClick={handlePayWithStripe}
      variant="outline"
    >
      Pagar com Cartão (R$ 60)
    </Button>
    
    <Button
      onClick={handleUseCredit}
      disabled={!user?.creditsBalance || user.creditsBalance < 1}
    >
      Usar 1 Crédito
    </Button>
  </div>
</div>
```

---

## 2. CPF/Nome/Telefone Obrigatórios em OAuth

### Problema Atual

Quando usuário faz login via OAuth do Manus, pode não ter CPF e telefone preenchidos, causando:
- Impossibilidade de agendar aula experimental (requer CPF único)
- Dados incompletos no sistema

### Solução

Modificar `client/src/App.tsx` para verificar dados completos após qualquer login:

```typescript
function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Verificar se usuário tem dados completos
  const hasCompleteProfile = user && user.name && user.cpf && user.phone;
  
  // Redirecionar para CompleteProfile se faltar dados
  useEffect(() => {
    if (!loading && user && !hasCompleteProfile && location !== '/complete-profile') {
      window.location.href = '/complete-profile';
    }
  }, [user, loading, hasCompleteProfile, location]);
  
  // ... resto do código
}
```

Garantir que a página `CompleteProfile.tsx` exija todos os campos:
- Nome completo (obrigatório)
- CPF (obrigatório, validar formato)
- Telefone (obrigatório, validar formato)
- Email (já vem do OAuth)

---

## 3. Evitar Duplicação de Usuários

### Problema Atual

Admin pode criar usuário manualmente com CPF "123.456.789-00", e depois o mesmo usuário faz login via OAuth, criando um segundo cadastro.

### Solução

Modificar `server/_core/oauth.ts` para verificar se já existe usuário com o mesmo CPF ao fazer login OAuth:

```typescript
// Ao receber dados do OAuth, antes de criar usuário:
const existingUserByCpf = await db.getUserByCpf(userProfile.cpf);
if (existingUserByCpf) {
  // Atualizar open_id do usuário existente ao invés de criar novo
  await dbInstance.update(users)
    .set({ openId: userProfile.sub })
    .where(eq(users.id, existingUserByCpf.id));
  
  // Usar usuário existente
  user = existingUserByCpf;
} else {
  // Criar novo usuário
  // ... código atual
}
```

Isso garante que:
1. Admin cria usuário manual com CPF
2. Usuário faz login OAuth
3. Sistema vincula OAuth ao cadastro existente (por CPF)
4. Créditos adicionados pelo admin aparecem para o usuário

---

## Prioridade de Implementação

1. **ALTA**: CPF/Nome/Telefone obrigatórios em OAuth (evita dados incompletos)
2. **ALTA**: Evitar duplicação de usuários (resolve problema de créditos)
3. **MÉDIA**: Botão "Usar Crédito" (melhoria de UX)

---

## Testes Necessários

Após implementar:

1. Criar usuário manual pelo admin com CPF
2. Adicionar créditos via aba Pagamentos
3. Fazer login OAuth com mesmo CPF
4. Verificar se créditos aparecem
5. Tentar agendar aula usando crédito
6. Verificar se crédito foi descontado
