import { MessageCircle } from "lucide-react";

export function WhatsApp() {
  return (
    <a
      href="https://wa.me/919999999999?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20a%20room%20booking%20at%20Hotel%20Kamla%20Inn%20Grand."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group"
      style={{ background: "#25D366" }}
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle size={20} color="#fff" fill="#fff" />
      <span
        className="text-sm hidden sm:block"
        style={{ color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
      >
        Chat with us
      </span>
    </a>
  );
}
