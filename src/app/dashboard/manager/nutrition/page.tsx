
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BrainCircuit, Pencil, Beef } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
    const { firestore, user, profile, isUserLoading } = useUser();
    const { toast } = useToast();
    const [plans, setPlans] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState<string | null>(null);

    useEffect(() => {
        if (!firestore || !user || profile?.role !== 'manager') return;
        
        setIsLoading(true);
        const fetchPlans = async () => {
            const fetchedPlans: Record<string, any> = {};
            for (const diet of dietTypes) {
                const planRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/nutritionPlans`, diet.id);
                const docSnap = await getDoc(planRef);
                fetchedPlans[diet.id] = docSnap.exists() ? docSnap.data().weekPlan : defaultPlan;
            }
            setPlans(fetchedPlans);
            setIsLoading(false);
        };
        fetchPlans();
    }, [firestore, user, profile?.role]);
    
    const handlePlanChange = (dietType: string, day: string, meal: string, value: string) => {
        setPlans(prev => ({
            ...prev,
            [dietType]: {
                ...prev[dietType],
                [day]: { ...prev[dietType][day], [meal]: value }
            },
        }));
    };

    const handleGeneratePlan = async (dietType: string) => {
        setIsGenerating(dietType);
        toast({ title: 'Generando con IA...', description: 'Creando un plan económico colombiano.' });
        try {
            const generatedPlan = await createNutritionPlan({ dietType: dietType as any });
            setPlans(prev => ({ ...prev, [dietType]: generatedPlan }));
            toast({ title: '¡Plan Generado!', description: 'Revisa las cantidades y guarda los cambios.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el plan.' });
        } finally {
            setIsGenerating(null);
        }
    };

    const handleSavePlan = async (dietType: string) => {
        if (!firestore || !plans[dietType]) return;
        setIsSaving(dietType);
        try {
            await setDoc(doc(firestore, `clubs/${MAIN_CLUB_ID}/nutritionPlans`, dietType), {
                id: dietType,
                clubId: MAIN_CLUB_ID,
                dietType: dietType,
                weekPlan: plans[dietType],
            });
            toast({ title: "¡Guardado!", description: 'Plan actualizado correctamente.' });
            setOpenDialog(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Error al guardar.' });
        }
        setIsSaving(null);
    };

    if (isLoading || isUserLoading) {
        return <div className="flex h-full w-full items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Beef /> Gestión de Nutrición</CardTitle>
                    <CardDescription>Crea microciclos alimenticios económicos para los deportistas UNIFIT.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dietTypes.map(diet => (
                        <Card key={diet.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{diet.name}</CardTitle>
                            </CardHeader>
                            <CardFooter className="mt-auto">
                                <Button className="w-full" onClick={() => setOpenDialog(diet.id)} variant="outline">
                                    <Pencil className="mr-2 h-4 w-4" /> Configurar Plan
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            {dietTypes.map(diet => (
                <Dialog key={diet.id} open={openDialog === diet.id} onOpenChange={(isOpen) => setOpenDialog(isOpen ? diet.id : null)}>
                    <DialogContent className="max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>Editando Plan: {diet.name}</DialogTitle>
                            <DialogDescription>Define el menú semanal con ingredientes locales y baratos.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="flex justify-end sticky top-0 bg-background/95 pb-2 z-10">
                                <Button onClick={() => handleGeneratePlan(diet.id)} disabled={isGenerating === diet.id} variant="secondary">
                                    {isGenerating === diet.id ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit className="mr-2" />}
                                    Generar con IA (Dieta Colombiana)
                                </Button>
                            </div>
                            {daysOfWeek.map(day => (
                                <div key={day} className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-bold text-lg text-primary">{day}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(mealLabels).map(([key, label]) => (
                                            <div key={key} className="space-y-1">
                                                <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
                                                <Textarea 
                                                    value={plans[diet.id]?.[day]?.[key] || ''} 
                                                    onChange={(e) => handlePlanChange(diet.id, day, key, e.target.value)}
                                                    placeholder="Ej: 150g pollo, 1/2 taza arroz..."
                                                    rows={3}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                            <Button onClick={() => handleSavePlan(diet.id)} disabled={isSaving === diet.id}>
                                {isSaving === diet.id ? <Loader2 className="animate-spin mr-2" /> : "Guardar Plan Semanal"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    );
}
