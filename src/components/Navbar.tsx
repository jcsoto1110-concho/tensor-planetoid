'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, Briefcase } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const isActive = (path: string) => pathname === path;

    return (
        <nav style={{
            height: 'var(--header-height)',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Logo & Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <div style={{
                            width: '32px', height: '32px',
                            backgroundColor: 'var(--primary)',
                            borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Briefcase size={18} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--primary)', letterSpacing: '-0.025em' }}>
                            CorpTravel
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {user.role === 'employee' && (
                            <>
                                <NavLink href="/employee" active={isActive('/employee')}>Mis Solicitudes</NavLink>
                                <NavLink href="/employee/create" active={isActive('/employee/create')}>Nueva Solicitud</NavLink>
                            </>
                        )}
                        {user.role === 'boss' && (
                            <NavLink href="/boss" active={isActive('/boss')}>Aprobaciones</NavLink>
                        )}
                        {user.role === 'agency' && (
                            <NavLink href="/agency" active={isActive('/agency')}>Portal Agencia</NavLink>
                        )}
                        {user.role === 'finance' && (
                            <NavLink href="/finance" active={isActive('/finance')}>Portal Finanzas</NavLink>
                        )}
                        {user.role === 'admin' && (
                            <NavLink href="/admin" active={isActive('/admin')}>Administración</NavLink>
                        )}
                    </div>
                </div>

                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                            <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--primary)' }}>{user.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{user.role}</p>
                        </div>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--muted)'
                        }}>
                            <UserIcon size={18} />
                        </div>
                    </div>

                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }}></div>

                    <button
                        onClick={logout}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem', border: 'none', color: 'var(--muted)' }}
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
    return (
        <Link
            href={href}
            style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: active ? 'var(--primary)' : 'var(--muted)',
                backgroundColor: active ? 'var(--surface-hover)' : 'transparent',
                borderRadius: 'var(--radius)',
                transition: 'all 0.2s'
            }}
            className="hover:bg-slate-50"
        >
            {children}
        </Link>
    );
}
