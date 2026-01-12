
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import initialClubConfig from "@/lib/club-config.json";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const bankAccountSchema = z.object({
    bankName: z.string().min(1, "El nombre del banco es requerido."),
    accountType: z.string().min(1, "El tipo de cuenta es requerido."),
    accountNumber: z.string().min(1, "El número de cuenta es requerido."),
    accountHolder: z.string().min(1, "El titular es requerido."),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function ManagerSettingsPage() {
  const router = useRouter();
  const { profile, firestore, isUserLoading } = useUser();
  const [logoUrl, setLogoUrl] = useState("https://i.ibb.co/bMRLtG3/Unio-n-Opita-FC-logo.png");
  
  // We use a local state that is initialized from the JSON file.
  const [clubConfig, setClubConfig] = useState(initialClubConfig);

  const clubConfigRef = useMemoFirebase(() => {
      if (!firestore || !profile?.clubId) return null;
      return doc(firestore, `clubs/${profile.clubId}`);
  },[firestore, profile?.clubId]);

  const {data: clubData, isLoading: clubLoading} = useCollection(clubConfigRef ? [clubConfigRef] : null);

  const coachesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.clubId) return null;
    return query(collection(firestore, 'users'), where("clubId", "==", profile.clubId), where("role", "==", "coach"));
  }, [firestore, profile?.clubId]);
  const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

  const [salaries, setSalaries] = useState<Record<string, number>>({});

  useEffect(() => {
    if (coaches) {
      const initialSalaries = coaches.reduce((acc, coach) => {
        // @ts-ignore
        acc[coach.id] = coach.salary || 0;
        return acc;
      }, {} as Record<string, number>);
      setSalaries(initialSalaries);
    }
  }, [coaches]);
  
  useEffect(() => {
    if (clubData) {
        // @ts-ignore
        setClubConfig(clubData[0]);
    }
  }, [clubData])

  const bankAccountForm = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: clubConfig.bankAccount,
  });
  
  useEffect(() => {
      bankAccountForm.reset(clubConfig.bankAccount);
  }, [clubConfig, bankAccountForm]);

  const onBankAccountSubmit = async (data: BankAccountFormValues) => {
    if (!clubConfigRef) return;
    try {
        await updateDoc(clubConfigRef, { bankAccount: data });
        toast({ title: "¡Datos Bancarios Guardados!", description: "La información de la cuenta ha sido actualizada." });
    } catch(e) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los datos bancarios." });
    }
  };

  const handleSalaryChange = (coachId: string, salary: string) => {
    setSalaries(prev => ({...prev, [coachId]: parseInt(salary, 10) || 0}));
  };

  const handleSaveSalaries = async () => {
    if (!firestore || !coaches) return;
    try {
        const batch = coaches.map(coach => {
            const coachRef = doc(firestore, 'users', coach.id);
            // @ts-ignore
            return updateDoc(coachRef, { salary: salaries[coach.id] });
        });
        await Promise.all(batch);
        toast({ title: "¡Salarios Guardados!", description: "Los salarios de los entrenadores han sido actualizados." });
    } catch(e) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los salarios." });
    }
  };
  
  const handleCategoryYearChange = (index: number, field: 'minYear' | 'maxYear', value: string) => {
    const newCategories = [...clubConfig.categories];
    newCategories[index] = { ...newCategories[index], [field]: parseInt(value) || 0 };
    setClubConfig(prev => ({ ...prev, categories: newCategories }));
  };

  const handleSaveCategories = async () => {
    if (!clubConfigRef) return;
    try {
        await updateDoc(clubConfigRef, { categories: clubConfig.categories });
        toast({ title: "¡Configuración de Categorías Guardada!", description: "Los rangos de edad para las categorías han sido actualizados." });
    } catch (e) {
        toast({ variant: 'destructive', title: "Error", description: "No se pudo guardar la configuración de categorías." });
    }
  };
  
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
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubName">Nombre del Club</Label>
              <Input id="clubName" value={clubConfig.name} onChange={(e) => setClubConfig(c => ({...c, name: e.target.value}))} />
            </div>
            <Button onClick={async () => {
                 if (!clubConfigRef) return;
                 await updateDoc(clubConfigRef, { name: clubConfig.name });
                 toast({title: "Nombre del club actualizado"})
            }}>Guardar Nombre</Button>
          </form>
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
            {clubConfig.categories.map((category, index) => (
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
          <Button onClick={handleSaveCategories} className="mt-6">Guardar Categorías</Button>
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
              <Button type="submit">Guardar Datos Bancarios</Button>
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
           <Button onClick={handleSaveSalaries} className="mt-6">Guardar Salarios</Button>
        </CardContent>
      </Card>
    </div>
  );
}
