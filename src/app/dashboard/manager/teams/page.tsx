'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, Target, ArrowRight, Loader2, MoreVertical } from "lucide-react";
import { useUser, useCollection, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, where, writeBatch, getDocs, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import clubConfig from "@/lib/club-config.json";

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerTeamsPage() {
    const { profile, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const athletesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // The where clause is removed to ensure all athletes in the subcollection are fetched,
        // as the collection path already scopes them to the club.
        return collection(firestore, `clubs/${MAIN_CLUB_ID}/athletes`);
    }, [firestore]);
    
    const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);
    
    const coachesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", MAIN_CLUB_ID), where("role", "in", ["coach", "manager"]));
    }, [firestore]);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    const microcyclesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`);
    }, [firestore]);
    const { data: microcycles, isLoading: cyclesLoading } = useCollection(microcyclesQuery);

    if (isUserLoading || athletesLoading || coachesLoading || cyclesLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const getCoachForTeam = (teamName: string) => {
        // Find an athlete in the team who has a coach assigned.
        const athleteWithCoach = athletes?.find(a => a.team === teamName && a.coachId);
        // If no such athlete is found, or the coaches list isn't loaded, return null.
        if (!athleteWithCoach || !coaches) return null;
        // Find the full coach object from the coaches list using the found coachId.
        return coaches.find(c => c.id === athleteWithCoach.coachId);
    }

    const getObjectiveForTeam = (teamName: string) => {
        const cycle = microcycles?.find(m => m.team === teamName);
        return cycle?.mainObjective || 'No hay objetivo principal definido.';
    }

    const handleAssignCoach = async (teamName: string, coach: any) => {
        if (!firestore) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo conectar a la base de datos." });
            return;
        }

        const athletesToUpdateQuery = query(collection(firestore, `clubs/${MAIN_CLUB_ID}/athletes`), where("team", "==", teamName));

        try {
            const querySnapshot = await getDocs(athletesToUpdateQuery);
            const batch = writeBatch(firestore);

            querySnapshot.forEach(athleteDoc => {
                const athleteRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/athletes`, athleteDoc.id);
                batch.update(athleteRef, { coachId: coach.id });
            });

            await batch.commit();

            toast({
                title: "¡Entrenador Asignado!",
                description: `El equipo ${teamName} ha sido asignado a ${coach.firstName}.`,
            });
        } catch (error) {
            console.error("Error al asignar entrenador: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo completar la asignación del entrenador." });
        }
    };

    const { categories } = clubConfig;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Gestión de Equipos</h1>
                <p className="text-muted-foreground">Gestiona y supervisa cada categoría del club de forma individual.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                    const teamName = category.name;
                    const teamAthletes = athletes?.filter(a => a.team === teamName) || [];
                    const currentCoach = getCoachForTeam(teamName);
                    
                    return (
                        <Card key={teamName} className="flex flex-col">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="font-headline text-2xl">{teamName}</CardTitle>
                                    <CardDescription>{teamAthletes.length} deportistas</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-mt-2">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/manager/athletes?team=${encodeURIComponent(teamName)}`}>
                                                Ver Deportistas
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>Asignar Entrenador</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {coaches && coaches.map(coach => (
                                                    <DropdownMenuItem key={coach.id} onClick={() => handleAssignCoach(teamName, coach)} disabled={currentCoach?.id === coach.id}>
                                                        {coach.firstName} {coach.lastName}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-5 w-5" />
                                    <span>Entrenador: <span className="font-semibold text-foreground">{currentCoach ? `${currentCoach.firstName} ${currentCoach.lastName}` : 'No asignado'}</span></span>
                                </div>
                                <div className="flex items-start gap-2 text-muted-foreground">
                                    <Target className="h-5 w-5 mt-1 flex-shrink-0" />
                                    <div>
                                        <span className="font-semibold text-foreground">Objetivo Actual:</span>
                                        <p className="text-sm">{getObjectiveForTeam(teamName)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
             {categories.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>No hay equipos definidos en la configuración del club.</p>
                        <p className="text-sm">Puedes definir equipos en la sección de <Link href="/dashboard/manager/settings" className="text-primary underline">Configuración</Link>.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
