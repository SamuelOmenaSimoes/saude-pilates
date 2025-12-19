import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function MyPlan() {
  const { data: balanceData, isLoading: loadingBalance } =
    trpc.credits.balance.useQuery();

  const { data: planData, isLoading: loadingPlan } =
    trpc.credits.currentPlan.useQuery();

  const createPlanCheckout =
    trpc.stripe.createPlanCheckout.useMutation();

  const handleRenew = async () => {
    if (!planData?.hasPlan || !planData.plan) return;

    const result = await createPlanCheckout.mutateAsync({
      planId: planData.plan.id,
    });

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  if (loadingBalance || loadingPlan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">
          Carregando informações do plano...
        </p>
      </div>
    );
  }

  const balance = balanceData?.balance ?? 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Meu plano e créditos</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Créditos */}
        <Card>
          <CardHeader>
            <CardTitle>Créditos disponíveis</CardTitle>
            <CardDescription>
              Quantas aulas você ainda pode agendar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-semibold">{balance}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cada aula consome 1 crédito.
            </p>
          </CardContent>
        </Card>

        {/* Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Meu plano atual</CardTitle>
            <CardDescription>
              Informações do seu pacote de aulas
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!planData?.hasPlan || !planData.plan ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Você ainda não possui um plano ativo.
                </p>

                <Link href="/plans">
                  <Button>Ver opções de planos</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium">{planData.plan.name}</p>

                {planData.plan.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {planData.plan.description}
                  </p>
                )}

                <p className="text-sm">
                  Frequência:{" "}
                  <span className="font-medium">
                    {planData.plan.frequency}x por semana
                  </span>
                </p>

                <p className="text-sm">
                  Duração:{" "}
                  <span className="font-medium">
                    {planData.plan.duration === "monthly" && "Mensal"}
                    {planData.plan.duration === "quarterly" && "Trimestral"}
                    {planData.plan.duration === "semester" && "Semestral"}
                  </span>
                </p>

                <p className="text-sm">
                  Créditos do plano:{" "}
                  <span className="font-medium">
                    {planData.plan.credits}
                  </span>
                </p>

                <p className="text-sm">
                  Início:{" "}
                  <span className="font-medium">
                    {new Date(
                      planData.plan.startedAt
                    ).toLocaleDateString("pt-BR")}
                  </span>
                </p>

                <p className="text-sm mb-3">
                  Expira em:{" "}
                  <span className="font-medium">
                    {new Date(
                      planData.plan.expiresAt
                    ).toLocaleDateString("pt-BR")}
                  </span>
                </p>

                <Button
                  onClick={handleRenew}
                  disabled={createPlanCheckout.isLoading}
                >
                  {createPlanCheckout.isLoading
                    ? "Redirecionando..."
                    : "Renovar plano"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MyPlan;
