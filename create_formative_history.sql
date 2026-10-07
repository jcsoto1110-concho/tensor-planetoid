-- Crear tabla para el histórico permanente de evaluaciones formativas
CREATE TABLE IF NOT EXISTS public.formative_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES public.email_resumes(id) ON DELETE SET NULL,
    session_title TEXT NOT NULL,
    candidate_name TEXT,
    cedula TEXT,
    position TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    sector TEXT,
    interview_date DATE,
    interview_time TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    attended BOOLEAN DEFAULT FALSE,
    evaluators_detail TEXT,      -- Ej: "Juan Perez: 85 pts | Maria Lopez: 90 pts"
    total_score NUMERIC DEFAULT 0,
    avg_score NUMERIC DEFAULT 0,
    fase INTEGER DEFAULT 1,
    comments TEXT,               -- Comentarios consolidados de todos los evaluadores
    company_slug TEXT,
    closed_by TEXT,              -- Cédula o nombre de quien realizó el cierre
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas y descargas por fecha súper rápidas
CREATE INDEX IF NOT EXISTS idx_formative_history_date ON public.formative_history(interview_date);
CREATE INDEX IF NOT EXISTS idx_formative_history_company ON public.formative_history(company_slug);
CREATE INDEX IF NOT EXISTS idx_formative_history_cedula ON public.formative_history(cedula);
CREATE INDEX IF NOT EXISTS idx_formative_history_closed_at ON public.formative_history(closed_at);
