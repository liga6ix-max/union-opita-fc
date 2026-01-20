
'use client';

import { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BrainCircuit, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format, isAfter } from 'date-fns';

const MAIN_CLUB_ID = 'OpitaClub';

export default function AthleteEvaluationsPage() {
  const { profile, user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Get evaluations assigned to the athlete's team
  const evaluationsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.team) return null;
    return query(
      collection(firestore, `clubs/${MAIN_CLUB_ID}/evaluations`),
      where("categories", "array-contains", profile.team)
    );
  }, [firestore, profile?.team]);
  const { data: assignedEvaluations, isLoading: evalsLoading } = useCollection(evaluationsQuery);

  // 2. Get evaluations the athlete has already completed
  const responsesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, `clubs/${MAIN_CLUB_ID}/evaluationResponses`),
      where("athleteId", "==", user.uid)
    );
  }, [firestore, user?.uid]);
  const { data: completedResponses, isLoading: responsesLoading } = useCollection(responsesQuery);

  const handleResponseChange = (questionIndex: number, value: string) => {
    setResponses(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = () => {
    if (!selectedEvaluation || Object.keys(responses).length !== selectedEvaluation.questions.length) {
      toast({ variant: 'destructive', title: 'Respuestas incompletas', description: 'Por favor, responde todas las preguntas.' });
      return;
    }
    setIsSubmitting(true);
    addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/evaluationResponses`), {
        evaluationId: selectedEvaluation.id,
        athleteId: user?.uid,
        clubId: MAIN_CLUB_ID,
        responses: responses,
        submittedAt: serverTimestamp(),
    });
    toast({ title: '¡Evaluación Enviada!', description: 'Tus respuestas han sido guardadas. ¡Gracias!' });
    setSelectedEvaluation(null);
    setResponses({});
    setIsSubmitting(false);
  };
  
  const isLoading = isUserLoading || evalsLoading || responsesLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  
  const completedEvaluationIds = new Set(completedResponses?.map(r => r.evaluationId));
  const pendingEvaluations = assignedEvaluations?.filter(e => 
    !completedEvaluationIds.has(e.id) && isAfter(new Date(e.expiryDate), new Date())
  ) || [];


  if (selectedEvaluation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{selectedEvaluation.title}</CardTitle>
          <CardDescription>{selectedEvaluation.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedEvaluation.questions.map((q: any, index: number) => (
            <div key={index} className="space-y-3">
              <p className="font-semibold">{index + 1}. {q.text}</p>
              <RadioGroup
                onValueChange={(value) => handleResponseChange(index, value)}
                className="flex items-center gap-6"
                value={responses[index]}
              >
                {[1, 2, 3, 4, 5].map(val => (
                  <div key={val} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(val)} id={`q${index}-r${val}`} />
                    <Label htmlFor={`q${index}-r${val}`}>{val}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter className="gap-4">
            <Button variant="outline" onClick={() => setSelectedEvaluation(null)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="mr-2"/>}
                Enviar Respuestas
            </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><BrainCircuit/> Mis Evaluaciones Pendientes</CardTitle>
          <CardDescription>Completa las evaluaciones asignadas por tu club.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEvaluations.length > 0 ? (
            <div className="space-y-4">
              {pendingEvaluations.map(e => (
                <Card key={e.id} className="flex items-center justify-between p-4">
                    <div>
                        <h3 className="font-semibold">{e.title}</h3>
                        <p className="text-sm text-muted-foreground">Fecha límite: {format(new Date(e.expiryDate), "d 'de' MMMM, yyyy")}</p>
                    </div>
                    <Button onClick={() => setSelectedEvaluation(e)}>Completar</Button>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium">¡Estás al día!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    No tienes evaluaciones pendientes por ahora.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
