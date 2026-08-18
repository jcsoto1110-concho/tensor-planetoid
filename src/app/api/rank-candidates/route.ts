import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { cargo, ciudad, funciones, apiKey, cedula, company_slug, filterSector, filterCiudad, filterRegion, filterEdad, filterGenero } = await req.json();
    const openaiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();

    if (!openaiKey) return NextResponse.json({ error: 'Falta API Key de OpenAI' }, { status: 401 });

    const openai = new OpenAI({ apiKey: openaiKey });

    // 1. Cargar candidatos filtrados por empresa de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('email_resumes')
      .select('*')
      .neq('classification_status', 'DELETED')
      .gte('received_date', thirtyDaysAgo.toISOString());

    // Filtrar por empresa si viene el slug
    if (company_slug) {
      query = query.eq('company_slug', company_slug);
    } else if (cedula) {
      // Fallback: filtrar por usuario si no hay empresa
      query = query.eq('created_by_cedula', cedula);
    }

    let { data: resumes, error: dbError } = await query;

    if (dbError) throw dbError;

    // Si no hay candidatos en los últimos 30 días, buscar en los últimos 90 días como fallback
    if (!resumes || resumes.length === 0) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      let fallbackQuery = supabase
        .from('email_resumes')
        .select('*')
        .neq('classification_status', 'DELETED')
        .gte('received_date', ninetyDaysAgo.toISOString());

      if (company_slug) {
        fallbackQuery = fallbackQuery.eq('company_slug', company_slug);
      } else if (cedula) {
        fallbackQuery = fallbackQuery.eq('created_by_cedula', cedula);
      }

      const { data: fallbackResumes, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;
      resumes = fallbackResumes;
    }

    if (!resumes || resumes.length === 0) {
      return NextResponse.json({ error: 'No hay candidatos recientes (últimos 90 días) en la base de datos para esta empresa.' }, { status: 404 });
    }

    // 2. Pre-filtrar por Sector, Ciudad, Región, Edad, Género
    let finalResumes = resumes;

    if (filterSector && filterSector !== 'ALL') {
      finalResumes = finalResumes.filter(r => r.sector && r.sector.toLowerCase() === filterSector.toLowerCase());
    }

    if (filterCiudad) {
      finalResumes = finalResumes.filter(r => r.city && r.city.toLowerCase().includes(filterCiudad.toLowerCase()));
    }

    if (filterRegion && filterRegion !== 'ALL') {
      finalResumes = finalResumes.filter(r => {
        const reg = getRegionByCity(r.city || '');
        return reg.toLowerCase() === filterRegion.toLowerCase();
      });
    }

    if (filterEdad && filterEdad !== 'ALL') {
      finalResumes = finalResumes.filter(r => {
        if (!r.age) return false;
        const ageNum = parseInt(r.age, 10);
        if (isNaN(ageNum)) return false;
        if (filterEdad === '18-25') return ageNum >= 18 && ageNum <= 25;
        if (filterEdad === '26-35') return ageNum >= 26 && ageNum <= 35;
        if (filterEdad === '36-45') return ageNum >= 36 && ageNum <= 45;
        if (filterEdad === '46+') return ageNum >= 46;
        return true;
      });
    }

    if (filterGenero && filterGenero !== 'ALL') {
      finalResumes = finalResumes.filter(r => {
        const gen = r.gender || inferGender(r.sender_name || '');
        return gen.toLowerCase() === filterGenero.toLowerCase();
      });
    }

    // 3. Pre-filtrar por palabras clave del cargo buscado
    if (cargo) {
      const cargoKeywords = cargo.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      if (cargoKeywords.length > 0) {
        const keywordMatched = finalResumes.filter(r => {
          const pos = (r.position || '').toLowerCase();
          return cargoKeywords.some((word: string) => pos.includes(word));
        });
        if (keywordMatched.length > 0) {
          finalResumes = keywordMatched;
        }
      }
    }

    if (finalResumes.length === 0) {
      return NextResponse.json({ error: 'No se encontraron candidatos que coincidan con los filtros aplicados (Sector, Ciudad, Región, Edad, Género).' }, { status: 404 });
    }

    // 3. Limitar a un máximo de 60 candidatos (los más recientes) para prevenir desbordamiento de contexto
    finalResumes = finalResumes
      .sort((a, b) => new Date(b.received_date || 0).getTime() - new Date(a.received_date || 0).getTime())
      .slice(0, 60);

    const perfiles = finalResumes.map(r => {
      return `[ID: ${r.id}] 
      Nombre: ${r.sender_name}
      Cargo: ${r.position}
      Experiencia: ${r.experience_years}
      Logro: ${r.main_achievement || 'No especificado'}
      Herramientas: ${r.key_tools || 'No especificado'}
      Resumen: ${r.ai_summary}`;
    }).join('\n\n');

    const prompt = `Evalúa a TODOS los ${finalResumes.length} candidatos para el cargo "${cargo}" en "${ciudad}".
    REQUISITOS: ${funciones}
    
    CANDIDATOS A EVALUAR:
    ${perfiles}
    
    INSTRUCCIÓN CRÍTICA: Debes incluir obligatoriamente a los ${finalResumes.length} candidatos en tu respuesta. No omitas a ninguno.
    Responde ÚNICAMENTE con un objeto JSON que tenga una propiedad "rankings": [{"id": "...", "score": 0-100, "justification": "..."}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

// Funciones auxiliares para filtrado
function getRegionByCity(city: string): 'Costa' | 'Sierra' | 'Oriente' | 'Insular' | 'Otro' {
  if (!city) return 'Otro';
  const normCity = city.toLowerCase();
  
  const costaCities = ['guayaquil', 'samborondon', 'samborondón', 'vía la costa', 'via la costa', 'manta', 'portoviejo', 'machala', 'esmeraldas', 'salinas', 'libertad', 'babahoyo', 'quevedo', 'milagro', 'chone', 'bahia', 'bahía', 'daule', 'durán', 'duran', 'santa elena', 'jipijapa', 'montecristi'];
  const sierraCities = ['quito', 'cumbaya', 'cumbayá', 'valle de los chillos', 'valle chillos', 'los chillos', 'cuenca', 'ambato', 'riobamba', 'loja', 'ibarra', 'latacunga', 'tulcán', 'tulcan', 'guaranda', 'azogues', 'otavalo', 'cayambe', 'sangolquí', 'sangolqui', 'machachi', 'baños', 'banos'];
  const orienteCities = ['coca', 'lago agrio', 'nueva loja', 'tena', 'puyo', 'macas', 'zamora', 'archidona', 'shushufindi', 'yantzaza'];
  const insularCities = ['galapagos', 'galápagos', 'santa cruz', 'san cristobal', 'san cristóbal', 'isabela', 'puerto baquerizo', 'puerto ayora'];

  if (costaCities.some(c => normCity.includes(c))) return 'Costa';
  if (sierraCities.some(c => normCity.includes(c))) return 'Sierra';
  if (orienteCities.some(c => normCity.includes(c))) return 'Oriente';
  if (insularCities.some(c => normCity.includes(c))) return 'Insular';

  return 'Otro';
}

function inferGender(name: string): 'Masculino' | 'Femenino' | 'Otro' {
  if (!name) return 'Otro';
  const firstName = name.trim().split(' ')[0].toLowerCase();
  
  const maleNames = ['juan', 'luis', 'jose', 'carlos', 'angel', 'miguel', 'david', 'jorge', 'ramon', 'felix', 'adrian', 'christian', 'cristian', 'esteban', 'german', 'hernando', 'ivan', 'joaquin', 'martin', 'oscar', 'ruben', 'sebastian', 'victor', 'hector', 'cesar', 'walter', 'raul', 'manuel', 'daniel', 'gabriel', 'rafael', 'samuel', 'javier', 'alex', 'ariel', 'rene'];
  const femaleNames = ['maria', 'carmen', 'isabel', 'pilar', 'dolores', 'beatriz', 'lourdes', 'mercedes', 'raquel', 'irene', 'ester', 'ruth', 'judith', 'miriam', 'elizabeth', 'ines', 'abigail', 'belen', 'consuelo', 'socorro', 'sol'];

  if (femaleNames.includes(firstName)) return 'Femenino';
  if (maleNames.includes(firstName)) return 'Masculino';

  if (firstName.endsWith('a')) {
    return 'Femenino';
  }
  
  return 'Masculino';
}
