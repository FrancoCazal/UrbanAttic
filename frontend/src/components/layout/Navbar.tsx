import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Search, X, Menu } from 'lucide-react';
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
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout.mutate();
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#1c1c1a] border-t-2 border-[#c02020]">
      <div className="flex justify-between items-center w-full px-6 py-4">
        {/* Logo */}
        <Link to="/" className="font-headline text-2xl font-black text-[#fcf9f6] tracking-tighter uppercase" onClick={closeMenu}>
          URBAN ATTIC
        </Link>

        {/* Center Nav Links — Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/products" className="font-headline uppercase tracking-tight font-bold text-sm text-[#fcf9f6] hover:text-[#c02020] transition-colors">
            CATALOG
          </Link>
          <Link to="/products?ordering=-created_at" className="font-headline uppercase tracking-tight font-bold text-sm text-[#fcf9f6] hover:text-[#c02020] transition-colors">
            NEW DROPS
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
            className="text-[#fcf9f6] hover:text-[#c02020] transition-colors p-2"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {user && (
            <>
              <Link to="/cart" className="flex items-center gap-2 text-[#fcf9f6] hover:text-[#c02020] transition-colors p-2" onClick={closeMenu}>
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.count > 0 && (
                  <span className="text-[#c02020] font-headline font-bold text-xs">
                    {cart.count}
                  </span>
                )}
              </Link>

              {/* User Dropdown — Desktop */}
              <div className="hidden md:block">
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
              </div>
            </>
          )}

          {!user && (
            <div className="hidden md:flex items-center gap-3">
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

          {/* Hamburger — Mobile */}
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
            className="md:hidden text-[#fcf9f6] hover:text-[#c02020] transition-colors p-2"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="bg-[#1c1c1a] border-t border-[#fcf9f6]/10 px-6 py-4">
          <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SCAN CATALOG..."
              className="flex-grow bg-transparent border-b-2 border-[#fcf9f6]/40 text-[#fcf9f6] px-2 py-2 font-headline font-bold uppercase tracking-wider text-sm focus:border-[#c02020] focus:outline-none placeholder:text-[#fcf9f6]/30"
            />
            <button
              type="submit"
              className="ml-4 px-6 py-2 bg-primary-container text-white font-headline font-bold uppercase text-sm hover:bg-primary transition-colors"
            >
              SCAN
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#1c1c1a] border-t border-[#fcf9f6]/10 px-6 py-8">
          <div className="flex flex-col gap-6">
            {/* Nav Links */}
            <Link to="/products" onClick={closeMenu} className="font-headline uppercase tracking-tight font-bold text-lg text-[#fcf9f6] hover:text-[#c02020] transition-colors">
              CATALOG
            </Link>
            <Link to="/products?ordering=-created_at" onClick={closeMenu} className="font-headline uppercase tracking-tight font-bold text-lg text-[#fcf9f6] hover:text-[#c02020] transition-colors">
              NEW DROPS
            </Link>

            <div className="border-t border-[#fcf9f6]/10 pt-6">
              {user ? (
                <div className="flex flex-col gap-6">
                  <div className="font-headline font-bold text-sm text-[#fcf9f6]/60 uppercase">
                    {user.first_name} {user.last_name}
                  </div>
                  <Link to="/profile" onClick={closeMenu} className="font-headline uppercase tracking-tight font-bold text-lg text-[#fcf9f6] hover:text-[#c02020] transition-colors flex items-center gap-3">
                    <User className="h-5 w-5" /> PROFILE
                  </Link>
                  <Link to="/orders" onClick={closeMenu} className="font-headline uppercase tracking-tight font-bold text-lg text-[#fcf9f6] hover:text-[#c02020] transition-colors flex items-center gap-3">
                    <Package className="h-5 w-5" /> MY ORDERS
                  </Link>
                  <button onClick={handleLogout} className="font-headline uppercase tracking-tight font-bold text-lg text-[#fcf9f6] hover:text-[#c02020] transition-colors flex items-center gap-3 text-left">
                    <LogOut className="h-5 w-5" /> LOGOUT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link to="/login" onClick={closeMenu} className="font-headline uppercase tracking-tight font-bold text-lg text-[#fcf9f6] hover:text-[#c02020] transition-colors">
                    LOGIN
                  </Link>
                  <Link to="/register" onClick={closeMenu}>
                    <button className="w-full py-3 bg-primary-container text-white font-headline font-bold uppercase tracking-wider hover:bg-primary transition-colors">
                      REGISTER
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
