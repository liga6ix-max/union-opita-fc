"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import initialLandingContent from "@/lib/landing-page-content.json";

export default function ManagerLandingPage() {
  const [content, setContent] = useState(initialLandingContent);

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [id]: value,
      },
    }));
  };

  const handleSectionTitleChange = (section: 'events' | 'news', value: string) => {
    setContent(prev => ({
        ...prev,
        [section]: {
            ...prev[section],
            title: value
        }
    }));
  };

  const handleItemChange = (section: 'events' | 'news', index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const items = [...content[section].items];
    items[index] = { ...items[index], [id]: value };
    setContent(prev => ({ ...prev, [section]: { ...prev[section], items } }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would save the content to a database or a file on the server.
    // For this demo, we'll just show a success message.
    console.log("Contenido guardado:", JSON.stringify(content, null, 2));
    toast({
        title: "¡Contenido guardado!",
        description: "La información de la página de inicio ha sido actualizada (simulado).",
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Página de Inicio</CardTitle>
          <CardDescription>
            Edita los textos y las imágenes que se muestran en la página
            principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hero Section */}
            <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-lg font-medium font-headline">Sección Principal (Héroe)</legend>
                <div className="space-y-2">
                    <Label htmlFor="title">Título Principal</Label>
                    <Input id="title" value={content.hero.title} onChange={handleHeroChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Textarea id="subtitle" value={content.hero.subtitle} onChange={handleHeroChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL de la Imagen de Fondo</Label>
                    <Input id="imageUrl" type="url" value={content.hero.imageUrl} onChange={handleHeroChange} />
                </div>
            </fieldset>

            {/* Events Section */}
            <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-lg font-medium font-headline">Eventos</legend>
                 <div className="space-y-2">
                    <Label htmlFor="events-title">Título de la sección</Label>
                    <Input id="events-title" value={content.events.title} onChange={(e) => handleSectionTitleChange('events', e.target.value)} />
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {content.events.items.map((event, index) => (
                        <AccordionItem value={`event-${index}`} key={index}>
                            <AccordionTrigger>Evento: {event.title}</AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título del Evento</Label>
                                    <Input id="title" value={event.title} onChange={(e) => handleItemChange('events', index, e)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Fecha</Label>
                                    <Input id="date" value={event.date} onChange={(e) => handleItemChange('events', index, e)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea id="description" value={event.description} onChange={(e) => handleItemChange('events', index, e)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">URL de la Imagen</Label>
                                    <Input id="imageUrl" type="url" value={event.imageUrl} onChange={(e) => handleItemChange('events', index, e)} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </fieldset>

            {/* News Section */}
             <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-lg font-medium font-headline">Noticias</legend>
                 <div className="space-y-2">
                    <Label htmlFor="news-title">Título de la sección</Label>
                    <Input id="news-title" value={content.news.title} onChange={(e) => handleSectionTitleChange('news', e.target.value)} />
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {content.news.items.map((item, index) => (
                        <AccordionItem value={`news-${index}`} key={index}>
                            <AccordionTrigger>Noticia: {item.title}</AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título de la Noticia</Label>
                                    <Input id="title" value={item.title} onChange={(e) => handleItemChange('news', index, e)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Fecha</Label>
                                    <Input id="date" value={item.date} onChange={(e) => handleItemChange('news', index, e)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea id="description" value={item.description} onChange={(e) => handleItemChange('news', index, e)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">URL de la Imagen</Label>
                                    <Input id="imageUrl" type="url" value={item.imageUrl} onChange={(e) => handleItemChange('news', index, e)} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </fieldset>

            <Button type="submit">Guardar Cambios</Button>
            <p className="text-sm text-muted-foreground">
                Nota: La funcionalidad de guardado es una simulación. Los cambios se reflejarán en esta página, pero no se aplicarán a la página de inicio pública en este entorno de demostración.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
