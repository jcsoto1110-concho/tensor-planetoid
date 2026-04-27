'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DocProvider, useDoc } from '@/context/DocContext';
import { ZPAuthProvider, useZPAuth } from '@/context/ZPAuthContext';
import { LayoutGrid, Upload, Users, ClipboardList, LogOut, CheckSquare, UserCircle } from 'lucide-react';

function NavLink({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
    return (
        <Link
            href={href}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: active ? '#fff' : '#94a3b8',
                backgroundColor: active ? '#667eea' : 'transparent',
                textDecoration: 'none',
                fontWeight: active ? '600' : '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
            }}
            className={active ? '' : 'hover:bg-slate-800 hover:text-white'}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {icon}
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '999px',
                    minWidth: '20px',
                    textAlign: 'center'
                }}>
                    {badge}
                </span>
            )}
        </Link>
    );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { getPendingDocuments } = useDoc();
    const { currentUser, logout, isAuthenticated } = useZPAuth();
    const pendingCount = getPendingDocuments().length;

    const isLoginPage = pathname === '/zero-paper/login';
    const isEmployeePage = pathname === '/zero-paper/employee-login' || pathname === '/zero-paper/employee-portal';

    // Protect routes
    useEffect(() => {
        if (!isAuthenticated && !isLoginPage && !isEmployeePage) {
            router.push('/zero-paper/login');
        }
    }, [isAuthenticated, isLoginPage, isEmployeePage, router]);

    // Redirect APPROVER to approvals page
    useEffect(() => {
        if (currentUser?.role === 'APPROVER' && pathname === '/zero-paper/admin') {
            router.push('/zero-paper/admin/approvals');
        }
    }, [currentUser, pathname, router]);

    // Show login page and employee pages without layout
    if (isLoginPage || isEmployeePage) {
        return <>{children}</>;
    }

    // Show loading while checking auth
    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = () => {
        logout();
        window.location.href = '/zero-paper';
    };

    // Determine which links to show based on role
    const isApprover = currentUser?.role === 'APPROVER';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>
            {/* Sidebar Navigation */}
            <aside style={{
                width: '260px',
                backgroundColor: '#1e293b',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #334155'
            }}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="Grupo Marathon Logo"
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'contain',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '4px'
                            }}
                        />
                        <div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 'bold', marginBottom: '2px' }}>Grupo Marathon</h2>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Gestión Documental</p>
                        </div>
                    </div>

                    {/* User Info */}
                    {currentUser && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#334155',
                            borderRadius: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <UserCircle size={16} color="#94a3b8" />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
                                    {currentUser.name}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '1.5rem' }}>
                                {currentUser.role === 'ADMIN' && '👑 Administrador'}
                                {currentUser.role === 'APPROVER' && '✅ Aprobador'}
                                {currentUser.role === 'UPLOADER' && '📤 Operador'}
                            </div>
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Show only relevant links based on role and requested order */}
                    {!isApprover ? (
                        <>
                            <NavLink href="/zero-paper/admin/employees" icon={<Users size={20} />} label="Empleados" active={pathname === '/zero-paper/admin/employees'} />
                            <NavLink href="/zero-paper/admin/upload" icon={<Upload size={20} />} label="Carga Masiva" active={pathname === '/zero-paper/admin/upload'} />
                            <NavLink
                                href="/zero-paper/admin/approvals"
                                icon={<CheckSquare size={20} />}
                                label="Aprobaciones"
                                active={pathname === '/zero-paper/admin/approvals'}
                                badge={pendingCount}
                            />
                        </>
                    ) : (
                        /* For APPROVER only show Approvals */
                        <NavLink
                            href="/zero-paper/admin/approvals"
                            icon={<CheckSquare size={20} />}
                            label="Aprobaciones"
                            active={pathname === '/zero-paper/admin/approvals'}
                            badge={pendingCount}
                        />
                    )}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155' }}>
                    <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: '#94a3b8',
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '0.875rem',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#374151';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                {children}
            </main>
        </div>
    );
}

export default function ZeroPaperLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ZPAuthProvider>
            <DocProvider>
                <LayoutContent>{children}</LayoutContent>
            </DocProvider>
        </ZPAuthProvider>
    );
}
