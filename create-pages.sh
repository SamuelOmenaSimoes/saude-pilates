#!/bin/bash

# MyAppointments page
cat > client/src/pages/MyAppointments.tsx << 'EOF'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function MyAppointments() {
  const { data: appointments, refetch } = trpc.appointments.myAppointments.useQuery();
  const cancelMutation = trpc.appointments.cancel.useMutation();
  const utils = trpc.useUtils();

  const handleCancel = async (appointmentId: number) => {
    try {
      await cancelMutation.mutateAsync({ appointmentId });
      toast.success("Aula cancelada com sucesso!");
      refetch();
      utils.auth.me.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar aula");
    }
  };

  const canCancel = (appointmentDate: Date) => {
    const now = new Date();
    const hoursUntil = (new Date(appointmentDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const upcoming = appointments?.filter((apt: any) => new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled') || [];
  const past = appointments?.filter((apt: any) => new Date(apt.appointmentDate) <= new Date() || apt.status !== 'scheduled') || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      <section className="bg-gradient-soft py-12">
        <div className="container">
          <h1 className="text-4xl font-bold">Meus Agendamentos</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Próximas Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length > 0 ? (
                <div className="space-y-4">
                  {upcoming.map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-semibold">
                          {format(new Date(apt.appointmentDate), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.professionalName} - {apt.unitName}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={!canCancel(apt.appointmentDate)}>
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar Aula?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {canCancel(apt.appointmentDate) 
                                ? "Você receberá o crédito de volta."
                                : "Cancelamentos com menos de 24h não geram devolução de crédito."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancel(apt.id)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma aula agendada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              {past.length > 0 ? (
                <div className="space-y-4">
                  {past.map((apt: any) => (
                    <div key={apt.id} className="rounded-lg border p-4 opacity-60">
                      <p className="font-semibold">
                        {format(new Date(apt.appointmentDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {apt.professionalName} - Status: {apt.status === 'completed' ? 'Concluída' : apt.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum histórico</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
EOF

# Profile page
cat > client/src/pages/Profile.tsx << 'EOF'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [cpf, setCpf] = useState(user?.cpf || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const updateMutation = trpc.auth.updateProfile.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateMutation.mutateAsync({ name, cpf, phone });
      toast.success("Perfil atualizado com sucesso!");
      utils.auth.me.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      <section className="bg-gradient-soft py-12">
        <div className="container">
          <h1 className="text-4xl font-bold">Meu Perfil</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  <p className="text-sm text-muted-foreground">
                    Necessário para aula experimental
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créditos disponíveis:</span>
                <span className="font-semibold">{user?.creditsBalance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aula experimental:</span>
                <span className="font-semibold">
                  {user?.hasTrialClass ? "Já utilizada" : "Disponível"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
EOF

echo "Pages created successfully!"
