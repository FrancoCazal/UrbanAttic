import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister, useUser } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useT } from '@/lib/settings-context';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const register = useRegister();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirm_password, ...registerData } = data;
    register.mutate(registerData, {
      onSuccess: () => {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      },
      onError: (error: any) => {
        const message = error.response?.data?.detail || 'Registration failed';
        toast.error(message);
      },
    });
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Helmet>
        <title>Register | Urban Attic</title>
        <meta name="description" content="Create your Urban Attic account and start shopping streetwear." />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline uppercase tracking-tighter">{t.auth.registerTitle}</CardTitle>
          <CardDescription>{t.auth.registerDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.emailLabel}</Label>
              <Input id="email" type="email" {...registerField('email')} placeholder="you@example.com" className="mt-2" />
              {errors.email && <p className="mt-1 text-sm text-primary">{errors.email.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="first_name" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.firstNameLabel}</Label>
                <Input id="first_name" {...registerField('first_name')} className="mt-2" />
                {errors.first_name && <p className="mt-1 text-sm text-primary">{errors.first_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="last_name" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.lastNameLabel}</Label>
                <Input id="last_name" {...registerField('last_name')} className="mt-2" />
                {errors.last_name && <p className="mt-1 text-sm text-primary">{errors.last_name.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.passwordLabel}</Label>
              <Input id="password" type="password" {...registerField('password')} placeholder="********" className="mt-2" />
              {errors.password && <p className="mt-1 text-sm text-primary">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirm_password" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.auth.confirmPasswordLabel}</Label>
              <Input id="confirm_password" type="password" {...registerField('confirm_password')} placeholder="********" className="mt-2" />
              {errors.confirm_password && <p className="mt-1 text-sm text-primary">{errors.confirm_password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? t.auth.creatingAccount : t.auth.registerTitle}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-secondary">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="font-medium text-on-surface hover:underline">{t.auth.loginTitle}</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
