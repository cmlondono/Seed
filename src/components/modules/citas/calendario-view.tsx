'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { createClient } from '@/lib/supabase/client';
import type { Cita, Empleado, Cliente, Servicio, CalendarEvent } from '@/types';
import { CitaDetailDialog } from './cita-detail-dialog';
import { NuevaCitaDialog } from './nueva-cita-dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  citas: Cita[];
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
}

export function CalendarioView({ citas: initialCitas, empleados, clientes, servicios }: Props) {
  const [citas, setCitas] = useState<Cita[]>(initialCitas);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [newCitaDate, setNewCitaDate] = useState<string | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('citas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
        // Reload citas from server
        fetch('/api/citas/realtime').then((r) => r.json()).then((data) => {
          if (data.citas) setCitas(data.citas);
        }).catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredCitas = filtroEmpleado === 'all'
    ? citas
    : citas.filter((c) => c.empleado_id === filtroEmpleado);

  const events: CalendarEvent[] = filteredCitas.map((cita) => ({
    id: cita.id,
    title: `${cita.cliente?.nombre ?? ''} - ${cita.servicio?.nombre ?? ''}`,
    start: `${cita.fecha}T${cita.hora_inicio}`,
    end: `${cita.fecha}T${cita.hora_fin}`,
    backgroundColor: cita.empleado?.color_calendario ?? '#3B82F6',
    borderColor: cita.empleado?.color_calendario ?? '#3B82F6',
    extendedProps: { cita },
  }));

  const handleEventClick = useCallback((info: EventClickArg) => {
    setSelectedCita((info.event.extendedProps as { cita: Cita }).cita);
  }, []);

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    setNewCitaDate(info.startStr.split('T')[0]);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filtros por empleado */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={filtroEmpleado === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFiltroEmpleado('all')}
        >
          Todos
        </Badge>
        {empleados.filter((e) => e.activo).map((emp) => (
          <Badge
            key={emp.id}
            variant={filtroEmpleado === emp.id ? 'default' : 'outline'}
            className="cursor-pointer gap-1.5"
            style={filtroEmpleado === emp.id ? { backgroundColor: emp.color_calendario, borderColor: emp.color_calendario } : {}}
            onClick={() => setFiltroEmpleado(emp.id)}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: emp.color_calendario }}
            />
            {emp.nombre} {emp.apellido}
          </Badge>
        ))}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-1">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            headerToolbar={isMobile ? {
              left: 'prev,next',
              center: 'title',
              right: 'listWeek,dayGridMonth',
            } : {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            locale={esLocale}
            initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
            events={events as never[]}
            eventClick={handleEventClick}
            selectable={!isMobile}
            select={handleDateSelect}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            nowIndicator
            businessHours={{ daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '19:00' }}
            eventContent={(info) => (
              <div className="px-1 py-0.5 overflow-hidden">
                <p className="text-xs font-medium truncate">{info.event.title}</p>
                <p className="text-xs opacity-80">{info.timeText}</p>
              </div>
            )}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Lista',
            }}
          />
        </div>
      </Card>

      {selectedCita && (
        <CitaDetailDialog
          cita={selectedCita}
          open={!!selectedCita}
          onClose={() => setSelectedCita(null)}
          onUpdate={(updatedCita) => {
            setCitas((prev) => prev.map((c) => c.id === updatedCita.id ? updatedCita : c));
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
            setCitas((prev) => [...prev, cita]);
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
