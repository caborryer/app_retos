'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { ThemedBoard } from '@/lib/mockData';
import { ALL_CHALLENGES } from '@/lib/mockData';
import {
  Plus,
  Upload,
  Edit3,
  Check,
  X,
  Image as ImageIcon,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const EMOJI_OPTIONS = ['🏃', '💪', '🏊', '🧘', '🚴', '🧗', '🐾', '⚽', '🎯', '🔥', '⚡', '🌟'];
const COLOR_OPTIONS = [
  '#FF5327', '#FC0230', '#06B6D4', '#10B981', '#3B82F6',
  '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6',
];

function CoverImageUploader({
  currentImage,
  onUpload,
}: {
  currentImage?: string;
  onUpload: (dataUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onUpload(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed overflow-hidden transition-all cursor-pointer ${
        dragging ? 'border-primary-500 bg-primary-500/10' : 'border-slate-600 hover:border-slate-500'
      }`}
      style={{ aspectRatio: '16/7' }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      {currentImage ? (
        <>
          <img src={currentImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Upload className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">Cambiar imagen</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
          <ImageIcon className="w-8 h-8 text-slate-500" />
          <p className="text-slate-400 text-sm font-medium">Arrastra o haz clic para subir</p>
          <p className="text-slate-600 text-xs">JPG, PNG, WebP</p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

function BoardCard({ board }: { board: ThemedBoard }) {
  const updateBoard = useAppStore((s) => s.updateBoard);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const [editEmoji, setEditEmoji] = useState(board.emoji);
  const [editColor, setEditColor] = useState(board.color);
  const [editDescription, setEditDescription] = useState(board.description ?? '');

  function saveEdits() {
    updateBoard(board.id, {
      title: editTitle,
      emoji: editEmoji,
      color: editColor,
      description: editDescription,
    });
    setEditing(false);
  }

  function cancelEdits() {
    setEditTitle(board.title);
    setEditEmoji(board.emoji);
    setEditColor(board.color);
    setEditDescription(board.description ?? '');
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      {/* Cover image */}
      <CoverImageUploader
        currentImage={board.coverImage}
        onUpload={(url) => updateBoard(board.id, { coverImage: url })}
      />

      <div className="p-5 space-y-4">
        {editing ? (
          /* Edit form */
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Título del tablero"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Emoji</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEditEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      editEmoji === e ? 'bg-primary-500/20 ring-2 ring-primary-500' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-all ${
                      editColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Descripción del tablero (opcional)"
              rows={2}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdits}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar
              </button>
              <button
                onClick={cancelEdits}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: board.color + '25' }}
                >
                  {board.emoji}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{board.title}</p>
                  {board.description && (
                    <p className="text-slate-500 text-xs line-clamp-1">{board.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div
                className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: board.color + '40' }}
              >
                <div className="h-full rounded-full" style={{ backgroundColor: board.color, width: '100%' }} />
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {board.challenges.length} retos
              </span>
            </div>
          </div>
        )}

        {/* Retos list (collapsible) */}
        {!editing && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors w-full"
            >
              <Trophy className="w-3.5 h-3.5" />
              Ver retos incluidos
              {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {expanded && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                {board.challenges.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900/40">
                    <span className="text-sm">{c.icon}</span>
                    <p className="text-slate-300 text-xs line-clamp-1 flex-1">{c.title}</p>
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: board.color }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewBoardModal({ onClose }: { onClose: () => void }) {
  const addBoard = useAppStore((s) => s.addBoard);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState('#FF5327');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filteredChallenges = ALL_CHALLENGES.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggleChallenge(id: string) {
    setSelectedChallengeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreate() {
    if (!title.trim() || selectedChallengeIds.length === 0) return;
    const challenges = ALL_CHALLENGES.filter((c) => selectedChallengeIds.includes(c.id));
    addBoard({
      id: `board-${Date.now()}`,
      title: title.trim(),
      emoji,
      color,
      description,
      coverImage,
      challenges,
      active: true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-semibold">Nuevo tablero</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Cover */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Imagen de portada</p>
            <CoverImageUploader currentImage={coverImage} onUpload={setCoverImage} />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1.5">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Retos de Verano"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Emoji */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Emoji</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    emoji === e ? 'bg-primary-500/20 ring-2 ring-primary-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1.5">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe el tablero..."
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Challenges selector */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">
              Retos incluidos{' '}
              <span className="text-primary-400">({selectedChallengeIds.length} seleccionados)</span>
            </p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reto..."
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {filteredChallenges.map((c) => {
                const selected = selectedChallengeIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleChallenge(c.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-all ${
                      selected
                        ? 'bg-primary-500/15 border border-primary-500/30'
                        : 'bg-slate-900/40 border border-transparent hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-base shrink-0">{c.icon}</span>
                    <p className="text-sm text-white flex-1 line-clamp-1">{c.title}</p>
                    {selected && <Check className="w-3.5 h-3.5 text-primary-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 shrink-0">
          <button
            onClick={handleCreate}
            disabled={!title.trim() || selectedChallengeIds.length === 0}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear tablero
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BoardManager() {
  const boards = useAppStore((s) => s.boards);
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {boards.length} tablero{boards.length !== 1 ? 's' : ''} configurado{boards.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo tablero
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </div>

      {showNewModal && <NewBoardModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
