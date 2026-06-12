'use client';

import { useActionState } from 'react';
import { createNegocio } from '@/actions/negocios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2 } from 'lucide-react';

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createNegocio, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">Configura tu negocio</CardTitle>
          <CardDescription>Un último paso antes de comenzar</CardDescription>
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Comenzar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
