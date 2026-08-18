import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const cedula = formData.get('cedula') as string;
    const prefix = formData.get('prefix') as string || 'doc';

    if (!file || !cedula) {
      return NextResponse.json(
        { error: 'File y cédula son obligatorios' },
        { status: 400 }
      );
    }

    const cleanCedula = cedula.replace(/[^a-zA-Z0-9]/g, '');
    const fileExt = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const fileName = `${cleanCedula}/${cleanCedula}_${prefix}_${timestamp}.${fileExt}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-documents')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error al subir documento en servidor:', uploadError);
      return NextResponse.json(
        { error: `Error en almacenamiento: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('candidate-documents')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      publicUrl,
      path: fileName
    });

  } catch (error: any) {
    console.error('Error en API upload-onboarding-doc:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
