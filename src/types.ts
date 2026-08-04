export type Page = "dashboard" | "operations" | "assets" | "customers" | "assistant";

export type OperationStatus =
  | "draft"
  | "dispatched"
  | "in_use"
  | "return_due"
  | "returned";

export interface Customer {
  id: string;
  code: string;
  name: string;
  kind: "Hospital" | "Clínica" | "Sanatorio";
  location: string;
  contact: string;
  activeLoans: number;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  family: string;
  pieces: number;
  status: "available" | "dispatched" | "inspection" | "maintenance";
  location: string;
  turns: number;
}

export interface Operation {
  id: string;
  number: string;
  customerId: string;
  customer: string;
  destination: string;
  assetId: string;
  asset: string;
  sentAt: string;
  dueAt: string;
  status: OperationStatus;
  signedBy?: string;
}
