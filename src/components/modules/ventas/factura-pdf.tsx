'use client';

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import type { Venta } from '@/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    padding: '4 10',
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'flex-start',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: '#999',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 10,
    color: '#222',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: '8 10',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: '7 10',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
    marginBottom: 4,
  },
  totalsLabel: { flex: 1, color: '#6b7280', fontSize: 10 },
  totalsValue: { width: 80, textAlign: 'right', fontSize: 10 },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    marginTop: 4,
  },
  totalFinalLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
  },
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

function formatMoney(v: number) {
  return `$${new Intl.NumberFormat('es-CO').format(v)}`;
}

function FacturaDocument({ venta, nombreNegocio }: { venta: Venta; nombreNegocio: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{nombreNegocio}</Text>
            <Text style={styles.subtitle}>Factura de venta</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.badge}>
              <Text>FACTURA #{String(venta.numero_factura).padStart(4, '0')}</Text>
            </View>
            <Text style={[styles.subtitle, { marginTop: 8 }]}>
              {new Date(venta.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>
              {venta.cliente ? `${venta.cliente.nombre} ${venta.cliente.apellido ?? ''}` : 'Cliente general'}
            </Text>
            {venta.cliente?.telefono && <Text style={[styles.infoValue, { color: '#6b7280', marginTop: 2 }]}>{venta.cliente.telefono}</Text>}
            {venta.cliente?.email && <Text style={[styles.infoValue, { color: '#6b7280', marginTop: 2 }]}>{venta.cliente.email}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Atendido por</Text>
            <Text style={styles.infoValue}>{venta.empleado?.nombre} {venta.empleado?.apellido}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Método de pago</Text>
            <Text style={styles.infoValue} />
            {[['efectivo','Efectivo'],['transferencia','Transferencia'],['tarjeta','Tarjeta'],['mixto','Mixto']].find(([v]) => v === venta.metodo_pago)?.at(1) ?? venta.metodo_pago}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colDesc]}>Descripción</Text>
          <Text style={[styles.headerText, styles.colQty]}>Cant.</Text>
          <Text style={[styles.headerText, styles.colPrice]}>P. Unit.</Text>
          <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
        </View>

        {/* Table Rows */}
        {(venta.detalles ?? []).map((d, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{d.descripcion}</Text>
            <Text style={styles.colQty}>{d.cantidad}</Text>
            <Text style={styles.colPrice}>{formatMoney(d.precio_unitario)}</Text>
            <Text style={styles.colTotal}>{formatMoney(d.subtotal)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatMoney(venta.subtotal)}</Text>
          </View>
          {venta.descuento > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Descuento</Text>
              <Text style={[styles.totalsValue, { color: '#ef4444' }]}>-{formatMoney(venta.descuento)}</Text>
            </View>
          )}
          {venta.impuesto > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>IVA</Text>
              <Text style={styles.totalsValue}>{formatMoney(venta.impuesto)}</Text>
            </View>
          )}
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>TOTAL</Text>
            <Text style={styles.totalFinalValue}>{formatMoney(venta.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generado el {new Date().toLocaleDateString('es-CO')}</Text>
          <Text style={styles.footerText}>Gracias por su preferencia</Text>
        </View>
      </Page>
    </Document>
  );
}

interface Props {
  venta: Venta;
  nombreNegocio?: string;
}

export function FacturaPDFButton({ venta, nombreNegocio = 'Mi Negocio' }: Props) {
  return (
    <PDFDownloadLink
      document={<FacturaDocument venta={venta} nombreNegocio={nombreNegocio} />}
      fileName={`factura-${String(venta.numero_factura).padStart(4, '0')}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className="gap-2">
          <Download className="w-3.5 h-3.5" />
          {loading ? 'Generando...' : 'Descargar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
