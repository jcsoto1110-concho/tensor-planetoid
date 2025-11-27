// Tipos para países y protección de datos
export type Country = 'ecuador' | 'peru' | 'chile';

export interface CompanyConfig {
    country: Country;
    companyName: string;
    ruc: string;
    dpoEmail: string;
    privacyEmail: string;
}

export interface ConsentRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeCedula: string;
    country: Country;
    consentDate: string;
    expiryDate: string;
    consentText: string;
    signatureData?: string;
    ipAddress?: string;
    status: 'active' | 'revoked' | 'expired';
}

export interface ARCORequest {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeCedula: string;
    requestType: 'access' | 'rectify' | 'delete' | 'oppose' | 'export';
    country: Country;
    requestDate: string;
    details: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    responseDate?: string;
    responseText?: string;
}
