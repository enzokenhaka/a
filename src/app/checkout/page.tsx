import CheckoutForm from './CheckoutForm';
import { isPlanId, type PlanId } from '@/lib/plans';

type CheckoutPageProps = {
  searchParams: {
    plan?: string;
    billing?: string;
    step?: string;
  };
};

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const initialPlan: PlanId | '' = searchParams.plan && isPlanId(searchParams.plan)
    ? searchParams.plan
    : '';
  const initialBilling = searchParams.billing === 'annual' ? 'annual' : 'monthly';

  return (
    <CheckoutForm
      initialPlan={initialPlan}
      initialBilling={initialBilling}
      startAtPayment={searchParams.step === 'payment'}
    />
  );
}
