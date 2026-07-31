import type { Asset, OperationStatus } from "../types";

const labels: Record<string, string> = {
  draft: "Borrador",
  dispatched: "Despachado",
  in_use: "En uso",
  return_due: "Retiro pendiente",
  returned: "Devuelto",
  available: "Disponible",
  inspection: "En inspección",
  maintenance: "Mantenimiento",
};

export function StatusPill({ status }: { status: OperationStatus | Asset["status"] }) {
  return <span className={`status status--${status}`}>{labels[status]}</span>;
}
