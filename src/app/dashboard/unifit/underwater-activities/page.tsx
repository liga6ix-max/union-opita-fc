'use client';

import { useMemo } from 'react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Waves, Calendar, Clock, MapPin } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';


const MAIN_CLUB_ID = 'OpitaClub';

export default function UnderwaterActivitiesPage() {
  const { profile, isUserLoading, firestore } = useUser();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/underwaterActivities`), where('date', '>=', format(startOfToday(), 'yyyy-MM-dd')), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: allActivities, isLoading: activitiesLoading } = useCollection(activitiesQuery);

  const filteredActivities = useMemo(() => {
    if (!allActivities || !profile) return [];
    
    return allActivities.filter(activity => {
        return !activity.level || activity.level === profile.level;
    });

  }, [allActivities, profile]);


  const isLoading = isUserLoading || activitiesLoading || !profile;

  if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Waves /> Actividades Subacuáticas
          </CardTitle>
          <CardDescription>
            Estas son las próximas actividades subacuáticas programadas para ti según tu nivel.
            {profile?.level && <span className="font-bold text-primary ml-2"> (Nivel {profile.level})</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {filteredActivities && filteredActivities.length > 0 ? (
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {filteredActivities.map(activity => (
                      <Card key={activity.id} className="flex flex-col">
                          <CardHeader>
                              <div className="flex justify-between items-start">
                                  <CardTitle className="font-headline text-xl">{activity.activity}</CardTitle>
                                  {activity.level && <Badge variant="secondary">Nivel {activity.level}</Badge>}
                              </div>
                               <CardDescription className="flex items-center gap-2 pt-2"><Calendar/> {format(new Date(`${activity.date}T00:00:00`), "d 'de' MMMM, yyyy", { locale: es })}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2"><Clock/> {activity.time}</div>
                                <div className="flex items-center gap-2"><MapPin/> {activity.location}</div>
                            </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
            ): (
              <div className="text-center py-12">
                <Waves className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Sin Actividades Próximas</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    No hay actividades subacuáticas programadas para tu nivel en este momento.
                </p>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
