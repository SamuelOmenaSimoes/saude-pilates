import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shape returned by appointments.getAvailableSlots (time can be Date or ISO string after serialization). */
export type AvailableSlot = {
  time: Date | string;
  available: boolean;
  spotsLeft: number;
  maxCapacity: number;
};

function toDate(t: Date | string): Date {
  return typeof t === "string" ? new Date(t) : t;
}

type SlotTimeSelectProps = {
  slots: AvailableSlot[] | undefined;
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function SlotTimeSelect({
  slots,
  value,
  onValueChange,
  placeholder = "Selecione o horário",
  label = "Horário",
}: SlotTimeSelectProps) {
  const availableSlots = slots?.filter((slot) => slot.available) ?? [];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableSlots.map((slot) => {
            const time = toDate(slot.time);
            return (
              <SelectItem
                key={time.getTime()}
                value={time.toLocaleTimeString("pt-BR")}
              >
                {time.toLocaleDateString("pt-BR")}{" "}
                {time.toLocaleTimeString("pt-BR")} (
                {slot.spotsLeft}/{slot.maxCapacity} vagas disponíveis)
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
