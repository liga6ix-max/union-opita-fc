'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Swords, Calendar, Clock, MapPin, Users, Shield, Bus, HandCoins, Goal, GitBranch, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const MAIN_CLUB_ID = 'OpitaClub';

export default function AthleteMatchesPage() {
  const { profile, user, isUserLoading, firestore } = useUser();
  const { toast } = useToast();

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.team) return null;
    return query(
      collection(firestore, `clubs/${MAIN_CLUB_ID}/matches`),
      where("categories", "array-contains", profile.team)
    );
  }, [firestore, profile?.team]);
  
  const { data: matches, isLoading: matchesLoading } = useCollection(matchesQuery);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, `clubs/${MAIN_CLUB_ID}/attendance`),
        where("athleteId", "==", user.uid)
    );
  }, [firestore, user?.uid]);
  const { data: attendanceData, isLoading: attendanceLoading } = useCollection(attendanceQuery);


  const handleAttendanceAction = async (matchId: string, status: 'Confirmado' | 'Rechazado') => {
    if (!firestore || !user?.uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
        return;
    }

    const attendanceCollectionRef = collection(firestore, `clubs/${MAIN_CLUB_ID}/attendance`);
    const q = query(attendanceCollectionRef, where("matchId", "==", matchId), where("athleteId", "==", user.uid));
    
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // Update existing attendance
            const docRef = querySnapshot.docs[0].ref;
            updateDocumentNonBlocking(docRef, { status, submittedAt: serverTimestamp() });
        } else {
            // Create new attendance record
            addDocumentNonBlocking(attendanceCollectionRef, {
                clubId: MAIN_CLUB_ID,
                matchId,
                athleteId: user.uid,
                status,
                submittedAt: serverTimestamp(),
            });
        }
        toast({
            title: `Asistencia ${status === 'Confirmado' ? 'Confirmada' : 'Rechazada'}`,
            description: `Has ${status.toLowerCase()} tu asistencia para este partido.`,
        });
    } catch (error) {
        console.error("Error handling attendance:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar tu respuesta.' });
    }
  };


  const isLoading = isUserLoading || matchesLoading || attendanceLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingMatches =
    matches?.filter((match) => {
      const matchDate = new Date(`${match.matchDate}T00:00:00`);
      return matchDate >= today;
    }) || [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Swords/> Mis Partidos</CardTitle>
          <CardDescription>Aquí puedes ver los próximos partidos y confirmar tu asistencia.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-6">
              {upcomingMatches.map(match => {
                const attendanceRecord = attendanceData?.find(a => a.matchId === match.id);

                return (
                  <Card key={match.id} className="shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                          <div>
                              <CardTitle className="font-headline text-2xl text-primary">Rival: {match.opponent}</CardTitle>
                              <CardDescription className="flex items-center gap-2 pt-1"><Calendar/> {format(new Date(`${match.matchDate}T00:00:00`), "d 'de' MMMM, yyyy", { locale: es })}</CardDescription>
                          </div>
                          <Badge variant={match.isVisitor ? 'destructive' : 'secondary'}>{match.isVisitor ? 'Visitante' : 'Local'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/> <div><p className="font-semibold">Hora Partido</p><p>{match.matchTime}</p></div></div>
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/> <div><p className="font-semibold">Hora Asistencia</p><p>{match.attendanceTime}</p></div></div>
                          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/> <div><p className="font-semibold">Lugar</p><p>{match.location}</p></div></div>
                          {match.isVisitor && match.departureTime && <div className="flex items-center gap-2"><Bus className="h-4 w-4 text-muted-foreground"/> <div><p className="font-semibold">Hora Salida</p><p>{match.departureTime}</p></div></div>}
                          <div className="flex items-center gap-2"><HandCoins className="h-4 w-4 text-muted-foreground"/> <div><p className="font-semibold">Arbitraje</p><p>{match.arbitrationValue ? `${match.arbitrationValue.toLocaleString('es-CO')} COP` : 'N/A'}</p></div></div>
                          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground"/> <div><p className="font-semibold">Modalidad</p><p>{match.modality}</p></div></div>
                       </div>
                       <div className="space-y-3 pt-4 border-t">
                           <div className="flex items-start gap-2"><Goal className="h-4 w-4 mt-1 text-muted-foreground"/><div><p className="font-semibold">Estructura de Juego</p><p className="text-muted-foreground">{match.gameStructure || 'No definida'}</p></div></div>
                           <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-1 text-muted-foreground"/><div><p className="font-semibold">Idea de Juego</p><p className="text-muted-foreground">{match.gameIdea || 'No definida'}</p></div></div>
                           <div className="flex items-start gap-2"><GitBranch className="h-4 w-4 mt-1 text-muted-foreground"/><div><p className="font-semibold">Modelo de Juego</p><p className="text-muted-foreground">{match.gameModel || 'No definido'}</p></div></div>
                       </div>
                        <div className="pt-4 border-t flex items-center justify-end gap-4">
                            {attendanceRecord ? (
                                <Badge variant={attendanceRecord.status === 'Confirmado' ? 'default' : 'destructive'}>
                                    {attendanceRecord.status === 'Confirmado' ? <CheckCircle className="mr-2"/> : <XCircle className="mr-2"/>}
                                    {attendanceRecord.status}
                                </Badge>
                            ) : (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => handleAttendanceAction(match.id, 'Rechazado')}>Rechazar</Button>
                                    <Button size="sm" onClick={() => handleAttendanceAction(match.id, 'Confirmado')}>Confirmar Asistencia</Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                  </Card>
                )})}
            </div>
          ) : (
             <div className="text-center py-12">
                <Swords className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Sin Partidos Próximos</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    No tienes partidos programados por ahora.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
