import { useMemo, useState } from "react";
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

const PLAN_TYPE_ORDER = ["individual", "pair", "group"] as const;

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
  const [selectedUnitId, setSelectedUnitId] = useState<number | "all">("all");
  const [selectedPlanType, setSelectedPlanType] = useState<
    "individual" | "pair" | "group" | "all"
  >("all");
  const [unitChoice, setUnitChoice] = useState<Record<number, number>>({});
  /** Só após clicar em Assinar sem unidade (filtro Todas + várias unidades no plano). */
  const [unitChoiceSubmitAttempted, setUnitChoiceSubmitAttempted] = useState<
    Record<number, boolean>
  >({});

  const allUnits = useMemo(() => {
    if (!plans?.length) return [];
    const byId = new Map<number, { id: number; name: string }>();
    for (const plan of plans) {
      for (const u of plan.units ?? []) {
        byId.set(u.id, u);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [plans]);

  const planTypesForUnit = useMemo(() => {
    if (!plans?.length) return [];
    const types = new Set<string>();
    for (const p of plans) {
      if (
        selectedUnitId === "all" ||
        (p.units ?? []).some((u) => u.id === selectedUnitId)
      ) {
        types.add(p.planType ?? "group");
      }
    }
    const list = Array.from(types) as ("individual" | "pair" | "group")[];
    return list.sort(
      (a, b) =>
        PLAN_TYPE_ORDER.indexOf(a) - PLAN_TYPE_ORDER.indexOf(b),
    );
  }, [plans, selectedUnitId]);

  const filteredPlans = useMemo(() => {
    if (!plans?.length) return [];
    return plans.filter((p) => {
      const unitOk =
        selectedUnitId === "all" ||
        (p.units ?? []).some((u) => u.id === selectedUnitId);
      const typeOk =
        selectedPlanType === "all" ||
        (p.planType ?? "group") === selectedPlanType;
      return unitOk && typeOk;
    });
  }, [plans, selectedUnitId, selectedPlanType]);

  /** Entre os planos visíveis com o filtro atual, só um card exibe "Mais Econômico" (menor preço por aula). */
  const mostEconomicalPlanId = useMemo(() => {
    if (filteredPlans.length === 0) return null;
    const ranked = filteredPlans.map((p) => ({
      id: p.id,
      pricePerClass: p.priceInCents / p.totalClasses,
    }));
    ranked.sort((a, b) => {
      if (a.pricePerClass !== b.pricePerClass) {
        return a.pricePerClass - b.pricePerClass;
      }
      return a.id - b.id;
    });
    return ranked[0]?.id ?? null;
  }, [filteredPlans]);

  const resolveCheckoutUnitId = (plan: {
    id: number;
    units?: { id: number; name: string }[];
  }): number | null => {
    const units = plan.units ?? [];
    if (units.length === 0) return null;
    if (selectedUnitId !== "all") {
      if (!units.some((u) => u.id === selectedUnitId)) return null;
      return selectedUnitId;
    }
    if (units.length === 1) {
      return units[0]!.id;
    }
    const uid = unitChoice[plan.id];
    if (uid != null && units.some((u) => u.id === uid)) return uid;
    return null;
  };

  const handleSelectPlan = async (plan: {
    id: number;
    units?: { id: number; name: string }[];
  }) => {
    if (!isAuthenticated) {
      toast.info("Faça login para adquirir um plano");
      setLocation("/login");
      return;
    }

    const unitId = resolveCheckoutUnitId(plan);
    if (unitId == null) {
      const units = plan.units ?? [];
      if (selectedUnitId === "all" && units.length > 1) {
        setUnitChoiceSubmitAttempted((prev) => ({
          ...prev,
          [plan.id]: true,
        }));
      }
      toast.error(
        selectedUnitId === "all"
          ? "Selecione a unidade para assinatura neste plano"
          : "Esta combinação de unidade e plano não está disponível",
      );
      return;
    }

    try {
      toast.loading("Redirecionando para pagamento...");

      const { url } = await checkout.mutateAsync({
        planId: plan.id,
        unitId,
      });

      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Erro ao criar checkout");
    }
  };

  const groupedPlans = useMemo(() => {
    if (filteredPlans.length === 0) return undefined;
    return filteredPlans.reduce(
      (acc, plan) => {
        if (!acc[plan.frequency]) {
          acc[plan.frequency] = [];
        }
        acc[plan.frequency].push(plan);
        return acc;
      },
      {} as Record<string, (typeof filteredPlans)[number][]>,
    );
  }, [filteredPlans]);

  const frequencyLabels: Record<string, string> = {
    "1x": "1x por semana",
    "2x": "2x por semana",
    "3x": "3x por semana",
  };

  const planTypeLabels: Record<string, string> = {
    individual: "Individual",
    pair: "Dupla",
    group: "Em grupo",
  };

  const classFormatLine = (planType: string): string => {
    if (planType === "group") return "Aulas em grupo (máx. 4 alunos)";
    if (planType === "pair") return "Aulas em dupla";
    return "Aulas individuais";
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
              Filtre por unidade e tipo de aula, ou use &quot;Todas&quot; /
              &quot;Todos&quot; para ver todos os planos.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl space-y-10">
            <div className="space-y-3">
              <Label className="text-base font-semibold" htmlFor="plan-unit">
                1. Unidade
              </Label>
              <Select
                value={String(selectedUnitId)}
                onValueChange={(v) => {
                  setSelectedUnitId(v === "all" ? "all" : Number(v));
                  setSelectedPlanType("all");
                }}
              >
                <SelectTrigger id="plan-unit" className="w-full">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {allUnits.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plans?.length && allUnits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma unidade com planos disponíveis no momento.
                </p>
              )}
            </div>

            {!!plans?.length && (
              <div className="space-y-3">
                <p className="text-base font-semibold">2. Tipo de plano</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      selectedPlanType === "all" ? "default" : "outline"
                    }
                    onClick={() => setSelectedPlanType("all")}
                  >
                    Todos
                  </Button>
                  {planTypesForUnit.map((pt) => (
                    <Button
                      key={pt}
                      type="button"
                      variant={selectedPlanType === pt ? "default" : "outline"}
                      onClick={() => setSelectedPlanType(pt)}
                    >
                      {planTypeLabels[pt]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!!plans?.length &&
            filteredPlans.length === 0 && (
              <p className="mb-8 text-center text-muted-foreground">
                Nenhum plano encontrado para esta combinação.
              </p>
            )}

          {groupedPlans && (
            <p className="mb-10 text-center text-lg text-muted-foreground">
              <span className="font-medium text-foreground">3. Planos</span>
              {" · "}
              {selectedUnitId === "all"
                ? "Todas as unidades"
                : allUnits.find((u) => u.id === selectedUnitId)?.name}
              {" · "}
              {selectedPlanType === "all"
                ? "Todos os tipos"
                : planTypeLabels[selectedPlanType]}
            </p>
          )}

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
                    const isPopular = plan.id === mostEconomicalPlanId;
                    const planUnitsList = plan.units ?? [];
                    const noUnits = planUnitsList.length === 0;
                    const needsUnitChoice =
                      selectedUnitId === "all" && planUnitsList.length > 1;
                    const chosenForPlan = unitChoice[plan.id];
                    const hasValidUnitChoice =
                      chosenForPlan != null &&
                      planUnitsList.some((u) => u.id === chosenForPlan);
                    const missingUnitChoice = needsUnitChoice && !hasValidUnitChoice;
                    const showUnitFieldError =
                      missingUnitChoice &&
                      unitChoiceSubmitAttempted[plan.id] === true;
                    const unitsLine =
                      selectedUnitId === "all"
                        ? formatUnitsAvailability(
                            planUnitsList.map((u) => u.name),
                          )
                        : null;

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
                          <p className="text-center text-sm font-medium text-primary">
                            {planTypeLabels[plan.planType ?? "group"] ??
                              plan.planType}
                          </p>
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
                                {(plan.planType ?? "group") === "pair" ? (
                                  <span className="align-super text-lg leading-none">
                                    *
                                  </span>
                                ) : null}
                              </span>
                            </p>
                            {(plan.planType ?? "group") === "pair" && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                * Preço por pessoa.
                              </p>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                            {unitsLine && (
                              <p className="mt-2 text-sm font-medium text-foreground">
                                {unitsLine}
                              </p>
                            )}
                          </div>

                          {selectedUnitId === "all" &&
                            planUnitsList.length > 1 && (
                              <div className="mb-4 space-y-2 text-left">
                                <Label className="text-sm">
                                  Unidade para assinatura
                                </Label>
                                <Select
                                  value={
                                    chosenForPlan != null
                                      ? String(chosenForPlan)
                                      : undefined
                                  }
                                  onValueChange={(v) => {
                                    const id = Number(v);
                                    setUnitChoice((prev) => ({
                                      ...prev,
                                      [plan.id]: id,
                                    }));
                                    setUnitChoiceSubmitAttempted((prev) => ({
                                      ...prev,
                                      [plan.id]: false,
                                    }));
                                  }}
                                >
                                  <SelectTrigger
                                    className="w-full"
                                    aria-invalid={showUnitFieldError}
                                  >
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
                                {classFormatLine(plan.planType ?? "group")}
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
