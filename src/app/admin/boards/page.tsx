import Link from 'next/link';
import { Suspense } from 'react';
import BoardManager from '@/components/admin/BoardManager';
import { AdminBoardsListSkeleton } from '@/components/admin/AdminSkeleton';

export default function BoardsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestión de tableros</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Selecciona una empresa y crea tableros: quedan asignados a esa empresa. También puedes ir a{' '}
          <Link href="/admin/organizations" className="text-primary-400 hover:text-primary-300">
            Empresas → Gestionar
          </Link>{' '}
          para ver los tableros de cada una.
        </p>
      </div>
      <Suspense
        fallback={<AdminBoardsListSkeleton />}
      >
        <BoardManager />
      </Suspense>
    </div>
  );
}
