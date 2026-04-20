import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { usePasswordResetConfirm } from '@/hooks/useAuth';
import { toast } from 'sonner';

const schema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((data) => data.new_password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const confirm = usePasswordResetConfirm();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    if (!token) {
      toast.error('Missing reset token.');
      return;
    }
    confirm.mutate(
      { token, new_password: data.new_password },
      {
        onSuccess: () => {
          toast.success('Password updated. Please log in with your new password.');
          navigate('/login');
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.detail ||
            'Reset failed. The link may have expired.';
          toast.error(msg);
        },
      },
    );
  };

  if (!token) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <h1 className="text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface">
              Invalid Link
            </h1>
            <p className="text-secondary">
              The password reset link is missing its token.
            </p>
            <Link to="/forgot-password">
              <Button variant="outline">Request a New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Helmet>
        <title>Reset Password | Urban Attic</title>
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline uppercase tracking-tighter">
            Reset Password
          </CardTitle>
          <CardDescription>Enter a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="new_password" className="text-[10px] font-bold font-headline uppercase tracking-widest">
                New Password
              </Label>
              <Input
                id="new_password"
                type="password"
                {...register('new_password')}
                placeholder="********"
                className="mt-2"
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-primary">{errors.new_password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm" className="text-[10px] font-bold font-headline uppercase tracking-widest">
                Confirm Password
              </Label>
              <Input
                id="confirm"
                type="password"
                {...register('confirm')}
                placeholder="********"
                className="mt-2"
              />
              {errors.confirm && (
                <p className="mt-1 text-sm text-primary">{errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={confirm.isPending}>
              {confirm.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-secondary hover:text-on-surface hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
