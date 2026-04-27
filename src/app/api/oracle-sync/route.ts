import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';
import { supabase } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Se requiere el ID del candidato' }, { status: 400 });
    }

    // 1. Obtener datos del candidato desde Supabase
    const { data: candidate, error: supaError } = await supabase
      .from('onboarding_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (supaError || !candidate) {
      throw new Error(`Candidato no encontrado en Supabase: ${supaError?.message}`);
    }

    if (candidate.status === 'SYNCED') {
      return NextResponse.json({ message: 'El candidato ya fue sincronizado previamente' });
    }

    const { cedula, nombres, apellidos, ciudad_residencia, telefono, documento_pdf_url } = candidate;

    // 2. Descargar el archivo PDF desde la URL pública de Supabase
    let localFileUrl = documento_pdf_url;
    
    if (documento_pdf_url) {
      console.log(`Descargando PDF desde Supabase: ${documento_pdf_url}`);
      const pdfResponse = await fetch(documento_pdf_url);
      
      if (pdfResponse.ok) {
        const arrayBuffer = await pdfResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Crear directorio local en el servidor (misma lógica existente)
        const uploadDir = join(process.cwd(), 'public', 'uploads', cedula);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const fileName = `Expediente_Ingreso_${cedula}.pdf`;
        const filePath = join(uploadDir, fileName);

        // 4. Guardar archivo en disco (servidor 91.28)
        await writeFile(filePath, buffer);
        console.log(`PDF guardado localmente en: ${filePath}`);
        
        // URL relativa para guardar en Oracle
        localFileUrl = `/uploads/${cedula}/${fileName}`;
      } else {
        console.warn(`No se pudo descargar el PDF de Supabase (Status: ${pdfResponse.status})`);
      }
    }

    // 5. Preparar datos para Oracle
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const codigo_sap = 'PENDIENTE'; 
    const position = 'NUEVO INGRESO';
    
    // Ciudad y País por defecto de los datos personales, si están disponibles
    const ciudad = candidate.datos_personales?.ciudad_residencia || 'QUITO';
    const pais = candidate.datos_personales?.nacionalidad || 'ECUADOR';

    // 6. Insertar o Actualizar en Oracle (Tabla digi_employees)
    const sqlEmployee = `
      MERGE INTO digi_employees e
      USING (SELECT :id as id FROM dual) s
      ON (e.id = s.id)
      WHEN MATCHED THEN
          UPDATE SET 
              name = :name,
              apellido = :apellido,
              position = :position,
              ciudad = :ciudad,
              pais = :pais,
              estado = '1'
      WHEN NOT MATCHED THEN
          INSERT (id, codigo_sap, name, apellido, position, entry_date, ciudad, pais, estado)
          VALUES (:id, :codigo_sap, :name, :apellido, :position, TO_DATE(:entry_date, 'YYYY-MM-DD'), :ciudad, :pais, '1')
    `;

    await executeOracleQuery(sqlEmployee, {
      id: cedula,
      codigo_sap,
      name: nombres,
      apellido: apellidos,
      position,
      entry_date: today,
      ciudad,
      pais
    });

    // 7. Insertar el registro del Documento en Oracle (Tabla digi_documents)
    if (localFileUrl) {
      const sqlDocument = `
        INSERT INTO digi_documents (employee_id, file_name, file_type, file_url, status, uploaded_by, comments)
        VALUES (:employee_id, :file_name, :file_type, :file_url, :status, :uploaded_by, :comments)
      `;

      await executeOracleQuery(sqlDocument, {
        employee_id: cedula,
        file_name: `Expediente de Ingreso (${nombres} ${apellidos})`,
        file_type: 'application/pdf',
        file_url: localFileUrl, // Ruta guardada en el servidor
        status: 'APPROVED',
        uploaded_by: 'CANDIDATO_ONBOARDING',
        comments: 'Expediente consolidado desde portal Onboarding'
      });
    }

    // 8. Actualizar el estado en Supabase
    await supabase
      .from('onboarding_candidates')
      .update({ status: 'SYNCED' })
      .eq('id', id);

    return NextResponse.json({ 
      success: true, 
      message: 'Candidato sincronizado y PDF guardado localmente',
      local_path: localFileUrl
    });

  } catch (error: any) {
    console.error('Error sincronizando con Oracle:', error);
    return NextResponse.json(
      { error: 'Error en la sincronización', details: error.message },
      { status: 500 }
    );
  }
}
