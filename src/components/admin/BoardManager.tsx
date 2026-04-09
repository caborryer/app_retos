'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Upload, Save, X, RefreshCw, ChevronDown, ChevronUp,
  Trash2, Edit2, GripVertical, Camera, Link as LinkIcon, ImageIcon,
} from 'lucide-react';
import Image from 'next/image';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHALLENGES = 8;

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Actividad física',
    emojis: ['🏃', '🚴', '🏊', '🧘', '🏋️', '⚽', '🎾', '🏔️', '🤸', '⛹️', '🏄', '🏇', '🥊', '🤼', '🎽', '🏌️', '🧗'],
  },
  {
    label: 'Naturaleza y aventura',
    emojis: ['🌿', '🌊', '🦁', '🌄', '🏕️', '🌲', '🦋', '🐾', '🌸', '🍃', '⛰️', '🌋', '🏞️', '🦅', '🐢'],
  },
  {
    label: 'Comida y salud',
    emojis: ['🥗', '🍎', '💊', '🥦', '🧃', '🥑', '🫐', '🍇', '🥕', '🧄', '🍳', '🥤', '🫖', '🍵', '🥙'],
  },
  {
    label: 'Arte y cultura',
    emojis: ['🎨', '🎵', '📚', '🎭', '✏️', '🎬', '🎤', '🖌️', '📷', '🎹', '🎸', '🎺', '🎻', '💃', '🕺'],
  },
  {
    label: 'Bienestar y mente',
    emojis: ['🧠', '💆', '😴', '❤️', '🌟', '🕊️', '✨', '🙏', '💭', '🌈', '🫶', '😊', '💪', '🌙', '☀️'],
  },
  {
    label: 'Trabajo y productividad',
    emojis: ['💼', '📊', '💡', '🎯', '🏆', '📝', '🔍', '💻', '📱', '🗓️', '⏱️', '🔑', '📌', '🚀', '🎓'],
  },
  {
    label: 'Misceláneos',
    emojis: ['🎉', '🔥', '⭐', '🙌', '🦄', '🎲', '🧩', '🪄', '🎁', '🌍', '🛸', '🤖', '💎', '🧲', '🎯'],
  },
];

const CATEGORIES = [
  'RUNNING', 'CYCLING', 'GYM', 'SWIMMING', 'YOGA',
  'TEAM_SPORTS', 'OUTDOOR', 'MIXED', 'PETS',
];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const CATEGORY_LABELS: Record<string, string> = {
  RUNNING: 'Correr', CYCLING: 'Ciclismo', GYM: 'Gimnasio', SWIMMING: 'Natación',
  YOGA: 'Yoga', TEAM_SPORTS: 'Deportes de equipo', OUTDOOR: 'Aire libre',
  MIXED: 'Mixto', PETS: 'Mascotas',
};
const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado', EXPERT: 'Experto',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskDraft {
  id?: string;
  title: string;
  description: string;
  photoRequired: boolean;
  linkRequired: boolean;
}

interface ChallengeSummary {
  id: string;
  title: string;
  icon: string;
  category: string;
  difficulty: string;
  points: number;
  tasks: TaskDraft[];
  images: string[];
  description: string;
  duration: number;
  color: string;
}

