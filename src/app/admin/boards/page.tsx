import BoardManager from '@/components/admin/BoardManager';

export default function BoardsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestión de tableros</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Edita los tableros de retos existentes, sube imágenes de portada y crea nuevos tableros temáticos.
        </p>
      </div>
      <BoardManager />
    </div>
  );
}
