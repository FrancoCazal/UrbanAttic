import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
    <nav className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Home className="h-6 w-6" />
            <span>Urban Attic</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/products" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Products
            </Link>

            {user && (
              <>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5" />
                    {cart && cart.count > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                      >
                        {cart.count}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <Link to="/orders" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                  Orders
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="px-2 py-1.5 text-xs text-slate-500">{user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!user && (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
