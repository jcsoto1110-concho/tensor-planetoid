'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { database } from '@/lib/database';
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
}

const DocContext = createContext<DocContextType>({} as DocContextType);

export function DocProvider({ children }: { children: React.ReactNode }) {
    const [employees, setEmployees] = useState<DocEmployee[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Load data from Supabase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [dbEmployees, dbDocuments, dbLogs] = await Promise.all([
                database.getEmployees(),
                database.getDocuments(),
                database.getAuditLogs()
            ]);

            // Map employees and attach documents
            const mappedEmployees: DocEmployee[] = dbEmployees.map(emp => {
                const empDocs = dbDocuments
                    .filter(doc => doc.employee_id === emp.id)
                    .map(doc => ({
                        id: doc.id,
                        fileName: doc.file_name,
                        type: doc.file_type,
                        url: doc.file_url,
                        uploadDate: doc.upload_date,
                        status: doc.status,
                        uploadedBy: doc.uploaded_by,
                        approvedBy: doc.approved_by,
                        approvedAt: doc.approved_date,
                        rejectedBy: doc.rejected_by,
                        rejectedAt: doc.approved_date, // Using approved_date for rejection timestamp too
                        comments: doc.comments || doc.rejection_reason
                    }));

                return {
                    id: emp.id,
                    codigo_sap: emp.codigo_sap,
                    name: emp.name,
                    apellido: emp.apellido,
                    position: emp.position,
                    entryDate: emp.entry_date,
                    region: emp.region,
                    ciudad: emp.ciudad,
                    departamento: emp.departamento,
                    responsable: emp.responsable,
                    pais: emp.pais,
                    documents: empDocs
                };
            });

            // Map audit logs
            const mappedLogs: AuditLog[] = dbLogs.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                user: log.user_name,
                action: log.action as any,
                entity: log.entity_type as any,
                entityId: log.entity_id,
                details: log.description
            }));

            setEmployees(mappedEmployees);
            setAuditLogs(mappedLogs);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addAuditLog = async (action: AuditLog['action'], entity: AuditLog['entity'], details: string, entityId?: string) => {
        try {
            await database.addAuditLog({
                action,
                entityType: entity,
                description: details,
                userName: 'Sistema', // TODO: Replace with actual user
                entityId
            });
            // Refresh logs
            const logs = await database.getAuditLogs();
            setAuditLogs(logs.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                user: log.user_name,
                action: log.action as any,
                entity: log.entity_type as any,
                entityId: log.entity_id,
                details: log.description
            })));
        } catch (error) {
            console.error('Error adding audit log:', error);
        }
    };

    const addEmployee = async (emp: DocEmployee) => {
        try {
            await database.createEmployee({
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
            });

            setEmployees(prev => [...prev, emp]);
            await addAuditLog('CREATE', 'EMPLOYEE', `Empleado creado: ${emp.name} ${emp.apellido} (${emp.id})`, emp.id);
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Error al crear empleado. Verifique si ya existe.');
        }
    };

    const addDocumentToEmployee = async (employeeId: string, doc: DocFile | { file: File; fileName: string; type: string; id: string; uploadDate: string }) => {
        try {
            let encryptedData: string | undefined;
            let fileToUpload: File;

            if ('file' in doc) {
                fileToUpload = doc.file;
                // Encrypt file content for storage/url
                encryptedData = await encryptFile(doc.file);
            } else {
                // Should not happen in new flow, but handle gracefully
                console.error('File object missing for upload');
                return;
            }

            const newDoc = await database.uploadDocument({
                file: fileToUpload,
                employeeId,
                uploadedBy: 'Sistema',
                encryptedData // Pass encrypted data URL
            });

            // Update local state
            setEmployees(prev => prev.map(emp => {
                if (emp.id === employeeId) {
                    const docFile: DocFile = {
                        id: newDoc.id,
                        fileName: newDoc.file_name,
                        type: newDoc.file_type,
                        url: newDoc.file_url,
                        uploadDate: newDoc.upload_date,
                        status: newDoc.status,
                        uploadedBy: newDoc.uploaded_by
                    };
                    return { ...emp, documents: [...emp.documents, docFile] };
                }
                return emp;
            }));

            await addAuditLog('ADD_DOCUMENT', 'DOCUMENT', `Documento cargado: ${doc.fileName}`, newDoc.id);

        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error al subir documento');
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
                    await database.createEmployee({
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
                    });
                    count++;
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
        // Not implemented for DB yet to avoid accidental mass deletion
        console.warn('Mass delete not implemented for production DB');
    };

    const loadDemoData = () => {
        // No-op in production mode
        console.log('Demo data loading disabled in production mode');
    };

    const clearAllData = () => {
        // No-op in production mode
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
            await database.approveDocument({
                documentId: docId,
                approvedBy,
                comments
            });

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
            await database.rejectDocument({
                documentId: docId,
                rejectedBy,
                reason: comments || 'Sin razón especificada'
            });

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
            rejectPendingDocument
        }}>
            {children}
        </DocContext.Provider>
    );
}

export const useDoc = () => useContext(DocContext);
