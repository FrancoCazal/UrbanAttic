import { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { useUser } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WishlistButtonProps {
  slug: string;
  variant?: 'icon' | 'full';
}

export function WishlistButton({ slug, variant = 'icon' }: WishlistButtonProps) {
  const { data: user } = useUser();
  const inWishlist = useIsInWishlist(slug);
  const toggle = useToggleWishlist();
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to use wishlist.');
      navigate('/login');
      return;
    }

    toggle.mutate(slug, {
      onSuccess: (data) => {
        toast.success(data.in_wishlist ? 'Added to wishlist' : 'Removed from wishlist');
      },
      onError: () => {
        toast.error('Could not update wishlist.');
      },
    });
  };

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        className="flex items-center gap-2 px-4 py-3 border-2 border-on-surface text-on-surface font-bold font-headline uppercase text-xs tracking-widest hover:bg-on-surface hover:text-background transition-colors disabled:opacity-50"
      >
        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
        {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className="absolute top-3 right-3 z-10 p-2 bg-background/90 border-2 border-on-surface hover:bg-on-surface hover:text-background transition-colors disabled:opacity-50"
    >
      <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current text-primary' : ''}`} />
    </button>
  );
}
