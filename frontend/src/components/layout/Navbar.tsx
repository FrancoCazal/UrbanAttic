import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, useLogout } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

export function Navbar() {
  const { data: user } = useUser();
  const { data: cart } = useCart();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1c1c1a] border-t-2 border-[#c02020]">
      <div className="flex justify-between items-center w-full px-6 py-4">
        {/* Logo */}
        <Link to="/" className="font-headline text-2xl font-black text-[#fcf9f6] tracking-tighter uppercase">
          URBAN ATTIC
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/products" className="font-headline uppercase tracking-tight font-bold text-sm text-[#fcf9f6] hover:text-[#c02020] transition-colors">
            CATALOG
          </Link>
          <Link to="/products?ordering=-created_at" className="font-headline uppercase tracking-tight font-bold text-sm text-[#fcf9f6] hover:text-[#c02020] transition-colors">
            NEW DROPS
          </Link>
          <Link to="/products" className="font-headline uppercase tracking-tight font-bold text-sm text-[#fcf9f6] hover:text-[#c02020] transition-colors">
            SALE
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <button className="text-[#fcf9f6] hover:text-[#c02020] transition-colors p-2">
            <Search className="h-5 w-5" />
          </button>

          {user && (
            <>
              <Link to="/cart" className="flex items-center gap-2 text-[#fcf9f6] hover:text-[#c02020] transition-colors p-2">
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.count > 0 && (
                  <span className="text-[#c02020] font-headline font-bold text-xs">
                    {cart.count}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[#fcf9f6] hover:text-[#c02020] transition-colors p-2">
                    <User className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-bold font-headline uppercase">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-secondary">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      PROFILE
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      MY ORDERS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    LOGOUT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-headline uppercase tracking-tight font-bold text-sm text-[#fcf9f6] hover:text-[#c02020] transition-colors">
                LOGIN
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary-container text-white px-4 py-2 font-headline font-bold uppercase text-sm hover:bg-primary transition-colors">
                  REGISTER
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
