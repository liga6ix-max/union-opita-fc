
'use client';

import { useMemo } from 'react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Maximize, GlassWater, CheckCircle, XCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const MAIN_CLUB_ID = 'OpitaClub';
type MicrocycleMethodology = 'tecnificacion' | 'futbol_medida' | 'periodizacion_tactica' | 'unifit';

const methodologyLabels: Record<MicrocycleMethodology, string> = {
    tecnificacion: 'Tecnificación',
    futbol_medida: 'Fútbol a la Medida',
    periodizacion_tactica: 'Periodización Táctica',
    unifit: 'UNIFIT',
};

export default function UnifitPlanPage() {
  const { profile, isUserLoading, firestore } = useUser();

  // Training Plans query
  const trainingPlansQuery = useMemoFirebase(() => {
      if (!firestore || !profile?.clubId || !profile?.level) return null;
      return query(
          collection(firestore, `clubs/${profile.clubId}/trainingPlans`),
          where("team", "==", "UNIFIT"),
          where("level", "==", profile.level)
      );
  }, [firestore, profile?.clubId, profile?.level]);
  const { data: trainingPlans, isLoading: plansLoading } = useCollection(trainingPlansQuery);
  
  const isLoading = isUserLoading || plansLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Mi Plan de Entrenamiento UNIFIT</CardTitle>
                <CardDescription>
                    Aquí puedes ver los planes de entrenamiento (mesociclos) asignados a tu nivel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !trainingPlans || trainingPlans.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aún no tienes un plan de entrenamiento asignado para tu nivel.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                    {trainingPlans.map((plan) => (
                        <Card key={plan.id}>
                        <AccordionItem value={`plan-${plan.id}`} className="border-b-0">
                            <AccordionTrigger className="p-6 hover:no-underline">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4 text-left">
                                <div>
                                    <h4 className="font-bold text-lg">{plan.mesocycleObjective}</h4>
                                    <Badge variant="secondary" className="mt-2">{methodologyLabels[plan.methodology as MicrocycleMethodology]}</Badge>
                                </div>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                            {plan.microcycles.map((micro: any, index: number) => (
                                <div key={index} className="mt-4 border-t pt-4 first:mt-0 first:border-t-0 first:pt-0">
                                    <h5 className="font-semibold">{micro.week}: <span className="text-muted-foreground font-normal">{micro.mainObjective}</span></h5>
                                    <div className="space-y-2 mt-2">
                                        {micro.sessions.map((session: any, sIndex: number) => (
                                            <div key={sIndex} className="border-l-2 border-primary pl-4 py-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold">{session.day} - {session.focus} ({session.duration} min)</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                    {session.fieldDimensions && (<span className="flex items-center gap-1.5"><Maximize className="h-4 w-4"/> {session.fieldDimensions}</span>)}
                                                    {session.recoveryTime && (<span className="flex items-center gap-1.5"><GlassWater className="h-4 w-4"/> {session.recoveryTime}</span>)}
                                                </div>
                                                <p className="text-muted-foreground whitespace-pre-wrap mt-2">{session.activities}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            </AccordionContent>
                        </AccordionItem>
                        </Card>
                    ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
