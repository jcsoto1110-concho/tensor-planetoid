import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // 6. Insertar o Actualizar en Supabase (Tabla digi_employees)
    const { error: empError } = await supabase
      .from('digi_employees')
      .upsert({
        id: cedula,
        codigo_sap,
        name: nombres,
        apellido: apellidos,
        position,
        entry_date: today,
        ciudad,
        pais,
        estado: '1'
      }, { onConflict: 'id' });

    if (empError) throw empError;

    // 7. Insertar el registro del Documento en Supabase (Tabla digi_documents)
    if (documento_pdf_url) {
      const { error: docError } = await supabase
        .from('digi_documents')
        .insert({
          employee_id: cedula,
          file_name: `Expediente de Ingreso (${nombres} ${apellidos})`,
          file_type: 'application/pdf',
          file_url: documento_pdf_url, // Usamos la URL pública directamente
          status: 'APPROVED',
          uploaded_by: 'CANDIDATO_ONBOARDING',
          comments: 'Expediente consolidado desde portal Onboarding'
        });
        
      if (docError) throw docError;
    }

    // 8. Actualizar el estado en Supabase
    await supabase
      .from('onboarding_candidates')
      .update({ status: 'SYNCED' })
      .eq('id', id);

    return NextResponse.json({ 
      success: true, 
      message: 'Candidato sincronizado exitosamente a Supabase',
      local_path: documento_pdf_url
    });

  } catch (error: any) {
    console.error('Error sincronizando candidato:', error);
    return NextResponse.json(
      { error: 'Error en la sincronización', details: error.message },
      { status: 500 }
    );
  }
}
