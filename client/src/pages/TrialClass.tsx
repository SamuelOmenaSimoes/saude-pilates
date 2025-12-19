import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { isHoliday } from "@shared/holidays";

export default function TrialClass() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const trpcUtils = trpc.useUtils();

  const [selectedUnit, setSelectedUnit] = useState<number>();
  const [selectedRoom, setSelectedRoom] = useState<number>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const [availableSlots, setAvailableSlots] = useState<any[]>();
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<any>();

  const { data: units } = trpc.units.list.useQuery();

  const { data: rooms } = trpc.units.getRooms.useQuery(
    { unitId: selectedUnit! },
    { enabled: !!selectedUnit }
  );

  const { data: professionals } = trpc.professionals.getByRoom.useQuery(
    { roomId: selectedRoom! },
    { enabled: !!selectedRoom }
  );

  const professional = professionals?.[0];

  // ===============================
  // Carregar horários disponíveis
  // ===============================
  useEffect(() => {
    if (!selectedRoom || !selectedDate) {
      setAvailableSlots(undefined);
      return;
    }

    const timestamp = selectedDate.getTime();
    setSlotsLoading(true);
    setSlotsError(undefined);

    trpcUtils.client.appointments.getAvailableSlots
      .query({ roomId: selectedRoom, date: timestamp })
      .then((slots) => {
        setAvailableSlots(slots);
        setSlotsLoading(false);
      })
      .catch((err) => {
        setSlotsError(err);
        setSlotsLoading(false);
      });
  }, [selectedRoom, selectedDate, trpcUtils]);

  // ===============================
  // Criar aula experimental
  // ===============================
  const createTrialMutation = trpc.appointments.createTrial.useMutation({
    onSuccess: async () => {
      if (selectedRoom && selectedDate) {
        const timestamp = selectedDate.getTime();
        const slots =
          await trpcUtils.client.appointments.getAvailableSlots.query({
            roomId: selectedRoom,
            date: timestamp,
          });
        setAvailableSlots(slots);
      }
    },
  });

  // ===============================
  // Regras de calendário
  // ===============================
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) return true;
    if (date.getDay() === 0) return true; // domingo
    if (isHoliday(checkDate)) return true;

    return false;
  };

  // ===============================
  // Enviar agendamento
  // ===============================
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.info("Faça login para agendar sua aula experimental");
      setLocation("/login");
      return;
    }

    if (!user?.cpf) {
      toast.error("Complete seu perfil antes de agendar");
      setLocation("/profile");
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
      await createTrialMutation.mutateAsync({
        unitId: selectedUnit!,
        roomId: selectedRoom,
        professionalId: professional.id,
        appointmentDate,
      });

      toast.success("Aula experimental agendada com sucesso!");
      setLocation("/my-appointments");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao agendar aula");
    }
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      <section className="bg-gradient-soft py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Aula Experimental Gratuita
        </h1>
        <p className="text-muted-foreground">
          Limitado a 1 aula por CPF
        </p>
      </section>

      <section className="py-12 flex-1">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Agende sua Aula Experimental</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Unidade */}
              <div>
                <Label>Unidade</Label>
                <Select
                  onValueChange={(v) => {
                    setSelectedUnit(Number(v));
                    setSelectedRoom(undefined);
                    setSelectedDate(undefined);
                    setSelectedTime(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sala */}
              {selectedUnit && rooms && (
                <div>
                  <Label>Sala</Label>
                  <Select
                    onValueChange={(v) => {
                      setSelectedRoom(Number(v));
                      setSelectedDate(undefined);
                      setSelectedTime(undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a sala" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Profissional */}
              {professional && (
                <div className="bg-muted p-3 rounded">
                  Profissional: <strong>{professional.fullName}</strong>
                </div>
              )}

              {/* Data */}
              {selectedRoom && (
                <div>
                  <Label>Data</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      setSelectedTime(undefined);
                    }}
                    disabled={isDateDisabled}
                    className="rounded-md border"
                  />
                </div>
              )}

              {/* Loading */}
              {slotsLoading && (
                <div className="text-center text-muted-foreground">
                  Carregando horários...
                </div>
              )}

              {/* Error */}
              {slotsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar horários
                  </AlertDescription>
                </Alert>
              )}

              {/* Horários */}
              {selectedDate && availableSlots && (
                <div>
                  <Label>Horário</Label>
                  <Select onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots
                        .filter((s) => s.available)
                        .map((s) => (
                          <SelectItem key={s.time} value={s.time}>
                            {s.time} ({s.count}/{s.capacity})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                className="w-full"
                disabled={createTrialMutation.isPending}
                onClick={handleSubmit}
              >
                {createTrialMutation.isPending
                  ? "Agendando..."
                  : "Agendar Aula Experimental"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
