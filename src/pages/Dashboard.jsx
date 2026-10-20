import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Database,
  FolderKanban,
  MessageSquare,
  RefreshCw,
  Server,
  ShieldCheck,
  Table2,
  Users,
  UsersRound,
} from "lucide-react";

import { useAdminApi } from "../services/useAdminApi";
import { getFriendlyError } from "../services/adminApi";

const metricConfig = [
  {
    label: "Total users",
    key: "totalUsers",
    icon: Users,
    color: "violet",
    description: "Registered platform users",
  },
  {
    label: "Workspaces",
    key: "totalWorkspaces",
    icon: Boxes,
    color: "blue",
    description: "Created workspaces",
  },
  {
    label: "Projects",
    key: "totalProjects",
    icon: FolderKanban,
    color: "orange",
    description: "Projects across the platform",
  },
  {
    label: "Tasks",
    key: "totalTasks",
    icon: ClipboardList,
    color: "emerald",
    description: "Tracked platform tasks",
  },
];

const tableIcons = {
  User: Users,
  Workspace: Boxes,
  WorkspaceMember: UsersRound,
  Project: FolderKanban,
  ProjectMember: UsersRound,
  Task: ClipboardList,
  Comment: MessageSquare,
};

const iconColors = {
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  orange: "bg-orange-50 text-orange-600 ring-orange-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};

const numberFormatter = new Intl.NumberFormat();

function formatNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter.format(value)
    : "—";
}

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTimestamp(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status, loading = false }) {
  const normalized = String(status || "unknown").toLowerCase();

  const healthy = ["connected", "responding", "healthy", "ok"].includes(
    normalized,
  );

  const pending = loading || normalized === "checking";

  const styles = pending
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : healthy
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  const label = pending
    ? "Checking"
    : normalized === "unknown"
      ? "Unknown"
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold ${styles}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          pending
            ? "animate-pulse bg-amber-500"
            : healthy
              ? "bg-emerald-500"
              : "bg-rose-500"
        }`}
      />
      {label}
    </span>
  );
}

function MetricCard({ metric, value, loading }) {
  const Icon = metric.icon;

  return (
    <article className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${iconColors[metric.color]}`}
        >
          <Icon size={21} strokeWidth={1.8} />
        </div>

        <span className="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-400">
          Live data
        </span>
      </div>

      <p className="mt-5 text-xs font-medium text-slate-500">{metric.label}</p>

      {loading ? (
        <div className="mt-2 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {formatNumber(value)}
        </p>
      )}

      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        {metric.description}
      </p>
    </article>
  );
}

function ErrorBanner({ message, onRetry, loading }) {
  return (
    <section
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center"
    >
      <AlertTriangle className="shrink-0 text-rose-600" size={21} />

      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-rose-900">
          Dashboard data unavailable
        </h2>
        <p className="mt-1 break-words text-xs leading-5 text-rose-700">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        Retry
      </button>
    </section>
  );
}

