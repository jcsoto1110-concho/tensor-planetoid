import { supabase, type Employee, type Document, type AuditLog } from './supabase';

export const database = {
    // ============ EMPLEADOS ============
    async getEmployees(): Promise<Employee[]> {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getEmployeeById(id: string): Promise<Employee | null> {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    },

    async createEmployee(employee: Omit<Employee, 'created_at' | 'updated_at'>): Promise<Employee> {
        const { data, error } = await supabase
            .from('employees')
            .insert([employee])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteEmployee(id: string): Promise<void> {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ============ DOCUMENTOS ============
    async getDocuments(employeeId?: string): Promise<Document[]> {
        let query = supabase
            .from('documents')
            .select('*')
            .order('upload_date', { ascending: false });

        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getPendingDocuments(): Promise<any[]> {
        const { data, error } = await supabase
            .from('documents')
            .select(`
        *,
        employees (*)
      `)
            .eq('status', 'PENDING')
            .order('upload_date', { ascending: false });

        if (error) throw error;

        return (data || []).map(doc => ({
            employee: doc.employees,
            document: {
                id: doc.id,
                fileName: doc.file_name,
                type: doc.file_type,
                url: doc.file_url,
                uploadDate: doc.upload_date,
                uploadedBy: doc.uploaded_by,
                status: doc.status,
            }
        }));
    },

    async uploadDocument(params: {
        file: File;
        employeeId: string;
        uploadedBy: string;
        encryptedData?: string;
    }): Promise<Document> {
        const { file, employeeId, uploadedBy, encryptedData } = params;

        // 1. Subir archivo a Supabase Storage
        const fileName = `${employeeId}/${Date.now()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('employee-documents')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('employee-documents')
            .getPublicUrl(fileName);

        // 3. Crear registro en DB
        const { data, error } = await supabase
            .from('documents')
            .insert([{
                employee_id: employeeId,
                file_name: file.name,
                file_type: file.type.includes('pdf') ? 'pdf' : 'image',
                file_url: encryptedData || publicUrl,
                file_path: fileName,
                file_size_bytes: file.size,
                is_encrypted: !!encryptedData,
                status: 'PENDING',
                uploaded_by: uploadedBy,
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async approveDocument(params: {
        documentId: string;
        approvedBy: string;
        comments?: string;
    }): Promise<Document> {
        const { documentId, approvedBy, comments } = params;

        const { data, error } = await supabase
            .from('documents')
            .update({
                status: 'APPROVED',
                approved_by: approvedBy,
                approved_date: new Date().toISOString(),
                comments: comments,
            })
            .eq('id', documentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async rejectDocument(params: {
        documentId: string;
        rejectedBy: string;
        reason: string;
    }): Promise<Document> {
        const { documentId, rejectedBy, reason } = params;

        const { data, error } = await supabase
            .from('documents')
            .update({
                status: 'REJECTED',
                rejected_by: rejectedBy,
                rejection_reason: reason,
                approved_date: new Date().toISOString(),
            })
            .eq('id', documentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteDocument(documentId: string): Promise<void> {
        // 1. Obtener info del documento
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', documentId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Eliminar de storage
        if (doc?.file_path) {
            await supabase.storage
                .from('employee-documents')
                .remove([doc.file_path]);
        }

        // 3. Eliminar de DB
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

        if (error) throw error;
    },

    // ============ AUDIT LOGS ============
    async addAuditLog(params: {
        action: string;
        entityType: string;
        description: string;
        userName: string;
        entityId?: string;
    }): Promise<void> {
        const { action, entityType, description, userName, entityId } = params;

        const { error } = await supabase
            .from('audit_logs')
            .insert([{
                action,
                entity_type: entityType,
                description,
                user_name: userName,
                entity_id: entityId,
            }]);

        if (error) throw error;
    },

    async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },
};
