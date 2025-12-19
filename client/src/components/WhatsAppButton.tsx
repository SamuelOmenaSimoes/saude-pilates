import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "5511930112640"; // WhatsApp number with country code
  const message = "Olá! Gostaria de mais informações sobre as aulas de Pilates.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-smooth hover:scale-110 hover:shadow-xl"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
