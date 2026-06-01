'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Upload, Save, X, RefreshCw, ChevronDown, ChevronUp,
  Trash2, Edit2, GripVertical, Camera, Link as LinkIcon, ImageIcon, RotateCcw, Filter, Building2, LayoutGrid,
} from 'lucide-react';
import Image from 'next/image';
import {
  canActivateBoard,
  getBoardActivationBlockReasons,
  type ChallengeLikeForActivation,
} from '@/lib/board-activation-rules';
import { BOARD_PRIZE_MAX_LENGTH } from '@/lib/board-prize';
import {
  AdminBoardsListSkeleton,
  AdminChallengeSlotsSkeleton,
} from '@/components/admin/AdminSkeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHALLENGES = 8;
const ADMIN_CHALLENGE_IMAGE_MAX_MB = 8;
const ADMIN_BOARD_COVER_MAX_MB = 10;

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

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
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
  difficulty: string;
  points: number;
  tasks: TaskDraft[];
  images: string[];
  description: string;
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
  prize?: string | null;
  organizationId?: string;
  isGeneral?: boolean;
  organization?: { id: string; name: string; slug: string };
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
  maxMb = ADMIN_CHALLENGE_IMAGE_MAX_MB,
  onUpload,
}: {
  label: string;
  currentImage: string | null;
  hint?: string;
  maxMb?: number;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`La imagen supera el tamaño maximo de ${maxMb} MB.`);
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
        {hint ?? `Recomendado: 800×400px · JPG o PNG · max ${maxMb} MB`}
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
    difficulty: challenge?.difficulty ?? 'BEGINNER',
    points: challenge?.points ?? 10,
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
      const payload = {
        ...form,
        color: isEditing ? challenge!.color : form.color,
        tasks,
        boardId,
      };
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

          {/* Difficulty */}
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

          {/* Points (+ color only when creating) */}
          {isEditing ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-3">
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
                <label className="text-slate-400 text-xs mb-1 block">Color</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  className="w-full h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Cover image */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Imagen del reto</label>
            <ImageUploader
              label="imagen del reto"
              currentImage={form.images[0] ?? null}
              maxMb={ADMIN_CHALLENGE_IMAGE_MAX_MB}
              hint={`Recomendado: 600×600px · JPG o PNG · max ${ADMIN_CHALLENGE_IMAGE_MAX_MB} MB`}
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
        <AdminChallengeSlotsSkeleton />
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

function BoardCard({
  board,
  onSave,
  onDelete,
  existingFolders,
  organizations,
  showOrganization,
}: {
  board: Board;
  onSave: (b: Partial<Board>) => Promise<void>;
  onDelete: () => Promise<void>;
  existingFolders: string[];
  organizations: { id: string; name: string }[];
  showOrganization: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [draft, setDraft] = useState<Partial<Board>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [addingNewFolder, setAddingNewFolder] = useState(false);
  const [activationChallenges, setActivationChallenges] = useState<ChallengeLikeForActivation[]>([]);
  const [activationLoading, setActivationLoading] = useState(false);

  useEffect(() => {
    if (!editing) {
      setActivationChallenges([]);
      return;
    }
    let cancelled = false;
    setActivationLoading(true);
    fetch(`/api/admin/challenges?boardId=${board.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        setActivationChallenges(Array.isArray(data) ? (data as ChallengeLikeForActivation[]) : []);
      })
      .catch(() => {
        if (!cancelled) setActivationChallenges([]);
      })
      .finally(() => {
        if (!cancelled) setActivationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editing, board.id]);

  const activationBlockReasons = getBoardActivationBlockReasons(activationChallenges);
  const canEnableActive = canActivateBoard(activationChallenges);

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
      prize: board.prize ?? '',
      isGeneral: board.isGeneral ?? false,
      organizationId: board.organizationId ?? board.organization?.id,
    });
    setAddingNewFolder(false);
    setEditing(true);
  }

  async function handleSave() {
    if (draft.active) {
      if (activationLoading) {
        alert('Espera a que termine de cargar la lista de retos e inténtalo de nuevo.');
        return;
      }
      const reasons = getBoardActivationBlockReasons(activationChallenges);
      if (reasons.length > 0) {
        alert(`No se puede guardar como activo:\n\n${reasons.slice(0, 15).join('\n')}`);
        return;
      }
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (board.active) return;
    const n = board._count?.challenges ?? 0;
    if (
      !confirm(
        `¿Eliminar el tablero «${board.title}»? Se borrarán ${n} reto${n !== 1 ? 's' : ''}, envíos de usuarios, imágenes y rankings. No se puede deshacer.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Error al eliminar el tablero';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleReset() {
    if (!confirm(`¿Reiniciar todo el progreso del tablero "${board.title}"? Se borrarán los envíos y el avance de todos los usuarios. Esta acción no se puede deshacer.`)) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/boards/${board.id}/reset`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Reset failed');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch {
      alert('No se pudo reiniciar el tablero');
    } finally {
      setResetting(false);
    }
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
            maxMb={ADMIN_BOARD_COVER_MAX_MB}
            hint={`Recomendado: 800×400px · JPG o PNG · max ${ADMIN_BOARD_COVER_MAX_MB} MB`}
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

            {/* Organization */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs block">Empresa</label>
              <select
                value={draft.organizationId ?? board.organizationId ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, organizationId: e.target.value }))}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Solo los usuarios de esta empresa verán el tablero (salvo que marques &quot;Tablero general&quot;).
              </p>
            </div>

            {/* Folder */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs block">Categoría / carpeta</label>
              <select
                value={addingNewFolder ? '__new__' : (draft.folder ?? '')}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setAddingNewFolder(true);
                    setDraft((d) => ({ ...d, folder: '' }));
                    return;
                  }
                  setAddingNewFolder(false);
                  setDraft((d) => ({ ...d, folder: e.target.value }));
                }}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="">Sin categoria</option>
                {existingFolders.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
                <option value="__new__">+ Agregar nueva categoría</option>
              </select>
              {addingNewFolder && (
                <input
                  value={draft.folder ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, folder: e.target.value }))}
                  className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-400 border border-slate-600"
                  placeholder="Escribe nueva categoría"
                />
              )}
            </div>

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

            <div>
              <label className="text-slate-400 text-[10px] block mb-0.5">
                Premio o incentivo (opcional)
              </label>
              <textarea
                value={typeof draft.prize === 'string' ? draft.prize : ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    prize: e.target.value.slice(0, BOARD_PRIZE_MAX_LENGTH),
                  }))
                }
                maxLength={BOARD_PRIZE_MAX_LENGTH}
                rows={2}
                placeholder="Ej: Cena para dos en restaurante partner..."
                className="w-full bg-slate-700 text-white text-xs rounded-lg px-2 py-1.5 resize-none placeholder-slate-500"
              />
              <p className="text-slate-500 text-[10px] mt-0.5 text-right">
                {(typeof draft.prize === 'string' ? draft.prize : '').length}/{BOARD_PRIZE_MAX_LENGTH}
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isGeneral ?? false}
                onChange={(e) => setDraft((d) => ({ ...d, isGeneral: e.target.checked }))}
                className="rounded"
              />
              <span className="text-slate-300 text-sm">Tablero general (todos los usuarios)</span>
            </label>

            {/* Active — only when all 8 challenges are fully configured */}
            <div className="space-y-2 rounded-xl border border-slate-600 bg-slate-800/80 p-3">
              <label
                className={`flex items-center gap-2 ${activationLoading || (!canEnableActive && !(draft.active ?? false)) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={draft.active ?? false}
                  disabled={activationLoading}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (!next) {
                      setDraft((d) => ({ ...d, active: false }));
                      return;
                    }
                    if (activationLoading) return;
                    if (!canEnableActive) return;
                    setDraft((d) => ({ ...d, active: true }));
                  }}
                  className="rounded disabled:opacity-50"
                />
                <span className="text-slate-300 text-sm font-medium">Tablero activo</span>
              </label>
              {activationLoading && (
                <p className="text-slate-500 text-xs">Comprobando retos…</p>
              )}
              {!activationLoading && !(draft.active ?? false) && !canEnableActive && (
                <div className="text-xs text-amber-200/90 space-y-1.5">
                  <p className="font-medium text-amber-100">
                    No puedes activarlo todavía por:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
                    {activationBlockReasons.slice(0, 12).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {activationBlockReasons.length > 12 && (
                    <p className="text-amber-200/70">…y más. Corrige los retos y vuelve a abrir edición.</p>
                  )}
                </div>
              )}
              {!activationLoading && canEnableActive && !(draft.active ?? false) && (
                <p className="text-xs text-emerald-400/90">
                  Los 8 retos están listos; puedes marcar el tablero como activo.
                </p>
              )}
            </div>

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
              {board.prize?.trim() && (
                <p className="text-amber-200/90 text-xs mt-1.5 line-clamp-3">
                  🎁 {board.prize.trim()}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {showOrganization && board.organization && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">
                    🏢 {board.organization.name}
                  </span>
                )}
                {board.isGeneral && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    General
                  </span>
                )}
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
                  onClick={handleReset}
                  disabled={resetting || deleting}
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 transition-colors disabled:opacity-50"
                  title="Reiniciar progreso de usuarios"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || board.active}
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700 disabled:hover:text-slate-400"
                  title={
                    board.active
                      ? 'Desactiva el tablero para poder eliminarlo'
                      : 'Eliminar tablero'
                  }
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

            {/* Reset success feedback */}
            {resetSuccess && (
              <p className="text-xs text-green-400 bg-green-500/10 rounded-lg px-2 py-1.5 border border-green-500/20">
                Progreso reiniciado correctamente
              </p>
            )}

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

function NewBoardModal({ onClose, onCreate, existingFolders, organizationId, organizationName }: {
  onClose: () => void;
  onCreate: (b: Board) => void;
  existingFolders: string[];
  organizationId: string;
  organizationName: string;
}) {
  const [form, setForm] = useState({
    title: '',
    emoji: '🏆',
    color: '#FC0230',
    description: '',
    folder: '',
    startDate: '',
    endDate: '',
    prize: '',
    isGeneral: false,
  });
  const [saving, setSaving] = useState(false);
  const [addingNewFolder, setAddingNewFolder] = useState(false);

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
          title: form.title,
          emoji: form.emoji,
          color: form.color,
          description: form.description || null,
          active: false,
          folder: form.folder || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          prize: form.prize.trim() || null,
          organizationId,
          isGeneral: form.isGeneral,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Nuevo tablero</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3">
          <p className="text-primary-300 text-xs font-semibold uppercase tracking-wide">Asignado a empresa</p>
          <p className="text-white font-medium mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary-400 shrink-0" />
            {organizationName}
          </p>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Solo usuarios de esta empresa verán el tablero en Home, salvo que marques &quot;Tablero general&quot;.
          </p>
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

        {/* Folder dropdown */}
        <div className="space-y-2">
          <label className="text-slate-400 text-xs mb-1 block">Categoría / carpeta</label>
          <select
            value={addingNewFolder ? '__new__' : form.folder}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setAddingNewFolder(true);
                set('folder', '');
                return;
              }
              setAddingNewFolder(false);
              set('folder', e.target.value);
            }}
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="">Sin categoria</option>
            {existingFolders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
            <option value="__new__">+ Agregar nueva categoría</option>
          </select>
          {addingNewFolder && (
            <input
              value={form.folder}
              onChange={(e) => set('folder', e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-400 border border-slate-600"
              placeholder="Escribe nueva categoría"
            />
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

        <div>
          <label className="text-slate-400 text-xs mb-1 block">Premio o incentivo (opcional)</label>
          <textarea
            value={form.prize}
            onChange={(e) => set('prize', e.target.value.slice(0, BOARD_PRIZE_MAX_LENGTH))}
            maxLength={BOARD_PRIZE_MAX_LENGTH}
            rows={3}
            placeholder="Texto del premio por completar el tablero (máx. 150 caracteres)"
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none placeholder-slate-400"
          />
          <p className="text-slate-500 text-xs mt-1 text-right">
            {form.prize.length}/{BOARD_PRIZE_MAX_LENGTH}
          </p>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isGeneral}
            onChange={(e) => set('isGeneral', e.target.checked)}
            className="rounded mt-0.5"
          />
          <span className="text-slate-400 text-xs leading-relaxed">
            <strong className="text-slate-300">Tablero general</strong> — visible para todos los usuarios
            registrados, además de los de esta empresa.
          </span>
        </label>

        <p className="text-slate-500 text-xs leading-relaxed">
          El tablero se crea <strong className="text-slate-400">inactivo</strong>. Cuando tenga los 8 retos
          configurados, podrás activarlo al editar el tablero.
        </p>

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
  const searchParams = useSearchParams();
  const urlOrganizationId = searchParams.get('organizationId')?.trim() || null;
  const openNewFromUrl = searchParams.get('new') === '1';

  const [boards, setBoards] = useState<Board[]>([]);
  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/organizations', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { id: string; name: string }[]) => {
        setOrganizations(data);
        if (urlOrganizationId && data.some((o) => o.id === urlOrganizationId)) {
          setOrganizationId(urlOrganizationId);
          return;
        }
        const stored = localStorage.getItem('adminOrganizationId');
        if (stored && stored !== 'all' && data.some((o) => o.id === stored)) {
          setOrganizationId(stored);
          return;
        }
        const general = data.find((o) => o.name === 'General') ?? data[0];
        if (general) setOrganizationId(general.id);
      });
  }, [urlOrganizationId]);

  useEffect(() => {
    if (organizationId) {
      localStorage.setItem('adminOrganizationId', organizationId);
    }
  }, [organizationId]);

  useEffect(() => {
    if (openNewFromUrl && organizationId) {
      setShowNew(true);
    }
  }, [openNewFromUrl, organizationId]);

  const selectedOrganizationName =
    organizations.find((o) => o.id === organizationId)?.name ?? null;

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const [filteredRes, allRes] = await Promise.all([
        fetch(
          organizationId
            ? `/api/boards?organizationId=${encodeURIComponent(organizationId)}`
            : '/api/boards',
          { credentials: 'include' }
        ),
        fetch('/api/boards', { credentials: 'include' }),
      ]);
      if (filteredRes.ok) setBoards(await filteredRes.json());
      if (allRes.ok) setAllBoards(await allRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    setSelectedBoardIds(new Set());
  }, [organizationId]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  async function handleSave(id: string, updates: Partial<Board>) {
    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reasons = Array.isArray(body.reasons) ? body.reasons as string[] : [];
        const msg =
          reasons.length > 0
            ? `${body.error ?? 'No se pudo guardar.'}\n\n${reasons.slice(0, 15).join('\n')}`
            : (typeof body.error === 'string' ? body.error : 'Error al guardar los cambios');
        alert(msg);
        return;
      }
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...body } : b)));
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Error al guardar los cambios';
      alert(message);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/boards/${id}`, { method: 'DELETE', credentials: 'include' });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      warnings?: string[];
    };
    if (!res.ok) {
      throw new Error(
        typeof body.error === 'string' ? body.error : 'Error al eliminar el tablero'
      );
    }
    setBoards((prev) => prev.filter((b) => b.id !== id));
    setAllBoards((prev) => prev.filter((b) => b.id !== id));
    if (body.warnings?.length) {
      alert(body.warnings.join('\n'));
    }
  }

  const assignableBoards = useMemo(
    () =>
      organizationId
        ? allBoards
            .filter((b) => b.organizationId !== organizationId)
            .sort((a, b) => {
              const aGeneral = a.organization?.slug === 'general' ? 0 : 1;
              const bGeneral = b.organization?.slug === 'general' ? 0 : 1;
              if (aGeneral !== bGeneral) return aGeneral - bGeneral;
              return a.title.localeCompare(b.title, 'es');
            })
        : [],
    [allBoards, organizationId]
  );

  function toggleBoardSelection(boardId: string) {
    setSelectedBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }

  async function handleAssignExisting() {
    if (!organizationId || selectedBoardIds.size === 0) return;
    const count = selectedBoardIds.size;
    if (
      !confirm(
        `¿Asignar ${count} tablero${count !== 1 ? 's' : ''} a "${selectedOrganizationName}"?`
      )
    ) {
      return;
    }
    setAssigning(true);
    try {
      const results = await Promise.all(
        [...selectedBoardIds].map((boardId) =>
          fetch(`/api/boards/${boardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ organizationId }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) alert(`${failed} tablero(s) no se pudieron asignar.`);
      setSelectedBoardIds(new Set());
      setActiveFilter('all');
      await fetchBoards();
    } finally {
      setAssigning(false);
    }
  }

  // Group boards by folder (active first when showing all)
  const filteredBoards = useMemo(() => {
    if (activeFilter === 'active') return boards.filter((b) => b.active);
    if (activeFilter === 'inactive') return boards.filter((b) => !b.active);
    return [...boards].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.title.localeCompare(b.title, 'es');
    });
  }, [boards, activeFilter]);

  const activeCount = boards.filter((b) => b.active).length;
  const inactiveCount = boards.filter((b) => !b.active).length;

  const STATUS_FILTERS: { key: typeof activeFilter; label: string }[] = [
    { key: 'active', label: `Activos (${activeCount})` },
    { key: 'inactive', label: `Inactivos (${inactiveCount})` },
    { key: 'all', label: `Todos (${boards.length})` },
  ];

  const folders = Array.from(new Set(filteredBoards.map((b) => b.folder ?? ''))).sort();
  const existingFolders = Array.from(new Set(boards.map((b) => b.folder ?? ''))).filter(Boolean).sort();
  const grouped = folders.map((folder) => ({
    folder,
    boards: filteredBoards.filter((b) => (b.folder ?? '') === folder),
  }));

  return (
    <div className="space-y-6">
      {/* Assignment banner */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          organizationId
            ? 'border-primary-500/30 bg-primary-500/10'
            : 'border-amber-500/30 bg-amber-500/10'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-white font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400 shrink-0" />
              Asignar tableros a una empresa
            </p>
            {organizationId && selectedOrganizationName ? (
              <>
                <p className="text-slate-300 text-sm">
                  Empresa seleccionada:{' '}
                  <span className="text-white font-medium">{selectedOrganizationName}</span>
                </p>
                <ol className="text-slate-400 text-sm list-decimal pl-5 space-y-1">
                  <li>
                    <strong className="text-slate-300">Nuevo:</strong> pulsa Nuevo tablero.
                  </li>
                  <li>
                    <strong className="text-slate-300">Existente:</strong> elige tableros de otras empresas
                    (p. ej. General) en la lista de abajo.
                  </li>
                  <li>Configura 8 retos y actívalo para que los usuarios invitados lo vean.</li>
                </ol>
              </>
            ) : (
              <p className="text-amber-100/90 text-sm">
                Elige una empresa en el selector de abajo. Sin empresa seleccionada no puedes crear tableros asignados.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0 min-w-[220px]">
            <label htmlFor="board-org-select" className="text-slate-400 text-xs font-medium">
              Empresa
            </label>
            <select
              id="board-org-select"
              value={organizationId ?? ''}
              onChange={(e) => setOrganizationId(e.target.value || null)}
              className="bg-slate-800 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5"
            >
              <option value="">Ver todas las empresas</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assign existing boards — only when a company is selected */}
      {organizationId && selectedOrganizationName && !loading && (
        <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 sm:p-5 space-y-3">
          <p className="text-white text-sm font-semibold">Asignar tablero existente a {selectedOrganizationName}</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Los tableros creados antes de empresas están en &quot;General&quot;. Selecciónalos aquí para moverlos a
            esta empresa sin recrearlos.
          </p>
          {assignableBoards.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {allBoards.length === 0
                ? 'No hay tableros en la plataforma. Crea uno en General o con Nuevo tablero.'
                : 'No hay tableros en otras empresas. Selecciona "General" arriba para ver los tableros legacy y comprobar que existen.'}
            </p>
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {assignableBoards.map((board) => (
                  <label
                    key={board.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoardIds.has(board.id)}
                      onChange={() => toggleBoardSelection(board.id)}
                      className="rounded shrink-0"
                    />
                    <span className="text-lg shrink-0">{board.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{board.title}</p>
                      <p className="text-slate-500 text-xs">
                        {board._count?.challenges ?? 0} retos ·{' '}
                        {board.active ? 'Activo' : 'Inactivo'}
                        {board.isGeneral ? ' · Tablero general' : ''}
                      </p>
                    </div>
                    <span className="text-slate-400 text-xs shrink-0 hidden sm:inline">
                      {board.organization?.name ?? 'Otra empresa'}
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedBoardIds.size === 0 || assigning}
                onClick={handleAssignExisting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                {assigning ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
                Asignar seleccionados ({selectedBoardIds.size})
              </button>
            </>
          )}
        </section>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={fetchBoards}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors border border-slate-700"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
          <button
            onClick={() => {
              if (!organizationId) {
                alert('Selecciona una empresa arriba para asignar un tablero.');
                return;
              }
              setShowNew(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo tablero
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeFilter === key
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <AdminBoardsListSkeleton />
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-12 text-slate-500 space-y-2">
          <p className="text-4xl mb-3">📋</p>
          <p>
            {organizationId
              ? `Esta empresa aún no tiene tableros${activeFilter === 'active' ? ' activos' : activeFilter === 'inactive' ? ' inactivos' : ''}.`
              : activeFilter === 'active'
              ? 'No hay tableros activos.'
              : activeFilter === 'inactive'
              ? 'No hay tableros inactivos.'
              : 'No hay tableros aún. Crea el primero.'}
          </p>
          {organizationId && assignableBoards.length > 0 && (
            <p className="text-slate-400 text-sm">
              Usa la sección &quot;Asignar tablero existente&quot; de arriba para mover tableros de General u otra
              empresa.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ folder, boards: groupBoards }) => (
            <div key={folder || '__none__'}>
              {/* Folder heading */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-sm font-medium">
                  {folder ? `📁 ${folder}` : '📋 Sin categoria'}
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
                    existingFolders={existingFolders}
                    organizations={organizations}
                    showOrganization={!organizationId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && organizationId && selectedOrganizationName && (
        <NewBoardModal
          onClose={() => setShowNew(false)}
          onCreate={(board) => setBoards((prev) => [...prev, board])}
          existingFolders={existingFolders}
          organizationId={organizationId}
          organizationName={selectedOrganizationName}
        />
      )}
    </div>
  );
}
