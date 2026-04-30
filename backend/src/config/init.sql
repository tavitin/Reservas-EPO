-- Sistema de Reservas EPO

CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'maestro')),
    activo        BOOLEAN DEFAULT true,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recursos (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    tipo        VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservas (
    id           SERIAL PRIMARY KEY,
    usuario_id   INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    recurso_id   INTEGER REFERENCES recursos(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin    TIMESTAMP NOT NULL,
    estado       VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada')),
    notas        TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fecha_valida CHECK (fecha_inicio < fecha_fin)
);

CREATE INDEX IF NOT EXISTS idx_reservas_recurso_horario
ON reservas(recurso_id, fecha_inicio, fecha_fin)
WHERE estado = 'confirmada';

-- Migración: campos de recepción/entrega de artículos
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS firma_base64       TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comentario_entrega TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_entrega      TIMESTAMPTZ;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS recibido_por       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;

-- Migración: ampliar CHECK de estado para incluir 'completada'
DO $$BEGIN
  ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_estado_check;
  ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check
    CHECK (estado IN ('confirmada', 'cancelada', 'completada'));
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
