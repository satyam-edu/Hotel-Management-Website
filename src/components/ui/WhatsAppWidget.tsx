import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "910000000000";

export function WhatsAppWidget() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition-transform hover:scale-105"
    >
      <MessageCircle size={28} fill="currentColor" className="text-white" />
    </a>
  );
}
