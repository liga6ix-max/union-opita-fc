
'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, Target, ArrowRight, Loader2 } from "lucide-react";
import { useUser, useCollection, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function ManagerTeamsPage() {
    const { profile, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const athletesQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId) return null;
        return collection(firestore, `clubs/${profile.clubId}/athletes`);
    }, [firestore, profile?.clubId]);
    const { data: athletes, isLoading: athletesLoading } = useCollection(athletesQuery);
    
    const coachesQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId) return null;
        return query(collection(firestore, 'users'), where("clubId", "==", profile.clubId), where("role", "==", "coach"));
    }, [firestore, profile?.clubId]);
    const { data: coaches, isLoading: coachesLoading } = useCollection(coachesQuery);

    const microcyclesQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.clubId) return null;
        return collection(firestore, `clubs/${profile.clubId}/microcycles`);
    }, [firestore, profile?.clubId]);
    const { data: microcycles, isLoading: cyclesLoading } = useCollection(microcyclesQuery);

    const teams = athletes?.reduce((acc, athlete) => {
        const teamName = athlete.team;
        if (teamName) {
            if (!acc[teamName]) {
                acc[teamName] = [];
            }
            acc[teamName].push(athlete);
        }
        return acc;
    }, {} as Record<string, any[]>) || {};

    if (isUserLoading || athletesLoading || coachesLoading || cyclesLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const getCoachForTeam = (teamName: string) => {
        const athleteInTeam = athletes?.find(a => a.team === teamName);
        if (!athleteInTeam || !coaches) return 'No asignado';
        const coach = coaches.find(c => c.id === athleteInTeam.coachId);
        return coach?.firstName || 'No asignado';
    }

    const getObjectiveForTeam = (teamName: string) => {
        const cycle = microcycles?.find(m => m.team === teamName);
        return cycle?.mainObjective || 'No hay objetivo principal definido.';
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Gestión de Equipos</h1>
                <p className="text-muted-foreground">Gestiona y supervisa cada categoría del club de forma individual.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(teams).map(([teamName, teamAthletes]) => (
                    <Card key={teamName} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{teamName}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-5 w-5" />
                                <span>{teamAthletes.length} Deportistas</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-5 w-5" />
                                <span>Entrenador: {getCoachForTeam(teamName)}</span>
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
                                <Target className="h-5 w-5 mt-1 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-foreground">Objetivo Actual:</span>
                                    <p className="text-sm">{getObjectiveForTeam(teamName)}</p>
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button asChild className="w-full">
                                <Link href={`/dashboard/manager/athletes?team=${encodeURIComponent(teamName)}`}>
                                    Ver Deportistas <ArrowRight className="ml-2"/>
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
             {Object.keys(teams).length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No hay equipos con deportistas asignados.</p>
            )}
        </div>
    )
}
