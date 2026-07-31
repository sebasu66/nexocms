import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PackageCheck, X } from "lucide-react";
import { assets, customers } from "../data/demo";
import type { Operation } from "../types";

interface Props {
  onClose: () => void;
  onCreate: (operation: Operation) => void;
  nextNumber: number;
}

export function NewOperationModal({ onClose, onCreate, nextNumber }: Props) {
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState(customers[0].id);
  const [assetId, setAssetId] = useState(
    assets.find((asset) => asset.status === "available")?.id ?? assets[0].id,
  );
  const [destination, setDestination] = useState("Quirófano central");
  const [dueAt, setDueAt] = useState("2026-08-05T17:00");

  const customer = useMemo(
    () => customers.find((item) => item.id === customerId)!,
    [customerId],
  );
  const asset = useMemo(
    () => assets.find((item) => item.id === assetId)!,
    [assetId],
  );
  const number = `R-A-${String(nextNumber).padStart(8, "0")}`;

  const submit = () => {
    onCreate({
      id: crypto.randomUUID(),
      number,
      customerId,
      customer: customer.name,
      destination,
      assetId,
      asset: asset.name,
      sentAt: new Date().toISOString(),
      dueAt,
      status: "draft",
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header">
          <div>
            <span className="eyebrow">Nuevo movimiento</span>
            <h2>Crear remito de salida</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </header>
        <div className="steps">
          {["Destino", "Instrumental", "Revisión"].map((label, index) => (
            <div className={`step ${step >= index + 1 ? "step--active" : ""}`} key={label}>
              <span>{step > index + 1 ? <Check size={14} /> : index + 1}</span>{label}
            </div>
          ))}
        </div>
        <div className="modal__body">
          {step === 1 && (
            <div className="form-grid">
              <label>Institución
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  {customers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Sector o destino
                <input value={destination} onChange={(event) => setDestination(event.target.value)} />
              </label>
              <label>Retiro previsto
                <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="asset-picker">
              {assets.filter((item) => item.status === "available").map((item) => (
                <button className={`asset-choice ${assetId === item.id ? "asset-choice--selected" : ""}`} onClick={() => setAssetId(item.id)} key={item.id}>
                  <span className="asset-choice__icon"><PackageCheck size={22} /></span>
                  <span><strong>{item.name}</strong><small>{item.code} · {item.pieces} piezas</small></span>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="review-card">
              <div className="review-number">{number}</div>
              <dl>
                <div><dt>Institución</dt><dd>{customer.name}</dd></div>
                <div><dt>Destino</dt><dd>{destination}</dd></div>
                <div><dt>Instrumental</dt><dd>{asset.name}</dd></div>
                <div><dt>Contenido</dt><dd>{asset.pieces} piezas verificadas</dd></div>
                <div><dt>Retiro previsto</dt><dd>{new Date(dueAt).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}</dd></div>
              </dl>
              <p>El remito se guardará como borrador. Podrás emitirlo y capturar la firma al entregar la caja.</p>
            </div>
          )}
        </div>
        <footer className="modal__footer">
          <button className="button button--ghost" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            <ArrowLeft size={17} /> {step === 1 ? "Cancelar" : "Atrás"}
          </button>
          <button className="button button--primary" onClick={step === 3 ? submit : () => setStep(step + 1)}>
            {step === 3 ? "Crear borrador" : "Continuar"} {step === 3 ? <Check size={17} /> : <ArrowRight size={17} />}
          </button>
        </footer>
      </section>
    </div>
  );
}
