import { logAction } from "./audit";
import type { AuditActionType } from "../types/database";

export type DiffFieldKind = "token" | "text" | "number" | "time" | "boolean";

export interface DiffFieldSpec {
  label: string;
  kind: DiffFieldKind;
  // Leading verb for the description, e.g. "Shifted" instead of the
  // default "Updated" — lets a field read naturally ("Shifted minimum
  // booking age baseline from 18 to 21") without a one-off template per field.
  verb?: string;
  // Only used for kind: "boolean" — phrases a toggle as a state transition
  // ("Triggered Maintenance Mode Kill Switch to ON") instead of a generic
  // before/after pair.
  describeBoolean?: (next: boolean) => string;
}

function formatValue(kind: DiffFieldKind, value: unknown): string {
  if (kind === "token") return String(value);
  if (kind === "text") return `"${String(value)}"`;
  return String(value);
}

// Section 4.13: every configuration save must record exactly which fields
// changed, not just that "settings were saved" — this walks the field spec
// map, compares old vs. new, and writes one descriptive audit_logs entry per
// changed field so a reviewer can see precisely what moved and by how much.
export async function logConfigDiff<T extends Record<string, unknown>>(
  adminId: string,
  actionType: AuditActionType,
  before: T,
  after: T,
  fieldSpecs: Partial<Record<keyof T, DiffFieldSpec>>,
): Promise<void> {
  const changedKeys = (Object.keys(fieldSpecs) as (keyof T)[]).filter(
    (key) => before[key] !== after[key],
  );

  for (const key of changedKeys) {
    const spec = fieldSpecs[key];
    if (!spec) continue;

    const oldValue = before[key];
    const newValue = after[key];

    let description: string;
    if (spec.kind === "boolean") {
      description = spec.describeBoolean
        ? spec.describeBoolean(Boolean(newValue))
        : `${spec.label}: changed from ${formatValue(spec.kind, oldValue)} to ${formatValue(spec.kind, newValue)}.`;
    } else if (spec.kind === "text") {
      // Text blocks are logged as a targeted area reference rather than
      // dumping full paragraph contents into the audit trail.
      description = `Updated ${spec.label} text content.`;
    } else {
      const verb = spec.verb ?? "Updated";
      description = `${verb} ${spec.label} from ${formatValue(spec.kind, oldValue)} to ${formatValue(spec.kind, newValue)}.`;
    }

    await logAction(adminId, actionType, description);
  }
}
