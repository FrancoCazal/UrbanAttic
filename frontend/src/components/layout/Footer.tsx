import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1c1c1a] border-t-2 border-[#c02020] w-full px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="text-xl font-black text-[#c02020] font-headline mb-6 uppercase">URBAN ATTIC</div>
            <p className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 leading-relaxed max-w-[200px]">
              STREETWEAR BORN IN ASUNCION. DESIGNED FOR THE CONCRETE LANDSCAPE.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-headline font-bold text-white text-[10px] tracking-[0.2em] mb-6">SHOP</h4>
            <div className="flex flex-col gap-4">
              <Link to="/products" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">CATALOG</Link>
              <Link to="/products?category=men" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">MEN</Link>
              <Link to="/products?category=women" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">WOMEN</Link>
              <Link to="/products?category=unisex" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">UNISEX</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-headline font-bold text-white text-[10px] tracking-[0.2em] mb-6">COMPANY</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">ABOUT</a>
              <a href="#" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">CONTACT</a>
              <a href="#" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">TERMS</a>
              <a href="#" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">PRIVACY</a>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-headline font-bold text-white text-[10px] tracking-[0.2em] mb-6">CONNECT</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">INSTAGRAM</a>
              <a href="#" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">TIKTOK</a>
              <a href="mailto:hello@urbanattic.com" className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all">EMAIL</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#fcf9f6]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60">
            &copy;{currentYear} URBAN ATTIC
          </p>
          <span className="font-headline uppercase tracking-tighter text-[10px] text-[#fcf9f6]/40">EST. 2018 / ASUNCION</span>
        </div>
      </div>
    </footer>
  );
}
