'use client';

import 'temporal-polyfill/global';
import { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewWeek,
  createViewDay,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import { createClient } from '@/lib/supabase/client';
import type { Cita, Empleado, Cliente, Servicio } from '@/types';
import { CitaDetailDialog } from './cita-detail-dialog';
import { NuevaCitaDialog } from './nueva-cita-dialog';
import { Badge } from '@/components/ui/badge';

const TZ = 'America/Bogota';

function toZDT(fecha: string, hora: string) {
  const h = hora.length > 5 ? hora.substring(0, 5) : hora;
  return Temporal.ZonedDateTime.from(`${fecha}T${h}:00[${TZ}]`);
}

function citaToEvent(cita: Cita) {
  return {
    id: cita.id,
    title: `${cita.cliente?.nombre ?? 'Sin cliente'} · ${cita.servicio?.nombre ?? ''}`,
    start: toZDT(cita.fecha, cita.hora_inicio),
    end: toZDT(cita.fecha, cita.hora_fin),
    calendarId: cita.empleado_id,
    _cita: cita,
  };
}

function hexWithAlpha(hex: string, alpha: number) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}

interface Props {
  citas: Cita[];
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
}

function EmployeeColorStyles({ empleados }: { empleados: Empleado[] }) {
  useEffect(() => {
    const css = empleados
      .filter(e => e.activo && e.color_calendario)
      .map(emp => {
        const c = emp.color_calendario;
        const cLight = hexWithAlpha(c, 0.15);
        return `.sx__calendar-wrapper{--sx-color-${emp.id}:${c};--sx-color-${emp.id}-container:${cLight};--sx-color-on-${emp.id}-container:${c};}`;
      })
      .join('');
    let el = document.getElementById('sx-employee-colors');
    if (!el) {
      el = document.createElement('style');
      el.id = 'sx-employee-colors';
      document.head.appendChild(el);
    }
    el.textContent = css;
    return () => { document.getElementById('sx-employee-colors')?.remove(); };
  }, [empleados]);
  return null;
}

export function CalendarioView({ citas: initialCitas, empleados, clientes, servicios }: Props) {
  const [citas, setCitas] = useState<Cita[]>(initialCitas);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [newCitaDate, setNewCitaDate] = useState<string | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('all');

  const filteredCitas = filtroEmpleado === 'all'
    ? citas
    : citas.filter((c) => c.empleado_id === filtroEmpleado);

  const calendarsConfig: Record<string, { colorName: string; lightColors: { main: string; container: string; onContainer: string } }> = {};
  for (const emp of empleados.filter(e => e.activo)) {
    const color = emp.color_calendario ?? '#3b82f6';
    calendarsConfig[emp.id] = {
      colorName: emp.id,
      lightColors: {
        main: color,
        container: hexWithAlpha(color, 0.15),
        onContainer: color,
      },
    };
  }

  const calendar = useCalendarApp({
    views: [createViewWeek(), createViewDay(), createViewMonthGrid(), createViewMonthAgenda()],
    events: filteredCitas.map(citaToEvent),
    locale: 'es-ES',
    calendars: calendarsConfig,
    defaultView: 'week',
    isDark: true,
    dayBoundaries: { start: '07:00', end: '21:00' },
    weekOptions: { gridHeight: 650, gridStep: 30 },
    callbacks: {
      onEventClick(event) {
        const cita = (event as Record<string, unknown>)._cita as Cita;
        if (cita) setSelectedCita(cita);
      },
      onClickDateTime(dateTime) {
        setNewCitaDate(dateTime.toPlainDate().toString());
      },
    },
  });

  useEffect(() => {
    if (!calendar) return;
    calendar.events.set(filteredCitas.map(citaToEvent));
  }, [citas, filtroEmpleado]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('citas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
        fetch('/api/citas/realtime').then(r => r.json()).then(data => {
          if (data.citas) setCitas(data.citas);
        }).catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={filtroEmpleado === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFiltroEmpleado('all')}
        >
          Todos
        </Badge>
        {empleados.filter(e => e.activo).map(emp => (
          <Badge
            key={emp.id}
            variant={filtroEmpleado === emp.id ? 'default' : 'outline'}
            className="cursor-pointer gap-1.5"
            style={filtroEmpleado === emp.id
              ? { backgroundColor: emp.color_calendario, borderColor: emp.color_calendario }
              : {}}
            onClick={() => setFiltroEmpleado(emp.id)}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: emp.color_calendario }} />
            {emp.nombre} {emp.apellido}
          </Badge>
        ))}
      </div>

      <EmployeeColorStyles empleados={empleados} />

      <div className="sx-wrapper rounded-xl overflow-hidden border border-border shadow-sm">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>

      {selectedCita && (
        <CitaDetailDialog
          cita={selectedCita}
          open={!!selectedCita}
          onClose={() => setSelectedCita(null)}
          onUpdate={(updatedCita) => {
            setCitas(prev => prev.map(c => c.id === updatedCita.id ? updatedCita : c));
            setSelectedCita(null);
          }}
          onDelete={(citaId) => {
            setCitas(prev => prev.filter(c => c.id !== citaId));
            setSelectedCita(null);
          }}
        />
      )}

      {newCitaDate && (
        <NuevaCitaDialog
          open={!!newCitaDate}
          defaultFecha={newCitaDate}
          onClose={() => setNewCitaDate(null)}
          onCreated={(cita) => {
            setCitas(prev => [...prev, cita]);
            setNewCitaDate(null);
          }}
          empleados={empleados}
          clientes={clientes}
          servicios={servicios}
        />
      )}
    </div>
  );
}
