import React, { useMemo, useState, useEffect, useRef } from "react";
import type { InputHTMLAttributes } from "react";
import {
  ExternalLink,
  Search,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Video,
  FileText,
  FolderOpen,
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import type { Subject, Chapter, LinkItem, StorageData } from "./types";
import { INITIAL_DATA } from "./types";
import { detectKind, cleanText, normalizeUrl, generateId } from "./utils";

const STORAGE_KEY = "CLASS_LINKS_PORTAL_V1";
const ADMIN_KEY = "CLASS_LINKS_IS_TEACHER"; // old key, only used to clear it
const TEACHER_SESSION_KEY = "CLASS_LINKS_TEACHER_SESSION";

const COLORS = [
  "#2563eb", // Royal Blue
  "#059669", // Emerald Green
  "#7c3aed", // Vivid Violet
  "#e11d48", // Rose Red
  "#d97706", // Amber
  "#0891b2", // Cyan
  "#db2777", // Fuchsia Pink
  "#4f46e5", // Indigo
];

const KIND_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  Zoom: {
    bg: "bg-blue-50 text-blue-700",
    text: "#2563eb",
    border: "border-blue-200",
    icon: <Video className="w-3.5 h-3.5 text-blue-600" />,
  },
  Meet: {
    bg: "bg-emerald-50 text-emerald-700",
    text: "#059669",
    border: "border-emerald-200",
    icon: <Video className="w-3.5 h-3.5 text-emerald-600" />,
  },
  Teams: {
    bg: "bg-purple-50 text-purple-700",
    text: "#7c3aed",
    border: "border-purple-200",
    icon: <Video className="w-3.5 h-3.5 text-purple-600" />,
  },
  YouTube: {
    bg: "bg-rose-50 text-rose-700",
    text: "#e11d48",
    border: "border-rose-200",
    icon: <Video className="w-3.5 h-3.5 text-rose-600" />,
  },
  Drive: {
    bg: "bg-amber-50 text-amber-800",
    text: "#d97706",
    border: "border-amber-200",
    icon: <FolderOpen className="w-3.5 h-3.5 text-amber-600" />,
  },
  PDF: {
    bg: "bg-red-50 text-red-700",
    text: "#dc2626",
    border: "border-red-200",
    icon: <FileText className="w-3.5 h-3.5 text-red-600" />,
  },
  Link: {
    bg: "bg-slate-100 text-slate-700",
    text: "#475569",
    border: "border-slate-200",
    icon: <LinkIcon className="w-3.5 h-3.5 text-slate-500" />,
  },
};

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm " +
        (className ?? "")
      }
    />
  );
}

function KindBadge({ kind }: { kind: string }) {
  const conf = KIND_CONFIG[kind] ?? KIND_CONFIG.Link;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${conf.bg} ${conf.border} shrink-0`}
    >
      {conf.icon}
      {kind}
    </span>
  );
}

function MoveButtons({
  onMove,
  canUp,
  canDown,
}: {
  onMove: (d: "up" | "down") => void;
  canUp: boolean;
  canDown: boolean;
}) {
  return (
    <span className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
      <button
        disabled={!canUp}
        onClick={() => onMove("up")}
        title="Move up"
        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button
        disabled={!canDown}
        onClick={() => onMove("down")}
        title="Move down"
        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

function LinkRow({
  link,
  edit,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
}: {
  link: LinkItem;
  edit: boolean;
  index: number;
  total: number;
  onUpdate: (id: string, title: string, url: string, note?: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [note, setNote] = useState(link.note ?? "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (editing) {
    return (
      <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 transition">
        <div className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">
          Edit Link
        </div>
        <Field
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resource title"
        />
        <Field
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
        <Field
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes, schedule, or password (optional)"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              try {
                onUpdate(link._id, title, url, note);
                setEditing(false);
              } catch (err: any) {
                alert(err.message || "Failed to update link");
              }
            }}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white/90 hover:bg-white hover:shadow-sm transition-all duration-150">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <KindBadge kind={link.kind} />
        <div className="min-w-0 flex-1">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-800 hover:text-indigo-600 flex items-center gap-1.5 transition leading-snug group-hover:underline"
          >
            <span className="truncate">{link.title}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 inline-block opacity-75" />
          </a>
          {link.note && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {link.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          onClick={handleCopy}
          title="Copy link address"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {edit && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
            <MoveButtons
              onMove={(d) => onMove(link._id, d)}
              canUp={index > 0}
              canDown={index < total - 1}
            />
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${link.title}"?`)) {
                  onDelete(link._id);
                }
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-sm hover:shadow transition"
        >
          Open
        </a>
      </div>
    </div>
  );
}

