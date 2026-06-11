'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import type { Configuracion } from '@/types';

const ConfigSchema = z.object({
  nombre_negocio: z.string().min(1, 'Requerido'),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  moneda: z.string().optional(),
  simbolo_moneda: z.string().optional(),
  porcentaje_impuesto: z.coerce.number().min(0).max(100),
  zona_horaria: z.string().optional(),
  hora_apertura: z.string().optional(),
  hora_cierre: z.string().optional(),
  color_primario: z.string().optional(),
  email_hora_envio: z.coerce.number().int().min(0).max(23).default(12),
  email_asunto: z.string().optional(),
  email_cuerpo: z.string().optional(),
});

export async function getConfiguracion(): Promise<Configuracion | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('configuracion').select('*').single();
  return data;
}

export async function updateConfiguracion(prevState: unknown, formData: FormData): Promise<{ error?: string; success?: string }> {
  await requireAdmin();
  const result = ConfigSchema.safeParse({
    nombre_negocio: formData.get('nombre_negocio'),
    telefono: formData.get('telefono'),
    email: formData.get('email') || undefined,
    direccion: formData.get('direccion'),
    ciudad: formData.get('ciudad'),
    pais: formData.get('pais'),
    moneda: formData.get('moneda'),
    simbolo_moneda: formData.get('simbolo_moneda'),
    porcentaje_impuesto: formData.get('porcentaje_impuesto'),
    zona_horaria: formData.get('zona_horaria'),
    hora_apertura: formData.get('hora_apertura'),
    hora_cierre: formData.get('hora_cierre'),
    color_primario: formData.get('color_primario'),
    email_hora_envio: formData.get('email_hora_envio') ?? 12,
    email_asunto: formData.get('email_asunto') || undefined,
    email_cuerpo: formData.get('email_cuerpo') || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from('configuracion').select('id').single();

  if (existing) {
    const { error } = await supabase.from('configuracion').update(result.data).eq('id', existing.id);
    if (error) return { error: 'Error al actualizar configuración' };
  } else {
    const { error } = await supabase.from('configuracion').insert(result.data);
    if (error) return { error: 'Error al guardar configuración' };
  }

  revalidatePath('/configuracion');
  return { success: 'Configuración guardada' };
}
