import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { id, apiKey } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const openaiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();
    if (!openaiKey) return NextResponse.json({ error: 'Falta API Key de OpenAI' }, { status: 400 });

    const openai = new OpenAI({ apiKey: openaiKey });

    // 1. Obtener el registro del candidato
    const { data: resume, error: fetchError } = await supabase
      .from('email_resumes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !resume) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    // 2. Extraer nombre de archivo desde la URL pública
    let storageFileName = resume.file_name;
    if (resume.pdf_url) {
      const parts = resume.pdf_url.split('candidate-documents/');
      if (parts.length > 1) {
        storageFileName = decodeURIComponent(parts[1].split('?')[0]);
      }
    }

    // 3. Descargar el PDF desde Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('candidate-documents')
      .download(storageFileName);

    if (downloadError || !fileData) {
      return NextResponse.json({ 
        error: `Error al descargar el PDF: ${downloadError?.message || 'Archivo no encontrado'}` 
      }, { status: 500 });
    }

    // 4. Extraer texto del PDF con pdf-parse (más estable en serverless)
    let pdfText = '';
    try {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      // Importación dinámica para evitar problemas de bundling
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text || '';
    } catch (pdfError: any) {
      console.error('Error extrayendo texto del PDF:', pdfError);
      return NextResponse.json({ 
        error: `Error al procesar el PDF: ${pdfError.message}. El archivo puede estar protegido o ser una imagen escaneada.` 
      }, { status: 500 });
    }

    if (!pdfText || pdfText.trim().length < 20) {
      return NextResponse.json({ 
        error: 'El PDF parece estar vacío, protegido o es una imagen escaneada sin texto extraíble.' 
      }, { status: 422 });
    }

    // 5. Analizar con OpenAI GPT-4o
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Eres un experto en RRHH. Analiza el CV y extrae datos estructurados en JSON. Responde SOLO con el JSON, sin texto adicional.' 
        },
        { 
          role: 'user', 
          content: `Analiza este CV y extrae la siguiente información:\n\n${pdfText.substring(0, 8000)}\n\nRetorna este JSON exacto:\n{\n  "city": "ciudad de residencia",\n  "position": "cargo o puesto más reciente",\n  "summary": "resumen profesional en 2-3 oraciones",\n  "experience_years": "años de experiencia como número",\n  "education_level": "nivel de estudios",\n  "skills": "habilidades separadas por comas",\n  "languages": "idiomas que maneja",\n  "phone": "teléfono si aparece",\n  "main_achievement": "logro principal o más destacado",\n  "key_tools": "herramientas o software clave"\n}` 
        }
      ],
      response_format: { type: 'json_object' }
    });

    const aiData = JSON.parse(response.choices[0].message.content || '{}');

    // 6. Guardar resultados en Supabase
    const { error: updateError } = await supabase.from('email_resumes').update({
      city:             aiData.city            || resume.city || '',
      position:         aiData.position        || resume.position || '',
      ai_summary:       aiData.summary         || '',
      experience_years: aiData.experience_years || '',
      education_level:  aiData.education_level  || '',
      skills:           aiData.skills           || '',
      languages:        aiData.languages        || '',
      sender_phone:     aiData.phone            || resume.sender_phone || '',
      main_achievement: aiData.main_achievement || '',
      key_tools:        aiData.key_tools        || '',
      classification_status: 'REVIEWED',
    }).eq('id', id);

    if (updateError) {
      console.error('Error actualizando BD:', updateError);
      return NextResponse.json({ error: 'Análisis completado pero error al guardar: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiData });

  } catch (error: any) {
    console.error('Error en analyze-resume:', error);
    
    // Mensajes de error más claros para el usuario
    let errorMsg = error.message || 'Error desconocido';
    if (error.status === 401) errorMsg = 'API Key de OpenAI inválida o sin saldo.';
    if (error.status === 429) errorMsg = 'Límite de solicitudes de OpenAI alcanzado. Intenta en unos minutos.';
    
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
