import { Card, CardContent } from "@/components/ui/card";
import { Award, Heart, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function About() {
  const professionals = [
    {
      name: "Faila Adachi",
      location: "Vila Oliveira - Sala 1",
      bio: "Fisioterapeuta com Pós-graduação em Fisioterapia Traumato-Ortopédica e Desportiva. Especializada em Pilates completo (solo, bola e aparelhos), Pilates avançado, Reedu cação Postural Global (RPG/RPM), Podoposturologia e Mulligan Manual Therapy. Dedicada ao tratamento de lesões musculoesqueléticas e recuperação funcional.",
      photo: "/faila.jpg",
    },
    {
      name: "Mariana Sabanae",
      location: "Vila Oliveira - Sala 2",
      bio: "Fisioterapeuta com Pós-graduação em Pilates e especialização em Microfisioterapia. Focada no bem-estar integral dos alunos, trabalha com diferentes níveis e necessidades individuais, proporcionando aulas personalizadas e eficazes.",
      photo: "/mari.jpg",
    },
    {
      name: "Phyllis Souza",
      location: "Vila Caputera",
      bio: "Fisioterapeuta com formação em Aurículo e Reedu cação Postural Global (RPG). Apaixonada por ajudar seus alunos a alcançarem seus objetivos de saúde através de uma abordagem personalizada e atenciosa.",
      photo: "/phyllis.jpg",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Cuidado Personalizado",
      description: "Cada aluno recebe atenção individual e um programa adaptado às suas necessidades.",
    },
    {
      icon: Target,
      title: "Foco em Resultados",
      description: "Trabalhamos com metas claras para garantir seu progresso contínuo.",
    },
    {
      icon: Award,
      title: "Excelência Profissional",
      description: "Nossa equipe está sempre atualizada com as melhores práticas do Pilates.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="bg-gradient-soft py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Sobre Nós
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Somos uma clínica dedicada a transformar vidas através do Pilates, 
              oferecendo atendimento personalizado e profissional.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              Nossa Missão
            </h2>
            <p className="text-lg text-muted-foreground">
              Promover saúde, bem-estar e qualidade de vida através da prática do Pilates, 
              oferecendo um ambiente acolhedor e profissional onde cada aluno pode alcançar 
              seu máximo potencial físico e mental.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {values.map((value, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Professionals Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Nossas Profissionais
            </h2>
            <p className="text-lg text-muted-foreground">
              Conheça as instrutoras dedicadas ao seu bem-estar
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {professionals.map((professional, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="mb-4 mx-auto">
                    <img 
                      src={professional.photo} 
                      alt={professional.name}
                      className="w-48 h-48 object-cover rounded-full mx-auto shadow-lg"
                    />
                  </div>
                  <h3 className="mb-2 text-center text-xl font-semibold">
                    {professional.name}
                  </h3>
                  <p className="mb-4 text-center text-sm text-primary font-medium">
                    {professional.location}
                  </p>
                  <p className="text-center text-muted-foreground">
                    {professional.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Nossas Unidades
            </h2>
            <p className="text-lg text-muted-foreground">
              Duas unidades para sua comodidade
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-2">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-2xl font-semibold">Vila Oliveira</h3>
                <p className="mb-4 text-muted-foreground">
                  Rua Laurinda Cardoso Melo Freire, 261 - Vila Oliveira
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Salas:</strong> 2 salas equipadas</p>
                  <p><strong>Profissionais:</strong> Faila Adachi e Mariana Sabanae</p>
                  <p><strong>Horários:</strong></p>
                  <ul className="ml-4 list-disc text-muted-foreground">
                    <li>Segunda a Sexta: 7h às 21h</li>
                    <li>Sábado: 8h às 12h</li>
                    <li>Domingo: Fechado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-2xl font-semibold">Vila Caputera</h3>
                <p className="mb-4 text-muted-foreground">
                  R. Kikuji Iwanami, 256 D - Vila Caputera
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Salas:</strong> 1 sala equipada</p>
                  <p><strong>Profissional:</strong> Phyllis Souza</p>
                  <p><strong>Horários:</strong></p>
                  <ul className="ml-4 list-disc text-muted-foreground">
                    <li>Segunda a Sexta: 7h às 21h</li>
                    <li>Sábado: 8h às 12h</li>
                    <li>Domingo: Fechado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
