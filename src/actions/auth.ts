'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export async function login(prevState: unknown, formData: FormData) {
  const result = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: 'Credenciales inválidas' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Email requerido' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
  });

  if (error) return { error: 'Error al enviar correo' };
  return { success: 'Revisa tu correo' };
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function register(prevState: unknown, formData: FormData) {
  const nombre = (formData.get('nombre') as string)?.trim();
  const apellido = (formData.get('apellido') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const nombre_negocio = (formData.get('nombre_negocio') as string)?.trim();

  if (!nombre || !apellido || !email || !password || !nombre_negocio) {
    return { error: 'Todos los campos son requeridos' };
  }
  if (password.length < 6) return { error: 'Contraseña mínimo 6 caracteres' };

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return { error: authError.message };

  // Create negocio
  const { data: negocio, error: negocioError } = await admin
    .from('negocios')
    .insert({ nombre: nombre_negocio })
    .select('id')
    .single();

  if (negocioError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: 'Error al crear negocio' };
  }

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    email,
    nombre,
    apellido,
    role: 'admin',
    activo: true,
    negocio_id: negocio.id,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await admin.from('negocios').delete().eq('id', negocio.id);
    return { error: 'Error al crear perfil' };
  }

  // Sign in the new user
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
