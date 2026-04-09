import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { useState } from 'react';

export function HomePage() {
  const { data, isLoading } = useProducts({ ordering: '-created_at', page_size: 8 });
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Welcome to the network.');
      setEmail('');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[90vh] bg-on-surface overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img
            alt="Urban streetwear lifestyle"
            className="w-full h-full object-cover grayscale"
            src="https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=1920&q=80"
          />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-16">
          <h1 className="font-headline text-[15vw] md:text-[12vw] leading-[0.8] font-black tracking-tighter text-white uppercase mb-8">
            STREET<br />LEVEL<br />ONLY
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="max-w-md font-body text-surface-container-high text-lg uppercase tracking-tight">
              COMFORTABLE, MODERN, AND AUTHENTIC URBAN FASHION FROM ASUNCION.
            </p>
            <Link to="/products">
              <button className="px-10 py-5 bg-primary-container text-white font-headline font-bold uppercase tracking-widest text-xl border-2 border-on-surface hover:bg-white hover:text-on-surface transition-all active:scale-95">
                SHOP NOW
              </button>
            </Link>
          </div>
        </div>
        {/* Gallery Scrubber */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div className="h-full bg-primary-container w-1/3"></div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="bg-surface py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-on-surface max-w-7xl mx-auto">
          {[
            { name: 'MEN', slug: 'men', img: 'https://unsplash.com/photos/J-YQ36vC2F8/download?w=800' },
            { name: 'WOMEN', slug: 'women', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80' },
            { name: 'UNISEX', slug: 'unisex', img: 'https://unsplash.com/photos/BkYjAysV8J4/download?w=800' },
          ].map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className={`group relative aspect-[3/4] overflow-hidden ${i < 2 ? 'border-b-2 md:border-b-0 md:border-r-2 border-on-surface' : ''}`}
            >
              <img
                className="w-full h-full object-cover grayscale brightness-75 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100"
                src={cat.img}
                alt={cat.name}
              />
              <div className="absolute inset-0 bg-on-surface/10 group-hover:bg-on-surface/0 transition-colors"></div>
              <div className="absolute bottom-8 left-8">
                <h2 className="font-headline text-4xl font-black text-on-surface bg-surface px-4 py-2 uppercase">{cat.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="bg-surface-container-low py-24 px-6 border-y-2 border-on-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-primary font-headline font-bold uppercase tracking-tighter text-sm block mb-2">CURATED SELECTION</span>
              <h3 className="font-headline text-5xl md:text-6xl font-black text-on-surface tracking-tighter uppercase">LATEST DROPS</h3>
            </div>
            <Link to="/products" className="font-headline font-bold uppercase border-b-2 border-on-surface pb-1 hover:text-primary hover:border-primary transition-all flex items-center gap-2">
              VIEW ALL <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ProductGrid products={(data?.results || []).slice(0, 8)} isLoading={isLoading} />
        </div>
      </section>

      {/* Brand Story */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-primary-container text-white p-12 md:p-24 flex flex-col justify-center">
          <span className="font-headline font-bold tracking-widest text-sm mb-6 opacity-80 uppercase">OUR STORY</span>
          <h3 className="font-headline text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tighter uppercase">BORN IN THE STREETS OF ASUNCION.</h3>
          <p className="font-body text-lg max-w-lg mb-10 opacity-90">
            Fundada en 2018, Urban Attic nace como una tienda de ropa juvenil inspirada en las tendencias urbanas, la cultura del skate y la musica alternativa. Prendas comodas, modernas y accesibles para una nueva generacion.
          </p>
          <Link to="/products" className="w-fit px-8 py-4 border-2 border-white font-headline font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all">
            EXPLORE CATALOG
          </Link>
        </div>
        <div className="h-[500px] md:h-auto overflow-hidden">
          <img
            className="w-full h-full object-cover grayscale brightness-75"
            src="https://unsplash.com/photos/lAxv9rMj0pY/download?w=800"
            alt="Urban landscape"
          />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-surface py-24 px-6 flex flex-col items-center text-center">
        <h4 className="font-headline text-4xl md:text-6xl font-black text-on-surface uppercase tracking-tighter mb-8">JOIN THE NETWORK.</h4>
        <p className="max-w-xl font-body text-secondary text-lg mb-12 uppercase tracking-tight">
          DROPS, DEALS, AND STREET CULTURE. DELIVERED WEEKLY.
        </p>
        <form onSubmit={handleNewsletter} className="flex flex-col md:flex-row w-full max-w-2xl gap-0">
          <input
            className="flex-grow bg-surface-container-high border-2 border-on-surface px-6 py-4 font-headline font-bold focus:ring-0 focus:border-primary-container outline-none"
            placeholder="YOUR@EMAIL.COM"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="bg-on-surface text-white px-12 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary-container transition-all"
          >
            SUBSCRIBE
          </button>
        </form>
      </section>
    </div>
  );
}
