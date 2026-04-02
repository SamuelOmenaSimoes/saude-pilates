import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Users,
  Calendar,
  CreditCard,
  Search,
  Building2,
  Package,
  Plus,
  Check,
  type LucideIcon,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { maskCPF, maskPhone, validateCPF, validatePhone } from "@/lib/validators";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsTriggerBaseClassName,
} from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function parseReaisToCents(s: string): number {
  const t = s.trim().replace(/\s/g, "");
  if (!t) return 0;
  const normalized =
    t.includes(",") && (!t.includes(".") || t.lastIndexOf(",") > t.lastIndexOf("."))
      ? t.replace(/\./g, "").replace(",", ".")
      : t.replace(",", ".");
  const n = parseFloat(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function centsToReaisStr(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function durationLabel(d: string) {
  if (d === "monthly") return "Mensal";
  if (d === "quarterly") return "Trimestral";
  if (d === "semester") return "Semestral";
  return d;
}

function AdminPlansTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyForm = () => ({
    name: "",
    description: "",
    frequency: "2x" as "1x" | "2x" | "3x",
    duration: "monthly" as "monthly" | "quarterly" | "semester",
    totalClasses: "",
    priceReais: "",
    installments: "1",
    installmentReais: "",
    credits: "",
    isActive: true,
  });

  const [create, setCreate] = useState(emptyForm);
  const [edit, setEdit] = useState(emptyForm);

  const { data: plans, isLoading, refetch } = trpc.admin.listAllPlansAdmin.useQuery();
  const createPlan = trpc.admin.createPlan.useMutation({
    onSuccess: () => {
      toast.success("Plano criado");
      refetch();
      setCreate(emptyForm());
      setShowCreate(false);
    },
    onError: (e) => toast.error(e.message || "Erro ao criar plano"),
  });
  const updatePlan = trpc.admin.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado");
      refetch();
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message || "Erro ao atualizar plano"),
  });

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEdit({
      name: p.name || "",
      description: p.description || "",
      frequency: p.frequency,
      duration: p.duration,
      totalClasses: String(p.totalClasses),
      priceReais: centsToReaisStr(p.priceInCents),
      installments: String(p.installments),
      installmentReais: centsToReaisStr(p.installmentPriceInCents),
      credits: String(p.credits),
      isActive: p.isActive,
    });
  };

  const submitCreate = () => {
    const priceInCents = parseReaisToCents(create.priceReais);
    const inst = Math.max(1, parseInt(create.installments, 10) || 1);
    let installmentPriceInCents = parseReaisToCents(create.installmentReais);
    if (installmentPriceInCents <= 0 && priceInCents > 0) {
      installmentPriceInCents = Math.ceil(priceInCents / inst);
    }
    const totalClasses = parseInt(create.totalClasses, 10);
    const credits = parseInt(create.credits, 10);
    if (!create.name.trim() || !totalClasses || !credits || !priceInCents) {
      toast.error("Preencha nome, aulas totais, créditos e preço válidos");
      return;
    }
    createPlan.mutate({
      name: create.name.trim(),
      description: create.description.trim() || undefined,
      frequency: create.frequency,
      duration: create.duration,
      totalClasses,
      priceInCents,
      installments: inst,
      installmentPriceInCents: installmentPriceInCents || priceInCents,
      credits,
      isActive: create.isActive,
    });
  };

  const submitEdit = () => {
    if (!editingId) return;
    const priceInCents = parseReaisToCents(edit.priceReais);
    const inst = Math.max(1, parseInt(edit.installments, 10) || 1);
    let installmentPriceInCents = parseReaisToCents(edit.installmentReais);
    if (installmentPriceInCents <= 0 && priceInCents > 0) {
      installmentPriceInCents = Math.ceil(priceInCents / inst);
    }
    const totalClasses = parseInt(edit.totalClasses, 10);
    const credits = parseInt(edit.credits, 10);
    if (!edit.name.trim() || !totalClasses || !credits || !priceInCents) {
      toast.error("Preencha nome, aulas totais, créditos e preço válidos");
      return;
    }
    updatePlan.mutate({
      id: editingId,
      name: edit.name.trim(),
      description: edit.description.trim() || null,
      frequency: edit.frequency,
      duration: edit.duration,
      totalClasses,
      priceInCents,
      installments: inst,
      installmentPriceInCents: installmentPriceInCents || priceInCents,
      credits,
      isActive: edit.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Planos</CardTitle>
            <CardDescription>Crie e edite planos exibidos em /plans e no checkout</CardDescription>
          </div>
          <Button variant={showCreate ? "secondary" : "default"} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancelar" : "Novo plano"}
          </Button>
        </CardHeader>
        {showCreate && (
          <CardContent className="space-y-4 border-t pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome</Label>
                <Input value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={create.description}
                  onChange={(e) => setCreate({ ...create, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequência (semana)</Label>
                <Select value={create.frequency} onValueChange={(v: "1x" | "2x" | "3x") => setCreate({ ...create, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x">1x</SelectItem>
                    <SelectItem value="2x">2x</SelectItem>
                    <SelectItem value="3x">3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={create.duration}
                  onValueChange={(v: "monthly" | "quarterly" | "semester") =>
                    setCreate({ ...create, duration: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semester">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total de aulas no período</Label>
                <Input
                  type="number"
                  min={1}
                  value={create.totalClasses}
                  onChange={(e) => setCreate({ ...create, totalClasses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Créditos ao comprar</Label>
                <Input
                  type="number"
                  min={1}
                  value={create.credits}
                  onChange={(e) => setCreate({ ...create, credits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço total (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={create.priceReais}
                  onChange={(e) => setCreate({ ...create, priceReais: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={create.installments}
                  onChange={(e) => setCreate({ ...create, installments: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da parcela (R$, opcional)</Label>
                <Input
                  placeholder="Automático se vazio"
                  value={create.installmentReais}
                  onChange={(e) => setCreate({ ...create, installmentReais: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="create-active"
                  checked={create.isActive}
                  onCheckedChange={(c) => setCreate({ ...create, isActive: c === true })}
                />
                <Label htmlFor="create-active" className="cursor-pointer">Plano ativo (visível no site)</Label>
              </div>
            </div>
            <Button onClick={submitCreate} disabled={createPlan.isPending}>
              {createPlan.isPending ? "Salvando..." : "Criar plano"}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os planos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Freq.</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans && plans.length > 0 ? (
                    plans.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.frequency}</TableCell>
                        <TableCell>{durationLabel(p.duration)}</TableCell>
                        <TableCell>{formatPrice(p.priceInCents)}</TableCell>
                        <TableCell>{p.credits}</TableCell>
                        <TableCell>{p.isActive ? "Sim" : "Não"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum plano cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingId !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Editar plano</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
              Fechar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome</Label>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={edit.frequency} onValueChange={(v: "1x" | "2x" | "3x") => setEdit({ ...edit, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x">1x</SelectItem>
                    <SelectItem value="2x">2x</SelectItem>
                    <SelectItem value="3x">3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={edit.duration}
                  onValueChange={(v: "monthly" | "quarterly" | "semester") =>
                    setEdit({ ...edit, duration: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semester">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total de aulas</Label>
                <Input
                  type="number"
                  min={1}
                  value={edit.totalClasses}
                  onChange={(e) => setEdit({ ...edit, totalClasses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Créditos</Label>
                <Input
                  type="number"
                  min={1}
                  value={edit.credits}
                  onChange={(e) => setEdit({ ...edit, credits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço total (R$)</Label>
                <Input
                  value={edit.priceReais}
                  onChange={(e) => setEdit({ ...edit, priceReais: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={edit.installments}
                  onChange={(e) => setEdit({ ...edit, installments: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da parcela (R$)</Label>
                <Input
                  value={edit.installmentReais}
                  onChange={(e) => setEdit({ ...edit, installmentReais: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="edit-active"
                  checked={edit.isActive}
                  onCheckedChange={(c) => setEdit({ ...edit, isActive: c === true })}
                />
                <Label htmlFor="edit-active" className="cursor-pointer">Plano ativo</Label>
              </div>
            </div>
            <Button onClick={submitEdit} disabled={updatePlan.isPending}>
              {updatePlan.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminUnitCard({
  unit,
  onSaveUnit,
  onCreateRoom,
  onUpdateRoom,
  createRoomPending,
  updateRoomPending,
}: {
  unit: { id: number; name: string; address: string; rooms: any[] };
  onSaveUnit: (id: number, name: string, address: string) => void;
  onCreateRoom: (input: {
    unitId: number;
    name: string;
    maxCapacity: number;
    isGroupOnly: boolean;
  }) => void;
  onUpdateRoom: (
    input: { id: number; name: string; maxCapacity: number; isGroupOnly: boolean },
    onSuccess?: () => void,
  ) => void;
  createRoomPending: boolean;
  updateRoomPending: boolean;
}) {
  const [uName, setUName] = useState(unit.name);
  const [uAddr, setUAddr] = useState(unit.address);
  const [newRoom, setNewRoom] = useState({ name: "", maxCapacity: "4", isGroupOnly: true });
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editRoom, setEditRoom] = useState({ name: "", maxCapacity: "", isGroupOnly: true });

  useEffect(() => {
    setUName(unit.name);
    setUAddr(unit.address);
  }, [unit.name, unit.address]);

  const handleCreateRoom = () => {
    if (!newRoom.name.trim()) {
      toast.error("Informe o nome da sala");
      return;
    }
    const cap = parseInt(newRoom.maxCapacity || "4", 10);
    onCreateRoom({
      unitId: unit.id,
      name: newRoom.name.trim(),
      maxCapacity: cap > 0 ? cap : 4,
      isGroupOnly: newRoom.isGroupOnly,
    });
    setNewRoom({ name: "", maxCapacity: "4", isGroupOnly: true });
  };

  const startEditRoom = (room: { id: number; name: string; maxCapacity: number; isGroupOnly: boolean }) => {
    setEditingRoomId(room.id);
    setEditRoom({
      name: room.name,
      maxCapacity: String(room.maxCapacity),
      isGroupOnly: room.isGroupOnly,
    });
  };

  const saveEditRoom = (roomId: number) => {
    const cap = parseInt(editRoom.maxCapacity, 10);
    onUpdateRoom(
      {
        id: roomId,
        name: editRoom.name.trim(),
        maxCapacity: cap > 0 ? cap : 1,
        isGroupOnly: editRoom.isGroupOnly,
      },
      () => setEditingRoomId(null),
    );
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-6 space-y-6">
      <h3 className="text-lg font-semibold">Unidade: {unit.name}</h3>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome</Label>
            <Input value={uName} onChange={(e) => setUName(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Textarea value={uAddr} onChange={(e) => setUAddr(e.target.value)} rows={2} />
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onSaveUnit(unit.id, uName, uAddr)}
        >
          Salvar unidade
        </Button>

        <div>
          <h4 className="font-medium mb-3">Salas</h4>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unit.rooms?.length ? (
                  unit.rooms.map((room: any) => (
                    <TableRow key={room.id}>
                      {editingRoomId === room.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editRoom.name}
                              onChange={(e) => setEditRoom({ ...editRoom, name: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              className="w-20"
                              value={editRoom.maxCapacity}
                              onChange={(e) => setEditRoom({ ...editRoom, maxCapacity: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={editRoom.isGroupOnly}
                              onCheckedChange={(c) =>
                                setEditRoom({ ...editRoom, isGroupOnly: c === true })
                              }
                            />
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" onClick={() => saveEditRoom(room.id)} disabled={updateRoomPending}>
                              Salvar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRoomId(null)}>
                              Cancelar
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{room.name}</TableCell>
                          <TableCell>{room.maxCapacity}</TableCell>
                          <TableCell>{room.isGroupOnly ? "Sim" : "Não"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => startEditRoom(room)}>
                              Editar
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center py-4">
                      Nenhuma sala nesta unidade
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Nova sala</Label>
              <Input
                placeholder="Nome"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cap.</Label>
              <Input
                type="number"
                min={1}
                className="w-16"
                value={newRoom.maxCapacity}
                onChange={(e) => setNewRoom({ ...newRoom, maxCapacity: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`g-${unit.id}`}
                checked={newRoom.isGroupOnly}
                onCheckedChange={(c) => setNewRoom({ ...newRoom, isGroupOnly: c === true })}
              />
              <Label htmlFor={`g-${unit.id}`} className="text-xs">Só grupo</Label>
            </div>
            <Button size="sm" onClick={handleCreateRoom} disabled={createRoomPending}>
              Adicionar sala
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const emptyNewUnitForm = () => ({
  name: "",
  address: "",
  roomName: "",
  roomMaxCapacity: "4",
  roomIsGroupOnly: true,
});

function AdminUnitsTab() {
  const { data: unitsWithRooms, isLoading, refetch } = trpc.admin.listUnitsWithRooms.useQuery();
  const createUnit = trpc.admin.createUnit.useMutation();
  const createRoom = trpc.admin.createRoom.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message || "Erro ao criar sala"),
  });
  const updateUnit = trpc.admin.updateUnit.useMutation({
    onSuccess: () => {
      toast.success("Unidade atualizada");
      refetch();
    },
    onError: (e) => toast.error(e.message || "Erro ao atualizar unidade"),
  });
  const updateRoom = trpc.admin.updateRoom.useMutation({
    onSuccess: () => {
      toast.success("Sala atualizada");
      refetch();
    },
    onError: (e) => toast.error(e.message || "Erro ao atualizar sala"),
  });

  const [newUnit, setNewUnit] = useState(emptyNewUnitForm);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  useEffect(() => {
    if (
      selectedUnitId != null &&
      unitsWithRooms &&
      !unitsWithRooms.some((u) => u.id === selectedUnitId)
    ) {
      setSelectedUnitId(null);
    }
  }, [selectedUnitId, unitsWithRooms]);

  const selectedUnit = unitsWithRooms?.find((u) => u.id === selectedUnitId);

  const handleCreateUnit = async () => {
    if (!newUnit.name.trim() || !newUnit.address.trim()) {
      toast.error("Nome e endereço são obrigatórios");
      return;
    }
    if (!newUnit.roomName.trim()) {
      toast.error("Informe o nome da primeira sala");
      return;
    }
    try {
      const { id } = await createUnit.mutateAsync({
        name: newUnit.name.trim(),
        address: newUnit.address.trim(),
      });
      const cap = parseInt(newUnit.roomMaxCapacity || "4", 10);
      await createRoom.mutateAsync({
        unitId: id,
        name: newUnit.roomName.trim(),
        maxCapacity: cap > 0 ? cap : 4,
        isGroupOnly: newUnit.roomIsGroupOnly,
      });
      toast.success("Unidade e primeira sala criadas");
      setNewUnit(emptyNewUnitForm());
      setSelectedUnitId(id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar unidade ou sala";
      toast.error(msg);
    }
  };

  const handleSaveUnit = (id: number, name: string, address: string) => {
    if (!name.trim() || !address.trim()) {
      toast.error("Nome e endereço são obrigatórios");
      return;
    }
    updateUnit.mutate({ id, name: name.trim(), address: address.trim() });
  };

  const createBusy = createUnit.isPending || createRoom.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova unidade</CardTitle>
          <CardDescription>
            Crie a unidade junto com a primeira sala (obrigatória para agendamentos)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-2xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome da unidade</Label>
              <Input
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Textarea
                value={newUnit.address}
                onChange={(e) => setNewUnit({ ...newUnit, address: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <p className="text-sm font-medium">Primeira sala</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-2 min-w-[10rem] flex-1">
                <Label>Nome da sala</Label>
                <Input
                  placeholder="Ex.: Sala 1"
                  value={newUnit.roomName}
                  onChange={(e) => setNewUnit({ ...newUnit, roomName: e.target.value })}
                />
              </div>
              <div className="space-y-2 w-24">
                <Label>Capacidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={newUnit.roomMaxCapacity}
                  onChange={(e) => setNewUnit({ ...newUnit, roomMaxCapacity: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="new-unit-room-group"
                  checked={newUnit.roomIsGroupOnly}
                  onCheckedChange={(c) =>
                    setNewUnit({ ...newUnit, roomIsGroupOnly: c === true })
                  }
                />
                <Label htmlFor="new-unit-room-group" className="text-sm font-normal cursor-pointer">
                  Só grupo
                </Label>
              </div>
            </div>
          </div>
          <Button onClick={handleCreateUnit} disabled={createBusy}>
            {createBusy ? "Salvando..." : "Criar unidade e primeira sala"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : unitsWithRooms && unitsWithRooms.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar unidade</CardTitle>
            <CardDescription>
              Escolha uma unidade para ver salas e editar dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 max-w-xl">
              <div className="space-y-2 flex-1 min-w-0">
                <Label>Unidade</Label>
                <Select
                  value={selectedUnitId != null ? String(selectedUnitId) : "none"}
                  onValueChange={(v) =>
                    setSelectedUnitId(v === "none" ? null : Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {unitsWithRooms.map((u: { id: number; name: string }) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedUnitId != null && (
                <Button
                  type="button"
                  variant="ghost"
                  className="sm:mt-6 shrink-0"
                  onClick={() => setSelectedUnitId(null)}
                >
                  Limpar seleção
                </Button>
              )}
            </div>

            {selectedUnit && (
              <AdminUnitCard
                unit={selectedUnit}
                onSaveUnit={handleSaveUnit}
                onCreateRoom={(input) =>
                  createRoom.mutate(input, {
                    onSuccess: () => toast.success("Sala criada"),
                  })
                }
                onUpdateRoom={(input, onSuccess) =>
                  updateRoom.mutate(
                    {
                      id: input.id,
                      name: input.name,
                      maxCapacity: input.maxCapacity,
                      isGroupOnly: input.isGroupOnly,
                    },
                    { onSuccess },
                  )
                }
                createRoomPending={createRoom.isPending}
                updateRoomPending={updateRoom.isPending}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-center py-6 rounded-lg border border-dashed">
          Nenhuma unidade cadastrada ainda — use o formulário acima
        </p>
      )}
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
                    {plan.name} - {formatPrice(plan.priceInCents)} ({plan.credits} créditos)
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

const ADMIN_TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "patients", label: "Pacientes", icon: Users },
  { value: "plans", label: "Planos", icon: Package },
  { value: "units", label: "Unidades", icon: Building2 },
  { value: "appointments", label: "Agendamentos", icon: Calendar },
  { value: "today", label: "Hoje", icon: Calendar },
  { value: "metrics", label: "Métricas", icon: CreditCard },
  { value: "migration", label: "Migração", icon: Users },
  { value: "payments", label: "Pagamentos", icon: CreditCard },
  { value: "recurring", label: "Recorrentes", icon: Calendar },
  { value: "blocked", label: "Bloqueados", icon: Calendar },
  { value: "import", label: "Importar", icon: Calendar },
];

/** Fits as many tab triggers as the row width allows; overflow goes under "+". */
function AdminResponsiveTabRow({
  value,
  onTabChange,
}: {
  value: string;
  onTabChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureInnerRef = useRef<HTMLDivElement>(null);
  const tabMeasureEls = useRef<(HTMLButtonElement | null)[]>([]);
  const plusMeasureWrapRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(ADMIN_TABS.length);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    if (cw < 48) return;

    const gapPx = (() => {
      const inner = measureInnerRef.current;
      if (!inner) return 4;
      const g = getComputedStyle(inner).columnGap || getComputedStyle(inner).gap;
      const n = parseFloat(g);
      return Number.isFinite(n) ? n : 4;
    })();

    const betweenListAndPlus = 8;

    const widths = ADMIN_TABS.map((_, i) => {
      const el = tabMeasureEls.current[i];
      return el?.getBoundingClientRect().width ?? 56;
    });

    const plusW = plusMeasureWrapRef.current?.getBoundingClientRect().width ?? 56;

    const nTabs = ADMIN_TABS.length;
    for (let k = nTabs; k >= 1; k--) {
      const tabsOnly =
        widths.slice(0, k).reduce((a, b) => a + b, 0) + gapPx * Math.max(0, k - 1);
      const needOverflow = k < nTabs;
      const total = tabsOnly + (needOverflow ? betweenListAndPlus + plusW : 0);
      if (total <= cw) {
        setVisibleCount(k);
        return;
      }
    }
    setVisibleCount(1);
  }, []);

  useLayoutEffect(() => {
    recalc();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => recalc());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalc]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onBp = () => recalc();
    mq.addEventListener("change", onBp);
    return () => mq.removeEventListener("change", onBp);
  }, [recalc]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => recalc());
    }
  }, [recalc]);

  const visibleTabs = ADMIN_TABS.slice(0, visibleCount);
  const overflowTabs = ADMIN_TABS.slice(visibleCount);
  const overflowHasActive = overflowTabs.some((t) => t.value === value);

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl">
      <div
        className="pointer-events-none absolute left-0 top-0 -z-10 flex w-max gap-2 opacity-0"
        aria-hidden
      >
        <div
          ref={measureInnerRef}
          className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px] sm:gap-1"
        >
          {ADMIN_TABS.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                tabIndex={-1}
                ref={(el) => {
                  tabMeasureEls.current[i] = el;
                }}
                className={cn(
                  tabsTriggerBaseClassName,
                  "shrink-0 px-2 text-xs sm:px-3 sm:text-sm",
                )}
              >
                <Icon className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div ref={plusMeasureWrapRef}>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1 border-dashed px-2.5"
            type="button"
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" />
            <span className="tabular-nums">+{ADMIN_TABS.length - 1}</span>
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-nowrap items-center gap-2">
        <TabsList className="inline-flex h-auto min-h-9 min-w-0 flex-1 flex-nowrap items-center justify-start gap-0.5 overflow-hidden rounded-lg p-[3px] sm:gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
              >
                <Icon className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {overflowTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant={overflowHasActive ? "secondary" : "outline"}
                size="sm"
                className="h-9 shrink-0 gap-1 border-dashed px-2.5"
                aria-label={`Abrir lista com mais ${overflowTabs.length} seções`}
              >
                <Plus className="h-4 w-4" />
                <span className="tabular-nums">+{overflowTabs.length}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              {overflowTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = value === tab.value;
                return (
                  <DropdownMenuItem
                    key={tab.value}
                    onClick={() => onTabChange(tab.value)}
                    className={cn(isActive && "bg-accent")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{tab.label}</span>
                    {isActive ? (
                      <Check className="h-4 w-4 shrink-0 opacity-80" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  // TODOS os hooks devem vir ANTES de qualquer return
  const [adminTab, setAdminTab] = useState("patients");
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

          <Tabs value={adminTab} onValueChange={setAdminTab} className="space-y-6">
            <AdminResponsiveTabRow value={adminTab} onTabChange={setAdminTab} />

            {/* Tab: Planos */}
            <TabsContent value="plans" className="space-y-6">
              <AdminPlansTab />
            </TabsContent>

            {/* Tab: Unidades */}
            <TabsContent value="units" className="space-y-6">
              <AdminUnitsTab />
            </TabsContent>

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
