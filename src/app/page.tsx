import Link from "next/link";

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Sistema de Reservas y Viajes</h1>
      <p style={{ color: 'var(--muted)' }}>Portal de Gestión de Viajes Corporativos</p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" className="btn btn-primary">
          Ingresar al Portal
        </Link>
      </div>
    </main>
  );
}
