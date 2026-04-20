import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin, useUser, useResendVerification } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useT } from '@/lib/settings-context';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useUser();
  const login = useLogin();
  const resend = useResendVerification();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const returnUrl = (location.state as { returnUrl?: string })?.returnUrl || '/';

  useEffect(() => {
    if (user) {
      navigate(returnUrl);
    }
  }, [user, navigate, returnUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    setUnverifiedEmail(null);
    login.mutate(data, {
      onSuccess: () => {
        toast.success('Login successful');
        navigate(returnUrl);
      },
      onError: (error: any) => {
        if (error.response?.data?.code === 'email_not_verified') {
          setUnverifiedEmail(error.response.data.email || data.email);
          return;
        }
        const message = error.response?.data?.detail || 'Invalid email or password';
        toast.error(message);
      },
    });
  };

  const handleResend = () => {
    if (!unverifiedEmail) return;
    resend.mutate(unverifiedEmail, {
      onSuccess: () => {
        toast.success('Verification email sent. Check your inbox.');
      },
      onError: () => {
        toast.error('Could not send verification email. Please try again.');
      },
    });
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Helmet>
        <title>Login | Urban Attic</title>
        <meta name="description" content="Sign in to your Urban Attic account." />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline uppercase tracking-tighter">{t.auth.loginTitle}</CardTitle>
          <CardDescription>{t.auth.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {unverifiedEmail && (
            <div className="mb-4 border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/30 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-200" />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-semibold mb-1">Email not verified</p>
                  <p>
                    Please verify your email <span className="font-mono">{unverifiedEmail}</span>{' '}
                    before logging in. Check your inbox for the verification link.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleResend}
                disabled={resend.isPending}
              >
                {resend.isPending ? 'Sending...' : 'Resend verification email'}
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.emailLabel}</Label>
              <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="mt-2" />
              {errors.email && <p className="mt-1 text-sm text-primary">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.passwordLabel}</Label>
              <Input id="password" type="password" {...register('password')} placeholder="********" className="mt-2" />
              {errors.password && <p className="mt-1 text-sm text-primary">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? t.auth.loggingIn : t.auth.loginTitle}
            </Button>
            <div className="text-center">
              <Link to="/forgot-password" className="text-xs text-secondary hover:text-on-surface hover:underline">
                Forgot your password?
              </Link>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-secondary">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="font-medium text-on-surface hover:underline">{t.auth.registerTitle}</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
