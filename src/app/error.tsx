'use client';

/** Catches errors thrown by any page or server component inside the root layout. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: '#FAFAF9',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#FC0230',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
          }}
        >
          ⚠️
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1A', marginBottom: 8 }}>
          Algo salió mal
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B67', marginBottom: 24, lineHeight: 1.5 }}>
          Ocurrió un error inesperado.
          {error.digest ? ` (ref: ${error.digest})` : ''}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: '#FC0230',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
        <p style={{ marginTop: 12, fontSize: 13, color: '#6B6B67' }}>
          O vuelve al{' '}
          <a href="/login" style={{ color: '#FC0230', textDecoration: 'none', fontWeight: 600 }}>
            inicio de sesión
          </a>
        </p>
      </div>
    </div>
  );
}
