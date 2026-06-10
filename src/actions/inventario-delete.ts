'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function deleteInventarioItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('inventario').update({ activo: false }).eq('id', id);
  if (error) return { error: 'Error al eliminar item' };
  revalidatePath('/inventario');
  return { success: true };
}
