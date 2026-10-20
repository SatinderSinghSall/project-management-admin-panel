import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
  CalendarDays,
  Link2,
  Database,
} from "lucide-react";
import { useAdminApi } from "../services/useAdminApi";
import { getFriendlyError } from "../services/adminApi";

const PAGE_SIZE = 10;
const EMPTY_FORM = { id: "", name: "", email: "", image: "" };

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Avatar({ user, size = "md" }) {
  const sizeClass =
    size === "lg" ? "h-16 w-16 rounded-2xl" : "h-10 w-10 rounded-xl";

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt=""
        className={`${sizeClass} shrink-0 border border-slate-200 bg-slate-50 object-cover`}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-violet-100 font-bold text-violet-700 ${size === "lg" ? "text-xl" : "text-sm"}`}
    >
      {initials(user?.name)}
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
    ghost:
      "border border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 active:scale-[0.99] ${variants[variant]} ${disabled ? "cursor-not-allowed opacity-50 shadow-none active:scale-100" : "cursor-pointer"} ${className}`}
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${className}`}
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
        className={`my-auto w-full ${wide ? "max-w-3xl" : "max-w-xl"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
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
        <div className="px-6 py-5">{children}</div>
      </section>
    </div>
  );
}

function Field({ label, error, hint, disabled = false, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        {...props}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${error ? "border-red-300" : "border-slate-200"} ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-500" : "cursor-text"}`}
      />
      {hint && !error && (
        <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function UserForm({ initial, mode, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initial }));
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

    if (mode === "create" && !form.id.trim()) {
      errors.id = "User ID is required by the current backend.";
    }
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (form.image.trim()) {
      try {
        const imageUrl = new URL(form.image.trim());
        if (!["http:", "https:"].includes(imageUrl.protocol)) {
          errors.image = "Use an HTTP or HTTPS image URL.";
        }
      } catch {
        errors.image = "Enter a valid image URL.";
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
        id: form.id.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        image: form.image.trim(),
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
          label="Application user ID"
          value={form.id}
          onChange={(event) => update("id", event.target.value)}
          placeholder="user_..."
          hint="Must match the ID used by your authentication provider for linked accounts."
          error={fieldErrors.id}
          required
          autoComplete="off"
        />
      )}
      <Field
        label="Full name"
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        placeholder="e.g. Alex Morgan"
        error={fieldErrors.name}
        required
        autoComplete="name"
      />
      <Field
        label="Email address"
        type="email"
        value={form.email}
        onChange={(event) => update("email", event.target.value)}
        placeholder="alex@example.com"
        error={fieldErrors.email}
        required
        autoComplete="email"
      />
      <Field
        label="Profile image URL"
        type="url"
        value={form.image}
        onChange={(event) => update("image", event.target.value)}
        placeholder="https://example.com/avatar.png"
        error={fieldErrors.image}
        hint="Optional. Leave blank to use no profile image."
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-5 text-amber-900">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          This edits the application database record only. It does not create,
          delete, or update the user's Clerk authentication account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {error}
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
              ? "Create user record"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function DetailRow({ label, value, mono = false, multiline = false }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 break-words text-sm text-slate-700 ${mono ? "font-mono text-xs" : ""} ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value === null || value === undefined || value === ""
          ? "Not set"
          : String(value)}
      </dd>
    </div>
  );
}

function UserDetails({ user, loading, error, onRetry }) {
  const counts = user?._count;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="relative">
          <Avatar user={user || {}} size="lg" />
          {user?.image && (
            <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 font-bold text-violet-700">
              {initials(user?.name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold text-slate-950">
            {user?.name || "Unnamed user"}
          </h3>
          <p className="mt-1 break-all text-sm text-slate-500">
            {user?.email || "No email"}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Database record
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
          <LoaderCircle size={16} className="animate-spin" />
          Loading complete user details…
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
            User scalar fields
          </h4>
        </div>
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          <DetailRow label="id" value={user?.id} mono />
          <DetailRow label="name" value={user?.name} />
          <DetailRow label="email" value={user?.email} />
          <DetailRow label="image" value={user?.image} multiline />
          <DetailRow label="createdAt" value={formatDate(user?.createdAt)} />
          <DetailRow label="updatedAt" value={formatDate(user?.updatedAt)} />
        </dl>
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <Link2 size={16} className="text-violet-600" />
          <h4 className="text-sm font-bold text-slate-900">Related records</h4>
        </div>
        {counts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Workspace memberships", counts.workspaces],
              ["Owned workspaces", counts.ownedWorkspaces],
              ["Projects", counts.projects],
              ["Assigned tasks", counts.tasks],
              ["Comments", counts.comments],
              ["Project memberships", counts.ProjectMember],
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
            Relation counts are available when the admin detail endpoint
            includes Prisma's <code>_count</code> selection.
          </p>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <CalendarDays size={14} />
        Dates are displayed in your browser's local time zone.
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
          <div className="h-10 w-10 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-slate-100" />
            <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
          </div>
          <div className="hidden h-8 w-24 rounded-lg bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const api = useAdminApi();
  const [users, setUsers] = useState([]);
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
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const result = await api.getRecords("users", {
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        setUsers(Array.isArray(result?.records) ? result.records : []);
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
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.id].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [users, search]);

  const openDetails = async (user) => {
    setModal({ type: "view", user });
    setDetailUser(user);
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await api.getRecord("users", user.id);
      const fullRecord =
        result?.record ?? result?.data?.record ?? result?.data ?? result;
      setDetailUser(fullRecord || user);
    } catch (err) {
      setDetailError(getFriendlyError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const retryDetails = () => {
    if (modal?.type === "view") openDetails(modal.user);
  };

  const openCreate = () => {
    setNotice("");
    setModal({ type: "create", user: EMPTY_FORM });
  };

  const openEdit = (user) => {
    setNotice("");
    setModal({
      type: "edit",
      user: {
        id: user.id ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
        image: user.image ?? "",
      },
    });
  };

  const saveUser = async (data) => {
    if (modal.type === "create") {
      await api.createRecord("users", data);
      setNotice("User database record created successfully.");
    } else {
      await api.updateRecord("users", modal.user.id, {
        name: data.name,
        email: data.email,
        image: data.image || "",
      });
      setNotice("User database record updated successfully.");
    }
    setModal(null);
    await loadUsers({ quiet: true });
  };

  const removeUser = async () => {
    if (!selectedUser || !deleteAcknowledged) return;
    setDeleting(true);
    setDeleteError("");

    try {
      await api.deleteRecord("users", selectedUser.id, {
        confirm: true,
        confirmCascade: true,
      });
      setNotice("User database record deleted.");
      setSelectedUser(null);
      setDeleteAcknowledged(false);

      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadUsers({ quiet: true });
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
            Users<span className="text-violet-600">.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage application user records, inspect schema fields, and review
            related data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => loadUsers({ quiet: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={17} />
            Add user record
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
            label: "Total records",
            value: loading ? "—" : total.toLocaleString(),
            note: "Application database users",
            icon: <Users size={20} />,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "On this page",
            value: loading ? "—" : users.length.toLocaleString(),
            note: "Loaded records",
            icon: <CircleUserRound size={20} />,
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
            <h2 className="font-bold text-slate-900">Application users</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by name, email, or database ID.
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
              placeholder="Search loaded records…"
              aria-label="Search users"
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              Couldn't load users
            </h3>
            <p
              role="alert"
              className="mx-auto mt-2 max-w-md text-sm text-slate-500"
            >
              {error}
            </p>
            <Button
              variant="primary"
              onClick={() => loadUsers()}
              className="mt-5"
            >
              <RefreshCw size={16} />
              Try again
            </Button>
          </div>
        ) : loading ? (
          <SkeletonRows />
        ) : filteredUsers.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              {search ? <Search size={23} /> : <Users size={23} />}
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? "No matching users" : "No user records yet"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another name, email address, or ID."
                : "User records returned by your backend will appear here."}
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
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Database ID</th>
                    <th className="px-5 py-4">Profile image</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {user.name || "Unnamed user"}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                              <Mail size={12} className="shrink-0" />
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          title={user.id}
                          className="inline-block max-w-48 truncate rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-600"
                        >
                          {user.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {user.image ? "Configured" : "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <IconButton
                            label={`View ${user.name || "user"} details`}
                            onClick={() => openDetails(user)}
                          >
                            <Eye size={17} />
                          </IconButton>
                          <IconButton
                            label={`Edit ${user.name || "user"}`}
                            onClick={() => openEdit(user)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={17} />
                          </IconButton>
                          <IconButton
                            label={`Delete ${user.name || "user"} record`}
                            onClick={() => {
                              setSelectedUser(user);
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
                  ? `${filteredUsers.length} matching record${filteredUsers.length === 1 ? "" : "s"} on this page`
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
          title="Add user record"
          subtitle="Create an application database record."
          onClose={() => setModal(null)}
        >
          <UserForm
            mode="create"
            initial={modal.user}
            onCancel={() => setModal(null)}
            onSubmit={saveUser}
          />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal
          title="Edit user record"
          subtitle="Update the profile fields stored in your application database."
          onClose={() => setModal(null)}
        >
          <UserForm
            mode="edit"
            initial={modal.user}
            onCancel={() => setModal(null)}
            onSubmit={saveUser}
          />
        </Modal>
      )}
      {modal?.type === "view" && (
        <Modal
          title="User record details"
          subtitle="Scalar fields and relationship counts from your Prisma User model."
          wide
          onClose={() => setModal(null)}
        >
          <UserDetails
            user={detailUser || modal.user}
            loading={detailLoading}
            error={detailError}
            onRetry={retryDetails}
          />
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={() => setModal(null)}>Close details</Button>
          </div>
        </Modal>
      )}
      {selectedUser && (
        <Modal
          title="Delete user record?"
          subtitle="Review the potential impact before continuing."
          closeDisabled={deleting}
          onClose={() => {
            setSelectedUser(null);
            setDeleteAcknowledged(false);
            setDeleteError("");
          }}
        >
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <ShieldAlert className="shrink-0 text-red-600" size={22} />
              <div>
                <p className="font-semibold text-red-900">
                  This action cannot easily be undone.
                </p>
                <p className="mt-1 break-words text-sm leading-5 text-red-800">
                  You are deleting the database record for{" "}
                  <strong>{selectedUser.name || selectedUser.email}</strong>.
                  Your Prisma schema uses cascade deletion for several user
                  relations, so related records may also be removed.
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
              className={`mt-1 h-4 w-4 accent-red-600 ${deleting ? "cursor-not-allowed" : "cursor-pointer"}`}
            />
            <span>
              I understand that deleting this record may remove related data and
              have reviewed the potential impact.
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
                setSelectedUser(null);
                setDeleteAcknowledged(false);
                setDeleteError("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={removeUser}
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
