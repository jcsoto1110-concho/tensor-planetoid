import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { cargo, ciudad, funciones, apiKey } = await req.json();
    const openaiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();

    if (!openaiKey) return NextResponse.json({ error: 'Falta API Key de OpenAI' }, { status: 401 });

    const openai = new OpenAI({ apiKey: openaiKey });

    // 1. Cargar candidatos
    const { data: resumes, error: dbError } = await supabase
      .from('email_resumes')
      .select('*')
      .or('classification_status.eq.REVIEWED,position.neq.""');

    if (dbError) throw dbError;
    if (!resumes || resumes.length === 0) return NextResponse.json({ error: 'No hay candidatos listos para rankear' }, { status: 404 });

    const perfiles = resumes.map(r => {
      return `[ID: ${r.id}] 
      Nombre: ${r.sender_name}
      Cargo: ${r.position}
      Experiencia: ${r.experience_years}
      Logro: ${r.main_achievement || 'No especificado'}
      Herramientas: ${r.key_tools || 'No especificado'}
      Resumen: ${r.ai_summary}`;
    }).join('\n\n');

    const prompt = `Evalúa a TODOS los ${resumes.length} candidatos para el cargo "${cargo}" en "${ciudad}".
    REQUISITOS: ${funciones}
    
    CANDIDATOS A EVALUAR:
    ${perfiles}
    
    INSTRUCCIÓN CRÍTICA: Debes incluir obligatoriamente a los ${resumes.length} candidatos en tu respuesta. No omitas a ninguno.
    Responde ÚNICAMENTE con un objeto JSON que tenga una propiedad "rankings": [{"id": "...", "score": 0-100, "justification": "..."}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Eres un experto en selección de personal que responde exclusivamente en JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    let aiResponse = response.choices[0].message.content || '{"rankings": []}';
    let parsed = JSON.parse(aiResponse);
    let rankings = Array.isArray(parsed) ? parsed : (parsed.rankings || Object.values(parsed)[0]);

    if (!Array.isArray(rankings)) throw new Error("La IA no devolvió un formato válido.");

    const uniqueIds = new Set();
    const enriched = rankings
      .filter((rank: any) => {
        if (!rank.id || uniqueIds.has(rank.id)) return false;
        uniqueIds.add(rank.id);
        return true;
      })
      .map((rank: any) => {
        const resume = resumes.find(r => r.id === rank.id);
        return {
          ...rank,
          name: resume?.sender_name || 'Desconocido',
          email: resume?.sender_email || '',
          pdf_url: resume?.pdf_url || '',
          position: resume?.position || '',
          experience: resume?.experience_years || '',
          sender_phone: resume?.sender_phone || ''
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    return NextResponse.json({ success: true, data: enriched });

  } catch (error: any) {
    console.error('Error Ranking OpenAI:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
