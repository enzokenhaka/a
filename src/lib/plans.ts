export const subscriptionPlans = [
  { id: 'iniciante', name: 'Iniciante', monthly: 59, annual: 49 },
  { id: 'crescimento', name: 'Crescimento', monthly: 99, annual: 79 },
  { id: 'premium', name: 'Premium', monthly: 169, annual: 139 },
] as const;

export type PlanId = (typeof subscriptionPlans)[number]['id'];

export const isPlanId = (value: string): value is PlanId =>
  subscriptionPlans.some((plan) => plan.id === value);
