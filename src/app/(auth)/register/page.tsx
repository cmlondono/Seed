'use client';

import { useActionState } from 'react';
import { register } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);

  if (state?.verify) {
    return (
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Verifica tu correo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Te enviamos un enlace de verificación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
          </div>
          <Link href="/login" className="text-sm text-primary hover:underline">Volver al inicio de sesión</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
        <CardDescription>Registra tu negocio para comenzar</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Nombre del negocio *</Label>
            <Input name="nombre_negocio" placeholder="Mi Peluquería" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input name="nombre" required />
            </div>
            <div className="space-y-2">
              <Label>Apellido *</Label>
              <Input name="apellido" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input name="email" type="email" required autoComplete="email" />
          </div>

          <div className="space-y-2">
            <Label>Contraseña *</Label>
            <Input name="password" type="password" required minLength={6} autoComplete="new-password" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear cuenta'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
