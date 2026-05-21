'use client';

import { useEffect, useState } from 'react';
import SubmissionsGallery from '@/components/admin/SubmissionsGallery';
import OrganizationFilter from '@/components/admin/OrganizationFilter';

export default function SubmissionsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('adminOrganizationId');
    if (stored && stored !== 'all') setOrganizationId(stored);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Envíos de usuarios</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Revisa, aprueba o rechaza las fotos y links subidos en las cards de retos.
          </p>
        </div>
        <OrganizationFilter
          value={organizationId}
          onChange={(id) => {
            setOrganizationId(id);
            localStorage.setItem('adminOrganizationId', id ?? 'all');
          }}
        />
      </div>
      <SubmissionsGallery organizationId={organizationId} />
    </div>
  );
}
