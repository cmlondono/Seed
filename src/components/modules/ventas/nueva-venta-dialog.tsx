'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createVenta } from '@/actions/ventas';
import { createCredito } from '@/actions/creditos';
import { searchClientes } from '@/actions/clientes';
import type { Empleado, Cliente, Servicio, Producto, Venta } from '@/types';
import { format, addMonths } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Plus, Minus, Trash2, Loader2, Search, X, ShoppingCart } from 'lucide-react';

interface CartItem {
  tipo: 'servicio' | 'producto';
  ref_id: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  descuento: number;
}

type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto' | 'credito';

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mixto', label: 'Mixto' },
  { value: 'credito', label: 'Crédito' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (venta: Venta, keepOpen?: boolean) => void;
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
  productos: Producto[];
}

export function NuevaVentaDialog({ open, onClose, onCreated, empleados, clientes, servicios, productos }: Props) {
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [numCuotas, setNumCuotas] = useState(3);
  const [fechaPrimeraCuota, setFechaPrimeraCuota] = useState('');

  // Client combobox
  const [clienteQuery, setClienteQuery] = useState('');
  const [clienteSugerencias, setClienteSugerencias] = useState<Cliente[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Remember last empleado across sales
  const lastEmpleadoRef = useRef('');

  useEffect(() => {
    setFechaPrimeraCuota(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  }, []);

  // Reset cart on open, restore last empleado
  useEffect(() => {
    if (open) {
      setCart([]);
      setClienteId(null);
      setClienteQuery('');
      setMetodoPago('efectivo');
      setDescuento(0);
      if (lastEmpleadoRef.current) setEmpleadoId(lastEmpleadoRef.current);
    }
  }, [open]);

  // Close combobox on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cart helpers
  const addToCart = (tipo: 'servicio' | 'producto', ref_id: string, descripcion: string, precio: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.ref_id === ref_id && c.tipo === tipo);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [...prev, { tipo, ref_id, descripcion, precio_unitario: precio, cantidad: 1, descuento: 0 }];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const newQty = next[index].cantidad + delta;
      if (newQty <= 0) { next.splice(index, 1); } else { next[index] = { ...next[index], cantidad: newQty }; }
      return next;
    });
  };

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  // Totals
  const subtotal = cart.reduce((s, c) => s + c.precio_unitario * c.cantidad - c.descuento, 0);
  const total = Math.max(0, subtotal - descuento);
  const montoCuota = metodoPago === 'credito' && numCuotas > 0 ? parseFloat((total / numCuotas).toFixed(2)) : 0;

  // Client search
  const handleClienteQuery = (q: string) => {
    setClienteQuery(q);
    setClienteId(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setClienteSugerencias([]); setShowSugerencias(false); return; }
    const local = clientes.filter((c) =>
      `${c.nombre} ${c.apellido ?? ''} ${c.documento_identidad ?? ''} ${c.telefono ?? ''}`.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);
    setClienteSugerencias(local);
    setShowSugerencias(true);
    searchTimeout.current = setTimeout(async () => {
      const remote = await searchClientes(q);
      setClienteSugerencias(remote);
    }, 300);
  };

  const selectCliente = (c: Cliente) => {
    setClienteId(c.id);
    setClienteQuery(`${c.nombre}${c.apellido ? ` ${c.apellido}` : ''}${c.documento_identidad ? ` · ${c.documento_identidad}` : ''}`);
    setShowSugerencias(false);
  };

  const resetAndKeepOpen = () => {
    setCart([]);
    setClienteId(null);
    setClienteQuery('');
    setMetodoPago('efectivo');
    setDescuento(0);
  };

  const submit = async (keepOpen: boolean) => {
    if (!empleadoId) { toast.error('Selecciona un empleado'); return; }
    if (cart.length === 0) { toast.error('Agrega al menos un ítem'); return; }

    setLoading(true);
    lastEmpleadoRef.current = empleadoId;

    const result = await createVenta({
      empleado_id: empleadoId,
      cliente_id: clienteId || undefined,
      metodo_pago: metodoPago,
      descuento,
      detalles: cart.map((c) => ({
        tipo: c.tipo,
        producto_id: c.tipo === 'producto' ? c.ref_id : undefined,
        servicio_id: c.tipo === 'servicio' ? c.ref_id : undefined,
        descripcion: c.descripcion,
        cantidad: c.cantidad,
        precio_unitario: c.precio_unitario,
        descuento: c.descuento,
      })),
    });

    if (result.error) {
      setLoading(false);
      toast.error(result.error);
      return;
    }

    if (metodoPago === 'credito' && result.ventaId) {
      const cr = await createCredito({
        venta_id: result.ventaId,
        cliente_id: clienteId || undefined,
        empleado_id: empleadoId,
        total_credito: total,
        numero_cuotas: numCuotas,
        fecha_primera_cuota: fechaPrimeraCuota,
      });
      if (cr.error) toast.error(`Venta creada, error en crédito: ${cr.error}`);
      else toast.success('Venta y crédito registrados');
    } else {
      toast.success('Venta registrada');
    }

    setLoading(false);
    onCreated(result.venta!, keepOpen);

    if (keepOpen) {
      resetAndKeepOpen();
    }
  };

  const empleadoNombre = empleados.find((e) => e.id === empleadoId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0">
        {/* Header: empleado + cliente */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-base mb-2">Nueva Venta</DialogTitle>
          <div className="grid grid-cols-2 gap-3">
            <Select value={empleadoId} onValueChange={(v) => { if (v) { setEmpleadoId(v); lastEmpleadoRef.current = v; } }}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Empleado *">
                  {empleadoNombre ? `${empleadoNombre.nombre} ${empleadoNombre.apellido}` : 'Empleado *'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {empleados.filter((e) => e.activo).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div ref={comboboxRef} className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="h-8 text-sm pl-8 pr-7"
                placeholder="Buscar cliente (opcional)..."
                value={clienteQuery}
                onChange={(e) => handleClienteQuery(e.target.value)}
                onFocus={() => clienteSugerencias.length > 0 && setShowSugerencias(true)}
                autoComplete="off"
              />
              {clienteQuery && (
                <button type="button" onClick={() => { setClienteQuery(''); setClienteId(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
              {showSugerencias && clienteSugerencias.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {clienteSugerencias.map((c) => (
                    <button key={c.id} type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => selectCliente(c)}>
                      <span className="font-medium">{c.nombre} {c.apellido}</span>
                      {c.documento_identidad && <span className="ml-2 text-xs text-muted-foreground">{c.documento_identidad}</span>}
                    </button>
                  ))}
                </div>
              )}
              {showSugerencias && clienteQuery && clienteSugerencias.length === 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Body: items grid | cart */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">

          {/* Items grid — click to add */}
          <div className="sm:w-[55%] border-r overflow-y-auto p-3 space-y-4">
            {servicios.filter((s) => s.activo).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Servicios</p>
                <div className="grid grid-cols-2 gap-2">
                  {servicios.filter((s) => s.activo).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addToCart('servicio', s.id, s.nombre, s.precio)}
                      className="flex flex-col items-start rounded-lg border px-3 py-2.5 text-left hover:bg-accent hover:border-primary transition-colors active:scale-95"
                    >
                      <span className="text-sm font-medium leading-tight">{s.nombre}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{formatCurrency(s.precio)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {productos.filter((p) => p.activo && p.stock > 0).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Productos</p>
                <div className="grid grid-cols-2 gap-2">
                  {productos.filter((p) => p.activo && p.stock > 0).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart('producto', p.id, p.nombre, p.precio)}
                      className="flex flex-col items-start rounded-lg border px-3 py-2.5 text-left hover:bg-accent hover:border-primary transition-colors active:scale-95"
                    >
                      <span className="text-sm font-medium leading-tight">{p.nombre}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{formatCurrency(p.precio)}</span>
                      <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {servicios.filter((s) => s.activo).length === 0 && productos.filter((p) => p.activo).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">No hay servicios ni productos activos</p>
            )}
          </div>

          {/* Cart + checkout */}
          <div className="sm:w-[45%] flex flex-col overflow-hidden">
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 gap-2">
                  <ShoppingCart className="w-9 h-9 opacity-20" />
                  <p className="text-sm">Toca un ítem para agregar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, i) => (
                    <div key={`${item.tipo}-${item.ref_id}`} className="flex items-center gap-2 rounded-lg border px-2.5 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.precio_unitario)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => updateQty(i, -1)} className="w-6 h-6 flex items-center justify-center rounded border hover:bg-accent">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.cantidad}</span>
                        <button type="button" onClick={() => updateQty(i, 1)} className="w-6 h-6 flex items-center justify-center rounded border hover:bg-accent">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => removeFromCart(i)} className="w-6 h-6 flex items-center justify-center rounded hover:text-destructive ml-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold w-14 text-right shrink-0">
                        {formatCurrency(item.precio_unitario * item.cantidad - item.descuento)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout panel */}
            <div className="border-t p-3 space-y-3 shrink-0">
              {/* Payment method buttons */}
              <div className="flex flex-wrap gap-1.5">
                {METODOS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMetodoPago(m.value)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      metodoPago === m.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Credit config */}
              {metodoPago === 'credito' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Cuotas</Label>
                      <Input type="number" min={1} max={48} value={numCuotas} onChange={(e) => setNumCuotas(Math.max(1, parseInt(e.target.value) || 1))} className="h-7 text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Primera cuota</Label>
                      <Input type="date" value={fechaPrimeraCuota} onChange={(e) => setFechaPrimeraCuota(e.target.value)} className="h-7 text-sm mt-1" min={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                  </div>
                  {total > 0 && <p className="text-xs text-blue-700 dark:text-blue-400">{numCuotas} cuotas de <strong>{formatCurrency(montoCuota)}</strong></p>}
                </div>
              )}

              {/* Discount + total */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Desc.</span>
                  <Input
                    type="number"
                    min={0}
                    value={descuento}
                    onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
                    className="h-7 w-24 text-sm text-right"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{formatCurrency(total)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || cart.length === 0 || !empleadoId}
                  onClick={() => submit(true)}
                  title="Registrar y hacer otra venta"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '+'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-[2]"
                  disabled={loading || cart.length === 0 || !empleadoId}
                  onClick={() => submit(false)}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
