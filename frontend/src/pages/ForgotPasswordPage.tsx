import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePasswordResetRequest } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const request = usePasswordResetRequest();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    request.mutate(data.email, {
      onSuccess: () => setSubmitted(true),
      onError: () => setSubmitted(true), // always show same message
    });
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Helmet>
        <title>Forgot Password | Urban Attic</title>
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline uppercase tracking-tighter">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <Mail className="h-12 w-12 text-on-surface" />
              </div>
              <p className="text-secondary">
                If that email is registered, you'll receive a reset link shortly.
                Check your inbox (and spam folder).
              </p>
              <p className="text-xs text-secondary">
                The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[10px] font-bold font-headline uppercase tracking-widest">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="mt-2"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-primary">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={request.isPending}>
                {request.isPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-secondary">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-on-surface hover:underline">
              Back to Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
