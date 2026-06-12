'use client';

import { useState, useActionState } from 'react';
import { toast } from 'sonner';
import { createUsuario, toggleUsuarioActivo, updateRolUsuario, deleteUsuario, changeUserPasswordAdmin } from '@/actions/usuarios';
import type { Profile, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, Trash2, UserCheck, UserX, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { usuarios: Profile[] }

export function UsuariosClient({ usuarios: initialUsuarios }: Props) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [open, setOpen] = useState(false);
  const [rolLoading, setRolLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [nuevoRol, setNuevoRol] = useState<UserRole>('empleado');
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [, formAction, isPending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await createUsuario(prev, formData);
    if (result.error) { toast.error(result.error); return result; }
    toast.success(result.success);
    setOpen(false);
    // Refresh list via revalidate
    window.location.reload();
    return result;
  }, null);

  const handleToggle = async (u: Profile) => {
    setToggleLoading(u.id);
    const result = await toggleUsuarioActivo(u.id, !u.activo);
    setToggleLoading(null);
    if ('error' in result) { toast.error(result.error as string); return; }
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !u.activo } : x));
    toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
  };

  const handleRol = async (id: string, role: UserRole) => {
    setRolLoading(id);
    const result = await updateRolUsuario(id, role);
    setRolLoading(null);
    if ('error' in result) { toast.error(result.error as string); return; }
    setUsuarios(prev => prev.map(x => x.id === id ? { ...x, role } : x));
    toast.success('Rol actualizado');
  };

  const handleChangePassword = async () => {
    if (!passwordUserId || newPassword.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    setPasswordLoading(true);
    const result = await changeUserPasswordAdmin(passwordUserId, newPassword);
    setPasswordLoading(false);
    if ('error' in result && result.error) { toast.error(result.error as string); return; }
    toast.success('Contraseña actualizada');
    setPasswordUserId(null);
    setNewPassword('');
  };

  const handleDelete = async (id: string) => {
    const result = await deleteUsuario(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    setUsuarios(prev => prev.filter(x => x.id !== id));
    toast.success('Usuario eliminado');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {usuarios.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {u.nombre[0]}{u.apellido[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.nombre} {u.apellido}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select
                    value={u.role}
                    onValueChange={(v) => handleRol(u.id, v as UserRole)}
                    disabled={rolLoading === u.id}
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      {rolLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                      <SelectItem value="empleado" className="text-xs">Empleado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Badge variant={u.activo ? 'default' : 'outline'} className="text-xs">
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={toggleLoading === u.id}
                    onClick={() => handleToggle(u)}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                  >
                    {toggleLoading === u.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : u.activo
                        ? <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                        : <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setPasswordUserId(u.id); setNewPassword(''); }}
                    title="Cambiar contraseña"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-destructive hover:text-destructive')}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará la cuenta de {u.nombre} {u.apellido}. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(u.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {usuarios.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">No hay usuarios registrados</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!passwordUserId} onOpenChange={(v) => { if (!v) { setPasswordUserId(null); setNewPassword(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nueva contraseña *</Label>
              <Input
                type="password"
                className="h-9"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setPasswordUserId(null); setNewPassword(''); }}>Cancelar</Button>
            <Button type="button" disabled={passwordLoading || newPassword.length < 6} onClick={handleChangePassword}>
              {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setNuevoRol('empleado'); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input name="nombre" className="h-9" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Apellido *</Label>
                <Input name="apellido" className="h-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input name="email" type="email" className="h-9" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contraseña *</Label>
              <Input name="password" type="password" className="h-9" minLength={6} required placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rol *</Label>
              <input type="hidden" name="role" value={nuevoRol} />
              <Select value={nuevoRol} onValueChange={(v) => setNuevoRol(v as UserRole)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
