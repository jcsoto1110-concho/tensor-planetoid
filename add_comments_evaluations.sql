-- Agregar columna comments a la tabla formative_evaluations
ALTER TABLE formative_evaluations 
ADD COLUMN IF NOT EXISTS comments TEXT;
