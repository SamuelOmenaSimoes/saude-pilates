import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="bg-gradient-soft py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Entre em Contato
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Estamos aqui para responder suas dúvidas e ajudar você a começar sua jornada no Pilates.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Telefone</h3>
                <a 
                  href="https://wa.me/5511930112640" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-smooth"
                >
                  (11) 93011-2640
                </a>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">E-mail</h3>
                <a 
                  href="mailto:saudeeppilates@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-smooth break-all"
                >
                  saudeeppilates@gmail.com
                </a>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Horário</h3>
                <p className="text-sm text-muted-foreground">
                  Seg-Sex: 7h às 21h<br />
                  Sáb: 8h às 12h<br />
                  Dom: Fechado
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Unidades</h3>
                <p className="text-sm text-muted-foreground">
                  3 unidades<br />
                  Vila Oliveira<br />
                  Vila Caputera<br />
                  Vila Suissa
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Nossas Unidades
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Vila Oliveira */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-2xl font-semibold">Vila Oliveira</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">
                        Rua Laurinda Cardoso Melo Freire, 261<br />
                        Vila Oliveira
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Horário de Funcionamento</p>
                      <p className="text-sm text-muted-foreground">
                        Segunda a Sexta: 7h às 21h<br />
                        Sábado: 8h às 12h<br />
                        Domingo: Fechado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Profissionais</p>
                      <p className="text-sm text-muted-foreground">
                        Sala 1: Faila Adachi<br />
                        Sala 2: Mariana Sabanae
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vila Caputera */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-2xl font-semibold">Vila Caputera</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">
                        R. Kikuji Iwanami, 256 D<br />
                        Vila Caputera
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Horário de Funcionamento</p>
                      <p className="text-sm text-muted-foreground">
                        Segunda a Sexta: 7h às 21h<br />
                        Sábado: 8h às 12h<br />
                        Domingo: Fechado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Profissional</p>
                      <p className="text-sm text-muted-foreground">
                        Phyllis Souza
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-2xl font-semibold">Vila Suissa</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">
                        Rua Antônio Máximo, 345B<br />
                        Vila Suissa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Horário de Funcionamento</p>
                      <p className="text-sm text-muted-foreground">
                        Segunda a Sexta: 7h às 21h<br />
                        Sábado: 8h às 12h<br />
                        Domingo: Fechado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Profissional</p>
                      <p className="text-sm text-muted-foreground">
                        Phyllis Souza
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Perguntas Frequentes
          </h2>

          <div className="mx-auto max-w-3xl space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold">Como funciona a aula experimental?</h3>
                <p className="text-sm text-muted-foreground">
                  A aula experimental é gratuita e limitada a uma por CPF. É uma ótima oportunidade 
                  para conhecer nossa metodologia, instrutoras e estrutura antes de se comprometer com um plano.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold">Como funciona o sistema de créditos?</h3>
                <p className="text-sm text-muted-foreground">
                  Cada plano adiciona créditos à sua conta (1 crédito = 1 aula). Você usa esses créditos 
                  para agendar suas aulas quando quiser, dentro dos horários disponíveis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold">Posso cancelar uma aula agendada?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Você pode cancelar aulas com até 24 horas de antecedência e receber o crédito 
                  de volta. Cancelamentos com menos de 24 horas não geram devolução do crédito.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold">Quantas pessoas por aula?</h3>
                <p className="text-sm text-muted-foreground">
                  Nossas aulas em grupo têm no máximo 4 alunos, garantindo atenção personalizada 
                  e acompanhamento adequado de cada participante.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold">Preciso levar algo para a aula?</h3>
                <p className="text-sm text-muted-foreground">
                  Recomendamos roupas confortáveis e uma garrafa de água. Todos os equipamentos 
                  necessários são fornecidos pela clínica.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
