import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatUnitsAvailability(names: string[]): string | null {
  if (names.length === 0) return null;
  const sorted = [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  if (sorted.length === 1) {
    return `Disponível na unidade ${sorted[0]}`;
  }
  if (sorted.length === 2) {
    return `Disponível nas unidades ${sorted[0]} e ${sorted[1]}`;
  }
  return `Disponível nas unidades ${sorted.slice(0, -1).join(", ")} e ${sorted[sorted.length - 1]}`;
}

export default function Plans() {
  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const checkout = trpc.stripe.createPlanCheckout.useMutation();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [unitChoice, setUnitChoice] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!plans) return;
    setUnitChoice((prev) => {
      const next = { ...prev };
      for (const plan of plans) {
        if (next[plan.id] !== undefined) continue;
        const first = plan.units?.[0];
        if (first) next[plan.id] = first.id;
      }
      return next;
    });
  }, [plans]);

  const handleSelectPlan = async (plan: {
    id: number;
    units?: { id: number; name: string }[];
  }) => {
    if (!isAuthenticated) {
      toast.info("Faça login para adquirir um plano");
      setLocation("/login");
      return;
    }

    const units = plan.units ?? [];
    if (units.length === 0) {
      toast.error("Nenhuma unidade disponível para este plano");
      return;
    }

    const uid = unitChoice[plan.id];
    if (!uid || !units.some((u) => u.id === uid)) {
      toast.error("Selecione uma unidade");
      return;
    }

    try {
      toast.loading("Redirecionando para pagamento...");

      const { url } = await checkout.mutateAsync({
        planId: plan.id,
        unitId: uid,
      });

      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Erro ao criar checkout");
    }
  };

  const groupedPlans = plans?.reduce(
    (acc, plan) => {
      if (!acc[plan.frequency]) {
        acc[plan.frequency] = [];
      }
      acc[plan.frequency].push(plan);
      return acc;
    },
    {} as Record<string, typeof plans>,
  );

  const frequencyLabels: Record<string, string> = {
    "1x": "1x por semana",
    "2x": "2x por semana",
    "3x": "3x por semana",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p>Carregando planos...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="bg-gradient-soft py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Nossos Planos
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Escolha o plano ideal para sua rotina e objetivos. Todos os planos
              incluem aulas em grupo com até 4 alunos.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20">
        <div className="container">
          {groupedPlans &&
            Object.entries(groupedPlans).map(([frequency, frequencyPlans]) => (
              <div key={frequency} className="mb-16">
                <h2 className="mb-8 text-center text-3xl font-bold">
                  {frequencyLabels[frequency]}
                </h2>

                <div className="grid gap-8 md:grid-cols-3">
                  {frequencyPlans.map((plan) => {
                    const pricePerClassCents = Math.round(
                      plan.priceInCents / plan.totalClasses,
                    );
                    const isPopular = plan.duration === "semester";
                    const planUnitsList = plan.units ?? [];
                    const unitsLine = formatUnitsAvailability(
                      planUnitsList.map((u) => u.name),
                    );
                    const noUnits = planUnitsList.length === 0;

                    return (
                      <Card
                        key={plan.id}
                        className={`relative border-2 transition-smooth hover:shadow-lg ${
                          isPopular ? "border-primary" : ""
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                            Mais Econômico
                          </div>
                        )}

                        <CardHeader>
                          <CardTitle className="text-center">
                            {plan.duration === "monthly" && "Mensal"}
                            {plan.duration === "quarterly" && "Trimestral"}
                            {plan.duration === "semester" && "Semestral"}
                          </CardTitle>
                        </CardHeader>

                        <CardContent>
                          <div className="mb-6 text-center">
                            <div className="mb-2 text-5xl font-bold text-primary">
                              {plan.totalClasses}
                            </div>
                            <p className="text-lg font-medium">aulas</p>
                            <p className="mt-3 text-2xl font-bold text-primary">
                              {formatPrice(pricePerClassCents)}
                              <span className="ml-1 text-base font-medium text-muted-foreground">
                                por aula
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                            {unitsLine && (
                              <p className="mt-2 text-sm font-medium text-foreground">
                                {unitsLine}
                              </p>
                            )}
                          </div>

                          {planUnitsList.length > 1 && (
                            <div className="mb-4 space-y-2 text-left">
                              <Label className="text-sm">
                                Unidade para assinatura
                              </Label>
                              <Select
                                value={String(
                                  unitChoice[plan.id] ??
                                    planUnitsList[0]?.id ??
                                    "",
                                )}
                                onValueChange={(v) =>
                                  setUnitChoice((prev) => ({
                                    ...prev,
                                    [plan.id]: Number(v),
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                  {planUnitsList.map((u) => (
                                    <SelectItem
                                      key={u.id}
                                      value={String(u.id)}
                                    >
                                      {u.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <ul className="mb-6 space-y-3">
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">
                                Aulas em grupo (máx. 4 alunos)
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">
                                Horários flexíveis
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">
                                Acompanhamento profissional
                              </span>
                            </li>
                          </ul>

                          <Button
                            className="w-full"
                            variant={isPopular ? "default" : "outline"}
                            onClick={() => handleSelectPlan(plan)}
                            disabled={checkout.isPending || noUnits}
                          >
                            Assinar Plano
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Single Class Card */}
          <div className="mt-16">
            <h2 className="mb-8 text-center text-3xl font-bold">Aula Avulsa</h2>

            <div className="mx-auto max-w-md">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-center">Aula Individual</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="mb-6 text-center">
                    <div className="mb-2 text-4xl font-bold">R$ 60,00</div>
                    <p className="text-sm text-muted-foreground">
                      Por aula de 1 hora
                    </p>
                  </div>

                  <ul className="mb-6 space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">1 aula avulsa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">
                        Aula em grupo (máx. 4 alunos)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">Sem compromisso</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => (window.location.href = "/single-class")}
                  >
                    Comprar Aula Avulsa
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-center text-3xl font-bold">
              Informações Importantes
            </h2>

            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">
                  Sistema de Créditos:
                </strong>{" "}
                Cada plano adiciona créditos à sua conta. 1 crédito = 1 aula.
                Use seus créditos para agendar aulas quando quiser.
              </p>
              <p>
                <strong className="text-foreground">
                  Política de Cancelamento:
                </strong>{" "}
                Você pode cancelar aulas com até 24 horas de antecedência e
                receber o crédito de volta. Cancelamentos com menos de 24 horas
                não geram devolução.
              </p>
              <p>
                <strong className="text-foreground">Pagamento:</strong> Todos os
                pagamentos são processados de forma segura através do Stripe.
                Aceitamos cartões de crédito e débito.
              </p>
              <p>
                <strong className="text-foreground">Dúvidas?</strong> Entre em
                contato conosco pelo WhatsApp ou e-mail. Estamos aqui para
                ajudar!
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
