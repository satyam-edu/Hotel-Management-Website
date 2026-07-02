import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "919956050766";

export function WhatsAppWidget() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex h-14 items-center overflow-hidden rounded-full bg-[#25D366] px-[15px] text-white shadow-lg shadow-black/30 transition-all duration-300"
    >
      <MessageCircle size={28} fill="currentColor" className="shrink-0" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-32 group-hover:opacity-100 sm:block">
        Chat with us
      </span>
    </a>
  );
}
