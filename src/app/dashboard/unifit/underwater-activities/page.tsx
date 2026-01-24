
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Waves } from 'lucide-react';

export default function UnderwaterActivitiesPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Waves /> Actividades Subacuáticas
          </CardTitle>
          <CardDescription>
            Consulta tu nivel y progreso en las actividades subacuáticas.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-12">
                <Waves className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Próximamente</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Esta sección está en construcción. Pronto podrás ver aquí tu progreso en actividades subacuáticas.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
