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

const bankAccountSchema = z.object({
    bankName: z.string().min(1, "El nombre del banco es requerido."),
    accountType: z.string().min(1, "El tipo de cuenta es requerido."),
    accountNumber: z.string().min(1, "El número de cuenta es requerido."),
    accountHolder: z.string().min(1, "El titular es requerido."),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function ManagerSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logoUrl, setLogoUrl] = useState(
    searchParams.get("logo") || "https://i.ibb.co/bMRLtG3/Unio-n-Opita-FC-logo.png"
  );
  
  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: initialClubConfig.bankAccount,
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
    console.log("Datos bancarios guardados:", data);
    // En una app real, esto guardaría en la base de datos
    toast({
        title: "¡Datos Bancarios Guardados!",
        description: "La información de la cuenta ha sido actualizada (simulado).",
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
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onBankAccountSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
    </div>
  );
}
