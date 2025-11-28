'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Zero Paper
    router.push('/zero-paper');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Redirigiendo a Zero Paper...</h1>
        <div style={{ fontSize: '1rem', opacity: 0.7 }}>
          Si no eres redirigido automáticamente,{' '}
          <a href="/zero-paper" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            haz clic aquí
          </a>
        </div>
      </div>
    </div>
  );
}
