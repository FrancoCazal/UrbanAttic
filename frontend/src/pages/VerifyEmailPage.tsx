import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from '@/hooks/useAuth';

type VerifyState = 'idle' | 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verifyEmail = useVerifyEmail();
  const [state, setState] = useState<VerifyState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Missing verification token.');
      return;
    }

    setState('loading');
    verifyEmail.mutate(token, {
      onSuccess: () => setState('success'),
      onError: (error: any) => {
        setState('error');
        setErrorMessage(error?.response?.data?.detail || 'Verification failed.');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Helmet>
        <title>Verify Email | Urban Attic</title>
      </Helmet>
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 space-y-6 text-center">
          {state === 'loading' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-on-surface" />
              </div>
              <h1 className="text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface">
                Verifying...
              </h1>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h1 className="mb-2 text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface">
                  Email Verified
                </h1>
                <p className="text-secondary">
                  Your account is now verified. You can continue shopping.
                </p>
              </div>
              <Link to="/">
                <Button className="w-full">Continue to Urban Attic</Button>
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h1 className="mb-2 text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface">
                  Verification Failed
                </h1>
                <p className="text-secondary">
                  {errorMessage} The link may have expired or is invalid.
                </p>
              </div>
              <Link to="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
