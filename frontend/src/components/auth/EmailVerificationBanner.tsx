import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useUser, useResendVerification } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function EmailVerificationBanner() {
  const { data: user } = useUser();
  const resend = useResendVerification();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.email_verified || dismissed) {
    return null;
  }

  const handleResend = () => {
    if (!user) return;
    resend.mutate(user.email, {
      onSuccess: () => {
        toast.success('Verification email sent. Check your inbox.');
      },
      onError: () => {
        toast.error('Could not send verification email. Please try again.');
      },
    });
  };

  return (
    <div className="w-full bg-amber-100 border-b-2 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            Please verify your email to unlock all features.
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleResend}
            disabled={resend.isPending}
            className="text-xs font-bold uppercase tracking-wider hover:underline disabled:opacity-50"
          >
            {resend.isPending ? 'Sending...' : 'Resend'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
