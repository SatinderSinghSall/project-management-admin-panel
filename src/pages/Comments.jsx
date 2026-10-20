import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAdminApi } from "../services/useAdminApi";

const PAGE_SIZE = 8;

const emptyForm = {
  content: "",
  userId: "",
  taskId: "",
};

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getRecordId(record) {
  return record?.id ?? "";
}

function getUserName(user) {
  if (!user) return "Unknown user";
  return user.name || user.email || user.id || "Unknown user";
}

function getTaskName(task) {
  if (!task) return "Unknown task";
  return task.title || task.id || "Unknown task";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortId(value, maxLength = 22) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function Avatar({ user }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = getUserName(user);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setImageFailed(false);
  }, [user?.image]);

  if (user?.image && !imageFailed) {
    return (
      <img
        src={user.image}
        alt={name}
        onError={() => setImageFailed(true)}
        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
      {initials || <UserRound size={18} />}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
        aria-label={title}
        className={`my-auto w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={19} />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </section>
    </div>
  );
}

function DetailField({ label, value, multiline = false }) {
  const displayed =
    value === null || value === undefined || value === ""
      ? "Not set"
      : typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value);

  return (
    <div className="grid gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 break-words text-sm text-slate-700 ${
          multiline ? "whitespace-pre-wrap" : ""
        }`}
      >
        {displayed}
      </dd>
    </div>
  );
}