interface Board {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string | null;
  coverImage: string | null;
  active: boolean;
  folder: string | null;
  startDate: string | null;
  endDate: string | null;
  _count?: { challenges: number };
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-10 bg-slate-700 rounded-lg text-xl flex items-center justify-center hover:bg-slate-600 transition-colors border border-slate-600"
        title="Seleccionar emoji"
      >
        {value || '🏆'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-12 z-50 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-72"
          >
            {/* Category tabs */}
            <div className="flex overflow-x-auto gap-1 p-2 border-b border-slate-700 scrollbar-hide">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCat(i)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-xs transition-colors ${
                    activeCat === i
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
              {EMOJI_CATEGORIES[activeCat].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onChange(emoji); setOpen(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-slate-600 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Manual input */}
            <div className="p-2 border-t border-slate-700">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Escribir emoji manualmente..."
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 placeholder-slate-500"
                maxLength={4}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────

function ImageUploader({
  label,
  currentImage,
  hint,
  onUpload,
}: {
  label: string;
  currentImage: string | null;
  hint?: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen supera el tamaño máximo de 5 MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      alert('Formato no válido. Usa JPG, PNG, WebP o GIF.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      onUpload(url);
    } catch {
      alert('Error al subir la imagen. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className="relative border-2 border-dashed border-slate-600 rounded-xl overflow-hidden cursor-pointer hover:border-primary-500 transition-colors"
        style={{ minHeight: 100 }}
        onClick={() => document.getElementById(`upload-${label}`)?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <input
          id={`upload-${label}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {currentImage ? (
          <div className="relative h-24">
            <Image src={currentImage} alt="Cover" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">Cambiar imagen</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-slate-500 gap-2">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Subir {label.toLowerCase()}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-slate-500 text-[10px] mt-1">
        {hint ?? 'Recomendado: 800×400px · JPG o PNG · máx 5 MB'}
      </p>
    </div>
  );
}

// ─── Task editor (within ChallengeFormModal) ──────────────────────────────────

function TaskEditor({
  tasks,
  onChange,
}: {
  tasks: TaskDraft[];
  onChange: (tasks: TaskDraft[]) => void;
}) {
  function addTask() {
    onChange([...tasks, { title: '', description: '', photoRequired: false, linkRequired: false }]);
  }

  function updateTask(i: number, patch: Partial<TaskDraft>) {
    onChange(tasks.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function removeTask(i: number) {
    onChange(tasks.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 text-sm font-medium">Tareas / Evidencia</span>
        <button
          type="button"
          onClick={addTask}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-600 text-slate-200 hover:bg-slate-500 transition-colors"
        >
          <Plus className="w-3 h-3" /> Agregar tarea
        </button>
      </div>

      {tasks.length === 0 && (
        <p className="text-slate-500 text-xs italic">Sin tareas — el reto se completa sin evidencia.</p>
      )}

      {tasks.map((task, i) => (
        <div key={i} className="bg-slate-700 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              value={task.title}
              onChange={(e) => updateTask(i, { title: e.target.value })}
              placeholder="Título de la tarea *"
              className="flex-1 bg-slate-600 text-white text-xs rounded-lg px-2 py-1.5 placeholder-slate-400"
            />
            <button type="button" onClick={() => removeTask(i)} className="text-slate-400 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            value={task.description}
            onChange={(e) => updateTask(i, { description: e.target.value })}
            placeholder="Descripción (opcional)"
            className="w-full bg-slate-600 text-white text-xs rounded-lg px-2 py-1.5 placeholder-slate-400"
          />
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div
                onClick={() => updateTask(i, { photoRequired: !task.photoRequired })}
                className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${task.photoRequired ? 'bg-primary-500' : 'bg-slate-500'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${task.photoRequired ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <Camera className="w-3 h-3 text-slate-400" />
              <span className="text-slate-300 text-xs">Foto</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div
                onClick={() => updateTask(i, { linkRequired: !task.linkRequired })}
                className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${task.linkRequired ? 'bg-blue-500' : 'bg-slate-500'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${task.linkRequired ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <LinkIcon className="w-3 h-3 text-slate-400" />
              <span className="text-slate-300 text-xs">Link</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Challenge form modal ─────────────────────────────────────────────────────

interface ChallengeFormModalProps {
  boardId: string;
  challenge?: ChallengeSummary;
  onClose: () => void;
  onSaved: (c: ChallengeSummary) => void;
}

function ChallengeFormModal({ boardId, challenge, onClose, onSaved }: ChallengeFormModalProps) {
  const isEditing = !!challenge;
  const [form, setForm] = useState({
    title: challenge?.title ?? '',
    description: challenge?.description ?? '',
    category: challenge?.category ?? 'MIXED',
    difficulty: challenge?.difficulty ?? 'BEGINNER',
    points: challenge?.points ?? 10,
    duration: challenge?.duration ?? 7,
    icon: challenge?.icon ?? '🏆',
    color: challenge?.color ?? '#FC0230',
    images: challenge?.images ?? [] as string[],
  });
  const [tasks, setTasks] = useState<TaskDraft[]>(challenge?.tasks ?? []);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('El título es obligatorio.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tasks, boardId };
      const url = isEditing ? `/api/admin/challenges/${challenge!.id}` : '/api/admin/challenges';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch {
      alert('Error al guardar el reto. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg my-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">{isEditing ? 'Editar reto' : 'Nuevo reto'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Icon + title */}
          <div className="flex gap-2">
            <input
              value={form.icon}
              onChange={(e) => set('icon', e.target.value)}
              placeholder="🏆"
              maxLength={4}
              title="Icono del reto (emoji)"
              className="w-12 bg-slate-700 text-white rounded-lg px-2 py-2 text-center text-xl placeholder-slate-500"
            />
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Título del reto *"
              className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-400"
            />
          </div>

          {/* Description */}
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descripción del reto..."
            rows={2}
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none placeholder-slate-400"
          />

          {/* Category + difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Dificultad</label>
              <select
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d] ?? d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Points + duration + color */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Puntos</label>
              <input
                type="number"
                min={0}
                value={form.points}
                onChange={(e) => set('points', Number(e.target.value))}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Duración (días)</label>
              <input
                type="number"
                min={1}
                value={form.duration}
                onChange={(e) => set('duration', Number(e.target.value))}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className="w-full h-9 rounded-lg cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Imagen del reto</label>
            <ImageUploader
              label="imagen del reto"
              currentImage={form.images[0] ?? null}
              hint="Recomendado: 600×600px · JPG o PNG · máx 5 MB"
              onUpload={(url) => set('images', [url])}
            />
          </div>

          {/* Tasks */}
          <TaskEditor tasks={tasks} onChange={setTasks} />
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            {isEditing ? 'Guardar cambios' : 'Crear reto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Challenge editor panel ───────────────────────────────────────────────────

function ChallengeEditorPanel({ board }: { board: Board }) {
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeSummary | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/challenges?boardId=${board.id}`, { credentials: 'include' });
      const data = await res.json();
      setChallenges(data);
    } catch {
      console.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este reto? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE', credentials: 'include' });
      setChallenges((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Error al eliminar el reto.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(saved: ChallengeSummary) {
    setChallenges((prev) => {
      const exists = prev.find((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
    });
  }

  const slots = Array.from({ length: MAX_CHALLENGES }, (_, i) => challenges[i] ?? null);
  const count = challenges.length;

  return (
    <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-850">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 text-sm font-medium">
          Retos ({count}/{MAX_CHALLENGES})
        </span>
        {count < MAX_CHALLENGES && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir reto
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((challenge, i) =>
            challenge ? (
              <div
                key={challenge.id}
                className="relative bg-slate-700 rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center group"
              >
                {/* Challenge image or icon */}
                {challenge.images[0] ? (
                  <img
                    src={challenge.images[0]}
                    alt={challenge.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{challenge.icon}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <p className="absolute bottom-1 left-0 right-0 text-center text-white text-[9px] font-semibold px-1 line-clamp-2 leading-tight">
                  {challenge.title}
                </p>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setEditingChallenge(challenge)}
                    className="p-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(challenge.id)}
                    disabled={deletingId === challenge.id}
                    className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-500 transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                key={`empty-${i}`}
                onClick={() => setShowNew(true)}
                disabled={count >= MAX_CHALLENGES}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:border-primary-500 hover:text-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[9px] mt-1">Reto {i + 1}</span>
              </button>
            ),
          )}
        </div>
      )}

      {(showNew || editingChallenge) && (
        <ChallengeFormModal
          boardId={board.id}
          challenge={editingChallenge ?? undefined}
          onClose={() => { setShowNew(false); setEditingChallenge(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({ board, onSave, onDelete }: { board: Board; onSave: (b: Partial<Board>) => Promise<void>; onDelete: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [draft, setDraft] = useState<Partial<Board>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function startEdit() {
    setDraft({
      title: board.title,
      emoji: board.emoji,
      color: board.color,
      description: board.description ?? '',
      coverImage: board.coverImage,
      active: board.active,
      folder: board.folder ?? '',
      startDate: board.startDate ? board.startDate.split('T')[0] : '',
      endDate: board.endDate ? board.endDate.split('T')[0] : '',
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el tablero "${board.title}"? Se eliminarán todos sus retos.`)) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  const challengeCount = board._count?.challenges ?? 0;

  return (
    <motion.div layout className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
      {/* Cover / header */}
      {editing ? (
        <div className="p-3">
          <ImageUploader
            label="portada del tablero"
            currentImage={draft.coverImage ?? board.coverImage}
            hint="Recomendado: 800×400px · JPG o PNG · máx 5 MB"
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
            {/* Emoji + title */}
            <div className="flex gap-2">
              <EmojiPicker
                value={draft.emoji ?? board.emoji}
                onChange={(e) => setDraft((d) => ({ ...d, emoji: e }))}
              />
              <input
                value={draft.title ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-400"
                placeholder="Título del tablero"
              />
            </div>

            {/* Color */}
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-xs">Color:</label>
              <input
                type="color"
                value={draft.color ?? board.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
            </div>

            {/* Description */}
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Descripción del tablero..."
              rows={2}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none placeholder-slate-400"
            />

            {/* Folder */}
            <input
              value={draft.folder ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, folder: e.target.value }))}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-400"
              placeholder="Carpeta / categoría (ej. Fitness 2026)"
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Fecha inicio</label>
                <input
                  type="date"
                  value={draft.startDate ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  className="w-full bg-slate-700 text-white text-xs rounded-lg px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block mb-0.5">Fecha fin</label>
                <input
                  type="date"
                  value={draft.endDate ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                  className="w-full bg-slate-700 text-white text-xs rounded-lg px-2 py-1.5"
                />
              </div>
            </div>

            {/* Active */}
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
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="text-white font-semibold">{board.title}</h3>
              {board.description && (
                <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{board.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {board.folder && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">
                    📁 {board.folder}
                  </span>
                )}
                {board.startDate && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">
                    {new Date(board.startDate).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    {board.endDate && ` → ${new Date(board.endDate).toLocaleDateString('es', { day: '2-digit', month: 'short' })}`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {board.active ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  Activo
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-500">
                  Inactivo
                </span>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                  title="Eliminar tablero"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={startEdit}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
              </div>
            </div>

            {/* Toggle challenge panel */}
            <button
              onClick={() => setShowChallenges((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <span className="text-slate-300 text-xs font-medium">
                Retos ({challengeCount}/{MAX_CHALLENGES})
              </span>
              {showChallenges
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </>
        )}
      </div>

      {/* Challenge editor panel */}
      <AnimatePresence>
        {showChallenges && !editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <ChallengeEditorPanel board={board} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── New board modal ──────────────────────────────────────────────────────────

function NewBoardModal({ onClose, onCreate, existingFolders }: {
  onClose: () => void;
  onCreate: (b: Board) => void;
  existingFolders: string[];
}) {
  const [form, setForm] = useState({
    title: '',
    emoji: '🏆',
    color: '#FC0230',
    description: '',
    active: false,
    folder: '',
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [showFolderSuggestions, setShowFolderSuggestions] = useState(false);

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          folder: form.folder || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
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

  const filteredFolders = existingFolders.filter(
    (f) => f.toLowerCase().includes(form.folder.toLowerCase()) && f !== form.folder,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Nuevo tablero</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji + title */}
        <div className="flex gap-2">
          <EmojiPicker value={form.emoji} onChange={(e) => set('emoji', e)} />
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-400"
            placeholder="Nombre del tablero *"
          />
        </div>

        {/* Color */}
        <div className="flex items-center gap-3">
          <label className="text-slate-400 text-sm">Color:</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => set('color', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <span className="text-slate-400 text-xs">{form.color}</span>
        </div>

        {/* Description */}
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Descripción (opcional)..."
          rows={2}
          className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none placeholder-slate-400"
        />

        {/* Folder with suggestions */}
        <div className="relative">
          <label className="text-slate-400 text-xs mb-1 block">Carpeta / categoría</label>
          <input
            value={form.folder}
            onChange={(e) => { set('folder', e.target.value); setShowFolderSuggestions(true); }}
            onFocus={() => setShowFolderSuggestions(true)}
            onBlur={() => setTimeout(() => setShowFolderSuggestions(false), 150)}
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-400"
            placeholder="ej. Fitness 2026 (opcional)"
          />
          {showFolderSuggestions && filteredFolders.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-xl border border-slate-600 shadow-lg z-10">
              {filteredFolders.map((f) => (
                <button
                  key={f}
                  type="button"
                  onMouseDown={() => set('folder', f)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  📁 {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Fecha inicio</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Fecha fin</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Active */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="rounded"
          />
          <span className="text-slate-300 text-sm">Marcar como activo</span>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.title.trim()}
            className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Plus className="w-4 h-4" />}
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
      const res = await fetch('/api/boards', { credentials: 'include' });
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
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
    } catch {
      alert('Error al guardar los cambios');
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/boards/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert('Error al eliminar el tablero');
    }
  }

  // Group boards by folder
  const folders = Array.from(new Set(boards.map((b) => b.folder ?? ''))).sort();
  const existingFolders = folders.filter(Boolean);
  const grouped = folders.map((folder) => ({
    folder,
    boards: boards.filter((b) => (b.folder ?? '') === folder),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableros</h1>
          <p className="text-slate-400 text-sm mt-1">Gestiona los tableros y sus retos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBoards}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors border border-slate-700"
            title="Recargar"
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

      {/* Content */}
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
        <div className="space-y-8">
          {grouped.map(({ folder, boards: groupBoards }) => (
            <div key={folder || '__none__'}>
              {/* Folder heading */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-sm font-medium">
                  {folder ? `📁 ${folder}` : '📋 Sin carpeta'}
                </span>
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-600 text-xs">{groupBoards.length} tablero{groupBoards.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onSave={(updates) => handleSave(board.id, updates)}
                    onDelete={() => handleDelete(board.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewBoardModal
          onClose={() => setShowNew(false)}
          onCreate={(board) => setBoards((prev) => [...prev, board])}
          existingFolders={existingFolders}
        />
      )}
    </div>
  );
}
