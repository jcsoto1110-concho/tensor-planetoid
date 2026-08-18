import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { testId, cargo, apiKey } = await req.json();
    if (!testId) {
      return NextResponse.json({ error: 'Falta ID de evaluación' }, { status: 400 });
    }

    // 1. Obtener la evaluación psicométrica
    const { data: test, error: fetchError } = await supabase
      .from('candidate_psychometric_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchError || !test) {
      return NextResponse.json({ error: 'Evaluación no encontrada' }, { status: 404 });
    }

    // 2. Si ya tiene la recomendación generada, retornarla directamente
    const discData = test.kudert_disc || {};
    if (discData.ai_recommendation) {
      return NextResponse.json({ success: true, recommendation: discData.ai_recommendation });
    }

    // 3. Preparar OpenAI
    const openaiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();
    if (!openaiKey) {
      return NextResponse.json({ error: 'Falta la API Key de OpenAI. Configúrala en el icono de engranaje (⚙️).' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    const verbal = test.verbal_score || 0;
    const espacial = test.espacial_score || 0;
    const logico = test.logico_score || 0;
    const numerico = test.numerico_score || 0;
    const abstracto = test.abstracto_score || 0;
    const ethics = test.ethics_score || 0;

    const D = discData.D || 0;
    const I = discData.I || 0;
    const S = discData.S || 0;
    const C = discData.C || 0;

    const prompt = `Analiza los siguientes resultados psicométricos y de comportamiento de un candidato para el cargo "${cargo || 'Candidato'}".
    
    PUNTAJES DE APTITUD (0-100):
    - Razonamiento Verbal: ${verbal}/100
    - Razonamiento Espacial: ${espacial}/100
    - Razonamiento Lógico: ${logico}/100
    - Razonamiento Numérico: ${numerico}/100
    - Razonamiento Abstracto: ${abstracto}/100
    - Ética y Cumplimiento: ${ethics}/100
    
    PERFIL CONDUCTUAL DISC:
    - Decisión/Dominancia (D): ${D}%
    - Interacción/Influencia (I): ${I}%
    - Serenidad/Estabilidad (S): ${S}%
    - Cumplimiento/Normas (C): ${C}%
    
    INSTRUCCIÓN: Genera una recomendación detallada y profesional para el reclutador en español. Evalúa la adecuación al puesto y sugiere preguntas de entrevista.
    
    Responde ÚNICAMENTE con un objeto JSON con el siguiente formato:
    {
      "compatibility": "Alta" | "Media" | "Baja",
      "summary": "Resumen ejecutivo de la adecuación del perfil al cargo.",
      "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
      "risks": ["Riesgo/Área de atención 1", "Riesgo/Área de atención 2"],
      "interview_questions": ["Pregunta sugerida 1", "Pregunta sugerida 2"]
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un experto consultor de selección y psicólogo organizacional. Respondes exclusivamente en JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    let aiContent = response.choices[0].message.content || '{}';
    
    // Limpiar bloques de código markdown si existen
    if (aiContent.includes('```')) {
      aiContent = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const parsedRecommendation = JSON.parse(aiContent);

    // Normalizar claves para evitar variaciones de OpenAI
    const normalizedRecommendation = {
      compatibility: parsedRecommendation.compatibility || parsedRecommendation.compatibilidad || 'Media',
      summary: parsedRecommendation.summary || parsedRecommendation.resumen || parsedRecommendation.resumen_ejecutivo || '',
      strengths: parsedRecommendation.strengths || parsedRecommendation.fortalezas || [],
      risks: parsedRecommendation.risks || parsedRecommendation.riesgos || [],
      interview_questions: parsedRecommendation.interview_questions || 
                           parsedRecommendation.interviewQuestions || 
                           parsedRecommendation.preguntas_entrevista || 
                           parsedRecommendation.preguntas || []
    };

    // 4. Guardar la recomendación dentro del campo kudert_disc
    const updatedDisc = {
      ...discData,
      ai_recommendation: normalizedRecommendation
    };

    const { error: updateError } = await supabase
      .from('candidate_psychometric_tests')
      .update({ kudert_disc: updatedDisc })
      .eq('id', testId);

    if (updateError) {
      console.error('Error al guardar recomendación:', updateError);
    }

    return NextResponse.json({ success: true, recommendation: normalizedRecommendation });

  } catch (error: any) {
    console.error('Error en /api/psychometric/recommend:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
