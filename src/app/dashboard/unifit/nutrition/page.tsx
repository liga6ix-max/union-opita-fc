
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Beef } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MAIN_CLUB_ID = 'OpitaClub';

const mealLabels: Record<string, string> = {
    breakfast: 'Desayuno',
    snack1: 'Media Mañana',
    lunch: 'Almuerzo',
    snack2: 'Media Tarde',
    dinner: 'Cena',
};

const daysOfWeekOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function UnifitNutritionPage() {
    const { profile, isUserLoading, firestore } = useUser();

    const planDocRef = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId || !profile.assignedDietType) return null;
        return doc(firestore, `clubs/${profile.clubId}/nutritionPlans`, profile.assignedDietType);
    }, [firestore, profile?.clubId, profile?.assignedDietType]);

    const { data: nutritionPlan, isLoading: planLoading } = useDoc(planDocRef);

    const isLoading = isUserLoading || planLoading;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!profile?.assignedDietType) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Beef /> Mi Plan Nutricional</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    <p>Aún no tienes un plan nutricional asignado.</p>
                    <p className="text-sm">Tu entrenador o un gerente del club te lo asignará pronto.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (!nutritionPlan) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Beef /> Mi Plan Nutricional</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    <p>Tu plan de dieta asignado aún no ha sido configurado por el administrador.</p>
                </CardContent>
            </Card>
        );
    }

    const weekPlan = nutritionPlan.weekPlan || {};

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Beef /> Mi Plan Nutricional</CardTitle>
                    <CardDescription>Aquí puedes ver el plan de alimentación semanal asignado por tu club.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="Lunes">
                        {daysOfWeekOrder.map(day => (
                            weekPlan[day] && (
                                <Card key={day}>
                                    <AccordionItem value={day} className="border-b-0">
                                        <AccordionTrigger className="p-6 text-xl font-headline hover:no-underline">
                                            {day}
                                        </AccordionTrigger>
                                        <AccordionContent className="p-6 pt-0 space-y-4">
                                            {Object.entries(mealLabels).map(([mealKey, mealLabel]) => (
                                                 weekPlan[day][mealKey] && (
                                                    <div key={mealKey} className="border-l-2 border-primary pl-4">
                                                        <h4 className="font-semibold">{mealLabel}</h4>
                                                        <p className="text-muted-foreground whitespace-pre-wrap">{weekPlan[day][mealKey]}</p>
                                                    </div>
                                                 )
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Card>
                            )
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

