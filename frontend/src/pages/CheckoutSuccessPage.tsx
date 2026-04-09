import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/settings-context';

export function CheckoutSuccessPage() {
  const t = useT();
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <div>
              <h1 className="mb-2 text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface">
                {t.checkout.successTitle}
              </h1>
              <p className="text-secondary">
                {t.checkout.successMessage}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/orders">
                <Button className="w-full gap-2">
                  <Package className="h-4 w-4" />
                  {t.checkout.viewMyOrders}
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="w-full gap-2">
                  {t.checkout.continueShopping}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
