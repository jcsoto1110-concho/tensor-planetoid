'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { User, Edit, Save, X, Shield, Plus, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
    const { users, updateUser, createUser } = useAuth();
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state for Edit
    const [editForm, setEditForm] = useState<{
        bossId: string;
        costCenter: string;
        role: string;
    }>({ bossId: '', costCenter: '', role: '' });

    // Form state for Create
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        bossId: '',
        costCenter: ''
    });

    const handleEditClick = (user: any) => {
        setEditingUser(user.id);
        setEditForm({
            bossId: user.bossId || '',
            costCenter: user.costCenter || '',
            role: user.role
        });
    };

    const handleSave = (userId: string) => {
        const originalUser = users.find(u => u.id === userId);
        if (!originalUser) return;

        updateUser({
            ...originalUser,
            bossId: editForm.bossId || undefined,
            costCenter: editForm.costCenter || undefined,
            role: editForm.role as any
        });
        setEditingUser(null);
    };

    const handleCreate = () => {
        if (!createForm.name || !createForm.email || !createForm.password) {
            return alert('Por favor complete los campos obligatorios');
        }

        const newUser = {
            id: 'u' + Date.now(),
            name: createForm.name,
            email: createForm.email,
            password: createForm.password,
            role: createForm.role as any,
            bossId: createForm.bossId || undefined,
            costCenter: createForm.costCenter || undefined
        };

        createUser(newUser);
        setIsCreating(false);
        setCreateForm({ name: '', email: '', password: '', role: 'employee', bossId: '', costCenter: '' });
        alert('Usuario creado exitosamente');
    };

    const potentialBosses = users.filter(u => u.role === 'boss' || u.role === 'admin');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius)', color: 'white' }}>
                            <Shield size={24} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Administración de Usuarios</h1>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                        <Plus size={18} style={{ marginRight: '0.5rem' }} />
                        Nuevo Usuario
                    </button>
                </div>

                {/* Create User Modal */}
                {isCreating && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <UserPlus size={20} /> Crear Nuevo Usuario
                                </h2>
                                <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Nombre Completo</label>
                                    <input className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Ej. Ana Garcia" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Email</label>
                                    <input className="input" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="ana@empresa.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Contraseña</label>
                                    <input className="input" type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="******" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Rol</label>
                                    <select className="input" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                                        <option value="employee">Empleado</option>
                                        <option value="boss">Jefe</option>
                                        <option value="agency">Agencia</option>
                                        <option value="finance">Finanzas</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                {createForm.role === 'employee' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Jefe Asignado</label>
                                            <select className="input" value={createForm.bossId} onChange={e => setCreateForm({ ...createForm, bossId: e.target.value })}>
                                                <option value="">-- Seleccionar Jefe --</option>
                                                {potentialBosses.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Centro de Costos</label>
                                            <input className="input" value={createForm.costCenter} onChange={e => setCreateForm({ ...createForm, costCenter: e.target.value })} placeholder="Ej. IT-001" />
                                        </div>
                                    </>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button onClick={() => setIsCreating(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
                                    <button onClick={handleCreate} className="btn btn-primary" style={{ flex: 1 }}>Crear Usuario</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: 'var(--muted)' }}>Usuario</th>
                                <th style={{ padding: '1rem', color: 'var(--muted)' }}>Rol</th>
                                <th style={{ padding: '1rem', color: 'var(--muted)' }}>Centro de Costos</th>
                                <th style={{ padding: '1rem', color: 'var(--muted)' }}>Jefe Asignado</th>
                                <th style={{ padding: '1rem', color: 'var(--muted)', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</div>
                                    </td>

                                    {editingUser === u.id ? (
                                        /* Edit Mode */
                                        <>
                                            <td style={{ padding: '1rem' }}>
                                                <select
                                                    className="input"
                                                    value={editForm.role}
                                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                                    style={{ padding: '0.25rem' }}
                                                >
                                                    <option value="employee">Empleado</option>
                                                    <option value="boss">Jefe</option>
                                                    <option value="agency">Agencia</option>
                                                    <option value="finance">Finanzas</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <input
                                                    className="input"
                                                    value={editForm.costCenter}
                                                    onChange={e => setEditForm({ ...editForm, costCenter: e.target.value })}
                                                    placeholder="Ej. IT-001"
                                                    style={{ padding: '0.25rem' }}
                                                />
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <select
                                                    className="input"
                                                    value={editForm.bossId}
                                                    onChange={e => setEditForm({ ...editForm, bossId: e.target.value })}
                                                    style={{ padding: '0.25rem' }}
                                                >
                                                    <option value="">-- Sin Jefe --</option>
                                                    {potentialBosses.filter(b => b.id !== u.id).map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleSave(u.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }}>
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingUser(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        /* View Mode */
                                        <>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ textTransform: 'capitalize', padding: '0.25rem 0.5rem', backgroundColor: 'var(--surface-hover)', borderRadius: '4px' }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {u.costCenter || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>--</span>}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {users.find(b => b.id === u.bossId)?.name || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>--</span>}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button onClick={() => handleEditClick(u)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
