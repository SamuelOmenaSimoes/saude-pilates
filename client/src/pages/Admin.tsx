import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Users, Calendar, CreditCard, Search } from "lucide-react";
import { maskCPF, maskPhone, validateCPF, validatePhone } from "@/lib/validators";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

function EditPatientForm({ user, onSuccess, onDelete }: { user: any, onSuccess: () => void, onDelete: () => void }) {
  const [editName, setEditName] = useState(user.name || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editCpf, setEditCpf] = useState(maskCPF(user.cpf || ''));
  const [editPhone, setEditPhone] = useState(maskPhone(user.phone || ''));
  
  const editPatientMutation = trpc.admin.editPatient.useMutation();
  const deletePatientMutation = trpc.admin.deletePatient.useMutation();
  
  const handleEditPatient = async () => {
    if (!validateCPF(editCpf)) {
      toast.error('CPF inválido');
      return;
    }
    
    if (!validatePhone(editPhone)) {
      toast.error('Telefone inválido');
      return;
    }
    
    try {
      await editPatientMutation.mutateAsync({
        userId: user.id,
        name: editName,
        email: editEmail,
        cpf: editCpf,
        phone: editPhone,
      });
      toast.success('Dados atualizados com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados');
    }
  };
  
  const handleDeletePatient = async () => {
    if (!confirm(`Tem certeza que deseja excluir o paciente ${user.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      await deletePatientMutation.mutateAsync({ userId: user.id });
      toast.success('Paciente excluído com sucesso!');
      onDelete();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir paciente');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label>CPF</Label>
          <Input
            value={editCpf}
            onChange={(e) => setEditCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={editPhone}
            onChange={(e) => setEditPhone(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleEditPatient} 
          disabled={editPatientMutation.isPending}
          className="flex-1"
        >
          {editPatientMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDeletePatient}
          disabled={deletePatientMutation.isPending}
        >
          {deletePatientMutation.isPending ? 'Excluindo...' : 'Excluir Paciente'}
        </Button>
      </div>
    </div>
  );
}

function BlockedTimeSlotsTab() {
  const [selectedUnitId, setSelectedUnitId] = useState<number>();
  const [selectedRoomId, setSelectedRoomId] = useState<number>();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  
  const { data: units } = trpc.units.list.useQuery();
  const { data: rooms } = trpc.units.getRooms.useQuery(
    { unitId: selectedUnitId! },
    { enabled: !!selectedUnitId }
  );
  const { data: professionals } = trpc.professionals.getByRoom.useQuery(
    { roomId: selectedRoomId! },
    { enabled: !!selectedRoomId }
  );
  const { data: blockedSlots, refetch: refetchBlocked } = trpc.admin.getBlockedTimeSlots.useQuery({});
  const blockTimeSlot = trpc.admin.blockTimeSlot.useMutation();
  const unblockTimeSlot = trpc.admin.unblockTimeSlot.useMutation();
  
  const professional = professionals?.[0];
  
  const handleBlockTimeSlot = async () => {
    if (!selectedUnitId || !selectedRoomId || !professional || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      const blockedDate = new Date(`${selectedDate}T${selectedTime}:00`);
      
      await blockTimeSlot.mutateAsync({
        unitId: selectedUnitId,
        roomId: selectedRoomId,
        professionalId: professional.id,
        blockedDate,
        reason: reason || undefined,
      });
      
      toast.success('Horário bloqueado com sucesso!');
      refetchBlocked();
      
      // Reset form
      setSelectedUnitId(undefined);
      setSelectedRoomId(undefined);
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao bloquear horário');
    }
  };
  
  const handleUnblock = async (id: number) => {
    if (!confirm('Tem certeza que deseja desbloquear este horário?')) return;
    
    try {
      await unblockTimeSlot.mutateAsync({ id });
      toast.success('Horário desbloqueado');
      refetchBlocked();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desbloquear');
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bloquear Horário Específico</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Bloqueie horários quando o profissional não puder dar aula. O horário não aparecerá disponível para agendamento.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select value={selectedUnitId?.toString()} onValueChange={(v) => { setSelectedUnitId(Number(v)); setSelectedRoomId(undefined); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map(unit => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sala *</Label>
              <Select value={selectedRoomId?.toString()} onValueChange={(v) => setSelectedRoomId(Number(v))} disabled={!selectedUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map(room => (
                    <SelectItem key={room.id} value={room.id.toString()}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Profissional em férias, consulta médica..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={handleBlockTimeSlot} disabled={blockTimeSlot.isPending}>
            {blockTimeSlot.isPending ? 'Bloqueando...' : 'Bloquear Horário'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Horários Bloqueados ({blockedSlots?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!blockedSlots || blockedSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum horário bloqueado</p>
          ) : (
            <div className="space-y-2">
              {blockedSlots.map((slot: any) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {new Date(slot.blockedDate).toLocaleDateString('pt-BR')} às {new Date(slot.blockedDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {slot.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{slot.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnblock(slot.id)}
                    disabled={unblockTimeSlot.isPending}
                  >
                    Desbloquear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecurringTab({ allUsers }: { allUsers: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [selectedUnitId, setSelectedUnitId] = useState<number>();
  const [selectedRoomId, setSelectedRoomId] = useState<number>();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  
  const { data: units } = trpc.units.list.useQuery();
  const { data: rooms } = trpc.units.getRooms.useQuery(
    { unitId: selectedUnitId! },
    { enabled: !!selectedUnitId }
  );
  const { data: professionals } = trpc.professionals.getByRoom.useQuery(
    { roomId: selectedRoomId! },
    { enabled: !!selectedRoomId }
  );
  const { data: recurringSchedules, refetch: refetchSchedules } = trpc.admin.getRecurringSchedules.useQuery();
  const createRecurring = trpc.admin.createRecurringSchedule.useMutation();
  const toggleRecurring = trpc.admin.toggleRecurringSchedule.useMutation();
  const deleteRecurring = trpc.admin.deleteRecurringSchedule.useMutation();
  const generateAppointments = trpc.admin.generateRecurringAppointments.useMutation();
  
  const professional = professionals?.[0];
  
  const daysOfWeek = [
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];
  
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  const handleCreateRecurring = async () => {
    if (!selectedUserId || !selectedUnitId || !selectedRoomId || !professional || selectedDays.length === 0 || !selectedTime) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    try {
      await createRecurring.mutateAsync({
        userId: selectedUserId,
        unitId: selectedUnitId,
        roomId: selectedRoomId,
        professionalId: professional.id,
        daysOfWeek: selectedDays,
        time: selectedTime,
      });
      
      toast.success('Agendamento recorrente criado com sucesso!');
      refetchSchedules();
      
      // Reset form
      setSelectedUserId(undefined);
      setSelectedUnitId(undefined);
      setSelectedRoomId(undefined);
      setSelectedDays([]);
      setSelectedTime('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar agendamento recorrente');
    }
  };
  
  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await toggleRecurring.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? 'Agendamento pausado' : 'Agendamento ativado');
      refetchSchedules();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento recorrente?')) return;
    
    try {
      await deleteRecurring.mutateAsync({ id });
      toast.success('Agendamento recorrente excluído');
      refetchSchedules();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };
  
  const handleGenerateAppointments = async () => {
    if (!confirm('Gerar agendamentos para os próximos 7 dias baseado nas regras recorrentes ativas?')) return;
    
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const result = await generateAppointments.mutateAsync({
        startDate: today,
        endDate: nextWeek,
      });
      
      toast.success(`${result.created} agendamentos criados! ${result.skipped} pulados (já existentes ou sem vagas).`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar agendamentos');
    }
  };
  
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek];
  };
  
  return (
    <div className="space-y-6">
      {/* Formulário de Criação */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Agendamento Recorrente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
              >
                <option value="">Selecione um paciente...</option>
                {allUsers?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Unidade</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedUnitId || ''}
                onChange={(e) => {
                  setSelectedUnitId(Number(e.target.value));
                  setSelectedRoomId(undefined);
                }}
              >
                <option value="">Selecione uma unidade...</option>
                {units?.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedUnitId && rooms && rooms.length > 0 && (
              <div className="space-y-2">
                <Label>Sala</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                >
                  <option value="">Selecione uma sala...</option>
                  {rooms.map((room: any) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {professional && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">Profissional: {professional.fullName}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Dias da Semana</Label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={selectedDays.includes(day.value) ? "default" : "outline"}
                  onClick={() => toggleDay(day.value)}
                  className="flex-1 min-w-[100px]"
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
          
          <Button
            onClick={handleCreateRecurring}
            disabled={createRecurring.isPending}
            className="w-full"
          >
            {createRecurring.isPending ? 'Criando...' : 'Criar Agendamento Recorrente'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Lista de Agendamentos Recorrentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agendamentos Recorrentes Ativos</CardTitle>
            <Button
              onClick={handleGenerateAppointments}
              disabled={generateAppointments.isPending}
              variant="default"
            >
              {generateAppointments.isPending ? 'Gerando...' : 'Gerar Agendamentos da Semana'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Clique no botão acima para criar automaticamente os agendamentos dos próximos 7 dias baseado nas regras recorrentes ativas.
          </p>
        </CardHeader>
        <CardContent>
          {!recurringSchedules || recurringSchedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum agendamento recorrente cadastrado</p>
          ) : (
            <div className="space-y-4">
              {recurringSchedules.map((schedule: any) => (
                <div key={schedule.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{schedule.user?.name || 'Paciente'}</p>
                      <p className="text-sm text-muted-foreground">{schedule.user?.email}</p>
                      <p className="text-sm">
                        <span className="font-medium">{getDayName(schedule.dayOfWeek)}</span> às {schedule.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.unit?.name} - {schedule.room?.name} - {schedule.professional?.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {schedule.isActive ? '✅ Ativo' : '⏸️ Pausado'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(schedule.id, schedule.isActive)}
                      >
                        {schedule.isActive ? 'Pausar' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentsTab({ allUsers }: { allUsers: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [selectedPlanId, setSelectedPlanId] = useState<number>();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: manualPayments, refetch: refetchPayments } = trpc.admin.getManualPayments.useQuery();
  const confirmPayment = trpc.admin.confirmManualPayment.useMutation();
  
  const handleConfirmPayment = async () => {
    if (!selectedUserId || !selectedPlanId) {
      toast.error('Selecione um paciente e um plano');
      return;
    }
    
    try {
      const result = await confirmPayment.mutateAsync({
        userId: selectedUserId,
        planId: selectedPlanId,
        paymentMethod,
        notes: notes || undefined,
        planStartDate: planStartDate || undefined,
        planEndDate: planEndDate || undefined,
      });
      
      toast.success(result.message);
      refetchPayments();
      
      // Reset form
      setSelectedUserId(undefined);
      setSelectedPlanId(undefined);
      setNotes('');
      setPlanStartDate('');
      setPlanEndDate('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar pagamento');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Formulário de Confirmação de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmar Pagamento Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
              >
                <option value="">Selecione um paciente...</option>
                {allUsers?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Plano</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedPlanId || ''}
                onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              >
                <option value="">Selecione um plano...</option>
                {plans?.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {(plan.priceInCents / 100).toFixed(2)} ({plan.credits} créditos)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <select
                className="w-full p-2 border rounded"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cash">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                placeholder="Ex: Pagamento recebido em 02/01/2025"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Início do Plano (opcional)</Label>
              <Input
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Término do Plano (opcional)</Label>
              <Input
                type="date"
                value={planEndDate}
                onChange={(e) => setPlanEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleConfirmPayment}
            disabled={!selectedUserId || !selectedPlanId || confirmPayment.isPending}
            className="w-full"
          >
            {confirmPayment.isPending ? 'Confirmando...' : 'Confirmar Pagamento e Adicionar Créditos'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos Manuais</CardTitle>
        </CardHeader>
        <CardContent>
          {!manualPayments || manualPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum pagamento manual registrado ainda.</p>
          ) : (
            <div className="space-y-4">
              {manualPayments.map((payment: any) => (
                <div key={payment.id} className="border rounded p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{payment.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{payment.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+{payment.creditsAdded} créditos</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentMethod === 'cash' ? 'Dinheiro' : payment.paymentMethod === 'pix' ? 'PIX' : 'Transferência'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Plano:</strong> {payment.plan?.name}</p>
                    <p><strong>Valor:</strong> R$ {(payment.amountInCents / 100).toFixed(2)}</p>
                    {payment.planStartDate && (
                      <p><strong>Início:</strong> {new Date(payment.planStartDate).toLocaleDateString('pt-BR')}</p>
                    )}
                    {payment.planEndDate && (
                      <p><strong>Término:</strong> {new Date(payment.planEndDate).toLocaleDateString('pt-BR')}</p>
                    )}
                    {payment.notes && <p><strong>Obs:</strong> {payment.notes}</p>}
                    <p className="text-muted-foreground">
                      Confirmado por {payment.confirmedByName} em {new Date(payment.createdAt).toLocaleDateString('pt-BR')} às {new Date(payment.createdAt).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MigrationTab({ allUsers, refetchAppointments }: { allUsers: any[], refetchAppointments: () => void }) {
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [selectedUserId, setSelectedUserId] = useState<number>();
  
  // Form states para criar paciente
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientCpf, setNewPatientCpf] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientPassword, setNewPatientPassword] = useState('');
  
  // Form states para criar agendamento
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [unitId, setUnitId] = useState<number>();
  const [roomId, setRoomId] = useState<number>();
  const [professionalId, setProfessionalId] = useState<number>();
  const [appointmentType, setAppointmentType] = useState<'trial' | 'single' | 'plan'>('plan');
  
  const { data: units } = trpc.units.list.useQuery();
  const { data: rooms } = trpc.units.getRooms.useQuery(
    { unitId: unitId! },
    { enabled: !!unitId }
  );
  const { data: professionals } = trpc.professionals.getByRoom.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId }
  );
  
  const createPatientMutation = trpc.admin.createPatient.useMutation();
  const createAppointmentMutation = trpc.admin.createAppointmentForPatient.useMutation();
  
  const handleCreatePatient = async () => {
    if (!newPatientName || !newPatientEmail || !newPatientCpf || !newPatientPhone || !newPatientPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (!validateCPF(newPatientCpf)) {
      toast.error('CPF inválido');
      return;
    }
    
    if (!validatePhone(newPatientPhone)) {
      toast.error('Telefone inválido');
      return;
    }
    
    try {
      const result = await createPatientMutation.mutateAsync({
        name: newPatientName,
        email: newPatientEmail,
        cpf: newPatientCpf,
        phone: newPatientPhone,
        password: newPatientPassword,
      });
      
      toast.success(result.message);
      setSelectedUserId(result.userId);
      setStep('create');
      
      // Limpar formulário
      setNewPatientName('');
      setNewPatientEmail('');
      setNewPatientCpf('');
      setNewPatientPhone('');
      setNewPatientPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar paciente');
    }
  };
  
  const handleCreateAppointment = async () => {
    if (!selectedUserId || !appointmentDate || !appointmentTime || !unitId || !roomId || !professionalId) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    const dateTime = `${appointmentDate}T${appointmentTime}:00`;
    
    try {
      const result = await createAppointmentMutation.mutateAsync({
        userId: selectedUserId,
        unitId,
        roomId,
        professionalId,
        appointmentDate: dateTime,
        type: appointmentType,
      });
      
      toast.success(result.message);
      refetchAppointments();
      
      // Limpar formulário
      setAppointmentDate('');
      setAppointmentTime('');
      setUnitId(undefined);
      setRoomId(undefined);
      setProfessionalId(undefined);
      setStep('select');
      setSelectedUserId(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar agendamento');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Passo 1: Selecionar ou Criar Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Passo 1: Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecionar Paciente Existente</Label>
            <select
              className="w-full p-2 border rounded"
              value={selectedUserId || ''}
              onChange={(e) => {
                setSelectedUserId(Number(e.target.value));
                setStep('create');
              }}
            >
              <option value="">Selecione um paciente...</option>
              {allUsers?.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-center text-muted-foreground">OU</div>
          
          <div className="space-y-4">
            <Label>Criar Novo Paciente</Label>
            <Input
              placeholder="Nome completo"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email (será o login)"
              value={newPatientEmail}
              onChange={(e) => setNewPatientEmail(e.target.value)}
            />
            <Input
              placeholder="CPF (000.000.000-00)"
              value={newPatientCpf}
              onChange={(e) => setNewPatientCpf(maskCPF(e.target.value))}
              maxLength={14}
            />
            <Input
              placeholder="Telefone ((00) 00000-0000)"
              value={newPatientPhone}
              onChange={(e) => setNewPatientPhone(maskPhone(e.target.value))}
              maxLength={15}
            />
            <Input
              type="password"
              placeholder="Senha temporária (mín. 6 caracteres)"
              value={newPatientPassword}
              onChange={(e) => setNewPatientPassword(e.target.value)}
            />
            <Button onClick={handleCreatePatient} disabled={createPatientMutation.isPending}>
              {createPatientMutation.isPending ? 'Criando...' : 'Criar Paciente'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Passo 2: Criar Agendamento */}
      {step === 'create' && selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Passo 2: Criar Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Unidade</Label>
              <select
                className="w-full p-2 border rounded"
                value={unitId || ''}
                onChange={(e) => setUnitId(Number(e.target.value))}
              >
                <option value="">Selecione...</option>
                {units?.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            
            {unitId && (
              <div className="space-y-2">
                <Label>Sala</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={roomId || ''}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                >
                  <option value="">Selecione...</option>
                  {rooms?.map((room: any) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {roomId && (
              <div className="space-y-2">
                <Label>Profissional</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={professionalId || ''}
                  onChange={(e) => setProfessionalId(Number(e.target.value))}
                >
                  <option value="">Selecione...</option>
                  {professionals?.map((prof: any) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Tipo de Aula</Label>
              <select
                className="w-full p-2 border rounded"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as any)}
              >
                <option value="trial">Experimental</option>
                <option value="single">Avulsa</option>
                <option value="plan">Plano</option>
              </select>
            </div>
            
            <Button onClick={handleCreateAppointment} disabled={createAppointmentMutation.isPending}>
              {createAppointmentMutation.isPending ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricsTab() {
  const { data: metrics, isLoading } = trpc.admin.getMetrics.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Preparar dados para gráficos
  const occupancyData = Object.entries(metrics.occupancyByHour)
    .map(([hour, count]) => ({
      hour: `${hour}h`,
      aulas: count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const revenueData = Object.entries(metrics.revenueByMonth)
    .map(([month, revenue]) => ({
      mês: month,
      receita: revenue / 100, // Converter centavos para reais
    }))
    .sort((a, b) => a.mês.localeCompare(b.mês))
    .slice(-6); // Últimos 6 meses

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalAppointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {(metrics.totalRevenue / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Cancelamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.cancellationRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Ocupação por Horário */}
      <Card>
        <CardHeader>
          <CardTitle>Ocupação por Horário</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aulas" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Receita Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mês" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pacientes Mais Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Mais Ativos (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Total de Aulas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.topUsers.map((user: any, index: number) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-right font-semibold">{user.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  // TODOS os hooks devem vir ANTES de qualquer return
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");

  // Buscar todos os usuários automaticamente
  const { data: allUsers, refetch: refetchUsers } = trpc.admin.listAllUsers.useQuery();
  const { data: allAppointments, refetch: refetchAppointments } = trpc.appointments.adminList.useQuery({});
  
  const { data: selectedUserDetails, refetch: refetchUserDetails } = trpc.admin.getUserDetails.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  const adjustCreditsMutation = trpc.credits.adminAdjust.useMutation();
  const quickAdjustMutation = trpc.credits.quickAdjustCredits.useMutation();
  const cancelAppointmentMutation = trpc.appointments.adminCancel.useMutation();

  // Proteger rota: apenas admin pode acessar (DEPOIS de todos os hooks)
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);
  
  // Mostrar loading DEPOIS de todos os hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }
  
  // Bloquear acesso se não for admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Filtrar usuários pela busca
  const filteredUsers = searchTerm.length > 0
    ? allUsers?.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cpf?.includes(searchTerm)
      )
    : allUsers;

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
  };
  
  const handleQuickAdjust = async (userId: number, amount: number) => {
    try {
      await quickAdjustMutation.mutateAsync({ userId, amount });
      toast.success(`Crédito ${amount > 0 ? 'adicionado' : 'removido'} com sucesso!`);
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ajustar créditos');
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUserId || !creditAmount || !creditReason) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await adjustCreditsMutation.mutateAsync({
        userId: selectedUserId,
        amount: Number(creditAmount),
        description: creditReason,
      });
      toast.success("Créditos ajustados com sucesso!");
      setCreditAmount("");
      setCreditReason("");
      refetchUserDetails();
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao ajustar créditos");
    }
  };

  const handleCancelAppointment = async (appointmentId: number, refundCredit: boolean = true) => {
    if (!confirm(`Cancelar este agendamento${refundCredit ? ' e devolver crédito' : ''}?`)) return;

    try {
      await cancelAppointmentMutation.mutateAsync({ appointmentId, refundCredit });
      toast.success("Agendamento cancelado");
      refetchAppointments();
      if (selectedUserId) {
        refetchUserDetails();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar");
    }
  };

  const todayAppointments = allAppointments?.filter((apt: any) => {
    const aptDate = new Date(apt.appointmentDate);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString() && apt.status === 'scheduled';
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie pacientes, agendamentos e créditos</p>
          </div>

          <Tabs defaultValue="patients" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9 max-w-6xl gap-1">
              <TabsTrigger value="patients" className="text-xs sm:text-sm px-2">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Pacientes</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm px-2">
                <Calendar className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Agendamentos</span>
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs sm:text-sm px-2">
                <Calendar className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Hoje</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs sm:text-sm px-2">
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Métricas</span>
              </TabsTrigger>
              <TabsTrigger value="migration" className="text-xs sm:text-sm px-2">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Migração</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm px-2">
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="recurring" className="text-xs sm:text-sm px-2">
                <Calendar className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Recorrentes</span>
              </TabsTrigger>
              <TabsTrigger value="blocked" className="text-xs sm:text-sm px-2">
                <Calendar className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bloqueados</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="text-xs sm:text-sm px-2">
                <Calendar className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Importar</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Pacientes */}
            <TabsContent value="patients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Pacientes ({filteredUsers?.length || 0})</CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou CPF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead className="text-right">Créditos</TableHead>
                          <TableHead className="text-center">Ajuste Rápido</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers && filteredUsers.length > 0 ? (
                          filteredUsers.map((u: any) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.name || '-'}</TableCell>
                              <TableCell>{u.email || '-'}</TableCell>
                              <TableCell>{u.cpf || '-'}</TableCell>
                              <TableCell>{u.phone || '-'}</TableCell>
                              <TableCell className="text-right font-semibold">{u.creditsBalance || 0}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleQuickAdjust(u.id, -1)}
                                    title="Remover 1 crédito"
                                  >
                                    -1
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleQuickAdjust(u.id, 1)}
                                    title="Adicionar 1 crédito"
                                  >
                                    +1
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSelectUser(u.id)}
                                >
                                  Ver Detalhes
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nenhum paciente encontrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes do Paciente Selecionado */}
              {selectedUserId && selectedUserDetails && (
                <>
                  {/* Card de Editar Dados */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Editar Dados do Paciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EditPatientForm 
                        user={selectedUserDetails.user} 
                        onSuccess={() => {
                          refetchUserDetails();
                          refetchUsers();
                        }}
                        onDelete={() => {
                          setSelectedUserId(undefined);
                          refetchUsers();
                        }}
                      />
                    </CardContent>
                  </Card>
                  
                  <div className="grid gap-6 md:grid-cols-2 md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ajustar Créditos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Paciente</Label>
                        <p className="text-sm font-medium mt-1">{selectedUserDetails.user.name}</p>
                        <p className="text-sm text-muted-foreground">Saldo atual: {selectedUserDetails.user.creditsBalance} créditos</p>
                      </div>
                      <div>
                        <Label htmlFor="creditAmount">Quantidade (use negativo para remover)</Label>
                        <Input
                          id="creditAmount"
                          type="number"
                          placeholder="Ex: 10 ou -5"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="creditReason">Motivo</Label>
                        <Input
                          id="creditReason"
                          placeholder="Ex: Ajuste manual, cortesia, etc"
                          value={creditReason}
                          onChange={(e) => setCreditReason(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAdjustCredits} className="w-full" disabled={adjustCreditsMutation.isPending}>
                        {adjustCreditsMutation.isPending ? "Ajustando..." : "Ajustar Créditos"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Agendamentos do Paciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedUserDetails.appointments && selectedUserDetails.appointments.length > 0 ? (
                          selectedUserDetails.appointments.slice(0, 5).map((apt: any) => (
                            <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(apt.appointmentDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {apt.type === 'trial' ? 'Experimental' : apt.type === 'single' ? 'Avulsa' : 'Plano'} - {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                                </p>
                              </div>
                              {apt.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelAppointment(apt.id, apt.type !== 'trial')}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab: Todos os Agendamentos */}
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allAppointments && allAppointments.length > 0 ? (
                      allAppointments.slice(0, 20).map((apt: any) => (
                        <div key={apt.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-smooth">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-lg">{apt.user?.name || 'Usuário'}</p>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  apt.status === 'scheduled' ? 'bg-green-100 text-green-700' : 
                                  apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                                <p><span className="font-medium">Email:</span> {apt.user?.email || '-'}</p>
                                <p><span className="font-medium">CPF:</span> {apt.user?.cpf || '-'}</p>
                                <p><span className="font-medium">Telefone:</span> {apt.user?.phone || '-'}</p>
                                <p><span className="font-medium">Créditos:</span> {apt.user?.creditsBalance || 0}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="text-sm">
                              <p className="font-medium">
                                {format(new Date(apt.appointmentDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-muted-foreground">
                                {apt.unit?.name} - {apt.room?.name} • {apt.professional?.name}
                              </p>
                              <p className="text-muted-foreground">
                                Tipo: <span className="capitalize">{apt.type === 'trial' ? 'Experimental' : apt.type === 'single' ? 'Avulsa' : 'Plano'}</span>
                              </p>
                            </div>
                          {apt.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelAppointment(apt.id, apt.type !== 'trial')}
                            >
                              Cancelar
                            </Button>
                          )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Nenhum agendamento encontrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Aulas de Hoje */}
            <TabsContent value="today">
              <Card>
                <CardHeader>
                  <CardTitle>Aulas de Hoje ({todayAppointments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.length > 0 ? (
                      todayAppointments.map((apt: any) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                          <div className="flex-1">
                            <p className="font-medium">{apt.user?.name || 'Usuário'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.appointmentDate), "HH:mm", { locale: ptBR })}
                              {' • '}
                              {apt.unit?.name} - {apt.room?.name}
                              {' • '}
                              {apt.professional?.name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelAppointment(apt.id, apt.type !== 'trial')}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Nenhuma aula agendada para hoje</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Métricas */}
            <TabsContent value="metrics">
              <MetricsTab />
            </TabsContent>

            {/* Tab: Migração */}
            <TabsContent value="migration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Migração da Agenda Física</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crie cadastros de pacientes e agendamentos para migrar da agenda física para o sistema digital.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MigrationTab allUsers={allUsers || []} refetchAppointments={refetchAppointments} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Pagamentos */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pagamentos Manuais</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Confirme pagamentos recebidos em dinheiro, PIX ou transferência e adicione créditos automaticamente.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <PaymentsTab allUsers={allUsers || []} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Recorrentes */}
            <TabsContent value="recurring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agendamentos Recorrentes</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure agendamentos automáticos para pacientes em dias fixos da semana (ex: toda terça e quinta às 9h).
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RecurringTab allUsers={allUsers || []} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Horários Bloqueados */}
            <TabsContent value="blocked" className="space-y-6">
              <BlockedTimeSlotsTab />
            </TabsContent>
            
            {/* Tab: Importar Agenda */}
            <TabsContent value="import" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Importar Agendamentos</CardTitle>
                  <CardDescription>
                    Importe agendamentos da sua agenda física usando um arquivo CSV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 mb-2"><strong>Formato esperado do CSV:</strong></p>
                      <p className="text-xs text-blue-800 font-mono">paciente_cpf,data,hora,tipo_aula,profissional_nome</p>
                      <p className="text-xs text-blue-800 mt-2">Exemplo:</p>
                      <p className="text-xs text-blue-800 font-mono">123.456.789-00,2024-01-15,09:00,Pilates,João Silva</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">Selecione arquivo CSV</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        className="cursor-pointer"
                      />
                    </div>
                    <Button className="w-full">
                      Importar Agendamentos
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Dica: Pacientes serão criados automaticamente se não existirem no sistema
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
