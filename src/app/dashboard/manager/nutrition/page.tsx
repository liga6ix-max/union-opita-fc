
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MAIN_CLUB_ID = 'OpitaClub';

const dietTypes = [
    { id: 'weight_loss', name: 'Pérdida de Peso' },
    { id: 'weight_gain', name: 'Aumento de Peso' },
    { id: 'vegan', name: 'Vegana' },
];

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const meals = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
const mealLabels: Record<string, string> = {
    breakfast: 'Desayuno',
    snack1: 'Media Mañana',
    lunch: 'Almuerzo',
    snack2: 'Media Tarde',
    dinner: 'Cena',
};

const defaultPlan = daysOfWeek.reduce((acc, day) => {
    acc[day] = meals.reduce((mealsAcc, meal) => {
        mealsAcc[meal] = '';
        return mealsAcc;
    }, {} as Record<string, string>);
    return acc;
}, {} as Record<string, Record<string, string>>);

export default function ManagerNutritionPage() {
    const { firestore, isUserLoading } = useUser();
    const { toast } = useToast();
    const [plans, setPlans] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch existing plans
    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);
        const fetchPlans = async () => {
            const fetchedPlans: Record<string, any> = {};
            for (const diet of dietTypes) {
                const planRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/nutritionPlans`, diet.id);
                const docSnap = await (await import('firebase/firestore')).getDoc(planRef);
                if (docSnap.exists()) {
                    fetchedPlans[diet.id] = docSnap.data().weekPlan || defaultPlan;
                } else {
                    fetchedPlans[diet.id] = defaultPlan;
                }
            }
            setPlans(fetchedPlans);
            setIsLoading(false);
        };
        fetchPlans();
    }, [firestore]);
    
    const handlePlanChange = (dietType: string, day: string, meal: string, value: string) => {
        setPlans(prev => ({
            ...prev,
            [dietType]: {
                ...prev[dietType],
                [day]: {
                    ...prev[dietType][day],
                    [meal]: value,
                },
            },
        }));
    };

    const handleSavePlans = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            for (const diet of dietTypes) {
                const planRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/nutritionPlans`, diet.id);
                await setDoc(planRef, {
                    id: diet.id,
                    clubId: MAIN_CLUB_ID,
                    dietType: diet.id,
                    weekPlan: plans[diet.id],
                });
            }
            toast({ title: '¡Planes Guardados!', description: 'Todos los planes nutricionales han sido actualizados.' });
        } catch (error) {
            console.error("Error saving plans:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los planes.' });
        }
        setIsSaving(false);
    };

    if (isLoading || isUserLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Planes Nutricionales</CardTitle>
                <CardDescription>Define los planes de comidas semanales para cada tipo de dieta.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="weight_loss" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        {dietTypes.map(diet => (
                            <TabsTrigger key={diet.id} value={diet.id}>{diet.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    {dietTypes.map(diet => (
                        <TabsContent key={diet.id} value={diet.id} className="space-y-6 mt-6">
                            {daysOfWeek.map(day => (
                                <Card key={day}>
                                    <CardHeader>
                                        <CardTitle className="font-headline">{day}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {meals.map(meal => (
                                            <div key={meal} className="space-y-2">
                                                <Label>{mealLabels[meal]}</Label>
                                                <Textarea
                                                    placeholder={`Detalles de ${mealLabels[meal].toLowerCase()}...`}
                                                    value={plans[diet.id]?.[day]?.[meal] || ''}
                                                    onChange={(e) => handlePlanChange(diet.id, day, meal, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSavePlans} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : "Guardar Todos los Planes"}
                </Button>
            </CardFooter>
        </Card>
    );
}
