
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
import { BrainCircuit, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import clubConfig from '@/lib/club-config.json';
import { Checkbox } from '@/components/ui/checkbox';

const questionSchema = z.object({
  text: z.string().min(1, "La pregunta no puede estar vacía."),
});

const evaluationSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  description: z.string().optional(),
  categories: z.array(z.string()).min(1, "Debes seleccionar al menos una categoría."),
  expiryDate: z.string().min(1, "La fecha de caducidad es requerida."),
  questions: z.array(questionSchema).min(1, "Debe haber al menos una pregunta."),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

const MAIN_CLUB_ID = 'OpitaClub';

export default function ManagerEvaluationsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profile, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      title: '',
      description: '',
      categories: [],
      expiryDate: '',
      questions: [{ text: '' }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = (data: EvaluationFormValues) => {
    if (!firestore || !profile) return;
    
    addDocumentNonBlocking(collection(firestore, `clubs/${MAIN_CLUB_ID}/evaluations`), {
      ...data,
      clubId: MAIN_CLUB_ID,
      createdBy: profile.id,
      createdAt: serverTimestamp(),
    });

    toast({ title: '¡Evaluación Creada!', description: 'La evaluación ha sido asignada a las categorías seleccionadas.' });
    setIsDialogOpen(false);
    form.reset();
  };

  if (isUserLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><BrainCircuit/> Evaluaciones Psicológicas</CardTitle>
            <CardDescription>Crea y asigna evaluaciones de rendimiento mental a los deportistas.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Nueva Evaluación</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Crear Nueva Evaluación</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Título de la Evaluación</FormLabel><FormControl><Input placeholder="Ej: Test de Rendimiento Mental (MPST)" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Describe el propósito y las instrucciones de la evaluación." {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="expiryDate" render={({ field }) => (
                        <FormItem><FormLabel>Fecha de Caducidad</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                  </div>
                  <FormField control={form.control} name="categories" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a Categorías</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border p-4">
                        {clubConfig.categories.map((item) => (
                          <FormField key={item.name} control={form.control} name="categories" render={({ field }) => (
                            <FormItem key={item.name} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.name])
                                      : field.onChange(field.value?.filter((value) => value !== item.name));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{item.name}</FormLabel>
                            </FormItem>
                          )}/>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <div>
                    <FormLabel>Preguntas</FormLabel>
                    <div className="space-y-4">
                      {fields.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2">
                           <FormField
                              control={form.control}
                              name={`questions.${index}.text`}
                              render={({ field }) => (
                                <FormItem className="flex-grow">
                                  <FormControl><Input placeholder={`Pregunta #${index + 1}`} {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" />Añadir Pregunta
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Crear y Asignar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aquí se mostrarán las evaluaciones creadas y sus resultados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