function AddLinks({
  chapterId,
  onAddSingle,
  onAddMany,
}: {
  chapterId: string;
  onAddSingle: (title: string, url: string, note?: string) => void;
  onAddMany: (text: string) => number;
}) {
  const [open, setOpen] = useState(false);
  const [many, setMany] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [text, setText] = useState("");

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => {
            setMany(false);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Link
        </button>
        <button
          onClick={() => {
            setMany(true);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> Batch Paste Many
        </button>
      </div>
    );
  }

  if (many) {
    return (
      <div className="mt-3 p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3">
        <div className="text-xs text-slate-600 font-medium">
          Paste links (one per line). Format:{" "}
          <code className="text-indigo-700 font-semibold">Title | URL</code> or
          just paste the plain URL.
        </div>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
          placeholder={`Lecture 1: Intro | https://zoom.us/j/123456\nLecture 2: Vector Math | https://youtu.be/example\nFormula Sheet | https://drive.google.com/file/d/xyz/view`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setOpen(false)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              try {
                const count = onAddMany(text);
                setText("");
                setOpen(false);
                alert(`Successfully added ${count} links!`);
              } catch (err: any) {
                alert(err.message || "Error adding links");
              }
            }}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            Import Links
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-3 p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onAddSingle(title, url, note);
          setTitle("");
          setUrl("");
          setNote("");
          setOpen(false);
        } catch (err: any) {
          alert(err.message || "Error adding link");
        }
      }}
    >
      <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
        Add New Link to Chapter
      </div>
      <Field
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Live Class: Gravitation & Orbits)"
        required
      />
      <Field
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste link (Zoom, Meet, YouTube, Drive, PDF...)"
        required
      />
      <Field
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note: class timings, passcode, requirements"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          Save Link
        </button>
      </div>
    </form>
  );
}

