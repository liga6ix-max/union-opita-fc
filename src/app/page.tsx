import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";
import landingContent from "@/lib/landing-page-content.json";

export default function Home() {
  const { hero, events, news } = landingContent;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="relative h-[600px] w-full">
          {hero && (
            <Image
              src={hero.imageUrl}
              alt={hero.title}
              fill
              className="object-cover"
              data-ai-hint={hero.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl">
              {hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-headline">
                <Link href="/login">Iniciar Sesión <ArrowRight className="ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="font-headline">
                <Link href="/register">¡Inscríbete Ahora!</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="events" className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-4xl font-bold text-primary">{events.title}</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {events.items.map((event, index) => (
                <Card key={index} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {event.imageUrl && (
                     <div className="relative h-60 w-full">
                        <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover"
                            data-ai-hint={landingContent.events.items[index].imageHint}
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
                <h2 className="text-center font-headline text-4xl font-bold text-primary">{news.title}</h2>
                <div className="mt-10 grid gap-8 md:grid-cols-2">
                    {news.items.map((item, index) => (
                        <Card key={index} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            {item.imageUrl && (
                                <div className="relative h-60 w-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={landingContent.news.items[index].imageHint}
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
