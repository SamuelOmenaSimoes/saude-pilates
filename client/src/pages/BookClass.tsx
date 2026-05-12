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
import { SlotTimeSelect } from "@/components/SlotTimeSelect";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import { toast } from "sonner";
import { AlertCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isHoliday } from "@shared/holidays";
import { Link, useLocation } from "wouter";

export default function BookClass() {
  const { user, isAuthenticated } = useAuth();
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

  const utils = trpc.useUtils();
  const createAppointmentMutation =
    trpc.appointments.createWithCredits.useMutation({
      onSuccess: () => {
        // Invalidar cache de slots disponíveis para atualizar contador de vagas
        utils.appointments.getAvailableSlots.invalidate();
        // Atualizar saldo de créditos do usuário
        utils.auth.me.invalidate();
      },
    });

  const professional = professionals?.[0] ?? { id: 0, fullName: "" };

  const { data: availableSlots } = trpc.appointments.getAvailableSlots.useQuery(
    {
      roomId: selectedRoom!,
      date: selectedDate || new Date(),
      unitId: selectedUnit!,
      professionalId: professional.id,
    },
    { enabled: !!selectedRoom && !!selectedDate },
  );

  const creditsBalance = user?.creditsBalance || 0;

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

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.info("Faça login para agendar uma aula");
      setLocation("/login");
      return;
    }

    if (creditsBalance < 1) {
      toast.error("Você não tem créditos suficientes");
      return;
    }

    if (!selectedRoom || !selectedDate || !selectedTime || !professional) {
      toast.error("Preencha todos os campos");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      await createAppointmentMutation.mutateAsync({
        unitId: selectedUnit!,
        roomId: selectedRoom,
        professionalId: professional.id,
        appointmentDate,
      });

      toast.success("Aula agendada com sucesso!");
      utils.auth.me.invalidate();
      window.location.href = "/my-appointments";
    } catch (error: any) {
      toast.error(error.message || "Erro ao agendar aula");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      <section className="bg-gradient-soft py-12">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Agendar Aula
            </h1>
            <p className="text-lg text-muted-foreground">
              Use seus créditos para agendar aulas. 1 crédito = 1 aula.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            {isAuthenticated && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Seus Créditos
                        </p>
                        <p className="text-2xl font-bold">{creditsBalance}</p>
                      </div>
                    </div>
                    {creditsBalance < 1 && (
                      <Link href="/plans">
                        <a>
                          <Button variant="outline">Comprar Créditos</Button>
                        </a>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {creditsBalance < 1 && isAuthenticated && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você não tem créditos suficientes. Adquira um plano para
                  continuar.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Agendar Aula com Créditos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    <Label>Sala / Doutora</Label>
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
                      Doutora: {professional.fullName}
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
                    <SlotTimeSelect
                      slots={availableSlots}
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                    />
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

                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Custo:</span>
                    <span className="text-2xl font-bold text-primary">
                      1 Crédito
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={
                    !selectedRoom ||
                    !selectedDate ||
                    !selectedTime ||
                    creditsBalance < 1 ||
                    createAppointmentMutation.isPending
                  }
                >
                  {createAppointmentMutation.isPending
                    ? "Agendando..."
                    : "Agendar Aula"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
