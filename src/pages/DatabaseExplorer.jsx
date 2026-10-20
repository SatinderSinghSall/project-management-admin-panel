import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Braces,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Copy,
  Database,
  Eye,
  FileJson,
  KeyRound,
  Link2,
  LoaderCircle,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Table2,
  X,
} from "lucide-react";
import { useAdminApi } from "../services/useAdminApi";

const PAGE_SIZE = 10;

const ENUMS = {
  WorkspaceRole: ["ADMIN", "MEMBER"],
  TaskStatus: ["TODO", "IN_PROGRESS", "DONE"],
  TaskType: ["TASK", "BUG", "FEATURE", "IMPROVEMENT", "OTHER"],
  ProjectStatus: ["ACTIVE", "PLANNING", "COMPLETED", "ON_HOLD", "CANCELLED"],
  Priority: ["LOW", "MEDIUM", "HIGH"],
};

const SCHEMA = [
  {
    name: "User",
    api: "users",
    description: "Application users and profile information",
    fields: [
      ["id", "String", "Primary key", "—"],
      ["name", "String", "Required", "—"],
      ["email", "String", "Unique", "—"],
      ["image", "String", "Default", '""'],
      ["createdAt", "DateTime", "Default", "now()"],
      ["updatedAt", "DateTime", "Automatic", "@updatedAt"],
    ],
    relations: [
      ["workspaces", "WorkspaceMember[]", "Workspace memberships"],
      ["projects", "Project[]", "Owned projects · ProjectOwner"],
      ["tasks", "Task[]", "Assigned tasks · TaskAssignee"],
      ["comments", "Comment[]", "Authored comments"],
      ["ownedWorkspaces", "Workspace[]", "Owned workspaces"],
      ["ProjectMember", "ProjectMember[]", "Project memberships"],
    ],
  },
  {
    name: "Workspace",
    api: "workspaces",
    description: "Workspaces, settings, and ownership",
    fields: [
      ["id", "String", "Primary key", "—"],
      ["name", "String", "Required", "—"],
      ["slug", "String", "Unique", "—"],
      ["description", "String?", "Optional", "null"],
      ["settings", "Json", "Default", '"{}"'],
      ["ownerId", "String", "Foreign key", "—"],
      ["createdAt", "DateTime", "Default", "now()"],
      ["image_url", "String", "Default", '""'],
      ["updatedAt", "DateTime", "Automatic", "@updatedAt"],
    ],
    relations: [
      ["members", "WorkspaceMember[]", "Workspace members"],
      ["projects", "Project[]", "Workspace projects"],
      ["owner", "User", "Workspace owner · ownerId → User.id"],
    ],
  },
  {
    name: "WorkspaceMember",
    api: "workspaceMembers",
    description: "Membership and roles inside a workspace",
    fields: [
      ["id", "String", "Primary key", "@default(uuid())"],
      ["userId", "String", "Foreign key", "—"],
      ["workspaceId", "String", "Foreign key", "—"],
      ["message", "String", "Default", '""'],
      ["role", "WorkspaceRole", "Enum", "MEMBER"],
    ],
    constraints: ["@@unique([userId, workspaceId])"],
    relations: [
      ["user", "User", "userId → User.id"],
      ["workspace", "Workspace", "workspaceId → Workspace.id"],
    ],
  },
  {
    name: "Project",
    api: "projects",
    description: "Projects, ownership, progress, and scheduling",
    fields: [
      ["id", "String", "Primary key", "@default(uuid())"],
      ["name", "String", "Required", "—"],
      ["description", "String?", "Optional", "null"],
      ["priority", "Priority", "Enum", "MEDIUM"],
      ["status", "ProjectStatus", "Enum", "ACTIVE"],
      ["start_date", "DateTime?", "Optional", "null"],
      ["end_date", "DateTime?", "Optional", "null"],
      ["team_lead", "String", "Foreign key", "—"],
      ["workspaceId", "String", "Foreign key", "—"],
      ["progress", "Int", "Default", "0"],
      ["createdAt", "DateTime", "Default", "now()"],
      ["updatedAt", "DateTime", "Automatic", "@updatedAt"],
    ],
    constraints: [],
    relations: [
      ["members", "ProjectMember[]", "Project memberships"],
      ["owner", "User", "team_lead → User.id · ProjectOwner"],
      ["workspace", "Workspace", "workspaceId → Workspace.id"],
      ["tasks", "Task[]", "Tasks belonging to this project"],
    ],
  },
  {
    name: "ProjectMember",
    api: "projectMembers",
    description: "Membership records linking users and projects",
    fields: [
      ["id", "String", "Primary key", "@default(uuid())"],
      ["userId", "String", "Foreign key", "—"],
      ["projectId", "String", "Foreign key", "—"],
    ],
    constraints: ["@@unique([userId, projectId])"],
    relations: [
      ["user", "User", "userId → User.id"],
      ["project", "Project", "projectId → Project.id"],
    ],
  },
  {
    name: "Task",
    api: "tasks",
    description: "Assigned tasks, deadlines, and workflow state",
    fields: [
      ["id", "String", "Primary key", "@default(uuid())"],
      ["projectId", "String", "Foreign key", "—"],
      ["title", "String", "Required", "—"],
      ["description", "String?", "Optional", "null"],
      ["status", "TaskStatus", "Enum", "TODO"],
      ["type", "TaskType", "Enum", "TASK"],
      ["priority", "Priority", "Enum", "MEDIUM"],
      ["assigneeId", "String", "Foreign key", "—"],
      ["due_date", "DateTime", "Required", "—"],
      ["createdAt", "DateTime", "Default", "now()"],
      ["updatedAt", "DateTime", "Automatic", "@updatedAt"],
    ],
    relations: [
      ["project", "Project", "projectId → Project.id"],
      ["assignee", "User", "assigneeId → User.id · TaskAssignee"],
      ["comments", "Comment[]", "Comments on this task"],
    ],
  },
  {
    name: "Comment",
    api: "comments",
    description: "Comments attached to tasks",
    fields: [
      ["id", "String", "Primary key", "—"],
      ["content", "String", "Required", "—"],
      ["userId", "String", "Foreign key", "—"],
      ["taskId", "String", "Foreign key", "—"],
      ["createdAt", "DateTime", "Default", "now()"],
    ],
    relations: [
      ["user", "User", "userId → User.id"],
      ["task", "Task", "taskId → Task.id"],
    ],
  },
];