function StatCard({ label, value, description, icon: Icon, tone }) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            tones[tone] || tones.violet
          }`}
        >
          <Icon size={20} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </article>
  );
}

export default function Comments() {
  const api = useAdminApi();

  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const results = await Promise.allSettled([
        api.getRecords("comments"),
        api.getRecords("users"),
        api.getRecords("tasks"),
      ]);

      if (results[0].status === "rejected") {
        throw results[0].reason;
      }

      setComments(getRows(results[0].value));

      setUsers(
        results[1].status === "fulfilled" ? getRows(results[1].value) : [],
      );

      setTasks(
        results[2].status === "fulfilled" ? getRows(results[2].value) : [],
      );

      if (
        results[1].status === "rejected" ||
        results[2].status === "rejected"
      ) {
        setNotice(
          "Comments loaded, but user or task options could not be loaded. Check your admin API permissions.",
        );
      }
    } catch (err) {
      setError(err?.message || "Unable to load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredComments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return comments;

    return comments.filter((comment) => {
      const author =
        comment.user || users.find((user) => user.id === comment.userId);
      const task =
        comment.task || tasks.find((item) => item.id === comment.taskId);

      return [
        comment.id,
        comment.content,
        comment.userId,
        comment.taskId,
        getUserName(author),
        author?.email,
        getTaskName(task),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [comments, search, users, tasks]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredComments.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const visibleComments = filteredComments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const uniqueAuthors = new Set(
    comments.map((comment) => comment.userId).filter(Boolean),
  ).size;

  function openCreate() {
    setForm({
      ...emptyForm,
      userId: users[0]?.id || "",
      taskId: tasks[0]?.id || "",
    });
    setModal({ type: "create" });
    setError("");
    setNotice("");
  }

  function openEdit(comment) {
    setForm({
      content: comment.content || "",
      userId: comment.userId || "",
      taskId: comment.taskId || "",
    });
    setModal({ type: "edit", comment });
    setError("");
    setNotice("");
  }

  function openDetails(comment) {
    setModal({ type: "details", comment });
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const content = form.content.trim();

      if (!content) {
        throw new Error("Please enter comment content.");
      }

      if (!form.userId || !form.taskId) {
        throw new Error("Select both an author and a task.");
      }

      const data = {
        content,
        userId: form.userId,
        taskId: form.taskId,
      };

      if (modal.type === "create") {
        await api.createRecord("comments", data);
        setNotice("Comment created successfully.");
      } else {
        await api.updateRecord("comments", modal.comment.id, data);
        setNotice("Comment updated successfully.");
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(err?.message || "Unable to save this comment.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteComment(comment) {
    const confirmed = window.confirm(
      `Delete this comment?\n\n${String(comment.content || "").slice(0, 180)}\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(comment.id);
    setError("");
    setNotice("");

    try {
      await api.deleteRecord("comments", comment.id, {
        confirm: true,
      });

      setComments((current) =>
        current.filter((item) => item.id !== comment.id),
      );

      setNotice("Comment deleted successfully.");
      setModal(null);
    } catch (err) {
      setError(err?.message || "Unable to delete this comment.");
    } finally {
      setDeletingId("");
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function authorFor(comment) {
    return (
      comment.user || users.find((user) => user.id === comment.userId) || null
    );
  }

  function taskFor(comment) {
    return (
      comment.task || tasks.find((task) => task.id === comment.taskId) || null
    );
  }

  const isEditing = modal?.type === "edit";
  const selectedComment = modal?.comment;
  const selectedAuthor = selectedComment ? authorFor(selectedComment) : null;
  const selectedTask = selectedComment ? taskFor(selectedComment) : null;

  return (
    <div className="space-y-7 pb-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600">
            Administration / Management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Comments<span className="text-violet-600">.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review discussion activity, inspect authors and tasks, and manage
            application comments from one place.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100"
          >
            <Plus size={17} />
            Add comment
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            className="cursor-pointer rounded p-1 hover:bg-rose-100"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && !error && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <Check size={18} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total comments"
          value={loading ? "—" : comments.length}
          description="Comment records in the application"
          icon={MessageSquare}
          tone="violet"
        />
        <StatCard
          label="Unique authors"
          value={loading ? "—" : uniqueAuthors}
          description="Distinct user IDs represented in comments"
          icon={UserRound}
          tone="blue"
        />
        <StatCard
          label="Search results"
          value={loading ? "—" : filteredComments.length}
          description="Records matching your current search"
          icon={Activity}
          tone="green"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Application comments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by comment text, author, task, or record ID.
            </p>
          </div>

          <label className="relative block w-full lg:max-w-sm">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search comments..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            />
          </label>
        </header>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={28} className="animate-spin text-violet-600" />
            <p className="text-sm">Loading comments...</p>
          </div>
        ) : error && comments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={30} className="text-rose-500" />
            <p className="mt-3 font-semibold text-slate-800">
              Comments could not be loaded
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Check your backend connection and admin API response.
            </p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Try again
            </button>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MessageSquare size={25} />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? "No matching comments" : "No comments yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term or clear your search."
                : "Comments created in the application will appear here."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus size={16} />
                Add comment
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Comment</th>
                    <th className="px-5 py-4">Author</th>
                    <th className="px-5 py-4">Related task</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleComments.map((comment) => {
                    const author = authorFor(comment);
                    const task = taskFor(comment);

                    return (
                      <tr
                        key={getRecordId(comment)}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="max-w-[340px] px-6 py-4">
                          <button
                            type="button"
                            onClick={() => openDetails(comment)}
                            className="block max-w-full cursor-pointer text-left"
                          >
                            <span className="block truncate text-sm font-semibold text-slate-800 hover:text-violet-700">
                              {comment.content || "(Empty comment)"}
                            </span>
                            <span className="mt-1 block font-mono text-[11px] text-slate-400">
                              ID: {shortId(comment.id, 25)}
                            </span>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar user={author} />
                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                                {getUserName(author)}
                              </p>
                              <p className="max-w-[180px] truncate text-xs text-slate-500">
                                {author?.email || shortId(comment.userId)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <FileText size={17} />
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate text-sm font-medium text-slate-700">
                                {getTaskName(task)}
                              </p>
                              <p className="max-w-[180px] truncate font-mono text-[11px] text-slate-400">
                                {shortId(comment.taskId)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />
                            {formatDate(comment.createdAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetails(comment)}
                              title="View comment"
                              aria-label="View comment"
                              className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(comment)}
                              title="Edit comment"
                              aria-label="Edit comment"
                              className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteComment(comment)}
                              disabled={deletingId === comment.id}
                              title="Delete comment"
                              aria-label="Delete comment"
                              className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === comment.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredComments.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredComments.length}
                </span>{" "}
                comments
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="min-w-12 text-center text-sm font-semibold text-slate-600">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {modal?.type === "details" && selectedComment && (
        <Modal
          title="Comment record details"
          subtitle="Scalar fields and related records from your Prisma Comment model."
          onClose={() => setModal(null)}
          wide
        >
          <div className="mb-6 flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <MessageSquare size={23} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Comment preview</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {selectedComment.content || "(Empty comment)"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Check size={13} />
                Database record
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
              <Activity size={17} className="text-violet-600" />
              Comment scalar fields
            </h3>
            <dl className="rounded-xl border border-slate-200 px-4">
              <DetailField label="ID" value={selectedComment.id} />
              <DetailField
                label="CONTENT"
                value={selectedComment.content}
                multiline
              />
              <DetailField label="USER ID" value={selectedComment.userId} />
              <DetailField label="TASK ID" value={selectedComment.taskId} />
              <DetailField
                label="CREATED AT"
                value={formatDate(selectedComment.createdAt)}
              />
            </dl>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
              <UserRound size={17} className="text-violet-600" />
              Related user
            </h3>
            <div className="rounded-xl border border-slate-200 p-4">
              {selectedAuthor ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar user={selectedAuthor} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {getUserName(selectedAuthor)}
                      </p>
                      <p className="break-all text-sm text-slate-500">
                        {selectedAuthor.email || "No email available"}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3">
                    <DetailField label="USER ID" value={selectedAuthor.id} />
                    <DetailField label="NAME" value={selectedAuthor.name} />
                    <DetailField label="EMAIL" value={selectedAuthor.email} />
                    <DetailField label="IMAGE" value={selectedAuthor.image} />
                  </dl>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  The user record is not included in this response and could not
                  be matched to the loaded users list.
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
              <FileText size={17} className="text-violet-600" />
              Related task
            </h3>
            <div className="rounded-xl border border-slate-200 p-4">
              {selectedTask ? (
                <dl>
                  <DetailField label="TASK ID" value={selectedTask.id} />
                  <DetailField label="TITLE" value={selectedTask.title} />
                  <DetailField
                    label="DESCRIPTION"
                    value={selectedTask.description}
                    multiline
                  />
                  <DetailField label="STATUS" value={selectedTask.status} />
                  <DetailField label="TYPE" value={selectedTask.type} />
                  <DetailField label="PRIORITY" value={selectedTask.priority} />
                  <DetailField
                    label="PROJECT ID"
                    value={selectedTask.projectId}
                  />
                  <DetailField
                    label="ASSIGNEE ID"
                    value={selectedTask.assigneeId}
                  />
                  <DetailField
                    label="DUE DATE"
                    value={formatDate(selectedTask.due_date)}
                  />
                  <DetailField
                    label="CREATED AT"
                    value={formatDate(selectedTask.createdAt)}
                  />
                  <DetailField
                    label="UPDATED AT"
                    value={formatDate(selectedTask.updatedAt)}
                  />
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  The task record is not included in this response and could not
                  be matched to the loaded tasks list.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => openEdit(selectedComment)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit comment
            </button>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {(modal?.type === "create" || modal?.type === "edit") && (
        <Modal
          title={isEditing ? "Edit comment" : "Create comment"}
          subtitle={
            isEditing
              ? "Update the content or linked user and task."
              : "Create a comment associated with an existing user and task."
          }
          onClose={() => {
            if (!saving) setModal(null);
          }}
        >
          <form onSubmit={submitForm} className="space-y-5">
            <div>
              <label
                htmlFor="comment-content"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Comment content <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="comment-content"
                required
                rows={5}
                maxLength={10000}
                value={form.content}
                onChange={(event) => updateField("content", event.target.value)}
                placeholder="Write the comment..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {form.content.length}/10000
              </p>
            </div>

            <div>
              <label
                htmlFor="comment-user"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Author <span className="text-rose-500">*</span>
              </label>
              <select
                id="comment-user"
                required
                value={form.userId}
                onChange={(event) => updateField("userId", event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserName(user)}
                    {user.email ? ` — ${user.email}` : ""}
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No users were loaded. Ensure the admin users endpoint is
                  accessible before creating a comment.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="comment-task"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Related task <span className="text-rose-500">*</span>
              </label>
              <select
                id="comment-task"
                required
                value={form.taskId}
                onChange={(event) => updateField("taskId", event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              >
                <option value="">Select a task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title || task.id}
                    {task.status ? ` — ${task.status}` : ""}
                  </option>
                ))}
              </select>
              {tasks.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No tasks were loaded. A comment must reference an existing
                  task.
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving || !form.content.trim() || !form.userId || !form.taskId
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create comment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
