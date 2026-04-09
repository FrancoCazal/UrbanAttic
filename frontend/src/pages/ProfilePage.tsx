import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser, useUpdateUser } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { data: user } = useUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateUser.mutate(data, {
      onSuccess: () => {
        toast.success('Profile updated');
      },
      onError: () => {
        toast.error('Failed to update profile');
      },
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 md:py-12">
      <h1 className="mb-8 text-4xl md:text-7xl font-black font-headline uppercase tracking-tighter">YOUR PROFILE</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline uppercase tracking-tighter">ACCOUNT INFO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold font-headline uppercase tracking-widest text-secondary">EMAIL</Label>
              <p className="mt-1 text-on-surface font-headline">{user.email}</p>
            </div>

            <Separator />

            <div>
              <Label className="text-[10px] font-bold font-headline uppercase tracking-widest text-secondary">MEMBER SINCE</Label>
              <p className="mt-1 text-on-surface font-headline">{formatDate(user.date_joined)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline uppercase tracking-tighter">EDIT PROFILE</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="first_name" className="text-[10px] font-bold font-headline uppercase tracking-widest">FIRST NAME</Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  className="mt-2"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-primary">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name" className="text-[10px] font-bold font-headline uppercase tracking-widest">LAST NAME</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  className="mt-2"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-primary">{errors.last_name.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'SAVING...' : 'SAVE CHANGES'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
