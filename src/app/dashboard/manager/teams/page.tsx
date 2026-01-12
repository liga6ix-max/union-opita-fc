

'use client';

import Link from "next/link";
import { athletes, coaches, microcycles } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, Target, ArrowRight } from "lucide-react";

// Agrupar atletas por equipo
const teams = athletes.reduce((acc, athlete) => {
    const teamName = athlete.team;
    if (teamName) {
        if (!acc[teamName]) {
            acc[teamName] = [];
        }
        acc[teamName].push(athlete);
    }
    return acc;
}, {} as Record<string, typeof athletes>);


export default function ManagerTeamsPage() {
    
    const getCoachForTeam = (teamName: string) => {
        const athleteInTeam = athletes.find(a => a.team === teamName);
        if (!athleteInTeam) return 'No asignado';
        const coach = coaches.find(c => c.id === athleteInTeam.coachId);
        return coach?.name || 'No asignado';
    }

    const getObjectiveForTeam = (teamName: string) => {
        const cycle = microcycles.find(m => m.team === teamName);
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
        </div>
    )
}
