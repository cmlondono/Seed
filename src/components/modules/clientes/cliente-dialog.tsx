'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createCliente, updateCliente } from '@/actions/clientes';
import type { Cliente } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  documento_identidad: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: (c: Cliente) => void;
}

export function ClienteDialog({ open, cliente, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!cliente;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', apellido: '', telefono: '', email: '', documento_identidad: '', observaciones: '' },
  });

  useEffect(() => {
    if (cliente) {
      form.reset({
        nombre: cliente.nombre,
        apellido: cliente.apellido ?? '',
        telefono: cliente.telefono ?? '',
        email: cliente.email ?? '',
        documento_identidad: cliente.documento_identidad ?? '',
        observaciones: cliente.observaciones ?? '',
      });
    } else {
      form.reset({ nombre: '', apellido: '', telefono: '', email: '', documento_identidad: '', observaciones: '' });
    }
  }, [cliente, open, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const input = {
      nombre: data.nombre,
      apellido: data.apellido || undefined,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      documento_identidad: data.documento_identidad || undefined,
      observaciones: data.observaciones || undefined,
    };

    const result = isEdit && cliente
      ? await updateCliente(cliente.id, input)
      : await createCliente(input);

    setLoading(false);
    if (result.error) { toast.error(result.error); return; }

    toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado');
    onSaved(result.item!);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre *</Label>
              <Input className="h-8 text-sm" {...form.register('nombre')} />
              {form.formState.errors.nombre && <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Apellido</Label>
              <Input className="h-8 text-sm" {...form.register('apellido')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Documento de identidad</Label>
            <Input className="h-8 text-sm" placeholder="CC, NIT, Pasaporte..." {...form.register('documento_identidad')} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Teléfono</Label>
            <Input className="h-8 text-sm" {...form.register('telefono')} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" className="h-8 text-sm" {...form.register('email')} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observaciones</Label>
            <Textarea className="text-sm resize-none" rows={2} {...form.register('observaciones')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
