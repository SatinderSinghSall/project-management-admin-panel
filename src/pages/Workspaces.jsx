import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
  Image as ImageIcon,
} from "lucide-react";
import { useAdminApi } from "../services/useAdminApi";
import { getFriendlyError } from "../services/adminApi";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  id: "",
  name: "",
  slug: "",
  description: "",
  ownerId: "",
  settings: "{}",
  image_url: "",
};

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function initials(value = "") {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "W"
  );
}

function WorkspaceAvatar({ workspace, large = false }) {
  const size = large ? "size-16 rounded-2xl" : "size-10 rounded-xl";

  return (
    <div className="relative shrink-0">
      {workspace?.image_url ? (
        <img
          src={workspace.image_url}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
          className={`${size} border border-slate-200 bg-slate-50 object-cover`}
        />
      ) : null}

      <div
        className={`${size} ${
          workspace?.image_url ? "hidden" : "flex"
        } items-center justify-center bg-violet-100 font-bold text-violet-700 ${
          large ? "text-xl" : "text-sm"
        }`}
      >
        {initials(workspace?.name)}
      </div>
    </div>
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
        if (event.target === event.currentTarget && !closeDisabled) {
          onClose();
        }
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

function WorkspaceForm({ initial, mode, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initial,
    settings:
      typeof initial?.settings === "string"
        ? initial.settings
        : JSON.stringify(initial?.settings ?? {}, null, 2),
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "name" && !current.slug) {
        next.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      return next;
    });

    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    const errors = {};

    if (mode === "create" && !form.id.trim()) {
      errors.id = "Workspace ID is required by your Prisma schema.";
    }

    if (!form.name.trim()) {
      errors.name = "Workspace name is required.";
    }

    if (!form.slug.trim()) {
      errors.slug = "Workspace slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      errors.slug = "Use lowercase letters, numbers, and hyphens.";
    }

    if (!form.ownerId.trim()) {
      errors.ownerId = "Workspace owner ID is required.";
    }

    let parsedSettings = {};

    try {
      parsedSettings = JSON.parse(form.settings || "{}");

      if (
        parsedSettings === null ||
        Array.isArray(parsedSettings) ||
        typeof parsedSettings !== "object"
      ) {
        errors.settings = "Settings must be a JSON object.";
      }
    } catch {
      errors.settings = "Enter valid JSON, for example: { }";
    }

    if (form.image_url.trim()) {
      try {
        const imageUrl = new URL(form.image_url.trim());

        if (!["http:", "https:"].includes(imageUrl.protocol)) {
          errors.image_url = "Use an HTTP or HTTPS image URL.";
        }
      } catch {
        errors.image_url = "Enter a valid image URL.";
      }
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        ...(mode === "create" ? { id: form.id.trim() } : {}),
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        ownerId: form.ownerId.trim(),
        settings: parsedSettings,
        image_url: form.image_url.trim(),
      });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "create" && (
        <Field
          label="Workspace ID"
          value={form.id}
          onChange={(event) => update("id", event.target.value)}
          placeholder="workspace_..."
          hint="Your Prisma Workspace model requires a manually supplied ID."
          error={fieldErrors.id}
          required
          autoComplete="off"
        />
      )}

      <Field
        label="Workspace name"
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        placeholder="e.g. Product Team"
        error={fieldErrors.name}
        required
      />

      <Field
        label="Workspace slug"
        value={form.slug}
        onChange={(event) => update("slug", event.target.value)}
        placeholder="product-team"
        hint="Must be unique. Use lowercase letters, numbers, and hyphens."
        error={fieldErrors.slug}
        required
      />

      <Field
        label="Owner user ID"
        value={form.ownerId}
        onChange={(event) => update("ownerId", event.target.value)}
        placeholder="user_..."
        hint="Must reference an existing User.id."
        error={fieldErrors.ownerId}
        required
      />

      <TextAreaField
        label="Description"
        value={form.description}
        onChange={(event) => update("description", event.target.value)}
        placeholder="Describe the purpose of this workspace..."
        hint="Optional workspace description."
      />

      <Field
        label="Workspace image URL"
        type="url"
        value={form.image_url}
        onChange={(event) => update("image_url", event.target.value)}
        placeholder="https://example.com/workspace.png"
        error={fieldErrors.image_url}
        hint="Optional. Leave blank to use the default workspace avatar."
      />

      <TextAreaField
        label="Settings (JSON)"
        value={form.settings}
        onChange={(event) => update("settings", event.target.value)}
        placeholder={'{\n  "theme": "light"\n}'}
        error={fieldErrors.settings}
        hint="Must be a valid JSON object. Defaults to {}."
        spellCheck={false}
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-5 text-amber-900">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          The owner must already exist in the application database. Creating a
          workspace does not create a user or a Clerk account.
        </p>
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
              ? "Create workspace"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function DetailRow({ label, value, mono = false, multiline = false }) {
  let displayValue = value;

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

function WorkspaceDetails({ workspace, loading, error, onRetry }) {
  const counts = workspace?._count;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <WorkspaceAvatar workspace={workspace || {}} large />

        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold text-slate-950">
            {workspace?.name || "Unnamed workspace"}
          </h3>

          <p className="mt-1 break-all text-sm text-slate-500">
            {workspace?.slug || "No slug"}
          </p>

          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Database record
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
          <LoaderCircle size={16} className="animate-spin" />
          Loading complete workspace details…
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
            Workspace scalar fields
          </h4>
        </div>

        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          <DetailRow label="id" value={workspace?.id} mono />
          <DetailRow label="name" value={workspace?.name} />
          <DetailRow label="slug" value={workspace?.slug} />
          <DetailRow
            label="description"
            value={workspace?.description}
            multiline
          />
          <DetailRow label="ownerId" value={workspace?.ownerId} mono />
          <DetailRow
            label="settings"
            value={workspace?.settings}
            mono
            multiline
          />
          <DetailRow label="image_url" value={workspace?.image_url} multiline />
          <DetailRow
            label="createdAt"
            value={formatDate(workspace?.createdAt)}
          />
          <DetailRow
            label="updatedAt"
            value={formatDate(workspace?.updatedAt)}
          />
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
              ["Workspace members", counts.members],
              ["Projects", counts.projects],
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
            Relation counts will appear here when the admin detail endpoint
            includes Prisma&apos;s <code>_count</code> selection.
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

export default function WorkspacesPage() {
  const api = useAdminApi();

  const [workspaces, setWorkspaces] = useState([]);
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
  const [detailWorkspace, setDetailWorkspace] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [notice, setNotice] = useState("");

  const loadWorkspaces = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const result = await api.getRecords("workspaces", {
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        setWorkspaces(Array.isArray(result?.records) ? result.records : []);

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
    loadWorkspaces();
  }, [loadWorkspaces]);

  const filteredWorkspaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return workspaces;

    return workspaces.filter((workspace) =>
      [
        workspace.name,
        workspace.slug,
        workspace.id,
        workspace.ownerId,
        workspace.description,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [workspaces, search]);

  const openDetails = async (workspace) => {
    setModal({ type: "view", workspace });
    setDetailWorkspace(workspace);
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await api.getRecord("workspaces", workspace.id);
      const fullRecord =
        result?.record ?? result?.data?.record ?? result?.data ?? result;

      setDetailWorkspace(fullRecord || workspace);
    } catch (err) {
      setDetailError(getFriendlyError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const retryDetails = () => {
    if (modal?.type === "view") openDetails(modal.workspace);
  };

  const openCreate = () => {
    setNotice("");
    setModal({ type: "create", workspace: EMPTY_FORM });
  };

  const openEdit = (workspace) => {
    setNotice("");

    setModal({
      type: "edit",
      workspace: {
        id: workspace.id ?? "",
        name: workspace.name ?? "",
        slug: workspace.slug ?? "",
        description: workspace.description ?? "",
        ownerId: workspace.ownerId ?? "",
        settings: workspace.settings ?? {},
        image_url: workspace.image_url ?? "",
      },
    });
  };

  const saveWorkspace = async (data) => {
    if (modal.type === "create") {
      await api.createRecord("workspaces", data);
      setNotice("Workspace created successfully.");
    } else {
      await api.updateRecord("workspaces", modal.workspace.id, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ownerId: data.ownerId,
        settings: data.settings,
        image_url: data.image_url,
      });

      setNotice("Workspace updated successfully.");
    }

    setModal(null);
    await loadWorkspaces({ quiet: true });
  };

  const removeWorkspace = async () => {
    if (!selectedWorkspace || !deleteAcknowledged) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.deleteRecord("workspaces", selectedWorkspace.id, {
        confirm: true,
        confirmCascade: true,
      });

      setNotice("Workspace deleted.");
      setSelectedWorkspace(null);
      setDeleteAcknowledged(false);

      if (workspaces.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadWorkspaces({ quiet: true });
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
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Administration / Management
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Workspaces<span className="text-violet-600">.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage workspace records, review ownership, and inspect related
            projects and members.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => loadWorkspaces({ quiet: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>

          <Button variant="primary" onClick={openCreate}>
            <Plus size={17} />
            Add workspace
          </Button>
        </div>
      </header>

      {/* Success notification */}
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

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total records",
            value: loading ? "—" : total.toLocaleString(),
            note: "Application workspaces",
            icon: <Boxes size={20} />,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "On this page",
            value: loading ? "—" : workspaces.length.toLocaleString(),
            note: "Loaded records",
            icon: <FolderKanban size={20} />,
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

      {/* Workspace table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Application workspaces</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by workspace name, slug, owner ID, or database ID.
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
              placeholder="Search loaded workspaces…"
              aria-label="Search workspaces"
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
              Couldn&apos;t load workspaces
            </h3>

            <p
              role="alert"
              className="mx-auto mt-2 max-w-md text-sm text-slate-500"
            >
              {error}
            </p>

            <Button
              variant="primary"
              onClick={() => loadWorkspaces()}
              className="mt-5"
            >
              <RefreshCw size={16} />
              Try again
            </Button>
          </div>
        ) : loading ? (
          <SkeletonRows />
        ) : filteredWorkspaces.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              {search ? <Search size={23} /> : <Boxes size={23} />}
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? "No matching workspaces" : "No workspace records yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another name, slug, owner ID, or workspace ID."
                : "Workspace records returned by your backend will appear here."}
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
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Workspace</th>
                    <th className="px-5 py-4">Slug</th>
                    <th className="px-5 py-4">Owner ID</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredWorkspaces.map((workspace) => (
                    <tr
                      key={workspace.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <WorkspaceAvatar workspace={workspace} />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {workspace.name || "Unnamed workspace"}
                            </p>

                            <p
                              title={workspace.id}
                              className="mt-1 max-w-64 truncate font-mono text-[11px] text-slate-400"
                            >
                              {workspace.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-block max-w-48 truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                          {workspace.slug || "No slug"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          title={workspace.ownerId}
                          className="inline-block max-w-44 truncate font-mono text-xs text-slate-500"
                        >
                          {workspace.ownerId || "Not set"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {workspace.createdAt
                          ? formatDate(workspace.createdAt)
                          : "Not available"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <IconButton
                            label={`View ${workspace.name || "workspace"} details`}
                            onClick={() => openDetails(workspace)}
                          >
                            <Eye size={17} />
                          </IconButton>

                          <IconButton
                            label={`Edit ${workspace.name || "workspace"}`}
                            onClick={() => openEdit(workspace)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={17} />
                          </IconButton>

                          <IconButton
                            label={`Delete ${workspace.name || "workspace"}`}
                            onClick={() => {
                              setSelectedWorkspace(workspace);
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
                  ? `${filteredWorkspaces.length} matching record${
                      filteredWorkspaces.length === 1 ? "" : "s"
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

      {/* Create dialog */}
      {modal?.type === "create" && (
        <Modal
          title="Add workspace"
          subtitle="Create a workspace record in your application database."
          onClose={() => setModal(null)}
        >
          <WorkspaceForm
            mode="create"
            initial={modal.workspace}
            onCancel={() => setModal(null)}
            onSubmit={saveWorkspace}
          />
        </Modal>
      )}

      {/* Edit dialog */}
      {modal?.type === "edit" && (
        <Modal
          title="Edit workspace"
          subtitle="Update the workspace fields stored in your application database."
          onClose={() => setModal(null)}
        >
          <WorkspaceForm
            mode="edit"
            initial={modal.workspace}
            onCancel={() => setModal(null)}
            onSubmit={saveWorkspace}
          />
        </Modal>
      )}

      {/* Details dialog */}
      {modal?.type === "view" && (
        <Modal
          title="Workspace record details"
          subtitle="Scalar fields and relation counts from your Prisma Workspace model."
          wide
          onClose={() => setModal(null)}
        >
          <WorkspaceDetails
            workspace={detailWorkspace || modal.workspace}
            loading={detailLoading}
            error={detailError}
            onRetry={retryDetails}
          />

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={() => setModal(null)}>Close details</Button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {selectedWorkspace && (
        <Modal
          title="Delete workspace?"
          subtitle="Review the potential impact before continuing."
          closeDisabled={deleting}
          onClose={() => {
            setSelectedWorkspace(null);
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
                  You are deleting the workspace{" "}
                  <strong>
                    {selectedWorkspace.name || selectedWorkspace.slug}
                  </strong>
                  . Your Prisma schema uses cascade deletion for workspace
                  ownership and project relations. Members, projects, and
                  dependent records may be affected.
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
              I understand that deleting this workspace may remove related
              records and have reviewed the potential impact.
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
                setSelectedWorkspace(null);
                setDeleteAcknowledged(false);
                setDeleteError("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={removeWorkspace}
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
