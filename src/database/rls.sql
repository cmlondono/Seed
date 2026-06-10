-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleado_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descansos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens_publicos ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get empleado_id from profile
CREATE OR REPLACE FUNCTION public.get_empleado_id()
RETURNS UUID AS $$
  SELECT id FROM public.empleados WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin() OR id = auth.uid());

-- ============================================================
-- SERVICIOS — todos autenticados pueden ver, solo admin edita
-- ============================================================
CREATE POLICY "servicios_select_authenticated" ON public.servicios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "servicios_insert_admin" ON public.servicios
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "servicios_update_admin" ON public.servicios
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "servicios_delete_admin" ON public.servicios
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- EMPLEADOS
-- ============================================================
CREATE POLICY "empleados_select_authenticated" ON public.empleados
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "empleados_insert_admin" ON public.empleados
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "empleados_update_admin" ON public.empleados
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "empleados_delete_admin" ON public.empleados
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- EMPLEADO_SERVICIOS
-- ============================================================
CREATE POLICY "emp_svc_select_authenticated" ON public.empleado_servicios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "emp_svc_insert_admin" ON public.empleado_servicios
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "emp_svc_delete_admin" ON public.empleado_servicios
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- HORARIOS
-- ============================================================
CREATE POLICY "horarios_select_authenticated" ON public.horarios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "horarios_insert_admin" ON public.horarios
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "horarios_update_admin" ON public.horarios
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "horarios_delete_admin" ON public.horarios
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- DESCANSOS
-- ============================================================
CREATE POLICY "descansos_select_authenticated" ON public.descansos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "descansos_manage_admin" ON public.descansos
  FOR ALL USING (public.is_admin());

-- ============================================================
-- BLOQUEOS
-- ============================================================
CREATE POLICY "bloqueos_select_authenticated" ON public.bloqueos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "bloqueos_manage_admin" ON public.bloqueos
  FOR ALL USING (public.is_admin());

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE POLICY "clientes_select_authenticated" ON public.clientes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "clientes_insert_authenticated" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clientes_update_authenticated" ON public.clientes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "clientes_delete_admin" ON public.clientes
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- CITAS
-- ============================================================
CREATE POLICY "citas_select_all" ON public.citas
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin() OR
      empleado_id = public.get_empleado_id()
    )
  );

CREATE POLICY "citas_insert_authenticated" ON public.citas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "citas_update_authenticated" ON public.citas
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin() OR
      empleado_id = public.get_empleado_id()
    )
  );

CREATE POLICY "citas_delete_admin" ON public.citas
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- INVENTARIO
-- ============================================================
CREATE POLICY "inventario_select_authenticated" ON public.inventario
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "inventario_insert_admin" ON public.inventario
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "inventario_update_admin" ON public.inventario
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "inventario_delete_admin" ON public.inventario
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- CATEGORIAS INVENTARIO
-- ============================================================
CREATE POLICY "cat_inv_select_authenticated" ON public.categorias_inventario
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cat_inv_manage_admin" ON public.categorias_inventario
  FOR ALL USING (public.is_admin());

-- ============================================================
-- MOVIMIENTOS INVENTARIO
-- ============================================================
CREATE POLICY "mov_inv_select_authenticated" ON public.movimientos_inventario
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "mov_inv_insert_authenticated" ON public.movimientos_inventario
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE POLICY "productos_select_authenticated" ON public.productos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "productos_insert_admin" ON public.productos
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "productos_update_admin" ON public.productos
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "productos_delete_admin" ON public.productos
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- VENTAS
-- ============================================================
CREATE POLICY "ventas_select_all" ON public.ventas
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin() OR
      empleado_id = public.get_empleado_id()
    )
  );

CREATE POLICY "ventas_insert_authenticated" ON public.ventas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ventas_update_admin" ON public.ventas
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "ventas_delete_admin" ON public.ventas
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- DETALLE VENTAS
-- ============================================================
CREATE POLICY "detalle_ventas_select" ON public.detalle_ventas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND (
        public.is_admin() OR v.empleado_id = public.get_empleado_id()
      )
    )
  );

CREATE POLICY "detalle_ventas_insert" ON public.detalle_ventas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- CONFIGURACION — solo admin
-- ============================================================
CREATE POLICY "config_select_admin" ON public.configuracion
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "config_manage_admin" ON public.configuracion
  FOR ALL USING (public.is_admin());

-- ============================================================
-- TOKENS PUBLICOS — solo admin
-- ============================================================
CREATE POLICY "tokens_manage_admin" ON public.tokens_publicos
  FOR ALL USING (public.is_admin());
