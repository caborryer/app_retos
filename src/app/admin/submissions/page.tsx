import SubmissionsGallery from '@/components/admin/SubmissionsGallery';

export default function SubmissionsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Envíos de usuarios</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Revisa, aprueba o rechaza las fotos y links subidos en las cards de retos.
        </p>
      </div>
      <SubmissionsGallery />
    </div>
  );
}
