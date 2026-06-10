'use client';

import { useState } from 'react';
import type { Cliente } from '@/types';
import { ClienteDialog } from './cliente-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Search, User, Phone, Mail, Calendar, Edit, Trash2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteCliente } from '@/actions/clientes';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props { clientes: Cliente[] }

export function ClientesClient({ clientes: initial }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>(initial);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return !q || `${c.nombre} ${c.apellido ?? ''} ${c.telefono ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q);
  });

  const handleDelete = async (id: string) => {
    const result = await deleteCliente(id);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Cliente eliminado');
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary" className="text-xs">{filtered.length} clientes</Badge>
        <Button size="sm" className="gap-2 ml-auto" onClick={() => setOpenNew(true)}>
          <Plus className="w-4 h-4" /> Nuevo cliente
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Contacto</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Registro</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{c.nombre} {c.apellido}</p>
                        {c.observaciones && (
                          <p className="text-xs text-muted-foreground truncate max-w-48">{c.observaciones}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {c.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {c.telefono}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {c.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(c.fecha_registro)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(c)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-destructive hover:text-destructive')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se desactivará el perfil de {c.nombre} {c.apellido}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <ClienteDialog
        open={openNew || !!selected}
        cliente={selected}
        onClose={() => { setOpenNew(false); setSelected(null); }}
        onSaved={(c) => {
          if (selected) {
            setClientes((prev) => prev.map((x) => (x.id === c.id ? c : x)));
          } else {
            setClientes((prev) => [c, ...prev]);
          }
          setOpenNew(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
