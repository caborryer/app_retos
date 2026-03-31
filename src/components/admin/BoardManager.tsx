'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Save, X, RefreshCw } from 'lucide-react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Board {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string | null;
  coverImage: string | null;
  active: boolean;
  _count?: { challenges: number };
}

// ─── Cover image uploader ─────────────────────────────────────────────────────

function CoverImageUploader({
  currentImage,
  onUpload,
}: {
  currentImage: string | null;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      onUpload(url);
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="relative border-2 border-dashed border-slate-600 rounded-xl overflow-hidden cursor-pointer hover:border-primary-500 transition-colors"
      style={{ minHeight: 120 }}
      onClick={() => document.getElementById('cover-upload')?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        id="cover-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {currentImage ? (
        <Image src={currentImage} alt="Cover" fill className="object-cover" unoptimized />
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
          <Upload className="w-6 h-6" />
          <span className="text-xs">Subir portada</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({ board, onSave }: { board: Board; onSave: (b: Partial<Board>) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Board>>({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft({ title: board.title, emoji: board.emoji, color: board.color, description: board.description ?? '', coverImage: board.coverImage, active: board.active });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  return (
    <motion.div
      layout
      className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700"
    >
      {/* Cover */}
      {editing ? (
        <div className="p-3">
          <CoverImageUploader
            currentImage={draft.coverImage ?? board.coverImage}
            onUpload={(url) => setDraft((d) => ({ ...d, coverImage: url }))}
          />
        </div>
      ) : board.coverImage ? (
        <div className="relative h-32">
          <Image src={board.coverImage} alt="" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          <span className="absolute bottom-2 left-3 text-2xl">{board.emoji}</span>
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center text-3xl" style={{ background: board.color + '33' }}>
          {board.emoji}
        </div>
      )}

      <div className="p-4 space-y-3">
        {editing ? (
          <>
            <div className="flex gap-2">
              <input
                value={draft.emoji ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                className="w-12 bg-slate-700 text-white rounded-lg px-2 py-1.5 text-center text-sm"
                placeholder="🏆"
              />
              <input
                value={draft.title ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm"
                placeholder="Título del tablero"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-xs">Color:</label>
              <input
                type="color"
                value={draft.color ?? board.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
            </div>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Descripción del tablero..."
              rows={2}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.active ?? false}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-slate-300 text-sm">Tablero activo</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-1.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-1.5 rounded-xl bg-primary-500 text-white text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="text-white font-semibold">{board.title}</h3>
              {board.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{board.description}</p>}
              <p className="text-slate-500 text-xs mt-1">{board._count?.challenges ?? 0} retos</p>
            </div>
            <div className="flex items-center justify-between">
              {board.active && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Activo</span>
              )}
              <button
                onClick={startEdit}
                className="ml-auto text-xs px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Editar
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── New board modal ──────────────────────────────────────────────────────────

function NewBoardModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: Board) => void }) {
  const [form, setForm] = useState({ title: '', emoji: '🏆', color: '#FC0230', description: '', active: false });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const board = await res.json();
      onCreate(board);
      onClose();
    } catch {
      alert('Error al crear el tablero');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Nuevo tablero</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2">
          <input
            value={form.emoji}
            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            className="w-12 bg-slate-700 text-white rounded-lg px-2 py-2 text-center"
            placeholder="🏆"
          />
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            placeholder="Nombre del tablero *"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm">Color:</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Descripción (opcional)..."
          rows={2}
          className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none"
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="rounded"
          />
          <span className="text-slate-300 text-sm">Marcar como activo</span>
        </label>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.title.trim()}
            className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear tablero
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BoardManager() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  async function handleSave(id: string, updates: Partial<Board>) {
    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
    } catch {
      alert('Error al guardar los cambios');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableros</h1>
          <p className="text-slate-400 text-sm mt-1">Gestiona los tableros de retos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBoards}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo tablero
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">📋</p>
          <p>No hay tableros aún. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onSave={(updates) => handleSave(board.id, updates)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewBoardModal
          onClose={() => setShowNew(false)}
          onCreate={(board) => setBoards((prev) => [...prev, board])}
        />
      )}
    </div>
  );
}
