import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const inicio = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const fin = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('citas')
    .select('*, cliente:clientes(*), empleado:empleados(*), servicio:servicios(*)')
    .gte('fecha', inicio)
    .lte('fecha', fin)
    .order('fecha')
    .order('hora_inicio');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ citas: data });
}
