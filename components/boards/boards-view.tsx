'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Trash2, Edit3, ArrowRight, Briefcase,
  ChevronRight, LayoutGrid, Sparkles
} from 'lucide-react'

interface Board {
  id: string
  name: string
  emoji: string | null
  description: string | null
  isDefault: boolean
  jobCount: number
  columnCount: number
  createdAt: string
}

interface BoardsViewProps {
  boards: Board[]
  userId: string
}

const BOARD_EMOJIS = ['🚀', '💼', '🎯', '⭐', '🔥', '💡', '🏆', '📋', '🎨', '🌟']

export function BoardsView({ boards: initialBoards, userId }: BoardsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [boards, setBoards] = useState(initialBoards)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', emoji: '🚀', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const newBoard = await res.json()
        setBoards(prev => [...prev, newBoard])
        setShowCreateModal(false)
        setFormData({ name: '', emoji: '🚀', description: '' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingBoard || !formData.name.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/boards/${editingBoard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const updated = await res.json()
        setBoards(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b))
        setEditingBoard(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (boardId: string) => {
    if (boards.length === 1) {
      alert('Vous ne pouvez pas supprimer votre dernier tableau.')
      return
    }
    setDeletingId(boardId)
    try {
      await fetch(`/api/boards/${boardId}`, { method: 'DELETE' })
      setBoards(prev => prev.filter(b => b.id !== boardId))
    } finally {
      setDeletingId(null)
    }
  }

  const openCreate = () => {
    setFormData({ name: '', emoji: '🚀', description: '' })
    setShowCreateModal(true)
  }

  const openEdit = (board: Board) => {
    setFormData({ name: board.name, emoji: board.emoji ?? '📋', description: board.description ?? '' })
    setEditingBoard(board)
  }

  return (
    <main className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid size={18} className="text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Tableau de bord</span>
            </div>
            <h1 className="font-display font-bold text-3xl tracking-tight">Mes Tableaux Kanban</h1>
            <p className="text-text-muted text-sm mt-1">
              {boards.length} tableau{boards.length > 1 ? 'x' : ''} — Gérez vos recherches d'emploi
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0"
          >
            <Plus size={16} />
            Nouveau tableau
          </button>
        </div>

        {/* Grid de tableaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={() => openEdit(board)}
              onDelete={() => handleDelete(board.id)}
              isDeleting={deletingId === board.id}
            />
          ))}

          {/* Carte "Créer un tableau" */}
          <button
            onClick={openCreate}
            className="group relative bg-card-bg border-2 border-dashed border-border-color hover:border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-text-muted hover:text-primary transition-all duration-300 min-h-[180px] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 border border-primary/10 group-hover:border-primary/20 flex items-center justify-center transition-all duration-300">
              <Plus size={22} className="text-primary/50 group-hover:text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Nouveau tableau</p>
              <p className="text-xs text-text-muted/60 mt-1">Démarrer une nouvelle recherche</p>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Créer / Éditer */}
      {(showCreateModal || editingBoard) && (
        <BoardModal
          mode={editingBoard ? 'edit' : 'create'}
          formData={formData}
          onChange={setFormData}
          onSubmit={editingBoard ? handleUpdate : handleCreate}
          onClose={() => { setShowCreateModal(false); setEditingBoard(null) }}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  )
}

// ─── Carte de tableau ───────────────────────────────────────────────────────

function BoardCard({ 
  board, onEdit, onDelete, isDeleting 
}: { 
  board: Board
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean 
}) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className="group relative bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/dashboard/${board.id}`)}
    >
      {/* Actions */}
      <div
        className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-foreground/5 transition-all"
          title="Modifier"
        >
          <Edit3 size={13} />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
          title="Supprimer"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Emoji */}
      <div className="text-3xl mb-4">{board.emoji ?? '📋'}</div>

      {/* Infos */}
      <h3 className="font-display font-bold text-lg mb-1 leading-tight pr-16 group-hover:text-primary transition-colors duration-200">
        {board.name}
      </h3>
      {board.description && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2">{board.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Briefcase size={12} />
          <span>{board.jobCount} offre{board.jobCount > 1 ? 's' : ''}</span>
        </div>
        <span className="text-border-color">·</span>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <LayoutGrid size={12} />
          <span>{board.columnCount} colonne{board.columnCount > 1 ? 's' : ''}</span>
        </div>
        {board.isDefault && (
          <>
            <span className="text-border-color">·</span>
            <div className="flex items-center gap-1 text-xs text-primary">
              <Sparkles size={10} />
              <span>Défaut</span>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary/0 group-hover:text-primary transition-all duration-200">
        <span>Ouvrir le tableau</span>
        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  )
}

// ─── Modal Formulaire ───────────────────────────────────────────────────────

function BoardModal({ 
  mode, formData, onChange, onSubmit, onClose, isSubmitting 
}: {
  mode: 'create' | 'edit'
  formData: { name: string; emoji: string; description: string }
  onChange: (data: { name: string; emoji: string; description: string }) => void
  onSubmit: () => void
  onClose: () => void
  isSubmitting: boolean
}) {
  const EMOJIS = ['🚀', '💼', '🎯', '⭐', '🔥', '💡', '🏆', '📋', '🎨', '🌟', '🎪', '🏗️', '💻', '🔭', '🌈']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card-bg border border-border-color rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display font-bold text-xl mb-5">
          {mode === 'create' ? '✨ Nouveau tableau' : '✏️ Modifier le tableau'}
        </h2>

        {/* Sélecteur emoji */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ ...formData, emoji })}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all border ${
                  formData.emoji === emoji
                    ? 'border-primary bg-primary/10 scale-110'
                    : 'border-border-color bg-foreground/3 hover:border-primary/30'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
            Nom du tableau <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            placeholder="Ex: Recherche développeur senior..."
            className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
            Description <span className="text-text-muted/50">(optionnel)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            placeholder="Décrivez l'objectif de ce tableau..."
            rows={2}
            className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border-color text-sm font-medium text-text-muted hover:bg-foreground/5 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/25"
          >
            {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
