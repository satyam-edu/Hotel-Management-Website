import { ClipboardList } from "lucide-react";

export function BookingRulesTab() {
  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <ClipboardList size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Booking Rules
        </h2>
      </div>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        Minimum booking age, maximum adults/children per room, check-in and
        check-out times, and the cancellation policy text will be editable
        here. Coming soon.
      </p>
    </div>
  );
}
