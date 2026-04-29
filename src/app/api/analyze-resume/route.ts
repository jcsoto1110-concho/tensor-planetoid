import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { id, apiKey } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del candidato' }, { status: 400 });
    }

    const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: 'Se requiere una API Key de Claude para analizar.' }, { status: 401 });
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // 1. Obtener la metadata del documento en Supabase
    const { data: resume, error: dbError } = await supabase
      .from('email_resumes')
      .select('file_name, email_uid, pdf_url')
      .eq('id', id)
      .single();

    if (dbError || !resume) {
      return NextResponse.json({ error: 'Candidato no encontrado en la base de datos' }, { status: 404 });
    }

    const storageFileName = `resume_${resume.email_uid.substring(0, 8)}_${resume.file_name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 2. Descargar el archivo desde Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('candidate-documents')
      .download(storageFileName);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'No se pudo descargar el archivo PDF de la nube. Nombre buscado: ' + storageFileName }, { status: 404 });
    }

    // 3. Convertir a base64 para enviárselo a Claude directamente (sin necesidad de pdf-parse)
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString('base64');

    // 4. Enviar el PDF a Claude para que lo analice nativamente
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: 'Eres un asistente experto en Recursos Humanos. Responde SOLO con un objeto JSON válido, sin etiquetas markdown como ```json.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            } as any,
            {
              type: 'text',
              text: `Analiza este CV y devuelve un JSON con exactamente estas claves:
{
  "city": "Ciudad de residencia. Si no la encuentras pon 'No especificada'",
  "position": "Cargo o profesión principal. Máximo 4 palabras.",
  "summary": "Resumen ejecutivo del perfil en máximo 3 líneas.",
  "experience_years": "Años de experiencia laboral total (ej: '3 años', '6 meses', 'Sin experiencia'). Calcula estimando por fechas de trabajo si no se especifica.",
  "education_level": "Nivel de estudios más alto. Exactamente uno de: 'Bachiller', 'Técnico', 'Tecnológico', 'Universitario', 'Posgrado', 'No especificado'.",
  "skills": "Las 5 habilidades o competencias más relevantes separadas por coma (ej: 'Ventas, Excel, Atención al cliente').",
  "languages": "Idiomas que maneja y nivel si se menciona (ej: 'Español nativo, Inglés básico'). Si no se menciona pon 'Español'.",
  "availability": "Disponibilidad de horario si se menciona (ej: 'Inmediata', 'Tiempo completo', 'Medio tiempo', 'No especificada').",
  "age": "Edad en años si aparece fecha de nacimiento o edad directamente. Si no pon 'No especificada'."
}`,
            },
          ],
        },
      ],
    });

    // 5. Extraer y limpiar la respuesta de Claude
    let aiResponse = '';
    if (completion.content && completion.content.length > 0 && completion.content[0].type === 'text') {
      aiResponse = completion.content[0].text;
    }
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const aiData = JSON.parse(aiResponse || '{}');

    // 6. Guardar en Supabase
    const { error: updateError } = await supabase
      .from('email_resumes')
      .update({
        city: aiData.city || 'No especificada',
        position: aiData.position || 'No especificado',
        ai_summary: aiData.summary || '',
        experience_years: aiData.experience_years || 'No especificado',
        education_level: aiData.education_level || 'No especificado',
        skills: aiData.skills || '',
        languages: aiData.languages || 'Español',
        availability: aiData.availability || 'No especificada',
        age: aiData.age || 'No especificada',
        classification_status: 'REVIEWED',
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: aiData });

  } catch (error: any) {
    console.error('Error procesando IA:', error);
    return NextResponse.json(
      { error: 'Error interno procesando la hoja de vida', details: error.message },
      { status: 500 }
    );
  }
}
