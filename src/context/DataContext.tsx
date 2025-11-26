'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TravelRequest, MOCK_REQUESTS } from '@/lib/mock-data';

interface DataContextType {
    requests: TravelRequest[];
    addRequest: (req: TravelRequest) => void;
    updateRequest: (id: string, updates: Partial<TravelRequest>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [requests, setRequests] = useState<TravelRequest[]>([]);

    useEffect(() => {
        // Load from local storage or mock
        const stored = localStorage.getItem('travel_app_requests');
        if (stored) {
            setRequests(JSON.parse(stored));
        } else {
            setRequests(MOCK_REQUESTS);
        }
    }, []);

    useEffect(() => {
        if (requests.length > 0) {
            localStorage.setItem('travel_app_requests', JSON.stringify(requests));
        }
    }, [requests]);

    const addRequest = (req: TravelRequest) => {
        setRequests(prev => [req, ...prev]);
    };

    const updateRequest = (id: string, updates: Partial<TravelRequest>) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    return (
        <DataContext.Provider value={{ requests, addRequest, updateRequest }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
