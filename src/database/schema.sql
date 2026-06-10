-- ============================================================
-- SCHEMA COMPLETO - Sistema de Gestión de Citas y Ventas
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  role TEXT NOT NULL DEFAULT 'empleado' CHECK (role IN ('admin', 'empleado')),
  activo BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  duracion_minutos INTEGER NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLEADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  cargo TEXT NOT NULL DEFAULT 'Empleado',
  color_calendario TEXT NOT NULL DEFAULT '#3B82F6',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLEADO_SERVICIOS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empleado_servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES public.servicios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empleado_id, servicio_id)
);

-- ============================================================
-- HORARIOS DE EMPLEADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.horarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 1=Lun...6=Sab
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empleado_id, dia_semana),
  CONSTRAINT horario_valido CHECK (hora_fin > hora_inicio)
);

-- ============================================================
-- DESCANSOS DE EMPLEADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.descansos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT descanso_valido CHECK (hora_fin > hora_inicio)
);

-- ============================================================
-- BLOQUEOS MANUALES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bloqueos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bloqueo_valido CHECK (fecha_fin > fecha_inicio)
);

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  apellido TEXT,
  telefono TEXT,
  email TEXT,
  observaciones TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CITAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
  servicio_id UUID NOT NULL REFERENCES public.servicios(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','en_proceso','completada','cancelada','no_asistio')),
  notas TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cita_tiempo_valido CHECK (hora_fin > hora_inicio)
);

-- ============================================================
-- CATEGORIAS INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria_id UUID REFERENCES public.categorias_inventario(id) ON DELETE SET NULL,
  stock_actual NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  unidad TEXT NOT NULL DEFAULT 'unidad',
  costo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
  proveedor TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MOVIMIENTOS DE INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
  cantidad NUMERIC(10,2) NOT NULL,
  stock_anterior NUMERIC(10,2) NOT NULL,
  stock_nuevo NUMERIC(10,2) NOT NULL,
  motivo TEXT,
  referencia_id UUID, -- puede referenciar una venta
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS (para venta)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  costo NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo >= 0),
  stock NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  codigo_barras TEXT,
  inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VENTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_factura SERIAL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
  cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10,2) NOT NULL DEFAULT 0,
  impuesto NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo','transferencia','tarjeta','mixto')),
  estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('pendiente','completada','cancelada','reembolsada')),
  notas TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DETALLE DE VENTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('producto','servicio')),
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  servicio_id UUID REFERENCES public.servicios(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONFIGURACION DEL NEGOCIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_negocio TEXT NOT NULL DEFAULT 'Mi Negocio',
  logo_url TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'Colombia',
  moneda TEXT DEFAULT 'COP',
  simbolo_moneda TEXT DEFAULT '$',
  porcentaje_impuesto NUMERIC(5,2) DEFAULT 0,
  zona_horaria TEXT DEFAULT 'America/Bogota',
  hora_apertura TIME DEFAULT '08:00',
  hora_cierre TIME DEFAULT '18:00',
  color_primario TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TOKENS PÚBLICOS (reservas futuras)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tokens_publicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT false,
  expira_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_empleado ON public.citas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON public.citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_empleado ON public.ventas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario ON public.movimientos_inventario(inventario_id);
CREATE INDEX IF NOT EXISTS idx_horarios_empleado ON public.horarios(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleado_servicios_empleado ON public.empleado_servicios(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleado_servicios_servicio ON public.empleado_servicios(servicio_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.servicios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.empleados
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.horarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.inventario
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.configuracion
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-crear profile tras signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'empleado')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: descontar stock en venta
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_venta_producto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'producto' AND NEW.producto_id IS NOT NULL THEN
    UPDATE public.productos
    SET stock = stock - NEW.cantidad
    WHERE id = NEW.producto_id AND stock >= NEW.cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_detalle_venta_insert
  AFTER INSERT ON public.detalle_ventas
  FOR EACH ROW EXECUTE FUNCTION public.handle_venta_producto();
