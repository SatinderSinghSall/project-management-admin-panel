import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  FolderKanban,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
  Link2,
} from "lucide-react";
import { useAdminApi } from "../services/useAdminApi";
import { getFriendlyError } from "../services/adminApi";

const PAGE_SIZE = 10;

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const STATUSES = ["ACTIVE", "PLANNING", "COMPLETED", "ON_HOLD", "CANCELLED"];

const EMPTY_FORM = {
  name: "",
  description: "",
  priority: "MEDIUM",
  status: "ACTIVE",
  start_date: "",
  end_date: "",
  team_lead: "",
  workspaceId: "",
  progress: 0,
};

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Badge({ children, color = "slate" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[color] || colors.slate}`}
    >
      {children}
    </span>
  );
}

function statusColor(status) {
  return (
    {
      ACTIVE: "green",
      PLANNING: "blue",
      COMPLETED: "violet",
      ON_HOLD: "amber",
      CANCELLED: "red",
    }[status] || "slate"
  );
}

function priorityColor(priority) {
  return (
    {
      LOW: "blue",
      MEDIUM: "amber",
      HIGH: "red",
    }[priority] || "slate"
  );
}

function Button({
  children,
  variant = "secondary",
  disabled = false,
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "border border-violet-600 bg-violet-600 text-white shadow-sm hover:border-violet-700 hover:bg-violet-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
    danger:
      "border border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 active:scale-[0.99] ${
        variants[variant]
      } ${
        disabled
          ? "cursor-not-allowed opacity-50 shadow-none active:scale-100"
          : "cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      type={props.type || "button"}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  closeDisabled = false,
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !closeDisabled) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, closeDisabled]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto w-full ${
          wide ? "max-w-3xl" : "max-w-xl"
        } overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <IconButton
            label="Close dialog"
            onClick={onClose}
            disabled={closeDisabled}
          >
            <X size={18} />
          </IconButton>
        </header>

        <div className="max-h-[calc(100dvh-140px)] overflow-y-auto px-6 py-5">
          {children}
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, error, disabled = false, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        {...props}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${
          error ? "border-red-300" : "border-slate-200"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-500"
            : "cursor-text"
        }`}
      />

      {hint && !error && (
        <span className="mt-1.5 block text-xs leading-5 text-slate-400">
          {hint}
        </span>
      )}

      {error && (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function TextAreaField({ label, hint, error, disabled = false, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        {...props}
        disabled={disabled}
        rows={3}
        className={`w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${
          error ? "border-red-300" : "border-slate-200"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-500"
            : "cursor-text"
        }`}
      />

      {hint && !error && (
        <span className="mt-1.5 block text-xs leading-5 text-slate-400">
          {hint}
        </span>
      )}

      {error && (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function SelectField({ label, options, disabled = false, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        {...props}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${
          disabled ? "cursor-not-allowed bg-slate-50" : "cursor-pointer"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProjectForm({ initial, mode, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initial,
    start_date: toDateInput(initial?.start_date),
    end_date: toDateInput(initial?.end_date),
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    const errors = {};
    const progress = Number(form.progress);

    if (!form.name.trim()) errors.name = "Project name is required.";
    if (!form.team_lead.trim())
      errors.team_lead = "Team lead user ID is required.";
    if (!form.workspaceId.trim())
      errors.workspaceId = "Workspace ID is required.";

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      errors.progress = "Progress must be an integer from 0 to 100.";
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errors.end_date = "End date cannot be earlier than the start date.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        start_date: form.start_date
          ? new Date(`${form.start_date}T00:00:00`).toISOString()
          : null,
        end_date: form.end_date
          ? new Date(`${form.end_date}T00:00:00`).toISOString()
          : null,
        team_lead: form.team_lead.trim(),
        workspaceId: form.workspaceId.trim(),
        progress,
      });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        label="Project name"
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        placeholder="e.g. Website redesign"
        error={fieldErrors.name}
        required
      />

      <TextAreaField
        label="Description"
        value={form.description || ""}
        onChange={(event) => update("description", event.target.value)}
        placeholder="Describe the project..."
        hint="Optional project description."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Priority"
          value={form.priority}
          onChange={(event) => update("priority", event.target.value)}
          options={PRIORITIES.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
          }))}
        />

        <SelectField
          label="Status"
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
          options={STATUSES.map((value) => ({
            value,
            label: value.replaceAll("_", " "),
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Start date"
          type="date"
          value={form.start_date}
          onChange={(event) => update("start_date", event.target.value)}
        />

        <Field
          label="End date"
          type="date"
          value={form.end_date}
          onChange={(event) => update("end_date", event.target.value)}
          error={fieldErrors.end_date}
        />
      </div>

      <Field
        label="Team lead user ID"
        value={form.team_lead}
        onChange={(event) => update("team_lead", event.target.value)}
        placeholder="user_..."
        hint="Must reference an existing User.id."
        error={fieldErrors.team_lead}
        required
      />

      <Field
        label="Workspace ID"
        value={form.workspaceId}
        onChange={(event) => update("workspaceId", event.target.value)}
        placeholder="Workspace database ID"
        hint="Must reference an existing Workspace.id."
        error={fieldErrors.workspaceId}
        required
      />

      <Field
        label="Progress (%)"
        type="number"
        min="0"
        max="100"
        step="1"
        value={form.progress}
        onChange={(event) => update("progress", event.target.value)}
        error={fieldErrors.progress}
        required
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-5 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            The team lead and workspace must already exist. This form manages
            the project record; it does not create users, workspaces, or
            authentication accounts.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Database size={16} />
          )}
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create project"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function DetailRow({ label, value, mono = false, multiline = false }) {
  let displayValue;

  if (value === null || value === undefined || value === "") {
    displayValue = "Not set";
  } else if (value instanceof Date) {
    displayValue = formatDate(value);
  } else if (typeof value === "object") {
    displayValue = JSON.stringify(value, null, 2);
  } else {
    displayValue = String(value);
  }

  return (
    <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd
        className={`min-w-0 break-words text-sm text-slate-700 ${
          mono ? "font-mono text-xs" : ""
        } ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {displayValue}
      </dd>
    </div>
  );
}

function ProjectDetails({ project, loading, error, onRetry }) {
  const counts = project?._count;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <FolderKanban size={26} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-lg font-bold text-slate-950">
              {project?.name || "Unnamed project"}
            </h3>

            <p className="mt-1 break-words text-sm text-slate-500">
              {project?.description || "No description provided"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color={statusColor(project?.status)}>
                {project?.status?.replaceAll("_", " ") || "Unknown status"}
              </Badge>

              <Badge color={priorityColor(project?.priority)}>
                {project?.priority || "Unknown priority"} priority
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Project progress</span>
            <span className="font-bold tabular-nums text-slate-800">
              {Number.isFinite(Number(project?.progress))
                ? `${project.progress}%`
                : "—"}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, Number(project?.progress) || 0))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
          <LoaderCircle size={16} className="animate-spin" />
          Loading complete project details…
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 cursor-pointer font-semibold underline underline-offset-2"
          >
            Retry details
          </button>
        </div>
      )}

      <section>
        <div className="mb-1 flex items-center gap-2">
          <Database size={16} className="text-violet-600" />
          <h4 className="text-sm font-bold text-slate-900">
            Project scalar fields
          </h4>
        </div>

        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          <DetailRow label="id" value={project?.id} mono />
          <DetailRow label="name" value={project?.name} />
          <DetailRow
            label="description"
            value={project?.description}
            multiline
          />
          <DetailRow label="priority" value={project?.priority} />
          <DetailRow label="status" value={project?.status} />
          <DetailRow
            label="start_date"
            value={project?.start_date ? formatDate(project.start_date) : null}
          />
          <DetailRow
            label="end_date"
            value={project?.end_date ? formatDate(project.end_date) : null}
          />
          <DetailRow label="team_lead" value={project?.team_lead} mono />
          <DetailRow label="workspaceId" value={project?.workspaceId} mono />
          <DetailRow
            label="progress"
            value={project?.progress == null ? null : `${project.progress}%`}
          />
          <DetailRow label="createdAt" value={formatDate(project?.createdAt)} />
          <DetailRow label="updatedAt" value={formatDate(project?.updatedAt)} />
        </dl>
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <Link2 size={16} className="text-violet-600" />
          <h4 className="text-sm font-bold text-slate-900">Related records</h4>
        </div>

        {counts ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Project members", counts.members],
              ["Tasks", counts.tasks],
            ].map(([label, count]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 p-3.5"
              >
                <p className="text-xs leading-5 text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  {typeof count === "number" ? count : "—"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
            Relation counts appear when the admin detail endpoint includes
            Prisma&apos;s <code>_count</code> selection.
          </p>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <CalendarDays size={14} />
        Dates are displayed in your browser&apos;s local time zone.
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 rounded bg-slate-100" />
            <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
          </div>
          <div className="hidden h-8 w-24 rounded-lg bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const api = useAdminApi();

  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [notice, setNotice] = useState("");

  const loadProjects = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const result = await api.getRecords("projects", {
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        setProjects(Array.isArray(result?.records) ? result.records : []);

        setPagination(
          result?.pagination ?? {
            page,
            limit: PAGE_SIZE,
            total: result?.records?.length ?? 0,
            totalPages: 1,
          },
        );
      } catch (err) {
        setError(getFriendlyError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api, page],
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      [
        project.name,
        project.description,
        project.id,
        project.status,
        project.priority,
        project.team_lead,
        project.workspaceId,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [projects, search]);

  const openDetails = async (project) => {
    setModal({ type: "view", project });
    setDetailProject(project);
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await api.getRecord("projects", project.id);
      const fullRecord =
        result?.record ?? result?.data?.record ?? result?.data ?? result;

      setDetailProject(fullRecord || project);
    } catch (err) {
      setDetailError(getFriendlyError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const retryDetails = () => {
    if (modal?.type === "view") openDetails(modal.project);
  };

  const openCreate = () => {
    setNotice("");
    setModal({ type: "create", project: EMPTY_FORM });
  };

  const openEdit = (project) => {
    setNotice("");

    setModal({
      type: "edit",
      project: {
        name: project.name ?? "",
        description: project.description ?? "",
        priority: project.priority ?? "MEDIUM",
        status: project.status ?? "ACTIVE",
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        team_lead: project.team_lead ?? "",
        workspaceId: project.workspaceId ?? "",
        progress: project.progress ?? 0,
      },
      id: project.id,
    });
  };

  const saveProject = async (data) => {
    if (modal.type === "create") {
      await api.createRecord("projects", data);
      setNotice("Project created successfully.");
    } else {
      await api.updateRecord("projects", modal.id, data);
      setNotice("Project updated successfully.");
    }

    setModal(null);
    await loadProjects({ quiet: true });
  };

  const removeProject = async () => {
    if (!selectedProject || !deleteAcknowledged) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.deleteRecord("projects", selectedProject.id, {
        confirm: true,
        confirmCascade: true,
      });

      setNotice("Project deleted.");
      setSelectedProject(null);
      setDeleteAcknowledged(false);

      if (projects.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadProjects({ quiet: true });
      }
    } catch (err) {
      setDeleteError(getFriendlyError(err));
    } finally {
      setDeleting(false);
    }
  };

  const total = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-w-0 space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Administration / Management
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Projects<span className="text-violet-600">.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage projects, monitor progress, and review ownership, status,
            priority, and related tasks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => loadProjects({ quiet: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>

          <Button variant="primary" onClick={openCreate}>
            <Plus size={17} />
            Add project
          </Button>
        </div>
      </header>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>

          <IconButton
            label="Dismiss notification"
            onClick={() => setNotice("")}
            className="text-emerald-700 hover:bg-emerald-100"
          >
            <X size={16} />
          </IconButton>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total projects",
            value: loading ? "—" : total.toLocaleString(),
            note: "Application project records",
            icon: <FolderKanban size={20} />,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "On this page",
            value: loading ? "—" : projects.length.toLocaleString(),
            note: "Loaded records",
            icon: <Users size={20} />,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Current page",
            value: loading ? "—" : `${page} / ${totalPages}`,
            note: "Paginated results",
            icon: <ArrowDown size={20} />,
            color: "bg-emerald-50 text-emerald-700",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                {item.label}
              </span>

              <span className={`rounded-xl p-2.5 ${item.color}`}>
                {item.icon}
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              {item.value}
            </p>

            <p className="mt-1 text-xs text-slate-400">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Application projects</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by name, status, priority, team lead, or workspace.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search loaded projects…"
              aria-label="Search projects"
              className="w-full cursor-text rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />

            {search && (
              <IconButton
                label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X size={16} />
              </IconButton>
            )}
          </div>
        </div>

        {error ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              Couldn&apos;t load projects
            </h3>

            <p
              role="alert"
              className="mx-auto mt-2 max-w-md text-sm text-slate-500"
            >
              {error}
            </p>

            <Button
              variant="primary"
              onClick={() => loadProjects()}
              className="mt-5"
            >
              <RefreshCw size={16} />
              Try again
            </Button>
          </div>
        ) : loading ? (
          <SkeletonRows />
        ) : filteredProjects.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FolderKanban size={23} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? "No matching projects" : "No project records yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another name, status, priority, or ID."
                : "Project records returned by your backend will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 cursor-pointer text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Progress</th>
                    <th className="px-5 py-4">Dates</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <FolderKanban size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {project.name || "Unnamed project"}
                            </p>

                            <p
                              title={project.id}
                              className="mt-1 max-w-64 truncate font-mono text-[11px] text-slate-400"
                            >
                              {project.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge color={statusColor(project.status)}>
                          {project.status?.replaceAll("_", " ") || "Unknown"}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge color={priorityColor(project.priority)}>
                          {project.priority || "Unknown"}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-28">
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              {Number(project.progress) || 0}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-violet-600"
                              style={{
                                width: `${Math.min(100, Math.max(0, Number(project.progress) || 0))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs leading-5 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {formatDate(project.start_date)}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Clock3 size={13} />
                          {formatDate(project.end_date)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <IconButton
                            label={`View ${project.name || "project"} details`}
                            onClick={() => openDetails(project)}
                          >
                            <Eye size={17} />
                          </IconButton>

                          <IconButton
                            label={`Edit ${project.name || "project"}`}
                            onClick={() => openEdit(project)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={17} />
                          </IconButton>

                          <IconButton
                            label={`Delete ${project.name || "project"}`}
                            onClick={() => {
                              setSelectedProject(project);
                              setDeleteAcknowledged(false);
                              setDeleteError("");
                            }}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {search
                  ? `${filteredProjects.length} matching record${
                      filteredProjects.length === 1 ? "" : "s"
                    } on this page`
                  : `Showing ${start}–${end} of ${total} records`}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>

                <span className="px-2 text-sm tabular-nums text-slate-500">
                  {page} / {totalPages}
                </span>

                <Button
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages || loading}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>

      {modal?.type === "create" && (
        <Modal
          title="Add project"
          subtitle="Create a project record in your application database."
          onClose={() => setModal(null)}
        >
          <ProjectForm
            mode="create"
            initial={modal.project}
            onCancel={() => setModal(null)}
            onSubmit={saveProject}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal
          title="Edit project"
          subtitle="Update project details stored in your application database."
          onClose={() => setModal(null)}
        >
          <ProjectForm
            mode="edit"
            initial={modal.project}
            onCancel={() => setModal(null)}
            onSubmit={saveProject}
          />
        </Modal>
      )}

      {modal?.type === "view" && (
        <Modal
          title="Project record details"
          subtitle="Scalar fields and relation counts from your Prisma Project model."
          wide
          onClose={() => setModal(null)}
        >
          <ProjectDetails
            project={detailProject || modal.project}
            loading={detailLoading}
            error={detailError}
            onRetry={retryDetails}
          />

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={() => setModal(null)}>Close details</Button>
          </div>
        </Modal>
      )}

      {selectedProject && (
        <Modal
          title="Delete project?"
          subtitle="Review the potential impact before continuing."
          closeDisabled={deleting}
          onClose={() => {
            setSelectedProject(null);
            setDeleteAcknowledged(false);
            setDeleteError("");
          }}
        >
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <ShieldAlert className="shrink-0 text-red-600" size={22} />

              <div>
                <p className="font-semibold text-red-900">
                  This action may delete related records.
                </p>

                <p className="mt-1 break-words text-sm leading-5 text-red-800">
                  You are deleting{" "}
                  <strong>{selectedProject.name || selectedProject.id}</strong>.
                  Your Prisma schema cascades project deletion to project
                  memberships and tasks, and task deletion may affect comments.
                </p>
              </div>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={deleteAcknowledged}
              disabled={deleting}
              onChange={(event) => setDeleteAcknowledged(event.target.checked)}
              className={`mt-1 size-4 accent-red-600 ${
                deleting ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            />

            <span>
              I understand that deleting this project may remove related tasks,
              memberships, and comments.
            </span>
          </label>

          {deleteError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {deleteError}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={() => {
                setSelectedProject(null);
                setDeleteAcknowledged(false);
                setDeleteError("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={removeProject}
              disabled={deleting || !deleteAcknowledged}
            >
              {deleting ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {deleting ? "Deleting…" : "Confirm deletion"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
