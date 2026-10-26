import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

// ========================================
// 1. AXIOS CONFIGURATION
// ========================================

const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
});

// ========================================
// 2. CREATE CONTEXT
// ========================================

const NotesContext = createContext(null);

// ========================================
// 3. NOTES CONTEXT PROVIDER
// ========================================

function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Display toast notifications
  function showToast(message, type = "success") {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  }

  // Automatically remove toast after 3 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // ========================================
  // FETCH NOTES
  // ========================================

  async function fetchNotes() {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/notes");

      setNotes(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load notes.";

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  // Fetch notes when the application starts
  useEffect(() => {
    fetchNotes();
  }, []);

  // ========================================
  // CREATE NOTE
  // ========================================

  async function createNote(note) {
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      const newNote = {
        id: Date.now().toString(),
        title: note.title.trim(),
        content: note.content.trim(),
        color: note.color || "white",
        tags: note.tags || [],
        archived: false,
        stock: note.stock ?? 1,
        createdAt: now,
        updatedAt: now,
      };

      const response = await api.post("/notes", newNote);

      setNotes((previousNotes) => [
        response.data,
        ...previousNotes,
      ]);

      showToast("Note created successfully!");

      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to create note.";

      setError(message);
      showToast(message, "error");

      return null;
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // UPDATE NOTE
  // ========================================

  async function updateNote(id, updates) {
    setLoading(true);
    setError(null);

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // PATCH updates only the supplied fields
      const response = await api.patch(
        `/notes/${id}`,
        updatedData
      );

      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          String(note.id) === String(id)
            ? response.data
            : note
        )
      );

      showToast("Note updated successfully!");

      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update note.";

      setError(message);
      showToast(message, "error");

      return null;
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // DELETE NOTE
  // ========================================

  async function deleteNote(id) {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/notes/${id}`);

      setNotes((previousNotes) =>
        previousNotes.filter(
          (note) => String(note.id) !== String(id)
        )
      );

      showToast("Note deleted successfully!");

      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete note.";

      setError(message);
      showToast(message, "error");

      return false;
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // TOGGLE ARCHIVE
  // ========================================

  async function toggleArchive(id) {
    const note = notes.find(
      (item) => String(item.id) === String(id)
    );

    if (!note) return null;

    const nextArchived = !note.archived;

    const updatedNote = await updateNote(id, {
      archived: nextArchived,
    });

    if (updatedNote) {
      showToast(
        nextArchived
          ? "Note archived successfully!"
          : "Note restored successfully!"
      );
    }

    return updatedNote;
  }

  // ========================================
  // SEARCH NOTES
  // ========================================

  function searchNotes(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return notes;
    }

    return notes.filter((note) => {
      const title = note.title || "";
      const content = note.content || "";
      const tags = note.tags || [];

      return (
        title.toLowerCase().includes(normalizedQuery) ||
        content.toLowerCase().includes(normalizedQuery) ||
        tags.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery)
        )
      );
    });
  }

  // Values and functions available to consumers
  const contextValue = {
    notes,
    loading,
    error,
    toast,
    createNote,
    updateNote,
    deleteNote,
    toggleArchive,
    searchNotes,
    fetchNotes,
  };

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
}

// ========================================
// 4. NOTES APP UI
// ========================================

function NotesDashboard() {
  const {
    notes,
    loading,
    error,
    toast,
    createNote,
    updateNote,
    deleteNote,
    toggleArchive,
    searchNotes,
    fetchNotes,
  } = useContext(NotesContext);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("white");
  const [tagsInput, setTagsInput] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const colors = {
    white: "bg-white",
    yellow: "bg-yellow-100",
    green: "bg-green-100",
    blue: "bg-blue-100",
    pink: "bg-pink-100",
    purple: "bg-purple-100",
  };

  // Filter notes based on search and archive status
  const visibleNotes = useMemo(() => {
    return searchNotes(search).filter(
      (note) => note.archived === showArchived
    );
  }, [notes, search, showArchived]);

  // ========================================
  // RESET FORM
  // ========================================

  function resetForm() {
    setTitle("");
    setContent("");
    setColor("white");
    setTagsInput("");
    setEditingId(null);
  }

  // ========================================
  // CREATE OR EDIT NOTE
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (!content.trim()) {
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      color,
      tags,
    };

    let result;

    if (editingId !== null) {
      result = await updateNote(editingId, noteData);
    } else {
      result = await createNote(noteData);
    }

    // Reset only when the operation succeeds
    if (result) {
      resetForm();
    }
  }

  // ========================================
  // LOAD NOTE INTO EDIT FORM
  // ========================================

  function handleEdit(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color || "white");
    setTagsInput((note.tags || []).join(", "));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ========================================
  // DELETE WITH CONFIRMATION
  // ========================================

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    const success = await deleteNote(id);

    if (success && String(editingId) === String(id)) {
      resetForm();
    }
  }

  // ========================================
  // RENDER UI
  // ========================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-50 max-w-sm rounded-xl px-5 py-3 text-white shadow-xl ${
            toast.type === "error"
              ? "bg-red-600"
              : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Notes App
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Organize your thoughts, one note at a time.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                !showArchived
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              My Notes
            </button>

            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                showArchived
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Create / Edit Form */}
        <section className="mx-auto mb-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingId !== null
                ? "Edit Note"
                : "Create a Note"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-slate-500 hover:text-red-600"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Note title"
              maxLength={100}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Write your thoughts..."
              rows={4}
              maxLength={5000}
              required
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-medium text-slate-600">
                  Color:
                </span>

                {Object.keys(colors).map((item) => (
                  <button
                    key={item}
                    type="button"
                    title={item}
                    aria-label={`Select ${item} color`}
                    aria-pressed={color === item}
                    onClick={() => setColor(item)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      colors[item]
                    } ${
                      color === item
                        ? "border-indigo-600 ring-2 ring-indigo-200"
                        : "border-slate-300"
                    }`}
                  />
                ))}
              </div>

              <input
                type="text"
                value={tagsInput}
                onChange={(event) =>
                  setTagsInput(event.target.value)
                }
                placeholder="Tags (comma-separated)"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {content.length}/5000 characters
              </span>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : editingId !== null
                  ? "Save Changes"
                  : "Add Note"}
              </button>
            </div>
          </form>
        </section>

        {/* Search */}
        <section className="mb-6">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, content, or tag..."
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </section>

        {/* Notes heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {showArchived ? "Archived Notes" : "Your Notes"}
          </h2>

          <span className="text-sm text-slate-500">
            {visibleNotes.length}{" "}
            {visibleNotes.length === 1 ? "note" : "notes"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-12 text-slate-600"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

            <span>Loading notes...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            <p className="font-semibold">
              Unable to complete the request.
            </p>

            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={fetchNotes}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleNotes.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mb-3 text-4xl">📝</div>

            <h3 className="text-lg font-semibold text-slate-800">
              {search
                ? "No matching notes"
                : showArchived
                ? "No archived notes"
                : "No notes yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : showArchived
                ? "Archived notes will appear here."
                : "Create your first note using the form above."}
            </p>
          </div>
        )}

        {/* Notes grid */}
        {!loading && !error && visibleNotes.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleNotes.map((note) => (
              <article
                key={note.id}
                className={`flex min-h-64 flex-col rounded-2xl border border-black/5 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                  colors[note.color] || "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="break-words text-lg font-bold text-slate-900">
                    {note.title}
                  </h3>

                  <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs capitalize text-slate-600">
                    {note.archived ? "Archived" : "Active"}
                  </span>
                </div>

                <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {note.content}
                </p>

                {/* Tags */}
                {note.tags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {note.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamps */}
                <div className="mt-4 border-t border-black/10 pt-3 text-xs text-slate-500">
                  <p>
                    Created:{" "}
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>

                  <p className="mt-1">
                    Updated:{" "}
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(note)}
                    disabled={loading}
                    className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleArchive(note.id)}
                    disabled={loading}
                    className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:opacity-50"
                  >
                    {note.archived ? "Restore" : "Archive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    disabled={loading}
                    className="rounded-lg bg-red-100/80 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          Notes App · React · Context API · Axios · JSON Server
        </footer>
      </main>
    </div>
  );
}

// ========================================
// 5. MAIN APP
// ========================================

export default function App() {
  return (
    <NotesProvider>
      <NotesDashboard />
    </NotesProvider>
  );
}