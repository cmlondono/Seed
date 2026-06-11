export interface DetalleInput {
  precio_unitario: number;
  cantidad: number;
  descuento: number;
}

/**
 * Pure totals calculator — no DB calls.
 * Extracted from src/actions/ventas.ts createVenta.
 */
export function calcularTotalesVenta(
  detalles: DetalleInput[],
  descuentoGlobal: number,
  taxRate: number,
): { subtotal: number; descuento: number; impuesto: number; total: number } {
  const subtotal = detalles.reduce(
    (acc, d) => acc + d.precio_unitario * d.cantidad - d.descuento,
    0,
  );
  const baseImponible = Math.max(0, subtotal - descuentoGlobal);
  const impuesto = parseFloat((baseImponible * (taxRate / 100)).toFixed(2));
  const total = parseFloat((baseImponible + impuesto).toFixed(2));

  return { subtotal, descuento: descuentoGlobal, impuesto, total };
}
