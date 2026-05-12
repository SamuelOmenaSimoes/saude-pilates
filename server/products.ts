/**
 * Stripe Products Configuration
 * Define all products and prices here for centralized management
 */

export interface StripeProduct {
  name: string;
  description: string;
  priceInCents: number;
  credits: number;
  metadata?: Record<string, string>;
}

// Single class product
export const SINGLE_CLASS_PRODUCT: StripeProduct = {
  name: "Aula Avulsa",
  description: "Aula avulsa de Pilates - 1 hora",
  priceInCents: 9000, // R$ 90,00
  credits: 1,
  metadata: {
    type: "single",
  },
};

// Plan products
export const PLAN_PRODUCTS: Record<string, StripeProduct> = {
  // 1x per week
  "1x-monthly": {
    name: "Plano Mensal - 1x por semana",
    description: "4 aulas (aproximadamente 1 mês)",
    priceInCents: 31500, // R$ 315,00
    credits: 4,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "1x",
      duration: "monthly",
    },
  },
  "1x-quarterly": {
    name: "Plano Trimestral - 1x por semana",
    description: "12 aulas (aproximadamente 3 meses) - 3x R$ 250,00",
    priceInCents: 75000, // R$ 750,00 total (3x R$ 250,00)
    credits: 12,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "1x",
      duration: "quarterly",
      installments: "3",
    },
  },
  "1x-semester": {
    name: "Plano Semestral - 1x por semana",
    description: "24 aulas (aproximadamente 6 meses) - 6x R$ 220,00",
    priceInCents: 132000, // R$ 1.320,00 total (6x R$ 220,00)
    credits: 24,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "1x",
      duration: "semester",
      installments: "6",
    },
  },

  // 2x per week
  "2x-monthly": {
    name: "Plano Mensal - 2x por semana",
    description: "8 aulas (aproximadamente 1 mês)",
    priceInCents: 38700, // R$ 387,00
    credits: 8,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "2x",
      duration: "monthly",
    },
  },
  "2x-quarterly": {
    name: "Plano Trimestral - 2x por semana",
    description: "24 aulas (aproximadamente 3 meses) - 3x R$ 352,00",
    priceInCents: 105600, // R$ 1.056,00 total (3x R$ 352,00)
    credits: 24,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "2x",
      duration: "quarterly",
      installments: "3",
    },
  },
  "2x-semester": {
    name: "Plano Semestral - 2x por semana",
    description: "48 aulas (aproximadamente 6 meses) - 6x R$ 320,00",
    priceInCents: 192000, // R$ 1.920,00 total (6x R$ 320,00)
    credits: 48,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "2x",
      duration: "semester",
      installments: "6",
    },
  },

  // 3x per week
  "3x-monthly": {
    name: "Plano Mensal - 3x por semana",
    description: "12 aulas (aproximadamente 1 mês)",
    priceInCents: 43600, // R$ 436,00
    credits: 12,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "3x",
      duration: "monthly",
    },
  },
  "3x-quarterly": {
    name: "Plano Trimestral - 3x por semana",
    description: "36 aulas (aproximadamente 3 meses) - 3x R$ 396,00",
    priceInCents: 118800, // R$ 1.188,00 total (3x R$ 396,00)
    credits: 36,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "3x",
      duration: "quarterly",
      installments: "3",
    },
  },
  "3x-semester": {
    name: "Plano Semestral - 3x por semana",
    description: "72 aulas (aproximadamente 6 meses) - 6x R$ 360,00",
    priceInCents: 216000, // R$ 2.160,00 total (6x R$ 360,00)
    credits: 72,
    metadata: {
      type: "plan",
      plan_type: "group",
      frequency: "3x",
      duration: "semester",
      installments: "6",
    },
  },
};

// Helper to get product by plan ID
export function getProductByPlanId(planId: number): StripeProduct | undefined {
  // Map plan IDs to product keys
  // This will be populated after seeding the database
  const planMapping: Record<number, string> = {
    1: "1x-monthly",
    2: "1x-quarterly",
    3: "1x-semester",
    4: "2x-monthly",
    5: "2x-quarterly",
    6: "2x-semester",
    7: "3x-monthly",
    8: "3x-quarterly",
    9: "3x-semester",
  };

  const productKey = planMapping[planId];
  return productKey ? PLAN_PRODUCTS[productKey] : undefined;
}
