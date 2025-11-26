'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useRouter } from 'next/navigation';
import { LATAM_CITIES } from '@/lib/latam-locations';

export default function CreateRequestPage() {
    const { user } = useAuth();
    const { addRequest } = useData();
    const router = useRouter();

    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [needsHotel, setNeedsHotel] = useState(false);

    // Hotel specific state
    const [hotelCheckIn, setHotelCheckIn] = useState('');
    const [hotelCheckOut, setHotelCheckOut] = useState('');
    const [hotelCity, setHotelCity] = useState('');

    // Auto-fill hotel dates when travel dates change, if not already set
    useEffect(() => {
        if (needsHotel) {
            if (!hotelCheckIn) setHotelCheckIn(startDate);
            if (!hotelCheckOut) setHotelCheckOut(endDate);
            if (!hotelCity) setHotelCity(destination);
        }
    }, [startDate, endDate, destination, needsHotel]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const newRequest: any = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: user.id,
            employeeName: user.name,
            destination,
            startDate,
            endDate,
            needsHotel,
            // Add hotel details if needed
            ...(needsHotel && {
                hotelCheckIn,
                hotelCheckOut,
                hotelCity
            }),
            status: 'pending_boss',
            createdAt: new Date().toISOString()
        };

        addRequest(newRequest);
        router.push('/employee');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="container" style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Crear Solicitud de Viaje</h1>

                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Destination with Autocomplete */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Destino</label>
                            <input
                                list="cities"
                                type="text"
                                className="input"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="Seleccione o escriba una ciudad..."
                                required
                            />
                            <datalist id="cities">
                                {LATAM_CITIES.map((city, index) => (
                                    <option key={index} value={city} />
                                ))}
                            </datalist>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Fecha Inicio Viaje</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Fecha Fin Viaje</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: needsHotel ? '1rem' : '0' }}>
                                <input
                                    type="checkbox"
                                    id="hotel"
                                    checked={needsHotel}
                                    onChange={(e) => setNeedsHotel(e.target.checked)}
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                />
                                <label htmlFor="hotel" style={{ cursor: 'pointer', fontWeight: '500' }}>Solicitar Reserva de Hotel</label>
                            </div>

                            {needsHotel && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Ciudad del Hotel</label>
                                        <input
                                            list="cities"
                                            type="text"
                                            className="input"
                                            value={hotelCity}
                                            onChange={(e) => setHotelCity(e.target.value)}
                                            placeholder="Igual al destino o diferente..."
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Check-in</label>
                                            <input
                                                type="date"
                                                className="input"
                                                value={hotelCheckIn}
                                                onChange={(e) => setHotelCheckIn(e.target.value)}
                                                required={needsHotel}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Check-out</label>
                                            <input
                                                type="date"
                                                className="input"
                                                value={hotelCheckOut}
                                                onChange={(e) => setHotelCheckOut(e.target.value)}
                                                required={needsHotel}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => router.back()}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                Enviar Solicitud
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
