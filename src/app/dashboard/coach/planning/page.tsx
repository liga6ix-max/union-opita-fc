'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, Clock, MapPin, CalendarIcon } from 'lucide-react';
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
    tecnificacion: 'Tecnificación (4-7 años)',
    futbol_medida: 'Fútbol a la Medida (8-11 años)',
    periodizacion_tactica: 'Periodización Táctica (12-20 años)'
};

const createSafeKeyForCategory = (categoryName: string) => {
    if (!categoryName) return '';
    return categoryName.replace(/[\s/]/g, '-');
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
            Consulta los microciclos de entrenamiento que te ha asignado el administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {!coachCycles || coachCycles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aún no tienes microciclos asignados.</p>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                {coachCycles.map((cycle) => (
                    <Card key={cycle.id}>
                    <AccordionItem value={`cycle-${cycle.id}`} className="border-b-0">
                        <AccordionTrigger className="p-6 hover:no-underline">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4 text-left">
                            <div>
                                <h4 className="font-bold text-lg">{cycle.week} - {cycle.team}</h4>
                                <Badge variant="secondary" className="mt-2">{methodologyLabels[cycle.methodology as MicrocycleMethodology]}</Badge>
                            </div>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                        <div className="space-y-4">
                            {(() => {
                                const schedule = clubData?.trainingSchedules?.[createSafeKeyForCategory(cycle.team)];
                                if (schedule && Array.isArray(schedule) && schedule.length > 0) {
                                    return (
                                        <div className="space-y-2 border-b pb-4 mb-4">
                                            {schedule.map((session: any, index: number) => (
                                                <div key={index} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                   <span className="flex items-center gap-1.5 font-medium"><CalendarIcon className="h-4 w-4"/> {session.day}</span>
                                                   <span className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4"/> {session.time}</span>
                                                   <span className="flex items-center gap-1.5 font-medium"><MapPin className="h-4 w-4"/> {session.location}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div>
                                <h5 className="font-semibold">Objetivo Principal</h5>
                                <p className="text-muted-foreground">{cycle.mainObjective}</p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-semibold">Sesiones</h5>
                                {cycle.sessions.map((session: any, index: number) => (
                                    <div key={index} className="border-l-2 border-primary pl-4 py-2">
                                        <p className="font-bold">{session.day} - {session.focus} ({session.duration} min)</p>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{session.activities}</p>
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
            )}
        </CardContent>
      </Card>
      
      {/* Print View Dialog */}
      <Dialog open={isPrintViewOpen} onOpenChange={setIsPrintViewOpen}>
        <DialogContent className="sm:max-w-3xl print:max-w-full print:border-0 print:shadow-none">
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
                    }
                    .no-print {
                        display: none;
                    }
                }
                `}
            </style>
           <div className="printable-area">
                {selectedCycle && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold font-headline">Microciclo: {selectedCycle.week}</DialogTitle>
                            <DialogDescription>
                                Equipo: {selectedCycle.team} | Metodología: {methodologyLabels[selectedCycle.methodology as MicrocycleMethodology]}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="my-6 space-y-6">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold text-lg">Objetivo Principal</h3>
                                <p className="text-gray-700">{selectedCycle.mainObjective}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Plan de Sesiones</h3>
                                <div className="space-y-4">
                                {selectedCycle.sessions.map((session: any, index: number) => (
                                    <div key={index} className="border-t pt-4">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-bold text-md">{session.day} - {session.focus}</h4>
                                            <span className="text-sm text-gray-500">{session.duration} minutos</span>
                                        </div>
                                        <p className="mt-2 text-gray-600 whitespace-pre-wrap">{session.activities}</p>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                         <DialogFooter className="no-print pt-6">
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