function unwrap(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function pretty(value) {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function labelize(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}

function isDateField(field) {
  return /At$|_date$/i.test(field);
}

function isIdField(field) {
  return field === "id" || field.endsWith("Id") || field === "team_lead";
}

function formatCell(field, value) {
  if (value === undefined) return "—";
  if (value === null) return "null";

  if (isDateField(field) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    }
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Badge({ children, tone = "slate" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${colors[tone] || colors.slate}`}
    >
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, count }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <Icon size={17} className="text-violet-600" />
        {title}
      </h3>
      {count !== undefined && <Badge>{count}</Badge>}
    </div>
  );
}

function SchemaModelCard({ model, selected, onClick, recordCount }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full cursor-pointer rounded-2xl border p-4 text-left transition duration-200 ${
        selected
          ? "border-violet-300 bg-violet-50/80 shadow-sm ring-2 ring-violet-100"
          : "border-slate-200 bg-white hover:border-violet-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            selected
              ? "bg-violet-600 text-white"
              : "bg-slate-100 text-slate-600 group-hover:bg-violet-50 group-hover:text-violet-700"
          }`}
        >
          <Table2 size={19} />
        </span>
        <Badge tone={selected ? "violet" : "slate"}>
          {recordCount === undefined ? "—" : recordCount}
        </Badge>
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">{model.name}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">
        {model.description}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">
          {model.fields.length} scalar fields
        </span>
        <span className="text-xs font-semibold text-violet-600">
          Inspect <span aria-hidden="true">→</span>
        </span>
      </div>
    </button>
  );
}

function RecordDetails({ model, record, onClose }) {
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(record || {});

  const copyRecord = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${model.name} record details`}
        className="my-auto flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <FileJson size={21} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">
                {model.name} record
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {entries.length} fields returned by the API
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={copyRecord}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span className="hidden sm:inline">
                {copied ? "Copied" : "Copy JSON"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto p-5 sm:p-7">
          <div className="mb-5 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
              Primary record identifier
            </p>
            <p className="mt-2 break-all font-mono text-xs text-slate-700">
              {record?.id ?? "No id field returned"}
            </p>
          </div>

          <SectionTitle
            icon={Braces}
            title="All returned fields"
            count={entries.length}
          />

          {entries.length ? (
            <dl className="overflow-hidden rounded-xl border border-slate-200">
              {entries.map(([field, value]) => (
                <div
                  key={field}
                  className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-0 sm:grid-cols-[190px_minmax(0,1fr)]"
                >
                  <dt className="break-words pt-0.5 text-xs font-bold text-slate-500">
                    {field}
                  </dt>
                  <dd
                    className={`min-w-0 break-words text-sm text-slate-700 ${
                      typeof value === "object" && value !== null
                        ? "overflow-x-auto whitespace-pre-wrap font-mono text-xs"
                        : ""
                    }`}
                  >
                    {pretty(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No fields were returned.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SchemaView({ model }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{model.name}</h2>
              <Badge tone="violet">Prisma model</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">{model.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{model.fields.length} scalar fields</Badge>
            <Badge tone="blue">{model.relations.length} relations</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <KeyRound size={18} className="text-violet-600" />
            <p className="mt-3 text-xs text-slate-500">Primary key</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
              {model.fields.find((field) => field[2] === "Primary key")?.[0] ||
                "—"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <Braces size={18} className="text-blue-600" />
            <p className="mt-3 text-xs text-slate-500">Scalar fields</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {model.fields.length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <Network size={18} className="text-emerald-600" />
            <p className="mt-3 text-xs text-slate-500">Relationships</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {model.relations.length}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <SectionTitle
            icon={Braces}
            title="Scalar fields"
            count={model.fields.length}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Field types, constraints, and defaults from the supplied Prisma
            schema.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Field</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Constraint</th>
                <th className="px-5 py-3.5">Default / behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {model.fields.map(([field, type, constraint, defaultValue]) => (
                <tr key={field} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-800">
                    {field}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={type.includes("?") ? "amber" : "blue"}>
                      {type}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {constraint}
                  </td>
                  <td className="max-w-xs break-words px-5 py-4 font-mono text-xs text-slate-500">
                    {defaultValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {model.constraints?.length > 0 && (
          <div className="border-t border-slate-100 p-5 sm:p-6">
            <SectionTitle icon={ShieldCheck} title="Model constraints" />
            <div className="flex flex-wrap gap-2">
              {model.constraints.map((constraint) => (
                <code
                  key={constraint}
                  className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-800"
                >
                  {constraint}
                </code>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={Link2}
          title="Relations"
          count={model.relations.length}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {model.relations.map(([field, type, description]) => (
            <div
              key={field}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <Network size={17} />
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-slate-800">
                  {field}
                </p>
                <p className="mt-1 break-words font-mono text-xs text-violet-700">
                  {type}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EnumsView() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(ENUMS).map(([name, values]) => (
        <section
          key={name}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Braces size={19} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900">{name}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {values.length} enum values
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {values.map((value) => (
              <Badge key={value} tone="violet">
                {value}
              </Badge>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function DatabaseExplorer() {
  const api = useAdminApi();

  const [view, setView] = useState("records");
  const [modelName, setModelName] = useState("User");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const model = SCHEMA.find((item) => item.name === modelName) || SCHEMA[0];

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.getRecords(model.api);
      setRecords(unwrap(response));
      setPage(1);
    } catch (err) {
      setRecords([]);
      setError(err?.message || `Could not load ${model.name} records.`);
    } finally {
      setLoading(false);
    }
  }, [api, model]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = records.filter((record) => {
      if (!query) return true;

      return Object.entries(record).some(([key, value]) => {
        const text =
          value !== null && typeof value === "object"
            ? JSON.stringify(value)
            : String(value ?? "");

        return (
          key.toLowerCase().includes(query) ||
          text.toLowerCase().includes(query)
        );
      });
    });

    if (sort.key) {
      result = [...result].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];

        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;

        const comparison =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, {
                numeric: true,
                sensitivity: "base",
              });

        return sort.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [records, search, sort]);

  const columns = useMemo(() => {
    const keys = new Set();
    records.forEach((record) =>
      Object.keys(record).forEach((key) => keys.add(key)),
    );

    const all = [...keys];
    const preferred = model.fields.map(([field]) => field);

    return [
      ...preferred.filter((field) => keys.has(field)),
      ...all.filter((field) => !preferred.includes(field)),
    ];
  }, [records, model]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const recordCounts = useMemo(
    () => ({ [modelName]: records.length }),
    [modelName, records.length],
  );

  const changeSort = (key) => {
    setSort((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">
            Administration / System
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Data explorer<span className="text-violet-600">.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Explore your Prisma schema, relationships, enums, and application
            records.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRecords}
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh records
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Prisma models</p>
            <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <Database size={20} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {SCHEMA.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Models in your schema</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Scalar fields</p>
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Braces size={20} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {SCHEMA.reduce((sum, item) => sum + item.fields.length, 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Across all models</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Enums</p>
            <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Code2 size={20} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {Object.keys(ENUMS).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Defined enum types</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Selected records</p>
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Activity size={20} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {loading ? "—" : records.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {model.name} records loaded
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-3 gap-1">
          {[
            ["records", Table2, "Records"],
            ["schema", Network, "Schema"],
            ["enums", Braces, "Enums"],
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                view === value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {view === "enums" ? (
        <>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Enum definitions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All enum names and values in the supplied Prisma schema.
            </p>
          </div>
          <EnumsView />
        </>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Schema models
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Select a model to inspect its schema or records.
              </p>
            </div>

            <div className="space-y-2">
              {SCHEMA.map((item) => (
                <SchemaModelCard
                  key={item.name}
                  model={item}
                  selected={item.name === modelName}
                  recordCount={
                    item.name === modelName && !loading
                      ? records.length
                      : undefined
                  }
                  onClick={() => {
                    setModelName(item.name);
                    setSearch("");
                    setPage(1);
                    setSelectedRecord(null);
                  }}
                />
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <p className="text-xs leading-5 text-emerald-800">
                Protected admin API. The explorer does not execute arbitrary
                SQL.
              </p>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            {view === "schema" ? (
              <SchemaView model={model} />
            ) : (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                        <Table2 size={21} />
                      </span>
                      <div>
                        <h2 className="font-bold text-slate-900">
                          {model.name} records
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          {model.description}
                        </p>
                      </div>
                    </div>
                    <Badge tone="green">
                      <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500" />
                      Read access
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="relative block">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPage(1);
                        }}
                        placeholder={`Search all ${model.name} fields...`}
                        className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setPage(1);
                      }}
                      disabled={!search}
                      className="cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear search
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} />
                    <span>
                      {loading
                        ? "Loading records..."
                        : `${filteredRecords.length} matching records`}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{columns.length} available columns</span>
                  </div>
                </header>

                {loading ? (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
                    <LoaderCircle
                      size={28}
                      className="animate-spin text-violet-600"
                    />
                    <p className="text-sm">
                      Loading {model.name.toLowerCase()} records...
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <AlertCircle size={30} className="text-rose-500" />
                    <h3 className="mt-3 font-bold text-slate-900">
                      Unable to load records
                    </h3>
                    <p className="mt-2 max-w-lg break-words text-sm text-slate-500">
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={loadRecords}
                      className="mt-4 cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <Database size={30} className="text-slate-300" />
                    <h3 className="mt-3 font-bold text-slate-900">
                      No records returned
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      The API returned no records for this model. Check the
                      backend endpoint and database contents.
                    </p>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-12 text-center">
                    <Search size={26} className="mx-auto text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-800">
                      No matching records
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try another search term.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {columns.map((column) => (
                              <th
                                key={column}
                                className="whitespace-nowrap px-4 py-3.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => changeSort(column)}
                                  className="inline-flex cursor-pointer items-center gap-1.5 transition hover:text-violet-700"
                                >
                                  {column}
                                  {sort.key === column ? (
                                    sort.direction === "asc" ? (
                                      <ArrowUp size={12} />
                                    ) : (
                                      <ArrowDown size={12} />
                                    )
                                  ) : (
                                    <ChevronDown
                                      size={12}
                                      className="opacity-30"
                                    />
                                  )}
                                </button>
                              </th>
                            ))}
                            <th className="sticky right-0 bg-slate-50 px-4 py-3.5 text-right">
                              Details
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {visibleRecords.map((record, index) => (
                            <tr
                              key={record.id ?? `${model.name}-${index}`}
                              className="group transition hover:bg-violet-50/30"
                            >
                              {columns.map((column) => (
                                <td key={column} className="max-w-64 px-4 py-4">
                                  <span
                                    title={formatCell(column, record[column])}
                                    className={`block max-w-64 truncate text-xs ${
                                      isIdField(column)
                                        ? "font-mono text-slate-500"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {formatCell(column, record[column])}
                                  </span>
                                </td>
                              ))}
                              <td className="sticky right-0 bg-white px-4 py-3 text-right group-hover:bg-violet-50/30">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRecord(record)}
                                  title="Inspect all fields"
                                  aria-label="Inspect all fields"
                                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                                >
                                  <Eye size={15} />
                                  <span>Inspect</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Showing{" "}
                        <span className="font-bold text-slate-800">
                          {(currentPage - 1) * PAGE_SIZE + 1}–
                          {Math.min(
                            currentPage * PAGE_SIZE,
                            filteredRecords.length,
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-slate-800">
                          {filteredRecords.length}
                        </span>{" "}
                        loaded records
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() =>
                            setPage((value) => Math.max(1, value - 1))
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={15} /> Previous
                        </button>
                        <span className="min-w-12 text-center text-xs font-bold text-slate-600">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setPage((value) => Math.min(totalPages, value + 1))
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next <ChevronRight size={15} />
                        </button>
                      </div>
                    </footer>
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <CircleHelp size={17} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-5 text-blue-900">
          <strong>Schema accuracy:</strong> the schema panel describes the
          Prisma model you supplied. The records panel displays fields and
          records returned by your protected API. Relationship names in the
          schema do not automatically mean related records are included in API
          responses.
        </p>
      </div>

      {selectedRecord && (
        <RecordDetails
          key={`${model.name}-${selectedRecord.id ?? "record"}`}
          model={model}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
