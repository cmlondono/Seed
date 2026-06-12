import { getCitas } from '@/actions/citas';
import { getEmpleados } from '@/actions/empleados';
import { getClientes } from '@/actions/clientes';
import { getServicios } from '@/actions/servicios';
import { CalendarioView } from '@/components/modules/citas/calendario-view';
import { NuevaCitaButton } from '@/components/modules/citas/nueva-cita-button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CitasPage() {
  const inicio = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const fin = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  const isAdmin = profile?.role === 'admin';

  let empleadoId: string | undefined;
  if (!isAdmin) {
    const { data: emp } = await supabase.from('empleados').select('id').eq('profile_id', user!.id).single();
    empleadoId = emp?.id;
  }

  const [citas, empleados, clientes, servicios] = await Promise.all([
    getCitas({ desde: inicio, hasta: fin, ...(empleadoId ? { empleado_id: empleadoId } : {}) }),
    getEmpleados(),
    getClientes(),
    getServicios(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground text-sm">Gestión de agenda y calendario</p>
        </div>
        <NuevaCitaButton empleados={empleados} clientes={clientes} servicios={servicios} />
      </div>

      <CalendarioView
        citas={citas}
        empleados={empleados}
        clientes={clientes}
        servicios={servicios}
      />
    </div>
  );
}
