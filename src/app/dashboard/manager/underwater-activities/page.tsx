'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Waves } from 'lucide-react';

export default function ManagerUnderwaterActivitiesPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Waves /> Gestión de Actividades Subacuáticas
          </CardTitle>
          <CardDescription>
            Define y programa los niveles y progresiones para las actividades subacuáticas del club.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-12">
                <Waves className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Próximamente</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Esta sección está en construcción. Pronto podrás gestionar aquí las actividades subacuáticas.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