function ChapterCard({
  chapter,
  links,
  color,
  edit,
  index,
  total,
  onRename,
  onDelete,
  onMove,
  onAddSingleLink,
  onAddManyLinks,
  onUpdateLink,
  onDeleteLink,
  onMoveLink,
}: {
  chapter: Chapter;
  links: LinkItem[];
  color: string;
  edit: boolean;
  index: number;
  total: number;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, d: "up" | "down") => void;
  onAddSingleLink: (chapterId: string, title: string, url: string, note?: string) => void;
  onAddManyLinks: (chapterId: string, text: string) => number;
  onUpdateLink: (id: string, title: string, url: string, note?: string) => void;
  onDeleteLink: (id: string) => void;
  onMoveLink: (id: string, d: "up" | "down") => void;
}) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(chapter.title);

  return (
    <section className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white/90 border-b border-slate-100"
        style={{ borderLeft: `6px solid ${color}` }}
      >
        {renaming ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                onRename(chapter._id, title);
                setRenaming(false);
              } catch (err: any) {
                alert(err.message);
              }
            }}
          >
            <Field
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="py-1.5 text-sm"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setOpen(!open)}
            className="flex flex-1 items-center gap-2.5 text-left py-0.5 group"
          >
            <span className="p-1 rounded-md text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition">
              {open ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
            <span className="font-bold text-slate-800 text-base tracking-tight">
              {chapter.title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {links.length} {links.length === 1 ? "resource" : "resources"}
            </span>
          </button>
        )}

        {edit && !renaming && (
          <div className="flex items-center gap-1.5">
            <MoveButtons
              onMove={(d) => onMove(chapter._id, d)}
              canUp={index > 0}
              canDown={index < total - 1}
            />
            <button
              onClick={() => setRenaming(true)}
              className="p-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              title="Rename chapter"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Delete chapter "${chapter.title}" and all its links?`
                  )
                ) {
                  onDelete(chapter._id);
                }
              }}
              className="p-1.5 text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
              title="Delete chapter"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="p-3 sm:p-4 space-y-2 bg-slate-50/50">
          {links.length === 0 ? (
            <div className="text-center py-6 px-4 text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
              No links or resources added to this chapter yet.
            </div>
          ) : (
            links.map((link, i) => (
              <LinkRow
                key={link._id}
                link={link}
                edit={edit}
                index={i}
                total={links.length}
                onUpdate={onUpdateLink}
                onDelete={onDeleteLink}
                onMove={onMoveLink}
              />
            ))
          )}

          {edit && (
            <AddLinks
              chapterId={chapter._id}
              onAddSingle={(t, u, n) => onAddSingleLink(chapter._id, t, u, n)}
              onAddMany={(text) => onAddManyLinks(chapter._id, text)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function SubjectModal({
  initialName = "",
  initialColor = COLORS[0],
  title,
  onSubmit,
  onClose,
}: {
  initialName?: string;
  initialColor?: string;
  title: string;
  onSubmit: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-slate-100 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              onSubmit(name, color);
              onClose();
            } catch (err: any) {
              alert(err.message);
            }
          }}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Subject Name
            </label>
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quantum Physics, English Literature"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Theme Accent Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 relative"
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition"
            >
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeacherLoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (token: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const j = await res.json();
        onSuccess(String(j.token || ""));
      } else if (res.status === 401) {
        setError("Wrong username or password.");
      } else {
        setError("Login is not available right now. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-xl"
      >
        <h3 className="text-lg font-bold text-slate-900">Teacher login</h3>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !username || !password}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Log in"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  // Persistence state
  const [data, setData] = useState<StorageData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return INITIAL_DATA;
  });

  // Teacher login: only true after a successful username/password check.
  // Kept in sessionStorage, so it ends when the tab is closed.
  const [isTeacher, setIsTeacher] = useState<boolean>(() => {
    localStorage.removeItem(ADMIN_KEY); // clear the old free-toggle flag
    return !!sessionStorage.getItem(TEACHER_SESSION_KEY);
  });

  const [showLogin, setShowLogin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [subjectModal, setSubjectModal] = useState<
    | { type: "add" }
    | { type: "edit"; subject: Subject }
    | null
  >(null);

  // Shared storage: everyone reads from the server; only a logged-in teacher saves.
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved" | "error">("");
  const serverEmpty = useRef(false);
  const fromServer = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  const fetchShared = async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        if (j && j.data && j.data.subjects && j.data.chapters && j.data.links) {
          fromServer.current = true;
          serverEmpty.current = false;
          setData(j.data);
        } else {
          serverEmpty.current = true;
        }
      }
    } catch (e) {
      console.error("Could not load shared data", e);
    } finally {
      setLoaded(true);
    }
  };

  const saveShared = async (d: StorageData) => {
    const token = sessionStorage.getItem(TEACHER_SESSION_KEY);
    if (!token) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ data: d }),
      });
      if (res.status === 401) {
        setSaveStatus("");
        alert("Your teacher session expired. Please log in again.");
        setIsTeacher(false);
        setEditMode(false);
      } else if (!res.ok) {
        setSaveStatus("error");
        alert("Could not save to the shared site. This change is only on this device.");
      } else {
        setSaveStatus("saved");
      }
    } catch {
      setSaveStatus("error");
      alert("Could not reach the server. This change is only on this device.");
    }
  };

  useEffect(() => {
    fetchShared();
    const onFocus = () => {
      if (!sessionStorage.getItem(TEACHER_SESSION_KEY)) fetchShared();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (fromServer.current) {
      fromServer.current = false;
      return;
    }
    if (!isTeacher || !loaded) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveShared(data), 600);
  }, [data]);

  // First time the teacher logs in and the server has nothing yet: publish what they have.
  useEffect(() => {
    if (isTeacher && loaded && serverEmpty.current) {
      serverEmpty.current = false;
      saveShared(data);
    }
  }, [isTeacher, loaded]);

  useEffect(() => {
    if (!isTeacher) sessionStorage.removeItem(TEACHER_SESSION_KEY);
  }, [isTeacher]);

  const canEdit = isTeacher && editMode;

  const subjects = useMemo(
    () => [...data.subjects].sort(byOrder),
    [data.subjects]
  );
  const chapters = useMemo(
    () => [...data.chapters].sort(byOrder),
    [data.chapters]
  );
  const links = useMemo(() => [...data.links].sort(byOrder), [data.links]);

  const activeSubject =
    subjects.find((s) => s._id === selectedSubjectId) ?? subjects[0] ?? null;
  const activeIndex = activeSubject
    ? subjects.findIndex((s) => s._id === activeSubject._id)
    : -1;
  const activeChapters = activeSubject
    ? chapters.filter((c) => c.subjectId === activeSubject._id)
    : [];

  const term = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!term) return [];
    return links
      .map((link) => {
        const subject = subjects.find((s) => s._id === link.subjectId);
        const chapter = chapters.find((c) => c._id === link.chapterId);
        return { link, subject, chapter };
      })
      .filter(({ link, subject, chapter }) =>
        [
          link.title,
          link.note ?? "",
          link.kind,
          subject?.name ?? "",
          chapter?.title ?? "",
        ].some((t) => t.toLowerCase().includes(term))
      );
  }, [term, links, subjects, chapters]);

  // Subject operations
  const handleAddSubject = (name: string, color: string) => {
    const clean = cleanText(name, "Subject name", 60);
    const newSub: Subject = {
      _id: generateId("sub"),
      name: clean,
      color,
      order: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSub],
    }));
    setSelectedSubjectId(newSub._id);
  };

  const handleUpdateSubject = (id: string, name: string, color: string) => {
    const clean = cleanText(name, "Subject name", 60);
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s._id === id ? { ...s, name: clean, color } : s
      ),
    }));
  };

  const handleDeleteSubject = (id: string) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s._id !== id),
      chapters: prev.chapters.filter((c) => c.subjectId !== id),
      links: prev.links.filter((l) => l.subjectId !== id),
    }));
    if (selectedSubjectId === id) setSelectedSubjectId(null);
  };

  const handleMoveSubject = (id: string, direction: "up" | "down") => {
    const sorted = [...data.subjects].sort(byOrder);
    const idx = sorted.findIndex((s) => s._id === id);
    const otherIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || otherIdx < 0 || otherIdx >= sorted.length) return;

    const current = sorted[idx];
    const other = sorted[otherIdx];
    const newOrder1 = other.order;
    const newOrder2 = current.order;

    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => {
        if (s._id === current._id) return { ...s, order: newOrder1 };
        if (s._id === other._id) return { ...s, order: newOrder2 };
        return s;
      }),
    }));
  };

  // Chapter operations
  const handleAddChapter = (title: string) => {
    if (!activeSubject) return;
    const clean = cleanText(title, "Chapter name", 120);
    const newCh: Chapter = {
      _id: generateId("ch"),
      subjectId: activeSubject._id,
      title: clean,
      order: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newCh],
    }));
    setNewChapterTitle("");
  };

  const handleRenameChapter = (id: string, title: string) => {
    const clean = cleanText(title, "Chapter name", 120);
    setData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) =>
        c._id === id ? { ...c, title: clean } : c
      ),
    }));
  };

  const handleDeleteChapter = (id: string) => {
    setData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((c) => c._id !== id),
      links: prev.links.filter((l) => l.chapterId !== id),
    }));
  };

  const handleMoveChapter = (id: string, direction: "up" | "down") => {
    const target = data.chapters.find((c) => c._id === id);
    if (!target) return;
    const siblings = data.chapters
      .filter((c) => c.subjectId === target.subjectId)
      .sort(byOrder);
    const idx = siblings.findIndex((c) => c._id === id);
    const otherIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || otherIdx < 0 || otherIdx >= siblings.length) return;

    const current = siblings[idx];
    const other = siblings[otherIdx];
    const newOrder1 = other.order;
    const newOrder2 = current.order;

    setData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) => {
        if (c._id === current._id) return { ...c, order: newOrder1 };
        if (c._id === other._id) return { ...c, order: newOrder2 };
        return c;
      }),
    }));
  };

  // Link operations
  const handleAddLink = (
    chapterId: string,
    title: string,
    rawUrl: string,
    note?: string
  ) => {
    const ch = data.chapters.find((c) => c._id === chapterId);
    if (!ch) throw new Error("Chapter not found");
    const cleanUrl = normalizeUrl(rawUrl);
    const cleanT = cleanText(title, "Link title", 150);
    const newLink: LinkItem = {
      _id: generateId("lnk"),
      chapterId,
      subjectId: ch.subjectId,
      title: cleanT,
      url: cleanUrl,
      kind: detectKind(cleanUrl),
      note: note?.trim() ? note.trim().slice(0, 300) : undefined,
      order: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));
  };

  const handleAddManyLinks = (chapterId: string, text: string) => {
    const ch = data.chapters.find((c) => c._id === chapterId);
    if (!ch) throw new Error("Chapter not found");
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) throw new Error("Please enter at least one link");
    if (lines.length > 100)
      throw new Error("Maximum 100 links can be pasted at once");

    const base = Date.now();
    const created: LinkItem[] = [];

    lines.forEach((line, i) => {
      const bar = line.lastIndexOf("|");
      let title = "";
      let rawUrl = line;
      if (bar >= 0) {
        title = line.slice(0, bar).trim();
        rawUrl = line.slice(bar + 1).trim();
      }
      const cleanUrl = normalizeUrl(rawUrl);
      if (!title) {
        title = new URL(cleanUrl).hostname.replace(/^www\./, "");
      }
      created.push({
        _id: generateId(`lnk-${i}`),
        chapterId,
        subjectId: ch.subjectId,
        title: title.slice(0, 150),
        url: cleanUrl,
        kind: detectKind(cleanUrl),
        order: base + i,
      });
    });

    setData((prev) => ({
      ...prev,
      links: [...prev.links, ...created],
    }));
    return created.length;
  };

  const handleUpdateLink = (
    id: string,
    title: string,
    rawUrl: string,
    note?: string
  ) => {
    const cleanUrl = normalizeUrl(rawUrl);
    const cleanT = cleanText(title, "Link title", 150);
    setData((prev) => ({
      ...prev,
      links: prev.links.map((l) =>
        l._id === id
          ? {
              ...l,
              title: cleanT,
              url: cleanUrl,
              kind: detectKind(cleanUrl),
              note: note?.trim() ? note.trim().slice(0, 300) : undefined,
            }
          : l
      ),
    }));
  };

  const handleDeleteLink = (id: string) => {
    setData((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l._id !== id),
    }));
  };

  const handleMoveLink = (id: string, direction: "up" | "down") => {
    const target = data.links.find((l) => l._id === id);
    if (!target) return;
    const siblings = data.links
      .filter((l) => l.chapterId === target.chapterId)
      .sort(byOrder);
    const idx = siblings.findIndex((l) => l._id === id);
    const otherIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || otherIdx < 0 || otherIdx >= siblings.length) return;

    const current = siblings[idx];
    const other = siblings[otherIdx];
    const newOrder1 = other.order;
    const newOrder2 = current.order;

    setData((prev) => ({
      ...prev,
      links: prev.links.map((l) => {
        if (l._id === current._id) return { ...l, order: newOrder1 };
        if (l._id === other._id) return { ...l, order: newOrder2 };
        return l;
      }),
    }));
  };

  // Export & Import backup JSON (Only accessible by Teacher)
  const exportData = () => {
    if (!isTeacher) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-links-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTeacher) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.subjects && parsed.chapters && parsed.links) {
          setData(parsed);
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup JSON format.");
        }
      } catch (err) {
        alert("Could not parse file.");
      }
    };
    reader.readAsText(file);
  };

  const resetToStarter = () => {
    if (!isTeacher) return;
    if (
      window.confirm(
        "Reset everything to standard default starter data? Any custom links will be replaced."
      )
    ) {
      setData(INITIAL_DATA);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                Class Links
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Teacher login / logout */}
            <button
              onClick={() => {
                if (isTeacher) {
                  setIsTeacher(false);
                  setEditMode(false);
                } else {
                  setShowLogin(true);
                }
              }}
              title={isTeacher ? "Log out of Teacher Mode" : "Teacher login"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isTeacher
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {isTeacher ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Teacher · Log out</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Teacher login</span>
                </>
              )}
            </button>

            {isTeacher && saveStatus && (
              <span className="hidden sm:inline text-xs text-slate-500">
                {saveStatus === "saving"
                  ? "Saving…"
                  : saveStatus === "saved"
                  ? "Saved ✓"
                  : "Not saved"}
              </span>
            )}

            {isTeacher && (
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition ${
                  editMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {editMode ? "Done Editing" : "Edit Links"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Welcome Hero */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              All Class Resources & Recordings
            </h1>
            <p className="mt-1 text-slate-500 text-sm">
              Instant access to live meeting rooms, recorded video lectures, formulas, and study files.
            </p>
          </div>

          {/* Quick Data Management (teacher only) */}
          {isTeacher && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={exportData}
                title="Export backup JSON"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <label
                title="Import backup JSON"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm font-medium cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              <button
                onClick={resetToStarter}
                title="Reset default subjects"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Global Instant Search */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Field
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lectures, chapters, Zoom links, formula sheets..."
            className="pl-11 pr-4 py-3 text-base rounded-2xl border-slate-200/90 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Results Display */}
        {term && (
          <div className="mb-8 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>
                Search results ({searchResults.length}{" "}
                {searchResults.length === 1 ? "match" : "matches"})
              </span>
              <span>“{search}”</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                No links found matching your query.
              </div>
            ) : (
              searchResults.map(({ link, subject, chapter }) => (
                <div
                  key={link._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <KindBadge kind={link.kind} />
                    <div className="min-w-0 flex-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-800 hover:text-indigo-600 truncate block hover:underline"
                      >
                        {link.title}
                      </a>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-semibold"
                          style={{ color: subject?.color }}
                        >
                          {subject?.name}
                        </span>
                        <span>•</span>
                        <span>{chapter?.title}</span>
                        {link.note && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{link.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-end sm:self-center px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-sm transition"
                  >
                    Open
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* Normal Browsing View */}
        {!term && (
          <>
            {/* Subject Pill Navigation Tabs */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {subjects.map((s) => {
                const isActive = activeSubject?._id === s._id;
                const linkCount = links.filter((l) => l.subjectId === s._id).length;
                return (
                  <button
                    key={s._id}
                    onClick={() => setSelectedSubjectId(s._id)}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 border shadow-sm"
                    style={
                      isActive
                        ? {
                            background: s.color,
                            borderColor: s.color,
                            color: "#ffffff",
                            boxShadow: `0 4px 14px ${s.color}35`,
                          }
                        : {
                            background: "#ffffff",
                            borderColor: "#e2e8f0",
                            color: "#334155",
                          }
                    }
                  >
                    <span>{s.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {linkCount}
                    </span>
                  </button>
                );
              })}

              {canEdit && (
                <button
                  onClick={() => setSubjectModal({ type: "add" })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold text-indigo-600 bg-white border border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              )}
            </div>

            {/* Empty State when no subjects exist */}
            {subjects.length === 0 && (
              <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No subjects yet</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  {isTeacher
                    ? "Get started by adding subjects or resetting back to the starter curriculum."
                    : "Your teacher hasn't added classes yet. Check back soon."}
                </p>
                <div className="mt-4 flex gap-3 justify-center">
                  {isTeacher && (
                    <button
                      onClick={resetToStarter}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow"
                    >
                      Load Default Subjects
                    </button>
                  )}
                  {isTeacher && (
                    <button
                      onClick={() => setSubjectModal({ type: "add" })}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      Create Custom Subject
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Active Subject Chapters View */}
            {activeSubject && (
              <div className="space-y-4">
                {/* Active Subject Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full inline-block shadow-sm"
                      style={{ backgroundColor: activeSubject.color }}
                    />
                    <h2
                      className="text-2xl font-black tracking-tight"
                      style={{ color: activeSubject.color }}
                    >
                      {activeSubject.name}
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">
                      ({activeChapters.length}{" "}
                      {activeChapters.length === 1 ? "Chapter" : "Chapters"})
                    </span>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <MoveButtons
                        onMove={(d) => handleMoveSubject(activeSubject._id, d)}
                        canUp={activeIndex > 0}
                        canDown={activeIndex < subjects.length - 1}
                      />
                      <button
                        onClick={() =>
                          setSubjectModal({
                            type: "edit",
                            subject: activeSubject,
                          })
                        }
                        className="p-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit subject name or color"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete subject "${activeSubject.name}" and all its chapters & links?`
                            )
                          ) {
                            handleDeleteSubject(activeSubject._id);
                          }
                        }}
                        className="p-1.5 text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Chapters List */}
                <div className="space-y-4">
                  {activeChapters.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white/70">
                      <p className="text-sm font-medium text-slate-500">
                        No chapters in {activeSubject.name} yet.
                      </p>
                      {canEdit && (
                        <p className="text-xs text-slate-400 mt-1">
                          Use the form below to create your first chapter.
                        </p>
                      )}
                    </div>
                  ) : (
                    activeChapters.map((chapter, idx) => (
                      <ChapterCard
                        key={chapter._id}
                        chapter={chapter}
                        links={links.filter((l) => l.chapterId === chapter._id)}
                        color={activeSubject.color}
                        edit={canEdit}
                        index={idx}
                        total={activeChapters.length}
                        onRename={handleRenameChapter}
                        onDelete={handleDeleteChapter}
                        onMove={handleMoveChapter}
                        onAddSingleLink={handleAddLink}
                        onAddManyLinks={handleAddManyLinks}
                        onUpdateLink={handleUpdateLink}
                        onDeleteLink={handleDeleteLink}
                        onMoveLink={handleMoveLink}
                      />
                    ))
                  )}
                </div>

                {/* Add Chapter Form */}
                {canEdit && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      try {
                        handleAddChapter(newChapterTitle);
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className="mt-6 flex gap-2 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm"
                  >
                    <Field
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder={`Add new chapter to ${activeSubject.name} (e.g. Chapter 4: Thermodynamics)`}
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shrink-0 shadow-sm transition"
                    >
                      + Add Chapter
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Teacher login modal */}
      {showLogin && (
        <TeacherLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(token) => {
            sessionStorage.setItem(TEACHER_SESSION_KEY, token);
            setIsTeacher(true);
            setShowLogin(false);
          }}
        />
      )}

      {/* Subject Create / Edit Modal */}
      {subjectModal && (
        <SubjectModal
          title={
            subjectModal.type === "add" ? "Create New Subject" : "Edit Subject"
          }
          initialName={
            subjectModal.type === "edit" ? subjectModal.subject.name : ""
          }
          initialColor={
            subjectModal.type === "edit"
              ? subjectModal.subject.color
              : COLORS[subjects.length % COLORS.length]
          }
          onSubmit={(name, color) => {
            if (subjectModal.type === "add") {
              handleAddSubject(name, color);
            } else {
              handleUpdateSubject(subjectModal.subject._id, name, color);
            }
          }}
          onClose={() => setSubjectModal(null)}
        />
      )}
    </div>
  );
}
