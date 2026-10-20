import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Database,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
  Link2,
} from "lucide-react";
import { useAdminApi } from "../services/useAdminApi";
import { getFriendlyError } from "../services/adminApi";

const PAGE_SIZE = 10;
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const TYPES = ["TASK", "BUG", "FEATURE", "IMPROVEMENT", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const EMPTY_FORM = {
  projectId: "",
  title: "",
  description: "",
  status: "TODO",
  type: "TASK",
  priority: "MEDIUM",
  assigneeId: "",
  due_date: "",
};

function formatDate(value, includeTime = false) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
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
      TODO: "slate",
      IN_PROGRESS: "blue",
      DONE: "green",
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

function TaskForm({ initial, mode, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initial,
    due_date: toDateInput(initial?.due_date),
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
    if (!form.title.trim()) errors.title = "Task title is required.";
    if (!form.projectId.trim()) errors.projectId = "Project ID is required.";
    if (!form.assigneeId.trim())
      errors.assigneeId = "Assignee user ID is required.";
    if (!form.due_date) errors.due_date = "Due date is required.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        projectId: form.projectId.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        type: form.type,
        priority: form.priority,
        assigneeId: form.assigneeId.trim(),
        due_date: new Date(`${form.due_date}T00:00:00`).toISOString(),
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
        label="Task title"
        value={form.title}
        onChange={(event) => update("title", event.target.value)}
        placeholder="e.g. Implement authentication"
        error={fieldErrors.title}
        required
      />

      <TextAreaField
        label="Description"
        value={form.description || ""}
        onChange={(event) => update("description", event.target.value)}
        placeholder="Describe the task..."
        hint="Optional task description."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Status"
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
          options={STATUSES.map((value) => ({
            value,
            label: value.replaceAll("_", " "),
          }))}
        />
        <SelectField
          label="Type"
          value={form.type}
          onChange={(event) => update("type", event.target.value)}
          options={TYPES.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
          }))}
        />
        <SelectField
          label="Priority"
          value={form.priority}
          onChange={(event) => update("priority", event.target.value)}
          options={PRIORITIES.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
          }))}
        />
      </div>

      <Field
        label="Project ID"
        value={form.projectId}
        onChange={(event) => update("projectId", event.target.value)}
        placeholder="Project database ID"
        hint="Must reference an existing Project.id."
        error={fieldErrors.projectId}
        required
      />

      <Field
        label="Assignee user ID"
        value={form.assigneeId}
        onChange={(event) => update("assigneeId", event.target.value)}
        placeholder="user_..."
        hint="Must reference an existing User.id."
        error={fieldErrors.assigneeId}
        required
      />

      <Field
        label="Due date"
        type="date"
        value={form.due_date}
        onChange={(event) => update("due_date", event.target.value)}
        error={fieldErrors.due_date}
        required
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-5 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            The project and assignee must already exist. This form manages the
            task record; it does not create projects, users, or authentication
            accounts.
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
              ? "Create task"
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

