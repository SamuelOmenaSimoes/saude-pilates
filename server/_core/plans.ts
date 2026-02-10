export type PlanConfig = {
  name: string;
  priceId: string;
  credits: number;
  interval: "month" | "one_time";
  commitmentMonths?: number;
};

export const PLANS = {
  once_per_week: {
    monthly: {
      name: "1x por semana – Mensal",
      priceId: "prod_TcHYs7sqK0TmqR",
      credits: 4,
      interval: "month",
    },
    quarterly: {
      name: "1x por semana – Trimestral",
      priceId: "prod_TcHfMGmo2uz9z2",
      credits: 12,
      interval: "month",
      commitmentMonths: 3,
    },
    semiannual: {
      name: "1x por semana – Semestral",
      priceId: "prod_TcHfd0AE61TaIH",
      credits: 24,
      interval: "month",
      commitmentMonths: 6,
    },
  },

  twice_per_week: {
    monthly: {
      name: "2x por semana – Mensal",
      priceId: "prod_TcHgxsP1jQeOAX",
      credits: 8,
      interval: "month",
    },
    quarterly: {
      name: "2x por semana – Trimestral",
      priceId: "prod_TcHhLQMQ1JqrJ6",
      credits: 24,
      interval: "month",
      commitmentMonths: 3,
    },
    semiannual: {
      name: "2x por semana – Semestral",
      priceId: "prod_TcHhNvHl5b9dxo",
      credits: 48,
      interval: "month",
      commitmentMonths: 6,
    },
  },

  three_per_week: {
    monthly: {
      name: "3x por semana – Mensal",
      priceId: "prod_TcHipB4yQFlqmX",
      credits: 12,
      interval: "month",
    },
    quarterly: {
      name: "3x por semana – Trimestral",
      priceId: "prod_TcHjQkjIjvTYVg",
      credits: 36,
      interval: "month",
      commitmentMonths: 3,
    },
    semiannual: {
      name: "3x por semana – Semestral",
      priceId: "prod_TcHjzqZ26BrmPT",
      credits: 72,
      interval: "month",
      commitmentMonths: 6,
    },
  },

  single_class: {
    name: "Aula avulsa",
    priceId: "prod_TcbD3gSxrQZj7d",
    credits: 1,
    interval: "one_time",
  },
} as const;
