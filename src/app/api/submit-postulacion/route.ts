import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const companySlug = formData.get('companySlug') as string;
    const cedula = formData.get('cedula') as string;
    const nombre = formData.get('nombre') as string;
    const email = formData.get('email') as string;
    const celular = formData.get('celular') as string;
    const cargo = formData.get('cargo') as string;
    const ciudad = formData.get('ciudad') as string;
    const experiencia = formData.get('experiencia') as string;
    const edad = formData.get('edad') as string;
    const herramientas = formData.get('herramientas') as string;
    const logro = formData.get('logro') as string;
    const birth_date = formData.get('birth_date') as string;
    const civil_status = formData.get('civil_status') as string;
    const home_address = formData.get('home_address') as string;
    const sector = formData.get('sector') as string;
    const education_level = formData.get('education_level') as string;
    const education_institution = formData.get('education_institution') as string;
    const education_title = formData.get('education_title') as string;
    const heard_from = formData.get('heard_from') as string;
    const gender = formData.get('genero') as string;
    const likes_sports = formData.get('likes_sports') as string;
    const sports_practiced = formData.get('sports_practiced') as string;
    const work_culture_motivation = formData.get('work_culture_motivation') as string;

    if (!cedula || !email || !nombre) {
      return NextResponse.json(
        { error: 'Cédula, nombre y correo son obligatorios' },
        { status: 400 }
      );
    }

    // 1. Verificar si ya existe la cédula
    const { data: existing, error: checkError } = await supabase
      .from('email_resumes')
      .select('id')
      .eq('cedula', cedula)
      .limit(1);

    if (checkError) {
      console.error('Error al verificar cédula:', checkError);
    } else if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Ya te has postulado anteriormente con este número de cédula. ¡Gracias por tu interés!' },
        { status: 400 }
      );
    }

    let publicUrl = '';
    
    // 2. Subir archivo a Supabase Storage si está presente
    if (file) {
      const emailUid = `WEB${Date.now()}`;
      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageFileName = `resume_${emailUid.substring(0, 8)}_${sanitizedOriginalName}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(storageFileName, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Error subiendo CV en servidor:', uploadError);
        return NextResponse.json(
          { error: `Error al subir hoja de vida: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data } = supabase.storage
        .from('candidate-documents')
        .getPublicUrl(storageFileName);
      
      publicUrl = data.publicUrl;
    }

    // 3. Insertar en email_resumes
    const emailUid = `WEB${Date.now()}`;
    const { error: dbError } = await supabase.from('email_resumes').insert([{
      email_uid: emailUid,
      sender_email: email.toLowerCase(),
      sender_name: nombre,
      cedula: cedula,
      subject: `Postulación Web: ${cargo}`,
      received_date: new Date().toISOString(),
      file_name: file ? file.name : 'CV.pdf',
      pdf_url: publicUrl,
      sender_phone: celular,
      classification_status: 'PENDING',
      position: cargo,
      city: ciudad,
      experience_years: experiencia,
      age: edad,
      skills: herramientas,
      main_achievement: logro,
      key_tools: herramientas,
      ai_summary: `CED: ${cedula} | TEL: ${celular} | LOGRO: ${logro} | HERRAMIENTAS: ${herramientas} | CONSENTIMIENTO LOPDP: ACEPTADO`,
      company_slug: companySlug || 'superdeporte',
      birth_date: birth_date || null,
      civil_status: civil_status || null,
      home_address: home_address || null,
      sector: sector || null,
      education_level: education_level || null,
      education_institution: education_institution || null,
      education_title: education_title || null,
      heard_from: heard_from || null,
      gender: gender || null,
      likes_sports: likes_sports || null,
      sports_practiced: sports_practiced || null,
      work_culture_motivation: work_culture_motivation || null
    }]);

    if (dbError) {
      console.error('Error insertando en BD:', dbError);
      return NextResponse.json(
        { error: `Error al registrar postulación: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Postulación registrada exitosamente' });

  } catch (error: any) {
    console.error('Error en API submit-postulacion:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar postulación', details: error.message },
      { status: 500 }
    );
  }
}
