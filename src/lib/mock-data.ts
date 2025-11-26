export type Role = 'employee' | 'boss' | 'agency' | 'finance' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    password?: string;
    bossId?: string;
    costCenter?: string;
}

export interface TravelRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    destination: string;
    startDate: string;
    endDate: string;
    needsHotel: boolean;
    hotelCheckIn?: string;
    hotelCheckOut?: string;
    hotelCity?: string;
    status: 'pending_boss' | 'rejected_boss' | 'pending_agency' | 'pending_finance' | 'pending_finance_review' | 'approved' | 'rejected_boss';

    // Agency fields
    quotationUrl?: string; // Mock URL to PDF
    agencyComments?: string;

    // Finance fields
    invoiceNumber?: string;
    invoiceAmount?: number;
    invoiceProvider?: string;

    createdAt: string;
}

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Juan Perez', email: 'juan@company.com', role: 'employee', password: '123', bossId: 'u2', costCenter: 'IT-001' },
    { id: 'u2', name: 'Maria Boss', email: 'maria@company.com', role: 'boss', password: '123', costCenter: 'MGMT-001' },
    { id: 'u3', name: 'Travel Agency', email: 'agency@travel.com', role: 'agency', password: '123' },
    { id: 'u4', name: 'Finance Dept', email: 'finance@company.com', role: 'finance', password: '123' },
    { id: 'u5', name: 'Admin User', email: 'admin@company.com', role: 'admin', password: '123' },
];

export const MOCK_REQUESTS: TravelRequest[] = [
    {
        id: 'r1',
        employeeId: 'u1',
        employeeName: 'Juan Perez',
        destination: 'Madrid, Spain',
        startDate: '2023-12-01',
        endDate: '2023-12-05',
        needsHotel: true,
        status: 'pending_boss',
        createdAt: '2023-11-20T10:00:00Z'
    }
];
