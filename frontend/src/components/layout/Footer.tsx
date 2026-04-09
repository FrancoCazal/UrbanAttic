import { Link } from 'react-router-dom';
import { useT } from '@/lib/settings-context';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useT();

  const linkClass = "font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 hover:text-[#c02020] underline decoration-2 transition-all";

  return (
    <footer className="bg-[#1c1c1a] border-t-2 border-[#c02020] w-full px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="text-xl font-black text-[#c02020] font-headline mb-6 uppercase">{t.footer.brand}</div>
            <p className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60 leading-relaxed max-w-[200px]">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="font-headline font-bold text-[#fcf9f6] text-[10px] tracking-[0.2em] mb-6">{t.footer.shop}</h4>
            <div className="flex flex-col gap-4">
              <Link to="/products" className={linkClass}>{t.footer.catalog}</Link>
              <Link to="/products?category=men" className={linkClass}>{t.footer.men}</Link>
              <Link to="/products?category=women" className={linkClass}>{t.footer.women}</Link>
              <Link to="/products?category=unisex" className={linkClass}>{t.footer.unisex}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-headline font-bold text-[#fcf9f6] text-[10px] tracking-[0.2em] mb-6">{t.footer.company}</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className={linkClass}>{t.footer.about}</a>
              <a href="#" className={linkClass}>{t.footer.contact}</a>
              <a href="#" className={linkClass}>{t.footer.terms}</a>
              <a href="#" className={linkClass}>{t.footer.privacy}</a>
            </div>
          </div>

          <div>
            <h4 className="font-headline font-bold text-[#fcf9f6] text-[10px] tracking-[0.2em] mb-6">{t.footer.connect}</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className={linkClass}>{t.footer.instagram}</a>
              <a href="#" className={linkClass}>{t.footer.tiktok}</a>
              <a href="mailto:hello@urbanattic.com" className={linkClass}>{t.footer.email}</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#fcf9f6]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-headline uppercase tracking-tighter text-xs text-[#fcf9f6]/60">
            &copy;{currentYear} URBAN ATTIC
          </p>
          <span className="font-headline uppercase tracking-tighter text-[10px] text-[#fcf9f6]/40">{t.footer.established}</span>
        </div>
      </div>
    </footer>
  );
}
