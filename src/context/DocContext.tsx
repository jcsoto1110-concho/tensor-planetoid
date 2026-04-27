'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { encryptFile } from '@/lib/encryption';

export interface DocEmployee {
    id: string; // Cédula
    codigo_sap?: string;
    name: string;
    apellido: string;
    position: string;
    entryDate: string;
    region?: string;
    ciudad?: string;
    departamento?: string;
    responsable?: string;
    pais?: string;
    estado?: string;
    documents: DocFile[];
}

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocFile {
    id: string;
    fileName: string;
    type: 'pdf' | 'image';
    url: string;
    uploadDate: string;
    status: DocumentStatus;
    uploadedBy: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    comments?: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'ADD_DOCUMENT' | 'RESET' | 'MASS_DELETE' | 'DOCUMENT_APPROVE' | 'DOCUMENT_REJECT';
    entity: 'EMPLOYEE' | 'DOCUMENT' | 'SYSTEM';
    entityId?: string;
    details: string;
}

interface DocContextType {
    employees: DocEmployee[];
    auditLogs: AuditLog[];
    loading: boolean;
    addEmployee: (emp: DocEmployee) => Promise<void>;
    addDocumentToEmployee: (employeeId: string, doc: DocFile | { file: File; fileName: string; type: string; id: string; uploadDate: string }) => Promise<void>;
    findEmployeeById: (id: string) => DocEmployee | undefined;
    massImportEmployees: (data: any[]) => Promise<void>;
    massDeleteEmployees: (data: any[]) => Promise<void>;
    loadDemoData: () => void;
    clearAllData: () => void;
    getPendingDocuments: () => Array<{ employee: DocEmployee; document: DocFile }>;
    approvePendingDocument: (employeeId: string, docId: string, approvedBy: string, comments?: string) => Promise<void>;
    rejectPendingDocument: (employeeId: string, docId: string, rejectedBy: string, comments?: string) => Promise<void>;
    syncEmployees: () => Promise<{ success: boolean; count?: number; error?: string }>;
}

const DocContext = createContext<DocContextType>({} as DocContextType);

