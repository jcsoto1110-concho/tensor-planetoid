import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { MASTER_QUESTIONS, PsychometricQuestion } from '@/lib/psychometricQuestions';

// Función para desordenar un arreglo aleatoriamente
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Función para seleccionar N preguntas aleatorias de una categoría del banco maestro
function getRandomQuestionsByCategory(category: string, limit: number): PsychometricQuestion[] {
  const filtered = MASTER_QUESTIONS.filter(q => q.type === category);
  return shuffle(filtered).slice(0, limit);
}

// GET: Cargar o Inicializar la evaluación psicométrica de un candidato
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get('candidateId');

  if (!candidateId) {
    return NextResponse.json({ error: 'candidateId requerido' }, { status: 400 });
  }

  try {
    // 1. Verificar si existe el candidato en email_resumes
    const { data: candidate, error: candidateError } = await supabase
      .from('email_resumes')
      .select('id, sender_name, position, sender_email')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado en el sistema' }, { status: 404 });
    }

    // 2. Buscar si ya tiene una prueba psicométrica creada
    const { data: test, error: testError } = await supabase
      .from('candidate_psychometric_tests')
      .select('*')
      .eq('resume_id', candidateId)
      .maybeSingle();

    if (test) {
      // Retornar prueba existente junto con detalles del candidato
      return NextResponse.json({
        success: true,
        candidate,
        test
      });
    }

    // 3. Si no existe, crear una nueva evaluación psicométrica con preguntas aleatorias
    const generatedQuestions = {
      verbal: getRandomQuestionsByCategory('verbal', 10),
      espacial: getRandomQuestionsByCategory('espacial', 5),
      logico: getRandomQuestionsByCategory('logico', 5),
      numerico: getRandomQuestionsByCategory('numerico', 5),
      abstracto: getRandomQuestionsByCategory('abstracto', 5),
      ethics: getRandomQuestionsByCategory('ethics', 5),
      kudert: getRandomQuestionsByCategory('kudert', 16) // Las 16 de Kudert (4 por dimensión)
    };

    const initialSectionsStatus = {
      verbal: 'PENDIENTE',
      espacial: 'PENDIENTE',
      logico: 'PENDIENTE',
      numerico: 'PENDIENTE',
      abstracto: 'PENDIENTE',
      ethics: 'PENDIENTE',
      kudert: 'PENDIENTE'
    };

    const { data: newTest, error: insertError } = await supabase
      .from('candidate_psychometric_tests')
      .insert({
        resume_id: candidateId,
        status: 'INICIADO',
        started_at: new Date().toISOString(),
        sections_status: initialSectionsStatus,
        generated_questions: generatedQuestions,
        answers: {}
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Error creando prueba: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      candidate,
      test: newTest
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Enviar y calificar las respuestas de una sección
export async function POST(req: NextRequest) {
  try {
    const { candidateId, section, answers: sectionAnswers } = await req.json();

    if (!candidateId || !section || !sectionAnswers) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // 1. Obtener la prueba actual
    const { data: test, error: testError } = await supabase
      .from('candidate_psychometric_tests')
      .select('*')
      .eq('resume_id', candidateId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: 'Prueba no encontrada' }, { status: 404 });
    }

    const generatedQuestions = test.generated_questions || {};
    const currentAnswers = test.answers || {};
    const sectionsStatus = test.sections_status || {};

    const questionsList: PsychometricQuestion[] = generatedQuestions[section] || [];
    
    if (questionsList.length === 0) {
      return NextResponse.json({ error: `No se encontraron preguntas generadas para la sección: ${section}` }, { status: 400 });
    }

    let calculatedScore = 0;
    let kudertDiscResults = test.kudert_disc || {};

    // 2. Calcular los puntajes de la sección
    if (section === 'kudert') {
      // Kudert / DISC: Respuestas de 1 a 5. Dimensiones D, I, S, C
      const totals = { D: 0, I: 0, S: 0, C: 0 };
      const counts = { D: 0, I: 0, S: 0, C: 0 };

      questionsList.forEach((q: any) => {
        const answerVal = parseInt(sectionAnswers[q.id] || '3'); // por defecto 3 (neutro) si no contestó
        const dim = q.dimension as 'D' | 'I' | 'S' | 'C';
        if (dim) {
          totals[dim] += answerVal;
          counts[dim]++;
        }
      });

      // Calcular porcentaje para cada dimensión (sobre un máximo de 5 puntos por pregunta)
      kudertDiscResults = {
        D: Math.round((totals.D / (counts.D * 5)) * 100),
        I: Math.round((totals.I / (counts.I * 5)) * 100),
        S: Math.round((totals.S / (counts.S * 5)) * 100),
        C: Math.round((totals.C / (counts.C * 5)) * 100)
      };

    } else if (section === 'ethics') {
      // Ética: Sumar los puntajes de las opciones elegidas y sacar promedio
      let sum = 0;
      let totalEthicsQuestions = questionsList.length;

      questionsList.forEach((q: any) => {
        const userChoice = sectionAnswers[q.id];
        const matchingOption = q.options?.find((opt: any) => opt.id === userChoice);
        sum += matchingOption?.score || 0; // Si no hay respuesta, es 0 puntos
      });

      calculatedScore = Math.round(sum / totalEthicsQuestions);

    } else {
      // Secciones técnicas (verbal, espacial, logico, numerico, abstracto)
      let correctCount = 0;
      const totalQuestions = questionsList.length;

      questionsList.forEach((q: any) => {
        const userChoice = sectionAnswers[q.id];
        let isCorrect = false;

        if (q.type === 'espacial') {
          const correctOpt = q.spatialOptions?.find((opt: any) => opt.isCorrect);
          isCorrect = correctOpt && correctOpt.id === userChoice;
        } else if (q.type === 'abstracto') {
          const correctOpt = q.abstractOptions?.find((opt: any) => opt.isCorrect);
          isCorrect = correctOpt && correctOpt.id === userChoice;
        } else {
          isCorrect = q.correctAnswer === userChoice;
        }

        if (isCorrect) {
          correctCount++;
        }
      });

      calculatedScore = Math.round((correctCount / totalQuestions) * 100);
    }

    // 3. Actualizar estructuras de datos locales
    currentAnswers[section] = sectionAnswers;
    sectionsStatus[section] = 'COMPLETADO';

    // Verificar si todas las secciones han sido completadas
    const allCompleted = Object.values(sectionsStatus).every(status => status === 'COMPLETADO');
    const finalStatus = allCompleted ? 'COMPLETADO' : 'INICIADO';
    const completedAt = allCompleted ? new Date().toISOString() : null;

    // 4. Guardar en Supabase
    const updateData: any = {
      answers: currentAnswers,
      sections_status: sectionsStatus,
      status: finalStatus,
      updated_at: new Date().toISOString()
    };

    if (section === 'kudert') {
      updateData.kudert_disc = kudertDiscResults;
    } else {
      updateData[`${section}_score`] = calculatedScore;
    }

    if (completedAt) {
      updateData.completed_at = completedAt;
    }

    const { data: updatedTest, error: updateError } = await supabase
      .from('candidate_psychometric_tests')
      .update(updateData)
      .eq('resume_id', candidateId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: `Error guardando resultados: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      test: updatedTest
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
