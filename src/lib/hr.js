import { base44 } from "@/api/base44Client";

export async function logAudit({ user, action, module, record, prev, next }) {
  try {
    await base44.entities.AuditLog.create({
      user: user || "System",
      action,
      module,
      record_affected: record || "",
      previous_value: prev || "",
      new_value: next || "",
      ip_address: "",
    });
  } catch {}
}

export function empName(e) {
  if (!e) return "—";
  return [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(" ");
}

export function initials(e) {
  if (!e) return "?";
  const f = e.first_name?.[0] || "";
  const l = e.last_name?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysBetween(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  "On Leave": "bg-amber-100 text-amber-700",
  Suspended: "bg-orange-100 text-orange-700",
  Terminated: "bg-red-100 text-red-700",
  Resigned: "bg-gray-100 text-gray-600",
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
};