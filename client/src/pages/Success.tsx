import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Success() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando seu pagamento...");
  
  const utils = trpc.useUtils();
  const { data: creditBalance, refetch: refetchBalance } = trpc.credits.balance.useQuery();
  
  const bookWithCreditMutation = trpc.appointments.bookSingleWithCredit.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Pagamento confirmado e aula agendada com sucesso!");
      sessionStorage.removeItem('pendingAppointment');
      utils.appointments.myAppointments.invalidate();
      utils.credits.balance.invalidate();
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Erro ao agendar aula. Por favor, entre em contato com o suporte.");
    },
  });

  useEffect(() => {
    const processPayment = async () => {
      // Aguardar alguns segundos para o webhook processar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se há agendamento pendente
      const pendingAppointmentStr = sessionStorage.getItem('pendingAppointment');
      
      if (!pendingAppointmentStr) {
        // Sem agendamento pendente, apenas confirmar que o crédito foi adicionado
        await refetchBalance();
        setStatus("success");
        setMessage("Pagamento confirmado! Seus créditos foram adicionados à sua conta.");
        return;
      }
      
      try {
        const pendingAppointment = JSON.parse(pendingAppointmentStr);
        
        // Aguardar mais um pouco e verificar o saldo de créditos
        await refetchBalance();
        
        // Tentar agendar a aula com o crédito
        setMessage("Agendando sua aula...");
        
        await bookWithCreditMutation.mutateAsync({
          unitId: pendingAppointment.unitId,
          roomId: pendingAppointment.roomId,
          professionalId: pendingAppointment.professionalId,
          appointmentDate: new Date(pendingAppointment.appointmentDate),
        });
        
      } catch (error: any) {
        console.error("Erro ao processar agendamento:", error);
        
        // Se falhar, ainda assim confirmar que o crédito foi adicionado
        setStatus("error");
        setMessage(
          "Seu pagamento foi confirmado e os créditos foram adicionados à sua conta. " +
          "No entanto, não foi possível agendar automaticamente. " +
          "Por favor, vá até 'Agendar Aula' e use seus créditos para fazer o agendamento."
        );
      }
    };
    
    processPayment();
  }, []);

  const handleGoToAppointments = () => {
    setLocation("/my-appointments");
  };
  
  const handleGoToBookClass = () => {
    setLocation("/book-class");
  };
  
  const handleGoToDashboard = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-1 py-12 bg-gradient-soft">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {status === "loading" && "Processando Pagamento"}
                  {status === "success" && "Pagamento Confirmado!"}
                  {status === "error" && "Atenção"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  {status === "loading" && (
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  )}
                  {status === "success" && (
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  )}
                  {status === "error" && (
                    <XCircle className="h-16 w-16 text-yellow-500" />
                  )}
                  
                  <p className="text-center text-lg text-muted-foreground">
                    {message}
                  </p>
                  
                  {creditBalance && status !== "loading" && (
                    <div className="rounded-lg bg-primary/10 p-4 w-full">
                      <p className="text-center font-medium">
                        Saldo de créditos: <span className="text-primary text-xl">{creditBalance.balance}</span>
                      </p>
                    </div>
                  )}
                </div>
                
                {status !== "loading" && (
                  <div className="space-y-3">
                    {status === "success" && (
                      <Button
                        className="w-full bg-gradient-primary"
                        onClick={handleGoToAppointments}
                      >
                        Ver Meus Agendamentos
                      </Button>
                    )}
                    
                    {status === "error" && (
                      <Button
                        className="w-full bg-gradient-primary"
                        onClick={handleGoToBookClass}
                      >
                        Agendar Aula Agora
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGoToDashboard}
                    >
                      Ir para o Painel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
