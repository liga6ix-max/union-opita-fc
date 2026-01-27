'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BrainCircuit, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { createNutritionPlan } from '@/ai/flows/create-nutrition-plan-flow';

const MAIN_CLUB_ID = 'OpitaClub';

const dietTypes = [
    { id: 'weight_loss', name: 'Pérdida de Peso' },
    { id: 'weight_gain', name: 'Aumento de Peso' },
    { id: 'vegan', name: 'Vegana' },
];

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const mealLabels: Record<string, string> = {
    breakfast: 'Desayuno',
    snack1: 'Media Mañana',
    lunch: 'Almuerzo',
    snack2: 'Media Tarde',
    dinner: 'Cena',
};

const defaultPlan = daysOfWeek.reduce((acc, day) => {
    acc[day] = Object.keys(mealLabels).reduce((mealsAcc, meal) => {
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
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState<string | null>(null);

    // Fetch existing plans
    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);
        const fetchPlans = async () => {
            const fetchedPlans: Record<string, any> = {};
            for (const diet of dietTypes) {
                const planRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/nutritionPlans`, diet.id);
                const docSnap = await getDoc(planRef);
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

    const handleGeneratePlan = async (dietType: string) => {
        setIsGenerating(dietType);
        toast({ title: 'Generando Plan con IA...', description: 'Esto puede tardar un momento.' });
        try {
            const generatedPlan = await createNutritionPlan({ dietType: dietType as any });
            setPlans(prev => ({
                ...prev,
                [dietType]: generatedPlan,
            }));
            toast({ title: '¡Plan Generado!', description: 'El plan ha sido cargado en el formulario. Revísalo y guárdalo.' });
        } catch (error) {
            console.error("Error generating plan:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el plan con IA.' });
        } finally {
            setIsGenerating(null);
        }
    };

    const handleSavePlan = async (dietType: string) => {
        if (!firestore || !plans[dietType]) return;
        setIsSaving(dietType);
        try {
            const planRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/nutritionPlans`, dietType);
            await setDoc(planRef, {
                id: dietType,
                clubId: MAIN_CLUB_ID,
                dietType: dietType,
                weekPlan: plans[dietType],
            });
            toast({ title: `¡Plan de ${dietTypes.find(d => d.id === dietType)?.name} Guardado!`, description: 'El plan nutricional ha sido actualizado.' });
            setOpenDialog(null);
        } catch (error) {
            console.error("Error saving plan:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el plan.' });
        }
        setIsSaving(null);
    };

    if (isLoading || isUserLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Planes Nutricionales</CardTitle>
                <CardDescription>Define los planes de comidas semanales para cada tipo de dieta. Cada plan se guarda de forma individual.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dietTypes.map(diet => (
                    <Card key={diet.id}>
                        <CardHeader>
                            <CardTitle>{diet.name}</CardTitle>
                            <CardDescription>Plan de alimentación enfocado en {diet.name.toLowerCase()}.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Dialog open={openDialog === diet.id} onOpenChange={(isOpen) => setOpenDialog(isOpen ? diet.id : null)}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar Plan</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>Editando Plan: {diet.name}</DialogTitle>
                                        <DialogDescription>
                                            Define las comidas para cada día. Puedes usar la IA para obtener una base y luego ajustarla.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-6">
                                        <div className="flex justify-end sticky top-0 py-2 bg-background/90 z-10">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleGeneratePlan(diet.id)}
                                                disabled={isGenerating === diet.id}
                                            >
                                                {isGenerating === diet.id ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit className="mr-2" />}
                                                {isGenerating === diet.id ? 'Generando...' : 'Generar con IA'}
                                            </Button>
                                        </div>
                                        {daysOfWeek.map(day => (
                                            <Card key={`${diet.id}-${day}`}>
                                                <CardHeader>
                                                    <CardTitle className="font-headline">{day}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Object.entries(mealLabels).map(([mealKey, mealLabel]) => (
                                                        <div key={mealKey} className="space-y-2">
                                                            <Label>{mealLabel}</Label>
                                                            <Textarea
                                                                placeholder={`Detalles de ${mealLabel.toLowerCase()}...`}
                                                                value={plans[diet.id]?.[day]?.[mealKey] || ''}
                                                                onChange={(e) => handlePlanChange(diet.id, day, mealKey, e.target.value)}
                                                                rows={4}
                                                            />
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                                        <Button onClick={() => handleSavePlan(diet.id)} disabled={isSaving === diet.id}>
                                            {isSaving === diet.id ? <Loader2 className="animate-spin" /> : "Guardar Plan"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}
