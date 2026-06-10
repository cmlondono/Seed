-- ============================================================
-- SISTEMA DE CRÉDITOS — ejecutar DESPUÉS de schema.sql y rls.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creditos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id          UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
  cliente_id        UUID REFERENCES public.clientes(id),
  empleado_id       UUID REFERENCES public.empleados(id),
  total_credito     NUMERIC(10,2) NOT NULL CHECK (total_credito > 0),
  saldo_pendiente   NUMERIC(10,2) NOT NULL DEFAULT 0,
  numero_cuotas     INT NOT NULL DEFAULT 1 CHECK (numero_cuotas >= 1),
  estado            TEXT NOT NULL DEFAULT 'activo'
                      CHECK (estado IN ('activo', 'pagado', 'vencido', 'cancelado')),
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cuotas_credito (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credito_id        UUID NOT NULL REFERENCES public.creditos(id) ON DELETE CASCADE,
  numero_cuota      INT NOT NULL,
  monto             NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha_vencimiento DATE NOT NULL,
  fecha_pago        DATE,
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'pagado', 'vencido')),
  comprobante       TEXT,
  email_enviado     BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers updated_at
CREATE OR REPLACE TRIGGER creditos_updated_at
  BEFORE UPDATE ON public.creditos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE TRIGGER cuotas_credito_updated_at
  BEFORE UPDATE ON public.cuotas_credito
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE public.creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_credito ENABLE ROW LEVEL SECURITY;

-- Admins: acceso total
CREATE POLICY "admins_all_creditos" ON public.creditos
  FOR ALL USING (is_admin());

CREATE POLICY "admins_all_cuotas" ON public.cuotas_credito
  FOR ALL USING (is_admin());

-- Empleados: solo sus créditos
CREATE POLICY "empleados_own_creditos" ON public.creditos
  FOR SELECT USING (empleado_id = get_empleado_id());

CREATE POLICY "empleados_own_cuotas" ON public.cuotas_credito
  FOR SELECT USING (
    credito_id IN (
      SELECT id FROM public.creditos WHERE empleado_id = get_empleado_id()
    )
  );

-- Función para actualizar estado de créditos con todas las cuotas vencidas
CREATE OR REPLACE FUNCTION actualizar_estado_creditos_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE public.creditos c
  SET estado = 'vencido'
  WHERE c.estado = 'activo'
    AND NOT EXISTS (
      SELECT 1 FROM public.cuotas_credito cc
      WHERE cc.credito_id = c.id AND cc.estado = 'pendiente'
    )
    AND EXISTS (
      SELECT 1 FROM public.cuotas_credito cc
      WHERE cc.credito_id = c.id AND cc.estado = 'vencido'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_creditos_cliente ON public.creditos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_creditos_empleado ON public.creditos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_creditos_estado ON public.creditos(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_credito ON public.cuotas_credito(credito_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha ON public.cuotas_credito(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON public.cuotas_credito(estado);
