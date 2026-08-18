import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory, apiKey, company_slug } = await req.json();
    const openaiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();

    if (!openaiKey) {
      return NextResponse.json({ error: 'Falta la API Key de OpenAI. Configúrala en el icono de engranaje (⚙️).' }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // 1. Obtener candidatos de email_resumes (últimos 40 para contexto general)
    let resumesQuery = supabase
      .from('email_resumes')
      .select('*')
      .neq('classification_status', 'DELETED')
      .order('received_date', { ascending: false })
      .limit(40);

    if (company_slug) {
      resumesQuery = resumesQuery.eq('company_slug', company_slug);
    }

    const { data: recentResumes, error: resumesErr } = await resumesQuery;
    if (resumesErr) throw resumesErr;

    // Buscar candidatos por nombre/email basados en el mensaje del chat para no perder coincidencias antiguas
    let searchedResumes: any[] = [];
    const cleanMsg = message.trim().replace(/['"“”*?¿!¡]/g, '');
    const words = cleanMsg
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length >= 3);

    if (words.length > 0) {
      let searchQuery = supabase
        .from('email_resumes')
        .select('*')
        .neq('classification_status', 'DELETED');

      if (company_slug) {
        searchQuery = searchQuery.eq('company_slug', company_slug);
      }

      const orConditions: string[] = [
        `sender_name.ilike.%${cleanMsg}%`,
        `sender_email.ilike.%${cleanMsg}%`
      ];

      const stopWords = new Set(['del', 'los', 'con', 'por', 'para', 'una', 'uno', 'que', 'las', 'como', 'esta', 'este', 'hola', 'bien', 'buen', 'dias', 'tardes', 'noches', 'buscar', 'quien', 'existe', 'candidato']);
      words.forEach((w: string) => {
        if (!stopWords.has(w.toLowerCase())) {
          orConditions.push(`sender_name.ilike.%${w}%`);
          orConditions.push(`sender_email.ilike.%${w}%`);
        }
      });

      searchQuery = searchQuery.or(orConditions.join(',')).limit(20);
      const { data: searchData, error: searchErr } = await searchQuery;
      if (!searchErr && searchData) {
        searchedResumes = searchData;
      }
    }

    // Combinar y deduplicar
    const mergedResumesMap = new Map();
    (recentResumes || []).forEach((r: any) => mergedResumesMap.set(r.id, r));
    searchedResumes.forEach((r: any) => mergedResumesMap.set(r.id, r));
    const resumes = Array.from(mergedResumesMap.values());

    // 2. Obtener pruebas psicométricas asociadas
    const { data: psychTests, error: psychErr } = await supabase
      .from('candidate_psychometric_tests')
      .select('*');
    
    const psychMap = new Map();
    if (psychTests && !psychErr) {
      psychTests.forEach((t: any) => {
        psychMap.set(t.resume_id, t);
      });
    }

    // 3. Formatear corpus de candidatos
    const candidateCorpus = (resumes || []).map((r, i) => {
      const test = psychMap.get(r.id);
      const compatibility = test?.kudert_disc?.ai_recommendation?.compatibility || 'No realizada';
      const discProfile = test?.kudert_disc?.ai_recommendation?.profile_name || '';

      return `${i + 1}. [CANDIDATO ID: ${r.id}]
   Nombre: ${r.sender_name || 'Sin Nombre'}
   Email: ${r.sender_email || 'Sin Email'}
   Celular/WA: ${r.sender_phone || 'Sin Teléfono'}
   Cargo Postulado: ${r.position || 'No especificado'}
   Ciudad: ${r.city || 'No especificada'}
   Experiencia: ${r.experience_years ? `${r.experience_years} años` : 'No especificada'}
   Edad: ${r.age ? `${r.age} años` : 'No especificada'}
   Estado Civil: ${r.civil_status || 'No especificado'}
   Sector de Vivienda: ${r.sector || 'No especificado'}
   Dirección: ${r.home_address || 'No especificada'}
   Estudios: ${r.education_level || 'No especificado'} ${r.education_institution ? `en ${r.education_institution}` : ''} ${r.education_title ? `(${r.education_title})` : ''}
   Medio de Postulación: ${r.heard_from || 'No especificado'}
   Afinidad Deporte: ${r.likes_sports === 'Si' ? `Sí, practica: ${r.sports_practiced || '—'}` : 'No'}
   Motivación Laboral: ${r.work_culture_motivation || 'No especificada'}
   Habilidades Clave: ${r.skills || 'No especificadas'}
   Logro Principal: ${r.main_achievement || 'No especificado'}
   Herramientas/Idiomas: ${r.key_tools || 'No especificado'}
   Prueba Psicométrica: ${compatibility !== 'No realizada' ? `Completada (Compatibilidad IA: ${compatibility}, Perfil DISC: ${discProfile})` : 'Pendiente'}
   Resumen de IA: ${r.ai_summary || 'No analizado'}`;
    }).join('\n\n');

    const systemPrompt = `Eres un Copiloto de IA experto en Selección y Reclutamiento de Personal.
Tu misión es ayudar al reclutador a analizar, filtrar, comparar y resumir los perfiles de los candidatos de su empresa.
Responde de manera profesional, clara y concisa en español.

A continuación, tienes la base de datos de candidatos activos de la empresa (recientes, límite 60):
---
${candidateCorpus || 'No hay candidatos registrados en la base de datos actualmente.'}
---

Instrucciones para tus respuestas:
1. Sé extremadamente objetivo y basa tus comparaciones, filtros y recomendaciones únicamente en los datos provistos.
2. Si recomiendas candidatos, menciona sus nombres completos, cargos postulados, puntos fuertes (experiencia, herramientas, perfiles psicométricos) y explica brevemente por qué encajan.
3. Si el usuario te pregunta por datos que no constan en la lista de candidatos o que no puedes inferir, indícaselo cortésmente.
4. Mantén tus respuestas legibles utilizando formato Markdown.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []).map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7
    });

    const replyContent = response.choices[0].message.content || 'No pude generar una respuesta.';

    return NextResponse.json({ success: true, reply: replyContent });

  } catch (error: any) {
    console.error('Error in Copilot API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
