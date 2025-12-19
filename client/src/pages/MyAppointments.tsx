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
import React from "react";

export default function MyAppointments() {
  const { data: appointments, refetch } = trpc.appointments.myAppointments.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  const cancelMutation = trpc.appointments.cancel.useMutation();
  const utils = trpc.useUtils();
  
  // Sincronizar dados do usuário a cada 30 segundos (para refletir alterações do admin)
  React.useEffect(() => {
    const interval = setInterval(() => {
      utils.auth.me.invalidate();
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [utils, refetch]);

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
