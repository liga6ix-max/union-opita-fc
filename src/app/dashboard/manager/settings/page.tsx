"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useUser, useCollection, useMemoFirebase, useFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const bankAccountSchema = z.object({
    bankName: z.string().min(1, "El nombre del banco es requerido."),
    accountType: z.string().min(1, "El tipo de cuenta es requerido."),
    accountNumber: z.string().min(1, "El número de cuenta es requerido."),
    accountHolder: z.string().min(1, "El titular es requerido."),
});

const categorySchema = z.object({
  name: z.string(),
  minYear: z.number(),
  maxYear: z.number(),
});

const clubSettingsSchema = z.object({
  name: z.string().min(1, "El nombre del club es requerido."),
  bankAccount: bankAccountSchema,
  categories: z.array(categorySchema),
  monthlyFees: z.record(z.number()),
});

type ClubSettings = z.infer<typeof clubSettingsSchema>;
type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerSettingsPage() {
  const { isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isSavingSalaries, setIsSavingSalaries] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [clubName, setClubName] = useState('');
  const [categories, setCategories] = useState<z.infer<typeof categorySchema>[]>([]);

  const clubConfigRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'clubs', MAIN_CLUB_ID);
  },[firestore]);
  const {data: clubData, isLoading: clubLoading} = useDoc<ClubSettings>(clubConfigRef);

  const coachesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
  }, [firestore]);
  const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

  const [salaries, setSalaries] = useState<Record<string, number>>({});

  const bankAccountForm = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  useEffect(() => {
    if (clubData) {
        bankAccountForm.reset(clubData.bankAccount);
        setClubName(clubData.name || '');
        setCategories(clubData.categories || []);
    }
    if (coaches) {
      const initialSalaries = coaches.reduce((acc, coach) => {
        // @ts-ignore
        acc[coach.id] = coach.salary || 0;
        return acc;
      }, {} as Record<string, number>);
      setSalaries(initialSalaries);
    }
  }, [clubData, coaches, bankAccountForm]);

  const onBankAccountSubmit = async (data: BankAccountFormValues) => {
    if (!clubConfigRef) return;
    setIsSavingBank(true);
    try {
        await updateDoc(clubConfigRef, { bankAccount: data });
        toast({ title: "¡Datos Bancarios Guardados!", description: "La información de la cuenta ha sido actualizada." });
    } catch(e) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los datos bancarios." });
    } finally {
        setIsSavingBank(false);
    }
  };

  const handleSalaryChange = (coachId: string, salary: string) => {
    setSalaries(prev => ({...prev, [coachId]: parseInt(salary, 10) || 0}));
  };

  const handleSaveSalaries = async () => {
    if (!firestore || !coaches) return;
    setIsSavingSalaries(true);
    try {
        const batch = writeBatch(firestore);
        coaches.forEach(coach => {
            const coachRef = doc(firestore, 'users', coach.id);
            batch.update(coachRef, { salary: salaries[coach.id] || 0 });
        });
        await batch.commit();
        toast({ title: "¡Salarios Guardados!", description: "Los salarios de los entrenadores han sido actualizados." });
    } catch(e) {
        console.error("Error saving salaries:", e);
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los salarios." });
    } finally {
        setIsSavingSalaries(false);
    }
  };
  
  const handleCategoryYearChange = (index: number, field: 'minYear' | 'maxYear', value: string) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: parseInt(value) || 0 };
    setCategories(newCategories);
  };

  const handleSaveCategories = async () => {
    if (!clubConfigRef) return;
    setIsSavingCategories(true);
    try {
        await updateDoc(clubConfigRef, { categories: categories });
        toast({ title: "¡Configuración de Categorías Guardada!", description: "Los rangos de edad para las categorías han sido actualizados." });
    } catch (e) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudo guardar la configuración de categorías." });
    } finally {
        setIsSavingCategories(false);
    }
  };
  
  const handleSaveName = async () => {
    if (!clubConfigRef) return;
    setIsSavingName(true);
    try {
        await updateDoc(clubConfigRef, { name: clubName });
        toast({title: "Nombre del club actualizado"});
    } catch (e) {
        toast({variant: 'destructive', title: 'Error', description: 'No se pudo guardar el nombre del club.'});
    } finally {
        setIsSavingName(false);
    }
  }
  
  if (isUserLoading || clubLoading || coachesLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Administra la configuración general y la imagen del club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubName">Nombre del Club</Label>
              <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} />
            </div>
            <Button onClick={handleSaveName} disabled={isSavingName}>
              {isSavingName ? <Loader2 className="animate-spin" /> : "Guardar Nombre"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Categorías</CardTitle>
          <CardDescription>
            Define los rangos de año de nacimiento para la asignación automática de deportistas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.name} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`category-${index}`} className="font-semibold">{category.name}</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id={`category-min-${index}`}
                        type="number"
                        placeholder="Año Mín."
                        value={category.minYear}
                        onChange={(e) => handleCategoryYearChange(index, 'minYear', e.target.value)}
                    />
                     <span className="text-muted-foreground">-</span>
                     <Input
                        id={`category-max-${index}`}
                        type="number"
                        placeholder="Año Máx."
                        value={category.maxYear}
                        onChange={(e) => handleCategoryYearChange(index, 'maxYear', e.target.value)}
                    />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSaveCategories} className="mt-6" disabled={isSavingCategories}>
            {isSavingCategories ? <Loader2 className="animate-spin" /> : "Guardar Categorías"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Pagos</CardTitle>
          <CardDescription>
            Información de la cuenta bancaria para recibir los pagos de mensualidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...bankAccountForm}>
            <form onSubmit={bankAccountForm.handleSubmit(onBankAccountSubmit)} className="space-y-6">
              <FormField control={bankAccountForm.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Nombre del Banco</FormLabel><FormControl><Input placeholder="Ej: Bancolombia" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={bankAccountForm.control} name="accountType" render={({ field }) => (<FormItem><FormLabel>Tipo de Cuenta</FormLabel><FormControl><Input placeholder="Ej: Ahorros" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={bankAccountForm.control} name="accountNumber" render={({ field }) => (<FormItem><FormLabel>Número de Cuenta</FormLabel><FormControl><Input placeholder="000-000000-00" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={bankAccountForm.control} name="accountHolder" render={({ field }) => (<FormItem><FormLabel>Titular de la Cuenta</FormLabel><FormControl><Input placeholder="Ej: Nombre Club NIT 000.000.000-0" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isSavingBank}>
                {isSavingBank ? <Loader2 className="animate-spin" /> : "Guardar Datos Bancarios"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Salarios de Entrenadores</CardTitle>
          <CardDescription>
            Define la remuneración mensual para cada entrenador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coaches?.map(coach => (
              <div key={coach.id} className="flex items-center justify-between">
                <Label htmlFor={`salary-${coach.id}`}>{coach.firstName} {coach.lastName}</Label>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">COP</span>
                    <Input
                        id={`salary-${coach.id}`}
                        type="number"
                        value={salaries[coach.id] || ''}
                        onChange={(e) => handleSalaryChange(coach.id, e.target.value)}
                        className="w-40"
                        placeholder="0"
                    />
                </div>
              </div>
            ))}
          </div>
           <Button onClick={handleSaveSalaries} className="mt-6" disabled={isSavingSalaries}>
            {isSavingSalaries ? <Loader2 className="animate-spin" /> : "Guardar Salarios"}
           </Button>
        </CardContent>
      </Card>
    </div>
  );
}
