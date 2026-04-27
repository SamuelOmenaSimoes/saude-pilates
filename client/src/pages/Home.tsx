import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Award, Heart, ArrowRight, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  const benefits = [
    {
      icon: Heart,
      title: "Saúde e Bem-Estar",
      description: "Melhore sua postura, flexibilidade e qualidade de vida",
    },
    {
      icon: Users,
      title: "Profissionais Qualificados",
      description: "Instrutoras experientes e dedicadas ao seu progresso",
    },
    {
      icon: Calendar,
      title: "Horários Flexíveis",
      description: "Aulas de segunda a sábado em horários convenientes",
    },
    {
      icon: Award,
      title: "Resultados Comprovados",
      description: "Método eficaz para fortalecimento e reabilitação",
    },
  ];

  const features = [
    "Aulas em grupo (até 4 alunos) ou individuais",
    "Duas unidades para sua comodidade",
    "Equipamentos modernos e bem mantidos",
    "Ambiente acolhedor e profissional",
    "Planos flexíveis para sua rotina",
    "Aula experimental gratuita",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-soft py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Transforme Seu Corpo e Mente com Pilates
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Descubra o poder do Pilates com profissionais dedicados ao seu bem-estar. 
              Agende sua aula experimental gratuita e comece sua jornada hoje mesmo.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/trial-class">
                <a>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-primary text-lg">
                    Aula Experimental Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </Link>
              <Link href="/single-class">
                <a>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg border-primary text-primary hover:bg-primary hover:text-white">
                    Aula Avulsa (R$ 60)
                  </Button>
                </a>
              </Link>
              <Link href="/plans">
                <a>
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto text-lg">
                    Ver Planos
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Por Que Escolher Saúde e Pilates?
            </h2>
            <p className="text-lg text-muted-foreground">
              Oferecemos uma experiência completa para seu desenvolvimento físico e mental
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 transition-smooth hover:border-primary hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Photos Section */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Nossa Estrutura
            </h2>
            <p className="text-lg text-muted-foreground">
              Conheça nossos espaços equipados para sua melhor experiência
            </p>
          </div>
          
               <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-smooth hover:shadow-2xl">
              <img 
                src="/clinicasala1.jpeg" 
                alt="Sala de Pilates 1 - Equipamentos profissionais" 
                className="h-[400px] w-full object-cover transition-smooth group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Sala 1 - Vila Oliveira</h3>
                  <p className="text-white/90">Equipamentos completos para sua prática</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-smooth hover:shadow-2xl">
              <img 
                src="/clinicasala2.jpeg" 
                alt="Sala de Pilates 2 - Ambiente moderno" 
                className="h-[400px] w-full object-cover transition-smooth group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Sala 2 - Vila Oliveira</h3>
                  <p className="text-white/90">Ambiente acolhedor e profissional</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-smooth hover:shadow-2xl">
              <img 
                src="/clinicasala3.jpeg" 
                alt="Sala Única - Vila Caputera" 
                className="h-[400px] w-full object-cover transition-smooth group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Sala Única - Vila Caputera</h3>
                  <p className="text-white/90">Espaço exclusivo e confortável</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-smooth hover:shadow-2xl">
              <img 
                src="clinicasuissa.jpeg" 
                alt="Sala de Pilates - Ambiente Profissional" 
                className="h-[400px] w-full object-cover transition-smooth group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Sala Única - Vila Suissa</h3>
                  <p className="text-white/90">Ambiente profissional e exclusivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                O Que Oferecemos
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Nossa clínica oferece tudo que você precisa para uma prática de Pilates 
                eficaz e prazerosa. Confira nossos diferenciais:
              </p>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="mb-4 text-4xl font-bold text-primary">3</div>
                  <h3 className="mb-2 font-semibold">Unidades</h3>
                  <p className="text-sm text-muted-foreground">
                    Vila Oliveira, Vila Caputera e Vila Suissa
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="mb-4 text-4xl font-bold text-primary">3</div>
                  <h3 className="mb-2 font-semibold">Profissionais</h3>
                  <p className="text-sm text-muted-foreground">
                    Instrutoras qualificadas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="mb-4 text-4xl font-bold text-primary">4</div>
                  <h3 className="mb-2 font-semibold">Alunos por Turma</h3>
                  <p className="text-sm text-muted-foreground">
                    Atenção personalizada
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="mb-4 text-4xl font-bold text-primary">+9</div>
                  <h3 className="mb-2 font-semibold">Planos Disponíveis</h3>
                  <p className="text-sm text-muted-foreground">
                    Flexibilidade para você
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="border-2 border-primary bg-gradient-soft">
            <CardContent className="py-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Pronto Para Começar?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Agende sua aula experimental gratuita e descubra como o Pilates 
                pode transformar sua vida.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/trial-class">
                  <a>
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-primary">
                      Agendar Aula Experimental
                    </Button>
                  </a>
                </Link>
                <Link href="/contact">
                  <a>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Fale Conosco
                    </Button>
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
