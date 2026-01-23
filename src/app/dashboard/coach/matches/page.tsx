'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Swords, PlusCircle, Loader2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import clubConfig from '@/lib/club-config.json';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const matchSchema = z.object({
  categories: z.array(z.string()).min(1, "Debes seleccionar al menos una categoría."),
  matchDate: z.string().min(1, "La fecha del partido es requerida."),
  matchTime: z.string().min(1, "La hora del partido es requerida."),
  attendanceTime: z.string().min(1, "La hora de asistencia es requerida."),
  location: z.string().min(3, "La ubicación es requerida."),
  opponent: z.string().min(2, "El nombre del rival es requerido."),
  isVisitor: z.boolean().default(false),
  departureTime: z.string().optional(),
  arbitrationValue: z.coerce.number().optional(),
  modality: z.enum(["Futbol 11", "Futbol 9", "Futbol 7", "Futbol 5"]),
  gameStructure: z.string().optional(),
  gameIdea: z.string().optional(),
  gameModel: z.string().optional(),
  calledPlayers: z.array(z.string()).optional(),
});

type MatchFormValues = z.infer<typeof matchSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function CoachMatchesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/matches`));
  }, [firestore, profile]);
  
  const { data: matches, isLoading: matchesLoading } = useCollection(matchesQuery);

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      categories: [],
      matchDate: '',
      matchTime: '',
      attendanceTime: '',
      location: '',
      opponent: '',
      isVisitor: false,
      modality: 'Futbol 11',
    },
  });

  const onSubmit = (data: MatchFormValues) => {
    if (!firestore || !profile) return;
    
    addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/matches`), {
      ...data,
      clubId: MAIN_CLUB_ID,
      createdBy: profile.id,
      createdAt: serverTimestamp(),
    });

    toast({ title: '¡Partido Creado!', description: 'El partido ha sido programado y los jugadores pueden ser convocados.' });
    setIsDialogOpen(false);
    form.reset();
  };

  if (isUserLoading || matchesLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  
  const isVisitor = form.watch('isVisitor');

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><Swords/> Gestión de Partidos</CardTitle>
            <CardDescription>Crea y gestiona los partidos del club.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Nuevo Partido</Button></DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader><DialogTitle>Crear Nuevo Partido</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-6">
                    <FormField
                      control={form.control}
                      name="categories"
                      render={() => (
                        <FormItem>
                          <FormLabel>Categorías Convocadas</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4">
                            {clubConfig.categories.map((item) => (
                              <FormField
                                key={item.name}
                                control={form.control}
                                name="categories"
                                render={({ field }) => (
                                  <FormItem key={item.name} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.name)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item.name])
                                            : field.onChange(field.value?.filter((value) => value !== item.name));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item.name}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="matchDate" render={({ field }) => (<FormItem><FormLabel>Fecha del Partido</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="matchTime" render={({ field }) => (<FormItem><FormLabel>Hora del Partido</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="attendanceTime" render={({ field }) => (<FormItem><FormLabel>Hora de Asistencia</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="opponent" render={({ field }) => (<FormItem><FormLabel>Equipo Rival</FormLabel><FormControl><Input placeholder="Nombre del equipo contrario" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Lugar del Partido</FormLabel><FormControl><Input placeholder="Estadio, cancha, etc." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                     <FormField control={form.control} name="isVisitor" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>¿Partido de Visitante?</FormLabel>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}/>
                    {isVisitor && <FormField control={form.control} name="departureTime" render={({ field }) => (<FormItem><FormLabel>Hora de Salida</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="arbitrationValue" render={({ field }) => (<FormItem><FormLabel>Valor Arbitraje (por persona)</FormLabel><FormControl><Input type="number" placeholder="Ej: 5000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="modality" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modalidad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar modalidad" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Futbol 11">Futbol 11</SelectItem>
                                <SelectItem value="Futbol 9">Futbol 9</SelectItem>
                                <SelectItem value="Futbol 7">Futbol 7</SelectItem>
                                <SelectItem value="Futbol 5">Futbol 5</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )}/>
                  </div>
                  <FormField control={form.control} name="gameStructure" render={({ field }) => (<FormItem><FormLabel>Estructura de Juego</FormLabel><FormControl><Input placeholder="Ej: 1-4-3-3" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="gameIdea" render={({ field }) => (<FormItem><FormLabel>Idea de Juego</FormLabel><FormControl><Textarea placeholder="Describe la idea de juego principal..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="gameModel" render={({ field }) => (<FormItem><FormLabel>Modelo de Juego</FormLabel><FormControl><Textarea placeholder="Describe el modelo de juego a utilizar..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>

                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Crear Partido"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {matches && matches.length > 0 ? (
            <div className='space-y-4'>
                {matches.map(match => (
                    <Card key={match.id}>
                        <CardHeader>
                            <CardTitle>Rival: {match.opponent}</CardTitle>
                            <CardDescription>Fecha: {match.matchDate} - {match.matchTime}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>Categorías: {match.categories.join(', ')}</p>
                           <p>Lugar: {match.location}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          ): (
            <p className="text-center text-muted-foreground py-8">
                No hay partidos programados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
