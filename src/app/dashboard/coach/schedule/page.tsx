
'use client';

import { useMemo } from 'react';
import { useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CalendarDays, MapPin, Clock, Users } from 'lucide-react';

const MAIN_CLUB_ID = 'OpitaClub';

const createSafeKeyForCategory = (categoryName: string) => {
    if (!categoryName) return '';
    return categoryName.replace(/[\s/]/g, '-');
};

export default function CoachSchedulePage() {
  const { profile, isUserLoading, firestore } = useUser();

  // 1. Get all microcycles assigned to this coach to determine their teams
  const microcyclesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.id) return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/microcycles`), where("coachId", "==", profile.id));
  }, [firestore, profile?.id]);
  const { data: coachCycles, isLoading: cyclesLoading } = useCollection(microcyclesQuery);

  // 2. Get the main club configuration document which contains all schedules
  const clubConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'clubs', MAIN_CLUB_ID);
  }, [firestore]);
  const { data: clubData, isLoading: clubLoading } = useDoc(clubConfigRef);

  // 3. Process the data to get schedules for the coach's teams
  const coachSchedules = useMemo(() => {
    if (!coachCycles || !clubData?.trainingSchedules) {
      return [];
    }
    
    // Get unique team names from the coach's cycles
    const coachTeams = [...new Set(coachCycles.map(cycle => cycle.team))];
    
    const schedules: { team: string; schedule: { day: string; time: string; location: string }[] }[] = [];

    coachTeams.forEach(team => {
      const safeKey = createSafeKeyForCategory(team);
      const teamSchedule = clubData.trainingSchedules[safeKey];
      if (teamSchedule && Array.isArray(teamSchedule) && teamSchedule.length > 0) {
        schedules.push({
          team: team,
          schedule: teamSchedule,
        });
      }
    });
    
    return schedules;
  }, [coachCycles, clubData]);

  const isLoading = isUserLoading || cyclesLoading || clubLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays /> Mis Horarios de Entrenamiento
          </CardTitle>
          <CardDescription>
            Aquí puedes ver los horarios de entrenamiento para las categorías que tienes asignadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coachSchedules.length > 0 ? (
            <div className="space-y-6">
              {coachSchedules.map(({ team, schedule }) => (
                <Card key={team}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Categoría: {team}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Día</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Lugar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.map((session, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {session.day}</TableCell>
                            <TableCell className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {session.time}</TableCell>
                            <TableCell className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {session.location}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tienes horarios asignados. Asegúrate de tener planes de entrenamiento (microciclos) asignados a tus categorías.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
