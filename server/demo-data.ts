export interface DemoOperation {
  id: string;
  number: string;
  customer: string;
  destination: string;
  asset: string;
  status: "draft" | "in_use" | "return_due" | "returned";
  sentAt: string;
  dueAt: string;
  signedBy?: string | null;
}

export const demoOperations: DemoOperation[] = [
  { id: "operation:o1", number: "R-A-00000128", customer: "Hospital Privado Universitario", destination: "Quirófano 4", asset: "Caja traumatología grande", status: "in_use", sentAt: "2026-07-29T09:15:00-03:00", dueAt: "2026-08-02T17:00:00-03:00", signedBy: "Dra. Paula Márquez" },
  { id: "operation:o2", number: "R-A-00000127", customer: "Hospital Italiano", destination: "Central de esterilización", asset: "Caja neurocirugía", status: "return_due", sentAt: "2026-07-28T13:40:00-03:00", dueAt: "2026-07-31T18:00:00-03:00", signedBy: "Martín López" },
  { id: "operation:o3", number: "R-A-00000126", customer: "Sanatorio Allende", destination: "Quirófano central", asset: "Set laparoscopía HD", status: "returned", sentAt: "2026-07-25T08:20:00-03:00", dueAt: "2026-07-27T15:00:00-03:00", signedBy: "Lic. Andrés Pérez" },
];

export const demoAssets = [
  { id: "asset:a1", code: "CX-TRA-001", name: "Caja traumatología grande", status: "dispatched", pieces: 42 },
  { id: "asset:a2", code: "CX-LAP-002", name: "Set laparoscopía HD", status: "available", pieces: 28 },
  { id: "asset:a3", code: "CX-NEU-001", name: "Caja neurocirugía", status: "dispatched", pieces: 36 },
  { id: "asset:a4", code: "CX-ART-003", name: "Set artroscopía hombro", status: "inspection", pieces: 24 },
];

export function statusLabel(status: DemoOperation["status"] | string): string {
  return { draft: "borrador", in_use: "en uso", return_due: "retiro pendiente", returned: "devuelto" }[status] ?? status;
}
