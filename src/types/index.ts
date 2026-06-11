// ============================================================
// DATABASE TYPES — matches Supabase schema
// ============================================================

export type UserRole = 'admin' | 'empleado';

export type EstadoCita = 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' | 'no_asistio';

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto' | 'credito';
export type EstadoCredito = 'activo' | 'pagado' | 'vencido' | 'cancelado';
export type EstadoCuota = 'pendiente' | 'pagado' | 'vencido';

export type EstadoVenta = 'pendiente' | 'completada' | 'cancelada' | 'reembolsada';

export type TipoDetalleVenta = 'producto' | 'servicio';

// ============================================================
// PROFILE
// ============================================================
export interface Profile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  role: UserRole;
  activo: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SERVICIO
// ============================================================
export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EMPLEADO
// ============================================================
export interface Empleado {
  id: string;
  profile_id?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  cargo: string;
  color_calendario: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // relations
  profile?: Profile;
  servicios?: Servicio[];
  horarios?: Horario[];
}

// ============================================================
// HORARIO
// ============================================================
export interface Horario {
  id: string;
  empleado_id: string;
  dia_semana: number; // 0=Dom, 1=Lun...6=Sab
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Descanso {
  id: string;
  empleado_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
}

export interface Bloqueo {
  id: string;
  empleado_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo?: string;
  created_at: string;
}

// ============================================================
// CLIENTE
// ============================================================
export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  documento_identidad?: string;
  observaciones?: string;
  activo: boolean;
  fecha_registro: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CITA
// ============================================================
export interface Cita {
  id: string;
  cliente_id: string;
  empleado_id: string;
  servicio_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio: number;
  estado: EstadoCita;
  notas?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // relations
  cliente?: Cliente;
  empleado?: Empleado;
  servicio?: Servicio;
}

// ============================================================
// INVENTARIO
// ============================================================
export interface CategoriaInventario {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface Inventario {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  costo_unitario: number;
  precio_venta: number;
  proveedor?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // relations
  categoria?: CategoriaInventario;
}

export interface MovimientoInventario {
  id: string;
  inventario_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  referencia_id?: string;
  created_by?: string;
  created_at: string;
  // relations
  inventario?: Inventario;
  profile?: Profile;
}

// ============================================================
// PRODUCTO
// ============================================================
export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo: number;
  stock: number;
  codigo_barras?: string;
  inventario_id?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  inventario?: Inventario;
}

// ============================================================
// VENTA
// ============================================================
export interface Venta {
  id: string;
  numero_factura: number;
  cliente_id?: string;
  empleado_id: string;
  cita_id?: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodo_pago: MetodoPago;
  estado: EstadoVenta;
  notas?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // relations
  cliente?: Cliente;
  empleado?: Empleado;
  cita?: Cita;
  detalles?: DetalleVenta[];
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  tipo: TipoDetalleVenta;
  producto_id?: string;
  inventario_id?: string;
  servicio_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  created_at: string;
  // relations
  producto?: Producto;
  inventario?: Inventario;
  servicio?: Servicio;
}

// ============================================================
// CONFIGURACION
// ============================================================
export interface Configuracion {
  id: string;
  nombre_negocio: string;
  logo_url?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  pais: string;
  moneda: string;
  simbolo_moneda: string;
  porcentaje_impuesto: number;
  zona_horaria: string;
  hora_apertura: string;
  hora_cierre: string;
  color_primario: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// DASHBOARD
// ============================================================
export interface DashboardStats {
  ventas_hoy: number;
  ventas_mes: number;
  citas_hoy: number;
  citas_pendientes: number;
  clientes_nuevos_mes: number;
  items_bajo_stock: number;
}

export interface VentasPorDia {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface ServicioTop {
  servicio_id: string;
  nombre: string;
  total_citas: number;
  ingresos: number;
}

export interface EmpleadoTop {
  empleado_id: string;
  nombre: string;
  total_citas: number;
  ingresos: number;
}

// ============================================================
// FORMS
// ============================================================
export interface CitaFormData {
  cliente_id: string;
  empleado_id: string;
  servicio_id: string;
  fecha: string;
  hora_inicio: string;
  notas?: string;
}

export interface VentaFormData {
  cliente_id?: string;
  empleado_id: string;
  cita_id?: string;
  metodo_pago: MetodoPago;
  descuento: number;
  notas?: string;
  detalles: DetalleVentaFormData[];
}

export interface DetalleVentaFormData {
  tipo: TipoDetalleVenta;
  producto_id?: string;
  servicio_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
}

// ============================================================
// CRÉDITOS
// ============================================================
export interface Credito {
  id: string;
  venta_id: string;
  cliente_id?: string;
  empleado_id: string;
  total_credito: number;
  saldo_pendiente: number;
  numero_cuotas: number;
  estado: EstadoCredito;
  notas?: string;
  created_at: string;
  updated_at: string;
  // relations
  cliente?: Cliente;
  empleado?: Empleado;
  venta?: Venta;
  cuotas?: CuotaCredito[];
}

export interface CuotaCredito {
  id: string;
  credito_id: string;
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago?: string;
  estado: EstadoCuota;
  comprobante?: string;
  email_enviado: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CALENDAR EVENTS
// ============================================================
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    cita: Cita;
  };
}

// ============================================================
// API RESPONSES
// ============================================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