function TaskDetails({ task, loading, error, onRetry }) {
  const counts = task?._count;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <ClipboardList size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-lg font-bold text-slate-950">
              {task?.title || "Untitled task"}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-500">
              {task?.description || "No description provided"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color={statusColor(task?.status)}>
                {task?.status?.replaceAll("_", " ") || "Unknown status"}
              </Badge>
              <Badge color={priorityColor(task?.priority)}>
                {task?.priority || "Unknown"} priority
              </Badge>
              <Badge color="violet">{task?.type || "Unknown type"}</Badge>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
          <LoaderCircle size={16} className="animate-spin" />
          Loading complete task details…
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
            Task scalar fields
          </h4>
        </div>
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          <DetailRow label="id" value={task?.id} mono />
          <DetailRow label="title" value={task?.title} />
          <DetailRow label="description" value={task?.description} multiline />
          <DetailRow label="status" value={task?.status} />
          <DetailRow label="type" value={task?.type} />
          <DetailRow label="priority" value={task?.priority} />
          <DetailRow label="projectId" value={task?.projectId} mono />
          <DetailRow label="assigneeId" value={task?.assigneeId} mono />
          <DetailRow
            label="due_date"
            value={formatDate(task?.due_date, true)}
          />
          <DetailRow
            label="createdAt"
            value={formatDate(task?.createdAt, true)}
          />
          <DetailRow
            label="updatedAt"
            value={formatDate(task?.updatedAt, true)}
          />
        </dl>
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <Link2 size={16} className="text-violet-600" />
          <h4 className="text-sm font-bold text-slate-900">Related records</h4>
        </div>

        {task?.project || task?.assignee || Array.isArray(task?.comments) ? (
          <div className="space-y-3">
            {task?.project && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Project
                </p>
                <p className="mt-1 break-words font-semibold text-slate-900">
                  {task.project.name || task.projectId}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                  {task.project.id || task.projectId}
                </p>
              </div>
            )}

            {task?.assignee && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assignee
                </p>
                <p className="mt-1 break-words font-semibold text-slate-900">
                  {task.assignee.name || task.assignee.email || task.assigneeId}
                </p>
                <p className="mt-1 break-words text-sm text-slate-500">
                  {task.assignee.email || task.assigneeId}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-400">
                  {task.assignee.id || task.assigneeId}
                </p>
              </div>
            )}

            {Array.isArray(task?.comments) && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Comments ({task.comments.length})
                </p>
                {task.comments.length ? (
                  <div className="space-y-3">
                    {task.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg bg-slate-50 p-3"
                      >
                        <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                          {comment.content}
                        </p>
                        <p className="mt-2 break-all text-xs text-slate-400">
                          {comment.user?.name ||
                            comment.user?.email ||
                            comment.userId ||
                            "Unknown author"}
                          {" · "}
                          {formatDate(comment.createdAt, true)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No comments yet.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
            Related project, assignee, and comment details will appear here when
            the admin detail endpoint returns those Prisma relations.
            {counts && (
              <p className="mt-2">
                Comments count:{" "}
                {typeof counts.comments === "number" ? counts.comments : "—"}
              </p>
            )}
          </div>
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

export default function TasksPage() {
  const api = useAdminApi();

  const [tasks, setTasks] = useState([]);
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
  const [detailTask, setDetailTask] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [notice, setNotice] = useState("");

  const loadTasks = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const result = await api.getRecords("tasks", {
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        setTasks(Array.isArray(result?.records) ? result.records : []);
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
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task) =>
      [
        task.title,
        task.description,
        task.id,
        task.status,
        task.type,
        task.priority,
        task.projectId,
        task.assigneeId,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [tasks, search]);

  const openDetails = async (task) => {
    setModal({ type: "view", task });
    setDetailTask(task);
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await api.getRecord("tasks", task.id);
      const fullRecord =
        result?.record ?? result?.data?.record ?? result?.data ?? result;
      setDetailTask(fullRecord || task);
    } catch (err) {
      setDetailError(getFriendlyError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const retryDetails = () => {
    if (modal?.type === "view") openDetails(modal.task);
  };

  const openCreate = () => {
    setNotice("");
    setModal({ type: "create", task: EMPTY_FORM });
  };

  const openEdit = (task) => {
    setNotice("");
    setModal({
      type: "edit",
      id: task.id,
      task: {
        projectId: task.projectId ?? "",
        title: task.title ?? "",
        description: task.description ?? "",
        status: task.status ?? "TODO",
        type: task.type ?? "TASK",
        priority: task.priority ?? "MEDIUM",
        assigneeId: task.assigneeId ?? "",
        due_date: task.due_date ?? "",
      },
    });
  };

  const saveTask = async (data) => {
    if (modal.type === "create") {
      await api.createRecord("tasks", data);
      setNotice("Task created successfully.");
    } else {
      await api.updateRecord("tasks", modal.id, data);
      setNotice("Task updated successfully.");
    }

    setModal(null);
    await loadTasks({ quiet: true });
  };

  const removeTask = async () => {
    if (!selectedTask || !deleteAcknowledged) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.deleteRecord("tasks", selectedTask.id, {
        confirm: true,
        confirmCascade: true,
      });

      setNotice("Task deleted.");
      setSelectedTask(null);
      setDeleteAcknowledged(false);

      if (tasks.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadTasks({ quiet: true });
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
            Tasks<span className="text-violet-600">.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage tasks, track progress, and review assignments, priorities,
            due dates, and comments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => loadTasks({ quiet: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={17} />
            Add task
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
            label: "Total tasks",
            value: loading ? "—" : total.toLocaleString(),
            note: "Application task records",
            icon: <ClipboardList size={20} />,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "On this page",
            value: loading ? "—" : tasks.length.toLocaleString(),
            note: "Loaded records",
            icon: <CheckCircle2 size={20} />,
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
            <h2 className="font-bold text-slate-900">Application tasks</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by title, status, type, priority, project, or assignee.
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
              placeholder="Search loaded tasks…"
              aria-label="Search tasks"
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
              Couldn&apos;t load tasks
            </h3>
            <p
              role="alert"
              className="mx-auto mt-2 max-w-md text-sm text-slate-500"
            >
              {error}
            </p>
            <Button
              variant="primary"
              onClick={() => loadTasks()}
              className="mt-5"
            >
              <RefreshCw size={16} />
              Try again
            </Button>
          </div>
        ) : loading ? (
          <SkeletonRows />
        ) : filteredTasks.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ClipboardList size={23} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? "No matching tasks" : "No task records yet"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another title, status, type, or ID."
                : "Task records returned by your backend will appear here."}
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
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Task</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Due date</th>
                    <th className="px-5 py-4">Project / Assignee</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <ClipboardList size={18} />
                          </div>
                          <div className="min-w-0 max-w-64">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {task.title || "Untitled task"}
                            </p>
                            <p
                              title={task.id}
                              className="mt-1 truncate font-mono text-[11px] text-slate-400"
                            >
                              {task.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={statusColor(task.status)}>
                          {task.status?.replaceAll("_", " ") || "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge color="violet">{task.type || "Unknown"}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={priorityColor(task.priority)}>
                          {task.priority || "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {formatDate(task.due_date)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-500">
                        <p className="max-w-48 truncate" title={task.projectId}>
                          Project: {task.project?.name || task.projectId || "—"}
                        </p>
                        <p
                          className="mt-1 max-w-48 truncate"
                          title={task.assigneeId}
                        >
                          Assignee:{" "}
                          {task.assignee?.name || task.assigneeId || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <IconButton
                            label={`View ${task.title || "task"} details`}
                            onClick={() => openDetails(task)}
                          >
                            <Eye size={17} />
                          </IconButton>
                          <IconButton
                            label={`Edit ${task.title || "task"}`}
                            onClick={() => openEdit(task)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={17} />
                          </IconButton>
                          <IconButton
                            label={`Delete ${task.title || "task"}`}
                            onClick={() => {
                              setSelectedTask(task);
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
                  ? `${filteredTasks.length} matching record${filteredTasks.length === 1 ? "" : "s"} on this page`
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
          title="Add task"
          subtitle="Create a task record in your application database."
          onClose={() => setModal(null)}
        >
          <TaskForm
            mode="create"
            initial={modal.task}
            onCancel={() => setModal(null)}
            onSubmit={saveTask}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal
          title="Edit task"
          subtitle="Update task details stored in your application database."
          onClose={() => setModal(null)}
        >
          <TaskForm
            mode="edit"
            initial={modal.task}
            onCancel={() => setModal(null)}
            onSubmit={saveTask}
          />
        </Modal>
      )}

      {modal?.type === "view" && (
        <Modal
          title="Task record details"
          subtitle="Scalar fields and related records from your Prisma Task model."
          wide
          onClose={() => setModal(null)}
        >
          <TaskDetails
            task={detailTask || modal.task}
            loading={detailLoading}
            error={detailError}
            onRetry={retryDetails}
          />
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={() => setModal(null)}>Close details</Button>
          </div>
        </Modal>
      )}

      {selectedTask && (
        <Modal
          title="Delete task?"
          subtitle="Review the potential impact before continuing."
          closeDisabled={deleting}
          onClose={() => {
            setSelectedTask(null);
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
                  <strong>{selectedTask.title || selectedTask.id}</strong>.
                  Depending on your Prisma schema and database rules, deleting
                  this task may also delete its comments.
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
              I understand that deleting this task may remove its related
              comments.
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
                setSelectedTask(null);
                setDeleteAcknowledged(false);
                setDeleteError("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={removeTask}
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
