'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, getNegocioId } from '@/lib/auth';
import { z } from 'zod';
import type { Profile, UserRole } from '@/types';

export async function getUsuarios(): Promise<Profile[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as Profile[];
}

const CreateSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  role: z.enum(['admin', 'empleado']),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export async function createUsuario(prevState: unknown, formData: FormData) {
  await requireAdmin();

  const result = CreateSchema.safeParse({
    email: formData.get('email'),
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    role: formData.get('role'),
    password: formData.get('password'),
  });

  if (!result.success) return { error: result.error.issues[0].message };

  const admin = createAdminClient();
  const negocioId = await getNegocioId();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: result.data.email,
    password: result.data.password,
    email_confirm: true,
  });

  if (authError) return { error: authError.message };

  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    email: result.data.email,
    nombre: result.data.nombre,
    apellido: result.data.apellido,
    role: result.data.role,
    activo: true,
    negocio_id: negocioId,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: 'Error al crear perfil de usuario' };
  }

  revalidatePath('/usuarios');
  return { success: `Usuario ${result.data.email} creado` };
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  await supabase.from('profiles').update({ activo }).eq('id', id);
  if (!activo) {
    await admin.auth.admin.updateUserById(id, { ban_duration: '876600h' });
  } else {
    await admin.auth.admin.updateUserById(id, { ban_duration: 'none' });
  }

  revalidatePath('/usuarios');
  return { success: true };
}

export async function updateRolUsuario(id: string, role: UserRole) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) return { error: 'Error al actualizar rol' };
  revalidatePath('/usuarios');
  return { success: true };
}

export async function deleteUsuario(id: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === id) return { error: 'No puedes eliminarte a ti mismo' };

  const admin = createAdminClient();
  await admin.from('profiles').delete().eq('id', id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: 'Error al eliminar usuario' };

  revalidatePath('/usuarios');
  return { success: true };
}
