-- ============================================================
-- MIGRACIONES — ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Audit trail: guardar referencia al item de inventario en cada línea de venta
ALTER TABLE public.detalle_ventas
  ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_inventario ON public.detalle_ventas(inventario_id);

-- 2. Unicidad: una cita solo puede estar en una venta activa
--    (nulls se permiten múltiples veces en columnas UNIQUE en PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cita_id_unique'
  ) THEN
    ALTER TABLE public.ventas ADD CONSTRAINT ventas_cita_id_unique UNIQUE (cita_id);
  END IF;
END $$;

-- 3. Columna documento_identidad en clientes (si no se ejecutó antes)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS documento_identidad TEXT;

CREATE INDEX IF NOT EXISTS idx_clientes_documento ON public.clientes(documento_identidad);
