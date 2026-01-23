'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Swords, PlusCircle, Loader2, Users, MoreVertical, Pencil, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import clubConfig from '@/lib/club-config.json';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function ManagerMatchesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(collection(firestore, `clubs/${MAIN_CLUB_ID}/matches`));
  }, [firestore, profile]);
  
  const { data: matches, isLoading: matchesLoading } = useCollection(matchesQuery);

  const createForm = useForm<MatchFormValues>({
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
      departureTime: '',
      arbitrationValue: undefined,
      gameStructure: '',
      gameIdea: '',
      gameModel: '',
    },
  });
  
  const editForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
  });

  const isVisitorInCreate = createForm.watch('isVisitor');
  const isVisitorInEdit = editForm.watch('isVisitor');

  useEffect(() => {
    if (selectedMatch && isEditDialogOpen) {
      editForm.reset({
        ...selectedMatch,
        arbitrationValue: selectedMatch.arbitrationValue || undefined,
        departureTime: selectedMatch.departureTime || '',
        gameStructure: selectedMatch.gameStructure || '',
        gameIdea: selectedMatch.gameIdea || '',
        gameModel: selectedMatch.gameModel || '',
      });
    }
  }, [selectedMatch, isEditDialogOpen, editForm]);

  const onCreateSubmit = (data: MatchFormValues) => {
    if (!firestore || !profile) return;
    
    addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/matches`), {
      ...data,
      clubId: MAIN_CLUB_ID,
      createdBy: profile.id,
      createdAt: serverTimestamp(),
    });

    toast({ title: '¡Partido Creado!', description: 'El partido ha sido programado.' });
    setIsCreateDialogOpen(false);
    createForm.reset();
  };
  
  const onEditSubmit = (data: MatchFormValues) => {
    if (!firestore || !profile || !selectedMatch) return;
    
    const matchRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/matches`, selectedMatch.id);
    updateDocumentNonBlocking(matchRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    toast({ title: '¡Partido Actualizado!', description: 'La información del partido ha sido guardada.'});
    setIsEditDialogOpen(false);
    setSelectedMatch(null);
  };
  
  const handleDeleteMatch = () => {
    if (!firestore || !selectedMatch) return;
    
    const matchRef = doc(firestore, `clubs/${MAIN_CLUB_ID}/matches`, selectedMatch.id);
    deleteDocumentNonBlocking(matchRef);
    
    toast({ title: '¡Partido Eliminado!', description: 'El partido ha sido eliminado del sistema.'});
    setIsDeleteDialogOpen(false);
    setSelectedMatch(null);
  }

  const openEditDialog = (match: any) => {
    setSelectedMatch(match);
    setIsEditDialogOpen(true);
  }
  
  const openDeleteDialog = (match: any) => {
    setSelectedMatch(match);
    setIsDeleteDialogOpen(true);
  }
  
  const isLoading = isUserLoading || matchesLoading;

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline flex items-center gap-2"><Swords/> Gestión de Partidos</CardTitle>
              <CardDescription>Crea y gestiona los partidos del club.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Nuevo Partido</Button></DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader><DialogTitle>Crear Nuevo Partido</DialogTitle></DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-6">
                      <FormField
                        control={createForm.control}
                        name="categories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categorías Convocadas</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4">
                              {clubConfig.categories.map((item) => (
                                <FormItem
                                  key={item.name}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.name)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.name])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== item.name
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.name}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={createForm.control} name="matchDate" render={({ field }) => (<FormItem><FormLabel>Fecha del Partido</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={createForm.control} name="matchTime" render={({ field }) => (<FormItem><FormLabel>Hora del Partido</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={createForm.control} name="attendanceTime" render={({ field }) => (<FormItem><FormLabel>Hora de Asistencia</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={createForm.control} name="opponent" render={({ field }) => (<FormItem><FormLabel>Equipo Rival</FormLabel><FormControl><Input placeholder="Nombre del equipo contrario" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={createForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>Lugar del Partido</FormLabel><FormControl><Input placeholder="Estadio, cancha, etc." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <FormField control={createForm.control} name="isVisitor" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"> <FormLabel>¿Partido de Visitante?</FormLabel> </div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                          {isVisitorInCreate && <FormField control={createForm.control} name="departureTime" render={({ field }) => (<FormItem><FormLabel>Hora de Salida</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={createForm.control} name="arbitrationValue" render={({ field }) => (<FormItem><FormLabel>Valor Arbitraje (por persona)</FormLabel><FormControl><Input type="number" placeholder="Ej: 5000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={createForm.control} name="modality" render={({ field }) => ( <FormItem> <FormLabel>Modalidad</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar modalidad" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Futbol 11">Futbol 11</SelectItem> <SelectItem value="Futbol 9">Futbol 9</SelectItem> <SelectItem value="Futbol 7">Futbol 7</SelectItem> <SelectItem value="Futbol 5">Futbol 5</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                      </div>
                      <FormField control={createForm.control} name="gameStructure" render={({ field }) => (<FormItem><FormLabel>Estructura de Juego</FormLabel><FormControl><Input placeholder="Ej: 1-4-3-3" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={createForm.control} name="gameIdea" render={({ field }) => (<FormItem><FormLabel>Idea de Juego</FormLabel><FormControl><Textarea placeholder="Describe la idea de juego principal..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={createForm.control} name="gameModel" render={({ field }) => (<FormItem><FormLabel>Modelo de Juego</FormLabel><FormControl><Textarea placeholder="Describe el modelo de juego a utilizar..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                      <DialogFooter> <Button type="submit" disabled={createForm.formState.isSubmitting}> {createForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Crear Partido"} </Button> </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : matches && matches.length > 0 ? (
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {matches.map(match => (
                      <Card key={match.id} className="flex flex-col">
                          <CardHeader className="flex-grow">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <CardTitle className="font-headline text-xl">Rival: {match.opponent}</CardTitle>
                                      <CardDescription className="flex items-center gap-2 pt-1"><Calendar/> {format(new Date(`${match.matchDate}T00:00:00`), "d 'de' MMMM, yyyy", { locale: es })}</CardDescription>
                                  </div>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => openEditDialog(match)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openDeleteDialog(match)} className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {match.categories.map((cat: string) => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2"><Clock/> {match.matchTime}</div>
                                <div className="flex items-center gap-2"><MapPin/> {match.location}</div>
                            </div>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Editar Partido</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-6">
                 <FormField
                    control={editForm.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categorías Convocadas</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4">
                          {clubConfig.categories.map((item) => (
                            <FormItem
                              key={item.name}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.name])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== item.name
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.name}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={editForm.control} name="matchDate" render={({ field }) => (<FormItem><FormLabel>Fecha del Partido</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={editForm.control} name="matchTime" render={({ field }) => (<FormItem><FormLabel>Hora del Partido</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={editForm.control} name="attendanceTime" render={({ field }) => (<FormItem><FormLabel>Hora de Asistencia</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={editForm.control} name="opponent" render={({ field }) => (<FormItem><FormLabel>Equipo Rival</FormLabel><FormControl><Input placeholder="Nombre del equipo contrario" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={editForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>Lugar del Partido</FormLabel><FormControl><Input placeholder="Estadio, cancha, etc." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                     <FormField control={editForm.control} name="isVisitor" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"> <FormLabel>¿Partido de Visitante?</FormLabel> </div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                     {isVisitorInEdit && <FormField control={editForm.control} name="departureTime" render={({ field }) => (<FormItem><FormLabel>Hora de Salida</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={editForm.control} name="arbitrationValue" render={({ field }) => (<FormItem><FormLabel>Valor Arbitraje (por persona)</FormLabel><FormControl><Input type="number" placeholder="Ej: 5000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={editForm.control} name="modality" render={({ field }) => ( <FormItem> <FormLabel>Modalidad</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar modalidad" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Futbol 11">Futbol 11</SelectItem> <SelectItem value="Futbol 9">Futbol 9</SelectItem> <SelectItem value="Futbol 7">Futbol 7</SelectItem> <SelectItem value="Futbol 5">Futbol 5</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                 </div>
                 <FormField control={editForm.control} name="gameStructure" render={({ field }) => (<FormItem><FormLabel>Estructura de Juego</FormLabel><FormControl><Input placeholder="Ej: 1-4-3-3" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={editForm.control} name="gameIdea" render={({ field }) => (<FormItem><FormLabel>Idea de Juego</FormLabel><FormControl><Textarea placeholder="Describe la idea de juego principal..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={editForm.control} name="gameModel" render={({ field }) => (<FormItem><FormLabel>Modelo de Juego</FormLabel><FormControl><Textarea placeholder="Describe el modelo de juego a utilizar..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                 <DialogFooter> <Button type="submit" disabled={editForm.formState.isSubmitting}> {editForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Cambios"} </Button> </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de eliminar este partido?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la información del partido.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedMatch(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMatch} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
