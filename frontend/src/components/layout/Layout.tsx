import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <EmailVerificationBanner />
      <main className="flex-1 bg-background">{children}</main>
      <Footer />
    </div>
  );
}