export function DocProvider({ children }: { children: React.ReactNode }) {
    const [employees, setEmployees] = useState<DocEmployee[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Load data from Oracle
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch employees
            let dbEmployees = null;
            try {
                const empRes = await fetch('/api/employees', { cache: 'no-store' });
                const empData = await empRes.json();
                if (empData.success && empData.data) dbEmployees = empData.data;
                else console.error('Error fetching employees:', empData.error);
            } catch (e) {
                console.error('Failed to fetch employees:', e);
            }

            // Fetch documents
            let dbDocuments = null;
            try {
                const docRes = await fetch('/api/documents', { cache: 'no-store' });
                const docData = await docRes.json();
                if (docData.success && docData.data) dbDocuments = docData.data;
                else console.error('Error fetching documents:', docData.error);
            } catch (e) {
                console.error('Failed to fetch documents:', e);
            }

            // Fetch audit logs
            let dbLogs = null;
            try {
                const logRes = await fetch('/api/audit', { cache: 'no-store' });
                const logData = await logRes.json();
                if (logData.success && logData.data) dbLogs = logData.data;
                else console.error('Error fetching audit logs:', logData.error);
            } catch (e) {
                console.error('Failed to fetch audit logs:', e);
            }

            // ONLY update state if we got at least employees
            if (dbEmployees && dbEmployees.length > 0) {
                const docs = dbDocuments || [];
                
                // Map employees and attach documents
                const mappedEmployees: DocEmployee[] = dbEmployees.map((emp: any) => {
                    const empId = String(emp.ID || emp.id || '');
                    const empDocs = docs
                        .filter((doc: any) => String(doc.EMPLOYEE_ID || doc.employee_id || '') === empId)
                        .map((doc: any) => ({
                            id: String(doc.ID || doc.id || ''),
                            fileName: doc.FILE_NAME || doc.file_name || 'Archivo',
                            type: (doc.FILE_TYPE || doc.file_type || 'pdf').toLowerCase() as any,
                            url: doc.FILE_URL || doc.file_url || '',
                            uploadDate: doc.UPLOAD_DATE || doc.upload_date || '',
                            status: (doc.STATUS || doc.status || 'PENDING') as any,
                            uploadedBy: doc.UPLOADED_BY || doc.uploaded_by || 'Sistema',
                            approvedBy: doc.APPROVED_BY || doc.approved_by,
                            approvedAt: doc.APPROVED_DATE || doc.approved_date,
                            rejectedBy: doc.REJECTED_BY || doc.rejected_by,
                            rejectedAt: doc.APPROVED_DATE || doc.approved_date,
                            comments: doc.COMMENTS || doc.comments || doc.REJECTION_REASON || doc.rejection_reason
                        }));

                    return {
                        id: empId,
                        codigo_sap: emp.CODIGO_SAP || emp.codigo_sap,
                        name: emp.NAME || emp.name || 'Sin Nombre',
                        apellido: emp.APELLIDO || emp.apellido || '',
                        position: emp.POSITION || emp.position || 'Empleado',
                        entryDate: emp.ENTRY_DATE || emp.entry_date || '',
                        region: emp.REGION || emp.region,
                        ciudad: emp.CIUDAD || emp.ciudad,
                        departamento: emp.DEPARTAMENTO || emp.departamento,
                        responsable: emp.RESPONSABLE || emp.responsable,
                        pais: emp.PAIS || emp.pais,
                        estado: emp.ESTADO || emp.estado,
                        documents: empDocs
                    };
                });

                setEmployees(mappedEmployees);
            }

            // ONLY update logs if we got them
            if (dbLogs) {
                const mappedLogs: AuditLog[] = dbLogs.map((log: any) => ({
                    id: log.ID || log.id,
                    timestamp: log.TIMESTAMP || log.timestamp,
                    user: log.USER_NAME || log.user_name || 'Sistema',
                    action: (log.ACTION || log.action) as any,
                    entity: (log.ENTITY_TYPE || log.entity_type) as any,
                    entityId: log.ENTITY_ID || log.entity_id,
                    details: log.DESCRIPTION || log.description || ''
                }));
                setAuditLogs(mappedLogs);
            }
        } catch (error) {
            console.error('Error in loadData main loop:', error);
        } finally {
            setLoading(false);
        }
    };

    const addAuditLog = async (action: AuditLog['action'], entity: AuditLog['entity'], details: string, entityId?: string) => {
        try {
            await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    entity_type: entity,
                    description: details,
                    user_name: 'Sistema',
                    entity_id: entityId
                })
            });

            // Refresh logs
            loadData();
        } catch (error) {
            console.error('Error adding audit log:', error);
        }
    };

    const addEmployee = async (emp: DocEmployee) => {
        try {
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: emp.id,
                    codigo_sap: emp.codigo_sap,
                    name: emp.name,
                    apellido: emp.apellido,
                    position: emp.position,
                    entry_date: emp.entryDate,
                    region: emp.region,
                    ciudad: emp.ciudad,
                    departamento: emp.departamento,
                    responsable: emp.responsable,
                    pais: emp.pais
                })
            });

            if (!response.ok) throw new Error('Failed to save employee');

            setEmployees(prev => [...prev, emp]);
            await addAuditLog('CREATE', 'EMPLOYEE', `Empleado creado: ${emp.name} ${emp.apellido} (${emp.id})`, emp.id);
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Error al crear empleado. Verifique si ya existe.');
        }
    };

    const addDocumentToEmployee = async (employeeId: string, doc: DocFile | { file: File; fileName: string; type: string; id: string; uploadDate: string }) => {
        try {
            let fileUrl: string = '';
            let filePath: string = '';

            if ('file' in doc) {
                // Upload to local API
                const formData = new FormData();
                formData.append('file', doc.file);
                formData.append('employeeId', employeeId);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload file');
                }

                const data = await response.json();
                fileUrl = data.url;
                filePath = data.path;

            } else {
                console.error('File object missing for upload');
                return;
            }

            // Save metadata to Oracle via API
            const docId = crypto.randomUUID();
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: docId,
                    file_name: doc.fileName,
                    file_type: doc.type,
                    file_url: fileUrl,
                    file_path: filePath,
                    employee_id: employeeId,
                    uploaded_by: 'Sistema',
                    status: 'PENDING'
                })
            });

            if (!response.ok) throw new Error('Failed to save document metadata');

            // Update local state
            setEmployees(prev => prev.map(emp => {
                if (emp.id === employeeId) {
                    const docFile: DocFile = {
                        id: docId,
                        fileName: doc.fileName,
                        type: doc.type as any,
                        url: fileUrl,
                        uploadDate: new Date().toISOString(),
                        status: 'PENDING',
                        uploadedBy: 'Sistema'
                    };
                    return { ...emp, documents: [...emp.documents, docFile] };
                }
                return emp;
            }));

            await addAuditLog('ADD_DOCUMENT', 'DOCUMENT', `Documento cargado localmente: ${doc.fileName}`, docId);

        } catch (error: any) {
            console.error('Error uploading document:', error);
            alert(`Error al subir documento: ${error.message || JSON.stringify(error)}`);
        }
    };

    const findEmployeeById = (id: string) => employees.find(e => e.id === id);

    const massImportEmployees = async (data: any[]) => {
        // Helper to find value case-insensitive
        const getValue = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
                const foundKey = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase());
                if (foundKey) return row[foundKey];
            }
            return null;
        };

        const convertExcelDate = (value: any): string => {
            if (!value) return new Date().toISOString().split('T')[0];
            if (typeof value === 'number') {
                const excelEpoch = new Date(1899, 11, 30);
                const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
                return date.toISOString().split('T')[0];
            }
            if (typeof value === 'string') {
                const parsed = new Date(value);
                if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
                return value;
            }
            return new Date().toISOString().split('T')[0];
        };

        let count = 0;
        for (const d of data) {
            const id = getValue(d, ['ci', 'cedula', 'cédula', 'identificacion', 'dni', 'documento', 'id']);
            const codigo_sap = getValue(d, ['codigo_sap', 'sap', 'codigo sap']);
            const name = getValue(d, ['name', 'nombre', 'nombres', 'empleado']);
            const apellido = getValue(d, ['apellido', 'apellidos']);
            const position = getValue(d, ['position', 'cargo', 'puesto', 'rol']) || 'Sin Cargo';
            const entryDateRaw = getValue(d, ['entryDate', 'fecha', 'fecha ingreso', 'ingreso', 'fecha_ingreso']);
            const region = getValue(d, ['region', 'región']);
            const ciudad = getValue(d, ['ciudad', 'city']);
            const departamento = getValue(d, ['departamento', 'area', 'department']);
            const responsable = getValue(d, ['responsable', 'jefe', 'supervisor']);
            const pais = getValue(d, ['pais', 'país', 'country']);

            if (id && name && apellido) {
                try {
                    const response = await fetch('/api/employees', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: String(id),
                            codigo_sap: codigo_sap ? String(codigo_sap) : undefined,
                            name: name,
                            apellido: apellido,
                            position: position,
                            entry_date: convertExcelDate(entryDateRaw),
                            region: region,
                            ciudad: ciudad,
                            departamento: departamento,
                            responsable: responsable,
                            pais: pais
                        })
                    });

                    if (response.ok) count++;
                } catch (e) {
                    console.warn(`Skipping duplicate or invalid employee: ${id}`);
                }
            }
        }

        if (count > 0) {
            await loadData(); // Refresh data
            await addAuditLog('IMPORT', 'EMPLOYEE', `Importación masiva: ${count} empleados agregados`);
        }
    };

    const massDeleteEmployees = async (data: any[]) => {
        console.warn('Mass delete not implemented for production DB');
    };

    const loadDemoData = () => {
        console.log('Demo data loading disabled in production mode');
    };

    const clearAllData = () => {
        console.log('Clear data disabled in production mode');
    };

    const getPendingDocuments = () => {
        const pending: Array<{ employee: DocEmployee; document: DocFile }> = [];
        employees.forEach(emp => {
            emp.documents.forEach(doc => {
                if (doc.status === 'PENDING') {
                    pending.push({ employee: emp, document: doc });
                }
            });
        });
        return pending;
    };

    const approvePendingDocument = async (employeeId: string, docId: string, approvedBy: string, comments?: string) => {
        try {
            const response = await fetch('/api/documents', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: docId,
                    status: 'APPROVED',
                    approved_by: approvedBy,
                    comments: comments
                })
            });

            if (!response.ok) throw new Error('Failed to approve document');

            setEmployees(prev => prev.map(emp => {
                if (emp.id === employeeId) {
                    return {
                        ...emp,
                        documents: emp.documents.map(doc => {
                            if (doc.id === docId) {
                                return {
                                    ...doc,
                                    status: 'APPROVED',
                                    approvedBy,
                                    approvedAt: new Date().toISOString(),
                                    comments
                                };
                            }
                            return doc;
                        })
                    };
                }
                return emp;
            }));

            await addAuditLog('DOCUMENT_APPROVE', 'DOCUMENT', `Documento aprobado`, docId);
        } catch (error) {
            console.error('Error approving document:', error);
        }
    };

    const rejectPendingDocument = async (employeeId: string, docId: string, rejectedBy: string, comments?: string) => {
        try {
            const response = await fetch('/api/documents', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: docId,
                    status: 'REJECTED',
                    approved_by: rejectedBy,
                    rejection_reason: comments
                })
            });

            if (!response.ok) throw new Error('Failed to reject document');

            setEmployees(prev => prev.map(emp => {
                if (emp.id === employeeId) {
                    return {
                        ...emp,
                        documents: emp.documents.map(doc => {
                            if (doc.id === docId) {
                                return {
                                    ...doc,
                                    status: 'REJECTED',
                                    rejectedBy,
                                    rejectedAt: new Date().toISOString(),
                                    comments
                                };
                            }
                            return doc;
                        })
                    };
                }
                return emp;
            }));

            await addAuditLog('DOCUMENT_REJECT', 'DOCUMENT', `Documento rechazado`, docId);
        } catch (error) {
            console.error('Error rejecting document:', error);
        }
    };

    const syncEmployees = async () => {
        try {
            const response = await fetch('/api/employees/sync', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                await loadData(); // Refresh list
            }
            return data;
        } catch (error: any) {
            console.error('Error syncing employees:', error);
            return { success: false, error: error.message };
        }
    };

    return (
        <DocContext.Provider value={{
            employees,
            auditLogs,
            loading,
            addEmployee,
            addDocumentToEmployee,
            findEmployeeById,
            massImportEmployees,
            massDeleteEmployees,
            loadDemoData,
            clearAllData,
            getPendingDocuments,
            approvePendingDocument,
            rejectPendingDocument,
            syncEmployees
        }}>
            {children}
        </DocContext.Provider>
    );
}

export const useDoc = () => useContext(DocContext);
