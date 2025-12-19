import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Clock, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRedirectAfterLogin } from "@/hooks/useRedirectAfterLogin";

export default function Dashboard() {
  const { user } = useAuth();
  useRedirectAfterLogin();
  const { data: allAppointments } = trpc.appointments.myAppointments.useQuery();
  const { data: creditHistory } = trpc.credits.history.useQuery({ limit: 10 });
  
  const upcomingAppointments = allAppointments?.filter((apt: any) => new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled');

  const creditsBalance = user?.creditsBalance || 0;
  const upcomingCount = upcomingAppointments?.length || 0;

  const recentCredits = creditHistory?.slice(0, 5) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      <section className="bg-gradient-soft py-12">
        <div className="container">
          <h1 className="text-4xl font-bold">Meu Painel</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Bem-vindo(a), {user?.name}!
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos Disponíveis</p>
                    <p className="text-3xl font-bold">{creditsBalance}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Link href="/book-class">
                  <a>
                    <Button className="mt-4 w-full" size="sm">
                      Agendar Aula
                    </Button>
                  </a>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Próximas Aulas</p>
                    <p className="text-3xl font-bold">{upcomingCount}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Link href="/my-appointments">
                  <a>
                    <Button className="mt-4 w-full" size="sm" variant="outline">
                      Ver Agendamentos
                    </Button>
                  </a>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ações Rápidas</p>
                    <p className="text-sm mt-2">Comprar mais créditos</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Link href="/plans">
                  <a>
                    <Button className="mt-4 w-full" size="sm" variant="outline">
                      Ver Planos
                    </Button>
                  </a>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Aulas</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments && upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appointment: any) => (
                      <div
                        key={appointment.id}
                        className="flex items-start gap-4 rounded-lg border p-4"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {format(new Date(appointment.appointmentDate), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.appointmentDate), "HH:mm", { locale: ptBR })} - {appointment.professionalName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.unitName} - {appointment.roomName}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link href="/my-appointments">
                      <a>
                        <Button variant="outline" className="w-full">
                          Ver Todos os Agendamentos
                        </Button>
                      </a>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Você não tem aulas agendadas
                    </p>
                    <Link href="/book-class">
                      <a>
                        <Button>Agendar Primeira Aula</Button>
                      </a>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credit History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Créditos</CardTitle>
              </CardHeader>
              <CardContent>
                {recentCredits.length > 0 ? (
                  <div className="space-y-4">
                    {recentCredits.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma transação ainda
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Link href="/book-class">
                  <a>
                    <Button className="w-full" variant="outline">
                      Agendar Aula
                    </Button>
                  </a>
                </Link>
                <Link href="/plans">
                  <a>
                    <Button className="w-full" variant="outline">
                      Comprar Plano
                    </Button>
                  </a>
                </Link>
                <Link href="/my-appointments">
                  <a>
                    <Button className="w-full" variant="outline">
                      Meus Agendamentos
                    </Button>
                  </a>
                </Link>
                <Link href="/profile">
                  <a>
                    <Button className="w-full" variant="outline">
                      Meu Perfil
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
