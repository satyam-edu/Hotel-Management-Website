import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Phone, Trash2, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { loadPendingEnquiries, type PendingEnquiry } from "../../lib/enquiries";

function formatPartySize(adults: number, children: number): string {
  const adultsLabel = `${adults} Adult${adults === 1 ? "" : "s"}`;
  if (children === 0) return adultsLabel;
  return `${adultsLabel}, ${children} Child${children === 1 ? "" : "ren"}`;
}

function formatDateRange(checkIn: string, checkOut: string): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return `${format(checkIn)} — ${format(checkOut)} (${nights} night${nights === 1 ? "" : "s"})`;
}

export function Enquiries() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<PendingEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadEnquiries() {
    setIsLoading(true);
    setLoadError(null);

    const result = await loadPendingEnquiries();

    if (result.error) {
      setLoadError(result.error);
      setIsLoading(false);
      return;
    }

    setEnquiries(result.data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadEnquiries();
  }, []);

  function handleConvert(enquiry: PendingEnquiry) {
    navigate("/admin/front-desk", { state: { fromEnquiry: enquiry } });
  }

  async function handleDelete(enquiryId: string) {
    if (!supabase) {
      setActionError("Database connection is not configured.");
      return;
    }

    setProcessingId(enquiryId);
    setActionError(null);
    setPendingDeleteId(null);

    const { error } = await supabase
      .from("enquiries")
      .delete()
      .eq("id", enquiryId);

    setProcessingId(null);

    if (error) {
      console.error("Failed to delete enquiry:", error.message);
      setActionError("Could not delete this enquiry. Please try again.");
      return;
    }

    await loadEnquiries();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Pending Enquiries
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Booking requests submitted from the homepage, awaiting front-desk review.
        </p>
      </div>

      {actionError && (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      <div className="glass-panel w-full overflow-x-auto rounded-xl scrollbar-thin">
        <table className="w-full min-w-[900px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[23%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="whitespace-nowrap px-6 py-4 font-medium">Enquiry ID</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">Guest Name</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">Phone</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">Dates &amp; Duration</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">Requested Room</th>
              <th className="whitespace-nowrap px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="flex items-center justify-center gap-3 text-sm text-white/40">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
                    Loading enquiries…
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && loadError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-red-400"
                  role="alert"
                >
                  {loadError}
                </td>
              </tr>
            )}

            {!isLoading &&
              !loadError &&
              enquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-white/70">
                    {enquiry.reference_code}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex min-w-0 items-center gap-2 text-white/90">
                      <User size={14} className="shrink-0 text-primary" />
                      <span className="truncate">{enquiry.full_name}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2 text-white/70">
                      <Phone size={14} className="shrink-0 text-white/40" />
                      {enquiry.mobile}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2 text-white/70">
                      <Calendar size={14} className="shrink-0 text-white/40" />
                      {formatDateRange(
                        enquiry.check_in_date,
                        enquiry.check_out_date,
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="truncate text-white/70">
                      {enquiry.room_type_name ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {formatPartySize(enquiry.adults, enquiry.children)}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={processingId === enquiry.id}
                        onClick={() => handleConvert(enquiry)}
                        className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Convert to Booking
                      </button>

                      {pendingDeleteId === enquiry.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={processingId === enquiry.id}
                            onClick={() => handleDelete(enquiry.id)}
                            className="rounded-sm px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors duration-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="rounded-sm px-2.5 py-1.5 text-xs text-white/50 transition-colors duration-300 hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete enquiry ${enquiry.reference_code}`}
                          disabled={processingId === enquiry.id}
                          onClick={() => setPendingDeleteId(enquiry.id)}
                          className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

            {!isLoading && !loadError && enquiries.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-white/40"
                >
                  No pending enquiries right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
