import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { cargo, ciudad, funciones, apiKey } = await req.json();

    if (!cargo || !funciones) {
      return NextResponse.json(
        { error: 'Se requiere el nombre del cargo y sus funciones.' },
        { status: 400 }
      );
    }

    const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: 'Se requiere una API Key de Claude para evaluar candidatos.' },
        { status: 401 }
      );
    }

    // 1. Cargar todos los CVs ya analizados por IA
    const { data: resumes, error: dbError } = await supabase
      .from('email_resumes')
      .select('id, sender_name, sender_email, sender_phone, city, position, experience_years, education_level, skills, languages, availability, age, ai_summary, pdf_url, file_name')
      .eq('classification_status', 'REVIEWED');

    if (dbError) {
      return NextResponse.json({ error: 'Error al cargar candidatos de la base de datos.' }, { status: 500 });
    }

    if (!resumes || resumes.length === 0) {
      return NextResponse.json(
        { error: 'No hay candidatos analizados por IA. Primero analiza las hojas de vida en la pestaña de Selección.' },
        { status: 404 }
      );
    }

    // 2. Construir el bloque de perfiles para el prompt
    const perfilesTexto = resumes.map((r, idx) => `
[CANDIDATO ${idx + 1}]
ID: ${r.id}
Nombre: ${r.sender_name || 'Sin nombre'} (${r.sender_email})
Ciudad: ${r.city || 'No especificada'}
Cargo detectado en CV: ${r.position || 'No especificado'}
Años de experiencia: ${r.experience_years || 'No especificado'}
Nivel educativo: ${r.education_level || 'No especificado'}
Habilidades: ${r.skills || 'No especificadas'}
Idiomas: ${r.languages || 'Español'}
Disponibilidad: ${r.availability || 'No especificada'}
Edad: ${r.age || 'No especificada'}
Resumen IA: ${r.ai_summary || 'No disponible'}
`).join('\n---\n');

    // 3. Llamar a Claude con todos los perfiles + descripción del cargo
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const prompt = `Eres un experto en Recursos Humanos de nivel senior. Tu tarea es evaluar qué tan bien se adapta cada candidato al cargo vacante descrito, y asignar un puntaje del 0 al 100.

=== CARGO VACANTE ===
Cargo: ${cargo}
Ciudad requerida: ${ciudad || 'Cualquier ciudad'}
Funciones y requisitos:
${funciones}
====================

=== CANDIDATOS A EVALUAR ===
${perfilesTexto}
============================

INSTRUCCIONES:
- Evalúa cada candidato en función del cargo vacante.
- Considera: experiencia relevante, habilidades, nivel educativo, disponibilidad, ciudad (si fue especificada) y perfil general.
- El puntaje 100 = candidato ideal, 0 = no apto en absoluto.
- La justificación debe ser concisa: máximo 2 oraciones explicando POR QUÉ ese puntaje.
- Si la ciudad del candidato no coincide con la requerida, penaliza 15 puntos máximo (podría reubicarse).

Responde ÚNICAMENTE con un array JSON válido, sin etiquetas markdown ni texto adicional. Formato exacto:
[
  {
    "id": "uuid-del-candidato",
    "score": 85,
    "justification": "Razón breve del puntaje."
  }
]`;

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: 'Eres un experto en Recursos Humanos. Responde SOLO con un array JSON válido, sin etiquetas markdown.',
      messages: [{ role: 'user', content: prompt }],
    });

    // 4. Extraer y parsear la respuesta
    let aiResponse = '';
    if (completion.content && completion.content.length > 0 && completion.content[0].type === 'text') {
      aiResponse = completion.content[0].text;
    }
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const rankings: { id: string; score: number; justification: string }[] = JSON.parse(aiResponse || '[]');

    // 5. Combinar datos de ranking con datos completos del candidato y ordenar por puntaje
    const enrichedRankings = rankings
      .map((ranking) => {
        const resume = resumes.find((r) => r.id === ranking.id);
        return {
          ...ranking,
          sender_name: resume?.sender_name || 'Sin nombre',
          sender_email: resume?.sender_email || '',
          sender_phone: resume?.sender_phone || null,
          city: resume?.city || 'No especificada',
          position: resume?.position || 'No especificado',
          experience_years: resume?.experience_years || '',
          education_level: resume?.education_level || '',
          skills: resume?.skills || '',
          pdf_url: resume?.pdf_url || null,
          file_name: resume?.file_name || '',
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, rankings: enrichedRankings, total: enrichedRankings.length });

  } catch (error: any) {
    console.error('Error en rank-candidates:', error);
    return NextResponse.json(
      { error: 'Error interno al evaluar candidatos.', details: error.message },
      { status: 500 }
    );
  }
}
