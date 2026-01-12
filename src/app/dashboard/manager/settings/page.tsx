
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { coaches as initialCoaches, type Coach } from "@/lib/data";

const bankAccountSchema = z.object({
    bankName: z.string().min(1, "El nombre del banco es requerido."),
    accountType: z.string().min(1, "El tipo de cuenta es requerido."),
    accountNumber: z.string().min(1, "El número de cuenta es requerido."),
    accountHolder: z.string().min(1, "El titular es requerido."),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

// This component will manage the shared state for the demo.
function useClubConfig() {
    const [config, setConfig] = useState(initialClubConfig);

    const updateBankAccount = (data: BankAccountFormValues) => {
        const newConfig = { ...config, bankAccount: data };
        setConfig(newConfig);
        // In a real app, this would be an API call.
        // For now, we simulate the update and log it.
        console.log("Datos bancarios guardados (simulado):", newConfig);
        toast({
            title: "¡Datos Bancarios Guardados!",
            description: "La información de la cuenta ha sido actualizada (simulado).",
        });
    };
    
    return { clubConfig: config, updateBankAccount };
}


export default function ManagerSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logoUrl, setLogoUrl] = useState(
    searchParams.get("logo") || "https://i.ibb.co/bMRLtG3/Unio-n-Opita-FC-logo.png"
  );
  
  // We use a local state that is initialized from the JSON file.
  const [clubConfig, setClubConfig] = useState(initialClubConfig);
  const [coaches, setCoaches] = useState<Coach[]>(initialCoaches);

  const bankAccountForm = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: clubConfig.bankAccount,
  });

  const handleLogoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams.toString());
    if (logoUrl) {
      newParams.set("logo", logoUrl);
    } else {
      newParams.delete("logo");
    }
    if (!newParams.has("role")) {
      newParams.set("role", "manager");
    }
    router.push(`/dashboard/manager/settings?${newParams.toString()}`);
    toast({
        title: "Logo actualizado",
        description: "El escudo del club se ha guardado.",
    });
  };

  const onBankAccountSubmit = (data: BankAccountFormValues) => {
    // This only updates the local state for this component for the demo.
    setClubConfig(prev => ({...prev, bankAccount: data}));
    console.log("Datos bancarios guardados:", data);
    // In a real app, this would save to a database or file.
    toast({
        title: "¡Datos Bancarios Guardados!",
        description: "La información de la cuenta ha sido actualizada (simulado).",
    });
  };

  const handleSalaryChange = (coachId: number, salary: string) => {
    const newCoaches = coaches.map(coach => 
        coach.id === coachId ? { ...coach, salary: parseInt(salary, 10) || 0 } : coach
    );
    setCoaches(newCoaches);
  };

  const handleSaveSalaries = () => {
    console.log("Salarios guardados (simulado):", coaches);
    toast({
        title: "¡Salarios Guardados!",
        description: "Los salarios de los entrenadores han sido actualizados (simulado)."
    });
  };


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
          <form onSubmit={handleLogoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL del Escudo del Club (PNG)</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                La URL debe apuntar a una imagen en formato PNG.
              </p>
            </div>
            <Button type="submit">Guardar Escudo</Button>
          </form>
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
              <FormField
                control={bankAccountForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Bancolombia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bankAccountForm.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cuenta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ahorros" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={bankAccountForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cuenta</FormLabel>
                    <FormControl>
                      <Input placeholder="000-000000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={bankAccountForm.control}
                name="accountHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titular de la Cuenta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Nombre Club NIT 000.000.000-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            {coaches.map(coach => (
              <div key={coach.id} className="flex items-center justify-between">
                <Label htmlFor={`salary-${coach.id}`}>{coach.name}</Label>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">COP</span>
                    <Input
                        id={`salary-${coach.id}`}
                        type="number"
                        value={coach.salary}
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
