export type Admission = "free" | "paid" | "unknown";
export function classifyAdmission(fee: unknown): Admission;
