import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight } from "lucide-react";

const heroImage = PlaceHolderImages.find(p => p.id === "hero-soccer");

const events = [
  {
    id: 1,
    title: "Torneo Intermunicipal",
    date: "25 de Agosto, 2024",
    description: "Participa en el torneo más grande de la región. Demuestra tu talento y lleva a tu equipo a la victoria.",
    image: PlaceHolderImages.find(p => p.id === "event-tournament"),
  },
  {
    id: 2,
    title: "Convocatorias Abiertas",
    date: "Todo Septiembre, 2024",
    description: "Buscamos nuevos talentos para todas nuestras categorías. ¡Es tu oportunidad de unirte a la familia Opita FC!",
    image: PlaceHolderImages.find(p => p.id === "event-tryouts"),
  },
];

const news = [
    {
        id: 1,
        title: "Nuevo Uniforme 2024",
        date: "15 de Julio, 2024",
        description: "Presentamos con orgullo nuestro nuevo uniforme, inspirado en los colores y la pasión de nuestra tierra.",
        image: PlaceHolderImages.find(p => p.id === "news-kit"),
      },
      {
        id: 2,
        title: "Juan Pérez convocado a la selección regional",
        date: "10 de Julio, 2024",
        description: "Nuestro talentoso mediocampista ha sido convocado para representar a la región en el próximo campeonato nacional.",
        image: PlaceHolderImages.find(p => p.id === "news-player"),
      },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="relative h-[600px] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight">
              Unión Opita FC Rivera
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl">
              Forjando campeones con disciplina, pasión y trabajo en equipo.
            </p>
            <Button asChild size="lg" className="mt-8 font-headline">
              <Link href="/dashboard">¡Inscríbete Ahora! <ArrowRight className="ml-2" /></Link>
            </Button>
          </div>
        </section>

        <section id="events" className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-4xl font-bold text-primary">Próximos Eventos</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {event.image && (
                     <div className="relative h-60 w-full">
                        <Image
                            src={event.image.imageUrl}
                            alt={event.image.description}
                            fill
                            className="object-cover"
                            data-ai-hint={event.image.imageHint}
                        />
                     </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-primary">{event.date}</p>
                    <p className="mt-2 text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="news" className="bg-secondary py-12 md:py-20">
            <div className="container mx-auto px-4">
                <h2 className="text-center font-headline text-4xl font-bold text-primary">Últimas Noticias</h2>
                <div className="mt-10 grid gap-8 md:grid-cols-2">
                    {news.map((item) => (
                        <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            {item.image && (
                                <div className="relative h-60 w-full">
                                <Image
                                    src={item.image.imageUrl}
                                    alt={item.image.description}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={item.image.imageHint}
                                />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-semibold text-primary">{item.date}</p>
                                <p className="mt-2 text-muted-foreground">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