function DatabaseInventory({ tables, loading, error }) {
  const total = tables.reduce(
    (sum, table) => sum + (Number.isFinite(table.count) ? table.count : 0),
    0,
  );

  const maxCount = Math.max(1, ...tables.map((table) => table.count || 0));

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Database size={20} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Database inventory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Record counts for all seven application tables
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <span className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-medium text-slate-600">
            {tables.length} tables
          </span>
          <span className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700">
            {loading ? "Calculating…" : `${formatNumber(total)} records`}
          </span>
        </div>
      </div>

      {error && tables.length === 0 ? (
        <div className="p-8 text-center">
          <Database className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Inventory unavailable
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Restore the database connection and refresh the dashboard.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Table</th>
                <th className="px-5 py-3.5">Records</th>
                <th className="px-5 py-3.5">Relative size</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tables.map((table) => {
                const Icon = tableIcons[table.name] || Table2;
                const count = Number.isFinite(table.count) ? table.count : null;
                const width = count === null ? 0 : (count / maxCount) * 100;

                return (
                  <tr
                    key={table.name}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon size={16} />
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {table.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {loading ? (
                        <span className="inline-block h-4 w-12 animate-pulse rounded bg-slate-100" />
                      ) : (
                        <span className="text-xs font-bold tabular-nums text-slate-900">
                          {formatNumber(count)}
                        </span>
                      )}
                    </td>

                    <td className="w-[30%] px-5 py-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle2 size={13} />
                        Available
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DatabaseTableCards({ tables, loading }) {
  const tableDetails = [
    { name: "User", description: "Registered accounts", icon: Users },
    { name: "Workspace", description: "Platform workspaces", icon: Boxes },
    {
      name: "WorkspaceMember",
      description: "Workspace memberships",
      icon: UsersRound,
    },
    { name: "Project", description: "Managed projects", icon: FolderKanban },
    {
      name: "ProjectMember",
      description: "Project memberships",
      icon: UsersRound,
    },
    { name: "Task", description: "Tracked tasks", icon: ClipboardList },
    { name: "Comment", description: "Task discussions", icon: MessageSquare },
  ];

  const countByName = new Map(tables.map((table) => [table.name, table.count]));

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Table details</h2>
          <p className="mt-1 text-xs text-slate-500">
            Explore record totals for all seven database tables.
          </p>
        </div>

        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-medium text-slate-600">
          7 tables
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {tableDetails.map((table) => {
          const Icon = table.icon;
          const count = countByName.get(table.name);
          const available = typeof count === "number" && Number.isFinite(count);

          return (
            <article
              key={table.name}
              className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition group-hover:bg-violet-100">
                  <Icon size={21} strokeWidth={1.8} />
                </span>

                <span className="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-500">
                  PostgreSQL
                </span>
              </div>

              <h3 className="mt-5 break-words text-sm font-semibold text-slate-800">
                {table.name}
              </h3>

              <p className="mt-1 text-[11px] text-slate-400">
                {table.description}
              </p>

              {loading ? (
                <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {formatNumber(available ? count : null)}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400">
                  Total records
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                    available ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {available ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <AlertTriangle size={13} />
                  )}
                  {available ? "Available" : "Count unavailable"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SystemHealth({ health, loading, error }) {
  const databaseStatus = error
    ? health?.database || "unavailable"
    : health?.database || "unknown";

  const apiStatus = error ? "unavailable" : health?.api || "unknown";

  const items = [
    {
      label: "Admin API",
      detail: "Latest dashboard request",
      icon: Server,
      status: apiStatus,
    },
    {
      label: "PostgreSQL / Neon",
      detail: "Database connectivity check",
      icon: Database,
      status: databaseStatus,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">System health</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Status from the latest backend response
          </p>
        </div>

        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Activity size={19} />
        </span>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {items.map(({ label, detail, icon: Icon, status }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                <Icon size={17} />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">{label}</p>
                <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
              </div>
            </div>

            <StatusBadge status={status} loading={loading} />
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock3 size={14} />
            <span className="text-[10px]">Backend uptime</span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {health?.uptimeSeconds == null
              ? "—"
              : formatUptime(health.uptimeSeconds)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Activity size={14} />
            <span className="text-[10px]">Environment</span>
          </div>
          <p className="mt-2 truncate text-sm font-bold capitalize text-slate-900">
            {health?.environment || "—"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-slate-400">
        Last checked: {formatTimestamp(health?.checkedAt)}
      </p>
    </section>
  );
}

export default function Dashboard() {
  const api = useAdminApi();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api.getOverview();

      // Support both { data: {...} } and { overview: {...} } responses.
      const payload = result?.data ?? result?.overview ?? result;

      // If the backend returns the old overview format, convert it.
      const legacy = payload?.overview ?? payload;

      const hasNewFormat = payload?.metrics && Array.isArray(payload?.tables);

      if (hasNewFormat) {
        setOverview(payload);
      } else {
        const tables = [
          { name: "User", count: legacy.users },
          { name: "Workspace", count: legacy.workspaces },
          { name: "WorkspaceMember", count: legacy.workspaceMembers },
          { name: "Project", count: legacy.projects },
          { name: "ProjectMember", count: legacy.projectMembers },
          { name: "Task", count: legacy.tasks },
          { name: "Comment", count: legacy.comments },
        ];

        setOverview({
          metrics: {
            totalUsers: legacy.users ?? null,
            totalWorkspaces: legacy.workspaces ?? null,
            totalProjects: legacy.projects ?? null,
            totalTasks: legacy.tasks ?? null,
            totalComments: legacy.comments ?? null,
          },
          tables,
          health: null,
        });
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const metrics = metricConfig.map((metric) => ({
    ...metric,
    value: overview?.metrics?.[metric.key] ?? null,
  }));

  const tables = Array.isArray(overview?.tables) ? overview.tables : [];
  const health = overview?.health ?? null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-10 sm:space-y-9">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-violet-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
              PLATFORM CONTROL CENTER
            </p>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Dashboard<span className="text-violet-600">.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Monitor your application, database records, and infrastructure from
            one central administration workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing…" : "Refresh dashboard"}
        </button>
      </header>

      {error && (
        <ErrorBanner message={error} onRetry={loadOverview} loading={loading} />
      )}

      {/* Summary metrics */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Platform overview
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Live totals returned by your admin backend.
            </p>
          </div>

          <StatusBadge
            status={error ? "unavailable" : overview ? "responding" : "unknown"}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.key}
              metric={metric}
              value={metric.value}
              loading={loading && !overview}
            />
          ))}
        </div>
      </section>

      {/* Database inventory and health */}
      <section className="grid min-w-0 grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,0.8fr)]">
        <DatabaseInventory
          tables={tables}
          loading={loading && !overview}
          error={error}
        />

        <SystemHealth
          health={health}
          loading={loading && !overview}
          error={error}
        />
      </section>

      {/* Seven individual database table cards below the inventory */}
      <DatabaseTableCards tables={tables} loading={loading && !overview} />

      {/* Operational activity */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={19} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Backend activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Operational monitoring
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <p className="text-xs font-semibold text-slate-700">
              Detailed request logs are not connected yet
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              This dashboard currently checks the latest overview request and
              database connectivity. To display request history, error events,
              and response times, add structured server logging and a protected
              log retrieval endpoint.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck size={19} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Security and access
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Administrative access controls
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100/80 bg-emerald-50/70 p-4">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <div>
                <p className="text-xs font-semibold text-emerald-900">
                  Server-side admin authorization
                </p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-800/80">
                  Keep the admin allowlist enforced on every protected API
                  request.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-100/80 bg-amber-50/70 p-4">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Audit trail needs implementation
                </p>
                <p className="mt-1 text-[11px] leading-5 text-amber-800/80">
                  Record sensitive admin changes and denied access attempts
                  before presenting them as historical security events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
