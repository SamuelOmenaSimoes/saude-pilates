import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isHoliday } from "@shared/holidays";

export default function SingleClass() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUnit, setSelectedUnit] = useState<number>();
  const [selectedRoom, setSelectedRoom] = useState<number>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const { data: units } = trpc.units.list.useQuery();
  const { data: rooms } = trpc.units.getRooms.useQuery(
    { unitId: selectedUnit! },
    { enabled: !!selectedUnit },
  );
  const { data: professionals } = trpc.professionals.getByRoom.useQuery(
    { roomId: selectedRoom! },
    { enabled: !!selectedRoom },
  );

  const professional = professionals?.[0];

  console.log("selectedDate before getAvailableSlots", selectedDate);

  const { data: availableSlots } = trpc.appointments.getAvailableSlots.useQuery(
    {
      roomId: selectedRoom!,
      date: selectedDate || new Date(),
      unitId: selectedUnit!,
      professionalId: professional?.id,
    },
    { enabled: !!selectedRoom && !!selectedDate },
  );

  const utils = trpc.useUtils();
  const { data: creditBalance } = trpc.credits.balance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckoutMutation = trpc.stripe.createSingleCheckout.useMutation({
    onSuccess: () => {
      // Invalidar cache de slots disponíveis para atualizar contador de vagas
      utils.appointments.getAvailableSlots.invalidate();
    },
  });

  const bookWithCreditMutation =
    trpc.appointments.bookSingleWithCredit.useMutation({
      onSuccess: () => {
        toast.success("Aula avulsa agendada com crédito!");
        utils.appointments.getAvailableSlots.invalidate();
        utils.credits.balance.invalidate();
        // Redirecionar para meus agendamentos
        setTimeout(() => {
          window.location.href = "/meus-agendamentos";
        }, 1500);
      },
      onError: (error) => {
        toast.error(error.message || "Erro ao agendar aula");
      },
    });

  const isDateDisabled = (date: Date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Bloquear datas passadas
    if (checkDate < today) return true;

    // Bloquear domingos (day 0)
    if (day === 0) return true;

    // Bloquear feriados
    if (isHoliday(checkDate)) return true;

    // Segunda a Sábado estão disponíveis (1-6)
    return false;
  };

  const handlePayWithStripe = async () => {
    if (!isAuthenticated) {
      toast.info("Faça login para comprar uma aula avulsa");
      setLocation("/login");
      return;
    }

    if (!selectedRoom || !selectedDate || !selectedTime || !professional) {
      toast.error("Preencha todos os campos");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const appointmentDate = selectedDate;
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      toast.loading("Criando checkout...");
      const { url } = await createCheckoutMutation.mutateAsync();

      // Store appointment details in sessionStorage for after payment
      sessionStorage.setItem(
        "pendingAppointment",
        JSON.stringify({
          unitId: selectedUnit,
          roomId: selectedRoom,
          professionalId: professional.id,
          appointmentDate: appointmentDate.toISOString(),
        }),
      );

      if (url) {
        window.open(url, "_blank");
        toast.success("Redirecionado para pagamento!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar checkout");
    }
  };

  const handleUseCredit = async () => {
    if (!isAuthenticated) {
      toast.info("Faça login para agendar");
      setLocation("/login");
      return;
    }

    if (!selectedRoom || !selectedDate || !selectedTime || !professional) {
      toast.error("Preencha todos os campos");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const appointmentDate = selectedDate;
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      await bookWithCreditMutation.mutateAsync({
        unitId: selectedUnit!,
        roomId: selectedRoom,
        professionalId: professional.id,
        appointmentDate,
      });
    } catch (error: any) {
      // Error handled in onError callback
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      <section className="bg-gradient-soft py-12">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Aula Avulsa</h1>
            <p className="text-lg text-muted-foreground">
              Compre uma aula avulsa por R$ 60,00 ou use seus créditos
              disponíveis.
            </p>
            {isAuthenticated && creditBalance && (
              <p className="mt-2 text-sm font-medium text-primary">
                Você tem {creditBalance.balance} crédito(s) disponível(is)
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Agendar e Pagar Aula Avulsa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Após o pagamento, sua aula será automaticamente agendada
                    para o horário selecionado.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    onValueChange={(value) => {
                      setSelectedUnit(Number(value));
                      setSelectedRoom(undefined);
                      setSelectedDate(undefined);
                      setSelectedTime(undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUnit && rooms && rooms.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sala / Profissional</Label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedRoom(Number(value));
                        setSelectedDate(undefined);
                        setSelectedTime(undefined);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {professional && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium">
                      Profissional: {professional.fullName}
                    </p>
                  </div>
                )}

                {selectedRoom && (
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(undefined);
                      }}
                      disabled={isDateDisabled}
                      className="rounded-md border"
                    />
                  </div>
                )}

                {selectedDate &&
                  availableSlots &&
                  availableSlots.length > 0 && (
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Select onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots
                            .filter((slot) => slot.available)
                            .map((slot) => (
                              <SelectItem
                                key={slot.time.getTime()}
                                value={slot.time.toLocaleTimeString("pt-BR")}
                              >
                                {slot.time.toLocaleDateString("pt-BR")}{" "}
                                {slot.time.toLocaleTimeString("pt-BR")} (
                                {slot.spotsLeft}/{slot.maxCapacity} vagas
                                disponíveis)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {selectedDate &&
                  availableSlots &&
                  availableSlots.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Não há horários disponíveis para esta data.
                      </AlertDescription>
                    </Alert>
                  )}

                {isAuthenticated &&
                creditBalance &&
                creditBalance.balance > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                      <p className="text-center text-sm font-medium text-muted-foreground mb-2">
                        Escolha a forma de pagamento:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 flex flex-col items-center gap-2 border-2 border-primary hover:bg-primary/10"
                        onClick={handleUseCredit}
                        disabled={
                          !selectedRoom ||
                          !selectedDate ||
                          !selectedTime ||
                          bookWithCreditMutation.isPending
                        }
                      >
                        <span className="text-lg font-bold">Usar Crédito</span>
                        <span className="text-sm text-muted-foreground">
                          {creditBalance.balance} crédito(s) disponível(is)
                        </span>
                      </Button>

                      <Button
                        className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-gradient-primary"
                        onClick={handlePayWithStripe}
                        disabled={
                          !selectedRoom ||
                          !selectedDate ||
                          !selectedTime ||
                          createCheckoutMutation.isPending
                        }
                      >
                        <span className="text-lg font-bold">
                          Pagar com Cartão
                        </span>
                        <span className="text-sm">R$ 60,00</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          R$ 60,00
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-primary"
                      onClick={handlePayWithStripe}
                      disabled={
                        !selectedRoom ||
                        !selectedDate ||
                        !selectedTime ||
                        createCheckoutMutation.isPending
                      }
                    >
                      {createCheckoutMutation.isPending
                        ? "Processando..."
                        : "Pagar e Agendar"}
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
