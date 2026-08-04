import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { NewOperationModal } from "./components/NewOperationModal";
import { StatusPill } from "./components/StatusPill";
import { assets, customers, initialOperations } from "./data/demo";
import { demoMode } from "./lib/supabase";
import type { Operation, Page } from "./types";

const navigation = [
  { id: "dashboard" as const, label: "Resumen", icon: LayoutDashboard },
  { id: "operations" as const, label: "Remitos", icon: FileText, count: 5 },
  { id: "assets" as const, label: "Instrumental", icon: Boxes },
  { id: "customers" as const, label: "Instituciones", icon: Building2 },
  { id: "assistant" as const, label: "Asistente IA", icon: Sparkles },
];

const pageMeta: Record<Page, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: { eyebrow: "Centro de operaciones", title: "Buen día, Medcare", subtitle: "Este es el estado de tu operación al 31 de julio." },
  operations: { eyebrow: "Trazabilidad", title: "Remitos y movimientos", subtitle: "Controlá cada salida, firma y devolución de instrumental." },
  assets: { eyebrow: "Inventario retornable", title: "Instrumental y cajas", subtitle: "Disponibilidad, ubicación y rotación de cada activo." },
  customers: { eyebrow: "Red asistencial", title: "Instituciones", subtitle: "Hospitales, clínicas, sedes y contactos operativos." },
  assistant: { eyebrow: "Nexo Intelligence", title: "Preguntale a tu operación", subtitle: "Una interfaz conversacional preparada para consultar datos autorizados." },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [operations, setOperations] = useState(initialOperations);
  const [search, setSearch] = useState("");
  const [newOperation, setNewOperation] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");

  const filteredOperations = useMemo(() => {
    const term = search.toLocaleLowerCase();
    return operations.filter((item) =>
      [item.number, item.customer, item.asset].some((value) =>
        value.toLocaleLowerCase().includes(term),
      ),
    );
  }, [operations, search]);

  const navigate = (target: Page) => {
    setPage(target);
    setMobileNav(false);
    setSearch("");
  };

  const created = (operation: Operation) => {
    setOperations((current) => [operation, ...current]);
    setNewOperation(false);
    setPage("operations");
    setToast(`Borrador ${operation.number} creado`);
    window.setTimeout(() => setToast(""), 3200);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand__mark"><span /><span /></div>
          <div><strong>Nexo</strong><small>operations</small></div>
          <button className="sidebar__close" onClick={() => setMobileNav(false)}><X /></button>
        </div>
        <div className="workspace-switcher">
          <span className="avatar avatar--company">M</span>
          <span><strong>Medcare SRL</strong><small>Demo comercial</small></span>
          <ChevronDown size={16} />
        </div>
        <nav className="nav">
          <span className="nav__label">OPERACIÓN</span>
          {navigation.map((item) => (
            <button className={page === item.id ? "nav__item nav__item--active" : "nav__item"} onClick={() => navigate(item.id)} key={item.id}>
              <item.icon size={19} /><span>{item.label}</span>
              {item.count && <small>{operations.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <button className="nav__item"><Settings size={19} /><span>Configuración</span></button>
          <div className="user-card">
            <span className="avatar">SU</span>
            <span><strong>Sebastián</strong><small>Administrador</small></span>
            <ChevronRight size={16} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu /></button>
          <div className="global-search"><Search size={18} /><input placeholder="Buscar remitos, cajas o instituciones..." /></div>
          <div className="topbar__actions">
            {demoMode && <span className="demo-badge"><span /> Modo demo</span>}
            <button className="button button--primary button--compact" onClick={() => setNewOperation(true)}><Plus size={17} /> Nuevo remito</button>
            <button className="profile-button"><CircleUserRound size={22} /></button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div><span className="eyebrow">{pageMeta[page].eyebrow}</span><h1>{pageMeta[page].title}</h1><p>{pageMeta[page].subtitle}</p></div>
            {page !== "assistant" && <button className="button button--primary page-cta" onClick={() => setNewOperation(true)}><Plus size={18} /> Nuevo remito</button>}
          </div>

          {page === "dashboard" && <Dashboard operations={operations} onNavigate={navigate} />}
          {page === "operations" && <OperationsPage operations={filteredOperations} search={search} onSearch={setSearch} />}
          {page === "assets" && <AssetsPage />}
          {page === "customers" && <CustomersPage />}
          {page === "assistant" && <AssistantPage onNavigate={navigate} />}
        </div>
      </main>

      {newOperation && <NewOperationModal onClose={() => setNewOperation(false)} onCreate={created} nextNumber={130 + operations.length - initialOperations.length} />}
      {toast && <div className="toast"><FileCheck2 size={19} />{toast}</div>}
      {mobileNav && <div className="nav-backdrop" onClick={() => setMobileNav(false)} />}
    </div>
  );
}

function Dashboard({ operations, onNavigate }: { operations: Operation[]; onNavigate: (page: Page) => void }) {
  const active = operations.filter((item) => ["dispatched", "in_use", "return_due"].includes(item.status));
  return (
    <>
      <section className="metrics">
        <article className="metric"><span className="metric__icon metric__icon--green"><PackageCheck /></span><div><small>Cajas en instituciones</small><strong>{active.length}</strong><span><TrendingUp size={14} /> 2 más que ayer</span></div></article>
        <article className="metric"><span className="metric__icon metric__icon--blue"><Boxes /></span><div><small>Instrumental disponible</small><strong>{assets.filter((item) => item.status === "available").length}</strong><span className="muted">de {assets.length} cajas</span></div></article>
        <article className="metric"><span className="metric__icon metric__icon--amber"><CalendarClock /></span><div><small>Retiros pendientes</small><strong>{operations.filter((item) => item.status === "return_due").length}</strong><span className="warning">Requiere atención</span></div></article>
        <article className="metric"><span className="metric__icon metric__icon--violet"><FileCheck2 /></span><div><small>Remitos este mes</small><strong>42</strong><span><TrendingUp size={14} /> 12% mensual</span></div></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel panel--wide">
          <header className="panel__header"><div><h2>Movimientos recientes</h2><p>Últimas entregas y devoluciones</p></div><button className="text-button" onClick={() => onNavigate("operations")}>Ver todos <ArrowRight size={16} /></button></header>
          <OperationTable operations={operations.slice(0, 5)} compact />
        </article>
        <article className="panel attention-panel">
          <header className="panel__header"><div><h2>Requieren atención</h2><p>Próximos pasos operativos</p></div><span className="count-badge">3</span></header>
          <div className="attention-list">
            <button><span className="attention-icon attention-icon--red"><CalendarClock /></span><span><strong>Retiro vencido</strong><small>Caja neurocirugía · Hospital Italiano</small></span><ChevronRight /></button>
            <button><span className="attention-icon attention-icon--amber"><Activity /></span><span><strong>Control pendiente</strong><small>Set artroscopía · ingresó ayer</small></span><ChevronRight /></button>
            <button><span className="attention-icon attention-icon--blue"><FileText /></span><span><strong>Firma por completar</strong><small>Remito R-A-00000129</small></span><ChevronRight /></button>
          </div>
          <div className="insight">
            <span><Sparkles size={17} /> INSIGHT DE NEXO</span>
            <p>La caja de traumatología compacta tuvo 39 movimientos. Conviene evaluar una segunda unidad antes del próximo trimestre.</p>
            <button onClick={() => onNavigate("assistant")}>Consultar análisis <ArrowRight size={14} /></button>
          </div>
        </article>
      </section>
    </>
  );
}

function OperationsPage({ operations, search, onSearch }: { operations: Operation[]; search: string; onSearch: (value: string) => void }) {
  return (
    <section className="panel">
      <div className="table-toolbar">
        <div className="tabs"><button className="tab tab--active">Todos <span>{operations.length}</span></button><button className="tab">En curso</button><button className="tab">Devueltos</button></div>
        <label className="table-search"><Search size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Filtrar..." /></label>
      </div>
      <OperationTable operations={operations} />
    </section>
  );
}

function OperationTable({ operations, compact = false }: { operations: Operation[]; compact?: boolean }) {
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>Remito</th><th>Institución</th><th>Instrumental</th><th>Salida</th><th>Retiro</th><th>Estado</th><th /></tr></thead>
        <tbody>
          {operations.map((item) => (
            <tr key={item.id}>
              <td><strong className="document-number">{item.number}</strong></td>
              <td><strong>{item.customer}</strong><small>{item.destination}</small></td>
              <td>{item.asset}</td>
              <td>{formatDate(item.sentAt)}</td>
              <td>{formatDate(item.dueAt)}</td>
              <td><StatusPill status={item.status} /></td>
              <td><button className="row-action"><ChevronRight size={18} /></button></td>
            </tr>
          ))}
          {!operations.length && <tr><td className="empty-state" colSpan={7}>No encontramos movimientos con ese criterio.</td></tr>}
        </tbody>
      </table>
      {compact && <div className="mobile-table-hint">Deslizá para ver más información</div>}
    </div>
  );
}

function AssetsPage() {
  return (
    <section className="card-grid">
      {assets.map((asset) => (
        <article className="asset-card" key={asset.id}>
          <div className="asset-card__top"><span className="asset-visual"><Boxes /></span><StatusPill status={asset.status} /></div>
          <span className="eyebrow">{asset.code}</span><h3>{asset.name}</h3><p>{asset.family} · {asset.pieces} piezas</p>
          <div className="asset-meta"><span><small>Ubicación actual</small><strong>{asset.location}</strong></span><span><small>Rotaciones</small><strong>{asset.turns}</strong></span></div>
        </article>
      ))}
    </section>
  );
}

function CustomersPage() {
  return (
    <section className="panel">
      <div className="table-toolbar"><div className="tabs"><button className="tab tab--active">Activas <span>{customers.length}</span></button></div><button className="button button--outline"><Plus size={16} /> Institución</button></div>
      <div className="customer-list">
        {customers.map((customer) => (
          <article key={customer.id}><span className="customer-logo">{customer.name.charAt(0)}</span><div><span className="eyebrow">{customer.kind} · {customer.code}</span><h3>{customer.name}</h3><p>{customer.location} · {customer.contact}</p></div><span className="loans"><strong>{customer.activeLoans}</strong><small>préstamos activos</small></span><ChevronRight /></article>
        ))}
      </div>
    </section>
  );
}

function AssistantPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [message, setMessage] = useState("");
  const [asked, setAsked] = useState(false);
  const submit = () => { if (message.trim()) setAsked(true); };
  return (
    <section className="assistant-layout">
      <article className="assistant-chat">
        <div className="assistant-welcome">
          <span className="ai-orb"><Bot /></span><h2>¿Qué necesitás saber?</h2><p>Consultá operaciones, disponibilidad y tendencias usando lenguaje natural.</p>
          <div className="prompt-grid">
            {["¿Qué cajas debo retirar hoy?", "¿Cuál fue el instrumental más utilizado?", "Mostrame las instituciones con préstamos activos", "¿Qué caja conviene comprar próximamente?"].map((prompt) => <button onClick={() => setMessage(prompt)} key={prompt}>{prompt}<ArrowRight size={15} /></button>)}
          </div>
        </div>
        {asked && <div className="chat-response"><span className="ai-mini"><Sparkles /></span><div><strong>Análisis preparado para la demo</strong><p>Hay una caja con retiro pendiente: <b>Caja neurocirugía</b> en Hospital Italiano. El retiro estaba previsto para hoy a las 18:00. En producción, esta respuesta se obtendrá mediante herramientas MCP de sólo lectura y respetará los permisos del usuario.</p><button onClick={() => onNavigate("operations")}>Abrir remito relacionado</button></div></div>}
        <div className="composer"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Preguntá sobre tu operación..." /><button onClick={submit}><Send size={18} /></button></div>
      </article>
      <aside className="assistant-info"><span className="eyebrow">Capacidades de la demo</span><h3>IA con contexto y límites</h3><p>Nexo no accede libremente a la base: utiliza herramientas explícitas y auditables.</p><ul><li><FileCheck2 />Consultar remitos y estados</li><li><Boxes />Analizar uso de instrumental</li><li><UsersRound />Resumir actividad por cliente</li><li><Activity />Detectar demoras y anomalías</li></ul><div className="security-note">Las acciones de escritura requerirán confirmación y permisos específicos.</div></aside>
    </section>
  );
}
