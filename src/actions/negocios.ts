'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createNegocio(prevState: unknown, formData: FormData) {
  const nombre_negocio = (formData.get('nombre_negocio') as string)?.trim();
  if (!nombre_negocio) return { error: 'Nombre requerido' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: negocio, error: negocioError } = await admin
    .from('negocios')
    .insert({ nombre: nombre_negocio })
    .select('id')
    .single();

  if (negocioError) return { error: 'Error al crear negocio' };

  const { error: profileError } = await admin
    .from('profiles')
    .update({ negocio_id: negocio.id })
    .eq('id', user.id);

  if (profileError) return { error: 'Error al actualizar perfil' };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
