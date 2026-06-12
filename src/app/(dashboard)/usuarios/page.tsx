import { getUsuarios } from '@/actions/usuarios';
import { UsuariosClient } from '@/components/modules/usuarios/usuarios-client';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const usuarios = await getUsuarios();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground text-sm">Gestiona los usuarios con acceso al sistema</p>
      </div>
      <UsuariosClient usuarios={usuarios} />
    </div>
  );
}
