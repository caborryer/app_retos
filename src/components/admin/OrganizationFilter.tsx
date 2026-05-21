'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'adminOrganizationId';

export type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

interface OrganizationFilterProps {
  value: string | null;
  onChange: (organizationId: string | null) => void;
  className?: string;
}

export function useOrganizationFilter() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setOrganizationId(stored === 'all' ? null : stored);
  }, []);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/organizations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(
          (data as OrganizationOption[]).map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  function handleChange(id: string | null) {
    setOrganizationId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id ?? 'all');
    }
  }

  return {
    organizationId,
    setOrganizationId: handleChange,
    organizations,
    organizationsLoading: loading,
    refreshOrganizations: fetchOrganizations,
  };
}

export default function OrganizationFilter({
  value,
  onChange,
  className = '',
}: OrganizationFilterProps) {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);

  useEffect(() => {
    fetch('/api/admin/organizations', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrganizations(data));
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-slate-400 text-sm whitespace-nowrap">Empresa:</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 min-w-[180px]"
      >
        <option value="">Todas las empresas</option>
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function organizationQueryParam(organizationId: string | null): string {
  return organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
}
