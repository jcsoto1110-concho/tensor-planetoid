import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;

    if (!file || !employeeId) {
      return NextResponse.json(
        { error: 'El archivo y la cédula del empleado son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanCedula = employeeId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `employees/${cleanCedula}/${Date.now()}_${cleanFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Intentar subir primero a Supabase Storage
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('candidate-documents')
          .getPublicUrl(storagePath);

        return NextResponse.json({
          success: true,
          url: publicUrl,
          path: storagePath
        });
      }

      console.warn('Fallo upload a Supabase Storage, intentando fallback local:', uploadError);
    } catch (storageErr) {
      console.warn('Excepción en Supabase Storage, intentando fallback local:', storageErr);
    }

    // 2. Fallback: Guardar en almacenamiento local si falla Supabase Storage
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads', cleanCedula);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const localFileName = `${Date.now()}_${cleanFileName}`;
      const localFilePath = join(uploadDir, localFileName);
      await writeFile(localFilePath, buffer);

      const publicUrl = `/uploads/${cleanCedula}/${localFileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: localFilePath
      });
    } catch (fsErr: any) {
      console.error('Error escribiendo archivo en disco local:', fsErr);
      return NextResponse.json(
        { 
          error: `Error al almacenar el archivo: ${fsErr.message || 'Error de permisos de escritura'}` 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error general en upload API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al procesar el archivo' },
      { status: 500 }
    );
  }
}
