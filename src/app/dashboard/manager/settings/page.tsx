"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import clubConfig from "@/lib/club-config.json";

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
import { useUser, useMemoFirebase, useFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, where, doc, setDoc } from "firebase/firestore";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
  trainingSchedules: z.record(z.array(z.object({
    day: z.string(),
    time: z.string(),
    location: z.string(),
  }))).optional(),
});

type ClubSettings = z.infer<typeof clubSettingsSchema>;
type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

const createSafeKeyForCategory = (categoryName: string) => {
    return categoryName.replace(/[\s/]/g, '-');
};


export default function ManagerSettingsPage() {
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isSavingSalaries, setIsSavingSalaries] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
  
  const [clubName, setClubName] = useState('');
  const [categories, setCategories] = useState<z.infer<typeof categorySchema>[]>([]);
  const [trainingSchedules, setTrainingSchedules] = useState<Record<string, { day: string; time: string; location: string }[]>>({});


  const clubConfigRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'clubs', MAIN_CLUB_ID);
  },[firestore]);
  const {data: clubData, isLoading: clubLoading} = useDoc<ClubSettings>(clubConfigRef);

  const coachesQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "==", "coach"));
  }, [firestore, profile]);
  const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

  const [salaries, setSalaries] = useState<Record<string, number>>({});

  const bankAccountForm = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: '',
      accountType: '',
      accountNumber: '',
      accountHolder: '',
    },
  });

  useEffect(() => {
    if (clubData) {
        bankAccountForm.reset({
          bankName: clubData.bankAccount?.bankName || '',
          accountType: clubData.bankAccount?.accountType || '',
          accountNumber: clubData.bankAccount?.accountNumber || '',
          accountHolder: clubData.bankAccount?.accountHolder || '',
        });
        setClubName(clubData.name || '');
        setCategories(clubData.categories && clubData.categories.length > 0 ? clubData.categories : clubConfig.categories);
        setTrainingSchedules(clubData.trainingSchedules || {});

    } else if (!clubLoading) {
        setCategories(clubConfig.categories);
    }
    
    if (coaches) {
      const initialSalaries = coaches.reduce((acc, coach) => {
        // @ts-ignore
        acc[coach.id] = coach.salary || 0;
        return acc;
      }, {} as Record<string, number>);
      setSalaries(initialSalaries);
    }
  }, [clubData, clubLoading, coaches, bankAccountForm]);

  const onBankAccountSubmit = (data: BankAccountFormValues) => {
    if (!clubConfigRef) return;
    setIsSavingBank(true);
    setDocumentNonBlocking(clubConfigRef, { bankAccount: data }, { merge: true });
    toast({ title: "¡Datos Bancarios Guardados!", description: "La información de la cuenta ha sido actualizada." });
    setIsSavingBank(false);
  };

  const handleSalaryChange = (coachId: string, salary: string) => {
    setSalaries(prev => ({...prev, [coachId]: parseInt(salary, 10) || 0}));
  };

  const handleSaveSalaries = () => {
    if (!firestore || !coaches) return;
    setIsSavingSalaries(true);
    
    coaches.forEach(coach => {
        const coachRef = doc(firestore, 'users', coach.id);
        updateDocumentNonBlocking(coachRef, { salary: salaries[coach.id] || 0 });
    });

    toast({ title: "¡Salarios Guardados!", description: "Los salarios de los entrenadores han sido actualizados." });
    setIsSavingSalaries(false);
  };
  
  const handleCategoryYearChange = (index: number, field: 'minYear' | 'maxYear', value: string) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: parseInt(value) || 0 };
    setCategories(newCategories);
  };

  const handleSaveCategories = () => {
    if (!clubConfigRef) return;
    setIsSavingCategories(true);
    setDocumentNonBlocking(clubConfigRef, { categories: categories }, { merge: true });
    toast({ title: "¡Configuración de Categorías Guardada!", description: "Los rangos de edad para las categorías han sido actualizados." });
    setIsSavingCategories(false);
  };
  
  const handleSaveName = () => {
    if (!clubConfigRef) return;
    setIsSavingName(true);
    setDocumentNonBlocking(clubConfigRef, { name: clubName }, { merge: true });
    toast({title: "Nombre del club actualizado"});
    setIsSavingName(false);
  }

 const handleScheduleChange = (categoryName: string, sessionIndex: number, field: 'day' | 'time' | 'location', value: string) => {
    const safeKey = createSafeKeyForCategory(categoryName);
    setTrainingSchedules(prev => {
        const currentSessions = Array.isArray(prev[safeKey]) ? prev[safeKey] : [];
        const newSessions = [...currentSessions];
        newSessions[sessionIndex] = { ...newSessions[sessionIndex], [field]: value };
        
        return {
            ...prev,
            [safeKey]: newSessions,
        };
    });
  };

  const handleAddSession = (categoryName: string) => {
    const safeKey = createSafeKeyForCategory(categoryName);
    setTrainingSchedules(prev => {
        const currentSessions = Array.isArray(prev[safeKey]) ? prev[safeKey] : [];
        const newSessions = [...currentSessions, { day: '', time: '', location: '' }];

        return {
            ...prev,
            [safeKey]: newSessions,
        };
    });
  };

  const handleRemoveSession = (categoryName: string, sessionIndex: number) => {
    const safeKey = createSafeKeyForCategory(categoryName);
    setTrainingSchedules(prev => {
        const currentSessions = Array.isArray(prev[safeKey]) ? prev[safeKey] : [];
        const newSessions = [...currentSessions];
        newSessions.splice(sessionIndex, 1);
        
        return {
            ...prev,
            [safeKey]: newSessions,
        };
    });
  };

  const handleSaveSchedules = () => {
    if (!clubConfigRef) return;
    setIsSavingSchedules(true);
    setDocumentNonBlocking(clubConfigRef, { trainingSchedules }, { merge: true });
    toast({ title: "¡Horarios Guardados!", description: "Los horarios de entrenamiento han sido actualizados." });
    setIsSavingSchedules(false);
  };
  
  if (isUserLoading || clubLoading || coachesLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
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
              <div key={category.name} className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 border-t pt-4 first:border-t-0 first:pt-0">
                <Label htmlFor={`category-min-${index}`} className="font-semibold md:col-span-2">{category.name}</Label>
                <div className="md:col-span-3 flex items-center gap-2">
                    <Input
                        id={`category-min-${index}`}
                        type="number"
                        placeholder="Año Mín."
                        value={category.minYear}
                        onChange={(e) => handleCategoryYearChange(index, 'minYear', e.target.value)}
                    />
                     <span className="font-bold text-muted-foreground">-</span>
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
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={handleSaveCategories} disabled={isSavingCategories}>
                {isSavingCategories ? <Loader2 className="animate-spin" /> : "Guardar Categorías"}
            </Button>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="outline" onClick={() => setCategories(clubConfig.categories)}>
                            Restablecer
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Carga las categorías por defecto del sistema.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Horarios de Entrenamiento</CardTitle>
          <CardDescription>
            Define los días, horas y lugares de entrenamiento para cada categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map((category) => {
              const safeKey = createSafeKeyForCategory(category.name);
              const scheduleSessions = Array.isArray(trainingSchedules?.[safeKey])
                ? trainingSchedules[safeKey]
                : [];
              return (
                <div key={category.name} className="space-y-4 rounded-md border p-4">
                   <Label className="font-semibold text-base">{category.name}</Label>
                   {scheduleSessions.map((session, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-2 items-end border-t pt-4">
                        <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`day-${safeKey}-${index}`}>Día</Label>
                            <Input id={`day-${safeKey}-${index}`} value={session.day} onChange={(e) => handleScheduleChange(category.name, index, 'day', e.target.value)} placeholder="Ej: Lunes" />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`time-${safeKey}-${index}`}>Horario</Label>
                            <Input id={`time-${safeKey}-${index}`} value={session.time} onChange={(e) => handleScheduleChange(category.name, index, 'time', e.target.value)} placeholder="4-6 PM" />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`location-${safeKey}-${index}`}>Lugar</Label>
                            <Input id={`location-${safeKey}-${index}`} value={session.location} onChange={(e) => handleScheduleChange(category.name, index, 'location', e.target.value)} placeholder="Cancha Principal" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSession(category.name, index)} className="md:col-span-1 text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleAddSession(category.name)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Horario
                  </Button>
                </div>
              );
            })}
          </div>
          <Button onClick={handleSaveSchedules} className="mt-6" disabled={isSavingSchedules}>
            {isSavingSchedules ? <Loader2 className="animate-spin" /> : "Guardar Horarios"}
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
