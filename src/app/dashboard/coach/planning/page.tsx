
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, Maximize, GlassWater, Users } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';


type MicrocycleMethodology = 'tecnificacion' | 'futbol_medida' | 'periodizacion_tactica';
const MAIN_CLUB_ID = 'OpitaClub';


const methodologyLabels: Record<MicrocycleMethodology, string> = {
    tecnificacion: 'Tecnificación',
    futbol_medida: 'Fútbol a la Medida',
    periodizacion_tactica: 'Periodización Táctica'
};

export default function CoachPlanningPage() {
  const { profile, isUserLoading, firestore } = useUser();
  const [selectedCycle, setSelectedCycle] = useState<any | null>(null);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);

  const microcyclesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.id || !profile?.clubId) return null;
    return query(collection(firestore, `clubs/${profile.clubId}/microcycles`), where("coachId", "==", profile.id));
  }, [firestore, profile?.id, profile?.clubId]);

  const { data: coachCycles, isLoading: cyclesLoading } = useCollection(microcyclesQuery);
  
  const { data: clubData, isLoading: clubLoading } = useDoc(useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return doc(firestore, 'clubs', profile.clubId);
  }, [firestore, profile]));

  const cyclesByCategory = useMemo(() => {
    if (!coachCycles) return {};
    return coachCycles.reduce((acc, cycle) => {
        const category = cycle.team || 'Sin Categoría';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(cycle);
        return acc;
    }, {} as Record<string, any[]>);
  }, [coachCycles]);


  const handlePrint = () => {
    setTimeout(() => {
        window.print();
    }, 100);
  };
  
  const openPrintModal = (cycle: any) => {
    setSelectedCycle(cycle);
    setIsPrintViewOpen(true);
  }
  
  if (isUserLoading || cyclesLoading || clubLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Mi Planificación Semanal</CardTitle>
          <CardDescription>
            Consulta los microciclos de entrenamiento que te ha asignado el administrador, organizados por categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {!coachCycles || coachCycles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aún no tienes microciclos asignados.</p>
            ) : (
                <div className="space-y-8">
                {Object.entries(cyclesByCategory).map(([category, cycles]) => (
                    <div key={category}>
                        <h3 className="text-2xl font-bold font-headline text-primary mb-4 flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Categoría: {category}
                        </h3>
                        <Accordion type="single" collapsible className="w-full space-y-4">
                        {cycles.map((cycle) => (
                            <Card key={cycle.id}>
                            <AccordionItem value={`cycle-${cycle.id}`} className="border-b-0">
                                <AccordionTrigger className="p-6 hover:no-underline">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4 text-left">
                                    <div>
                                        <h4 className="font-bold text-lg">{cycle.week}</h4>
                                        <Badge variant="secondary" className="mt-2">{methodologyLabels[cycle.methodology as MicrocycleMethodology]}</Badge>
                                    </div>
                                </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="font-semibold">Objetivo Principal</h5>
                                        <p className="text-muted-foreground">{cycle.mainObjective}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h5 className="font-semibold">Sesiones</h5>
                                        {cycle.sessions.map((session: any, index: number) => (
                                            <div key={index} className="border-l-2 border-primary pl-4 py-2">
                                                <p className="font-bold">{session.day} - {session.focus} ({session.duration} min)</p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                    {session.fieldDimensions && (
                                                        <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4"/> {session.fieldDimensions}</span>
                                                    )}
                                                    {session.recoveryTime && (
                                                        <span className="flex items-center gap-1.5"><GlassWater className="h-4 w-4"/> {session.recoveryTime}</span>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground whitespace-pre-wrap mt-2">{session.activities}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className='pt-4'>
                                        <Button onClick={() => openPrintModal(cycle)}>
                                            <Printer className="mr-2" /> Imprimir Plan
                                        </Button>
                                    </div>
                                </div>
                                </AccordionContent>
                            </AccordionItem>
                            </Card>
                        ))}
                        </Accordion>
                    </div>
                ))}
                </div>
            )}
        </CardContent>
      </Card>
      
      {/* Print View Dialog */}
      <Dialog open={isPrintViewOpen} onOpenChange={setIsPrintViewOpen}>
        <DialogContent className="sm:max-w-4xl print:max-w-full print:border-0 print:shadow-none">
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        padding: 2rem; 
                    }
                    .no-print {
                        display: none;
                    }
                }
                `}
            </style>
           <div className="printable-area p-2 sm:p-4 md:p-8">
                {selectedCycle && (
                    <>
                        <DialogHeader className="border-b-2 border-primary pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-3xl font-bold font-headline text-primary">
                                        Plan de Entrenamiento: {selectedCycle.week}
                                    </DialogTitle>
                                    <DialogDescription className="text-base text-muted-foreground">
                                        Equipo: {selectedCycle.team} | Metodología: {methodologyLabels[selectedCycle.methodology as MicrocycleMethodology]}
                                    </DialogDescription>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold font-headline text-lg">{clubData?.name || 'Unión Opita FC'}</h3>
                                    <p className="text-sm text-muted-foreground">Entrenador: {profile?.firstName} {profile?.lastName}</p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="my-8 space-y-8">
                            <div className="p-4 bg-secondary/50 rounded-lg border">
                                <h3 className="font-semibold text-xl font-headline text-primary">Objetivo Principal del Microciclo</h3>
                                <p className="mt-2 text-foreground">{selectedCycle.mainObjective}</p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-2xl font-headline text-primary border-b pb-2 mb-6">Plan de Sesiones</h3>
                                <div className="space-y-8">
                                    {selectedCycle.sessions.map((session: any, index: number) => (
                                        <div key={index} className="border-l-4 border-primary pl-6 py-4 bg-card rounded-r-lg shadow-sm">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-bold text-xl font-headline">{session.day} - {session.focus}</h4>
                                                <span className="font-medium text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full">{session.duration} minutos</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                                                {session.fieldDimensions && (
                                                    <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4"/> {session.fieldDimensions}</span>
                                                )}
                                                {session.recoveryTime && (
                                                    <span className="flex items-center gap-1.5"><GlassWater className="h-4 w-4"/> {session.recoveryTime}</span>
                                                )}
                                            </div>
                                            <div className="space-y-3 mt-4">
                                                <h5 className="font-semibold text-md">Actividades:</h5>
                                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{session.activities}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                         <DialogFooter className="no-print pt-8 border-t mt-8">
                            <Button variant="outline" onClick={() => setIsPrintViewOpen(false)}>Cerrar</Button>
                            <Button onClick={handlePrint}><Printer className="mr-2"/> Imprimir</Button>
                        </DialogFooter>
                    </>
                )}
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
