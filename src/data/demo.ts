import type { Asset, Customer, Operation } from "../types";

export const customers: Customer[] = [
  { id: "c1", code: "CLI-001", name: "Hospital Privado Universitario", kind: "Hospital", location: "Córdoba Capital", contact: "Quirófano central", activeLoans: 3 },
  { id: "c2", code: "CLI-002", name: "Sanatorio Allende", kind: "Sanatorio", location: "Nueva Córdoba", contact: "Coordinación quirúrgica", activeLoans: 1 },
  { id: "c3", code: "CLI-003", name: "Clínica del Sol", kind: "Clínica", location: "Villa Carlos Paz", contact: "Esterilización", activeLoans: 0 },
  { id: "c4", code: "CLI-004", name: "Hospital Italiano", kind: "Hospital", location: "Córdoba Capital", contact: "Depósito médico", activeLoans: 2 },
  { id: "c5", code: "CLI-005", name: "Sanatorio Francés", kind: "Sanatorio", location: "Alta Córdoba", contact: "Cirugía", activeLoans: 0 },
];

export const assets: Asset[] = [
  { id: "a1", code: "CX-TRA-001", name: "Caja traumatología grande", family: "Traumatología", pieces: 42, status: "dispatched", location: "Hospital Privado", turns: 18 },
  { id: "a2", code: "CX-LAP-002", name: "Set laparoscopía HD", family: "Laparoscopía", pieces: 28, status: "available", location: "Depósito Medcare", turns: 25 },
  { id: "a3", code: "CX-NEU-001", name: "Caja neurocirugía", family: "Neurocirugía", pieces: 36, status: "dispatched", location: "Hospital Italiano", turns: 11 },
  { id: "a4", code: "CX-ART-003", name: "Set artroscopía hombro", family: "Artroscopía", pieces: 24, status: "inspection", location: "Control de calidad", turns: 32 },
  { id: "a5", code: "CX-COL-002", name: "Caja cirugía de columna", family: "Columna", pieces: 51, status: "available", location: "Depósito Medcare", turns: 14 },
  { id: "a6", code: "CX-TRA-004", name: "Caja traumatología compacta", family: "Traumatología", pieces: 31, status: "maintenance", location: "Servicio técnico", turns: 39 },
];

export const initialOperations: Operation[] = [
  { id: "o1", number: "R-A-00000128", customerId: "c1", customer: "Hospital Privado Universitario", destination: "Quirófano 4", assetId: "a1", asset: "Caja traumatología grande", sentAt: "2026-07-29T09:15:00", dueAt: "2026-08-02T17:00:00", status: "in_use", signedBy: "Dra. Paula Márquez" },
  { id: "o2", number: "R-A-00000127", customerId: "c4", customer: "Hospital Italiano", destination: "Central de esterilización", assetId: "a3", asset: "Caja neurocirugía", sentAt: "2026-07-28T13:40:00", dueAt: "2026-07-31T18:00:00", status: "return_due", signedBy: "Martín López" },
  { id: "o3", number: "R-A-00000126", customerId: "c2", customer: "Sanatorio Allende", destination: "Quirófano central", assetId: "a2", asset: "Set laparoscopía HD", sentAt: "2026-07-25T08:20:00", dueAt: "2026-07-27T15:00:00", status: "returned", signedBy: "Lic. Andrés Pérez" },
  { id: "o4", number: "R-A-00000129", customerId: "c1", customer: "Hospital Privado Universitario", destination: "Traumatología", assetId: "a5", asset: "Caja cirugía de columna", sentAt: "2026-08-01T07:30:00", dueAt: "2026-08-04T17:00:00", status: "draft" },
  { id: "o5", number: "R-A-00000125", customerId: "c4", customer: "Hospital Italiano", destination: "Quirófano 2", assetId: "a4", asset: "Set artroscopía hombro", sentAt: "2026-07-22T10:10:00", dueAt: "2026-07-24T18:00:00", status: "returned", signedBy: "Dra. Carla Ruiz" },
];
