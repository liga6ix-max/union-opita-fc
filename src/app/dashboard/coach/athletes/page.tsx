
'use client';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ClipboardCheck, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { parseISO, isValid } from "date-fns";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function CoachAthletesPage() {
    const { profile, firestore, isUserLoading } = useUser();
    const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    const athletesQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId || !profile.id) return null;
        return query(collection(firestore, `clubs/${profile.clubId}/athletes`), where("coachId", "==", profile.id));
    }, [firestore, profile?.clubId, profile?.id]);

    const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);

    const openDetailsModal = (athlete: any) => {
        setSelectedAthlete(athlete);
        setIsDetailsOpen(true);
    };

    const getAge = (birthDateString: string) => {
        if (!birthDateString || !isValid(parseISO(birthDateString))) return 'N/A';
        const birthDate = parseISO(birthDateString);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        const m = new Date().getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
            return age - 1;
        }
        return age;
    };

    if (isUserLoading || athletesLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Gestión de Deportistas</CardTitle>
                    <CardDescription>Consulta la información y el rendimiento de los deportistas a tu cargo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Edad</TableHead>
                                <TableHead>Contacto de Emergencia</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athletes && athletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">{athlete.firstName} {athlete.lastName}</TableCell>
                                    <TableCell>{athlete.team || 'N/A'}</TableCell>
                                    <TableCell>{getAge(athlete.birthDate)}</TableCell>
                                    <TableCell>{athlete.emergencyContactName} - {athlete.emergencyContactPhone}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => openDetailsModal(athlete)}>Ver Evaluaciones</DropdownMenuItem>
                                                <DropdownMenuItem>Editar Información</DropdownMenuItem>
                                                <DropdownMenuItem>Añadir Evaluación</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(!athletes || athletes.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground">No tienes deportistas asignados.</p>
                    )}
                </CardContent>
            </Card>

             <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Evaluaciones Físicas de {selectedAthlete?.firstName}</DialogTitle>
                        <DialogDescription>
                            Historial de rendimiento físico del deportista.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAthlete && (
                        <div className="space-y-6 py-4">
                            <p className="text-sm text-center text-muted-foreground py-8">No hay evaluaciones físicas registradas para este deportista.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
