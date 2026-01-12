"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ManagerSettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [logoUrl, setLogoUrl] = useState(searchParams.get('logo') || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newParams = new URLSearchParams(searchParams.toString());
        if (logoUrl) {
            newParams.set("logo", logoUrl);
        } else {
            newParams.delete("logo");
        }
        // Preserve role param
        if (!newParams.has('role')) {
            newParams.set('role', 'manager');
        }
        router.push(`/dashboard/manager/settings?${newParams.toString()}`);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Configuración del Club</CardTitle>
                    <CardDescription>
                        Administra la configuración general del club.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                La URL debe apuntar a una imagen en formato PNG. La imagen se mostrará en toda la aplicación.
                            </p>
                        </div>
                        <Button type="submit">Guardar Cambios</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
