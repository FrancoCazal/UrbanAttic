import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useT } from '@/lib/settings-context';

export function HomePage() {
  const t = useT();
  const { data, isLoading } = useProducts({ ordering: '-created_at', page_size: 8 });
  const [email, setEmail] = useState('');
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success(t.home.welcomeToast);
      setEmail('');
    }
  };

  const categories = [
    { name: t.home.men, slug: 'men', img: 'https://unsplash.com/photos/J-YQ36vC2F8/download?w=800' },
    { name: t.home.women, slug: 'women', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80' },
    { name: t.home.unisex, slug: 'unisex', img: 'https://unsplash.com/photos/BkYjAysV8J4/download?w=800' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[90vh] bg-[#1c1c1a] overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img
            alt="Urban streetwear lifestyle"
            className="w-full h-full object-cover grayscale"
            src="https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=1920&q=80"
          />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-16">
          {/* Logo + CTA — Desktop right side */}
          <div className="hidden md:flex absolute right-16 top-[55%] -translate-y-1/2 flex-col items-center gap-16">
            <img src="/favicon.jpg" alt="Urban Attic Logo" className="w-40 lg:w-56 xl:w-72 h-auto object-contain opacity-90" />
            <Link to="/products">
              <button className="px-10 py-5 bg-primary-container text-white font-headline font-bold uppercase tracking-widest text-xl border-2 border-on-surface hover:bg-white hover:text-on-surface transition-all active:scale-95">
                {t.home.shopNow}
              </button>
            </Link>
          </div>
          {/* Mobile: Logo */}
          <img src="/favicon.jpg" alt="Urban Attic Logo" className="md:hidden w-32 h-auto object-contain opacity-90 mb-6" />
          <h1 className="font-headline text-[18vw] md:text-[12vw] leading-[0.8] font-black tracking-tighter text-white uppercase mb-6 md:mb-8">
            {t.home.heroHeadline.split('\n').map((line, i) => (
              <span key={i}>{line}{i < 2 && <br />}</span>
            ))}
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
            <p className="max-w-md font-body text-[#eae8e5] text-sm md:text-lg uppercase tracking-tight">
              {t.home.heroSubtitle}
            </p>
            <Link to="/products" className="md:hidden">
              <button className="px-8 py-4 bg-primary-container text-white font-headline font-bold uppercase tracking-widest text-base border-2 border-on-surface hover:bg-white hover:text-on-surface transition-all active:scale-95">
                {t.home.shopNow}
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div className="h-full bg-primary-container w-1/3"></div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="bg-surface py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-on-surface max-w-7xl mx-auto">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className={`group relative aspect-[3/4] overflow-hidden ${i < 2 ? 'border-b-2 md:border-b-0 md:border-r-2 border-on-surface' : ''}`}
            >
              <img className="w-full h-full object-cover grayscale brightness-75 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100" src={cat.img} alt={cat.name} />
              <div className="absolute inset-0 bg-on-surface/10 group-hover:bg-on-surface/0 transition-colors"></div>
              <div className="absolute bottom-8 left-8">
                <h2 className="font-headline text-4xl font-black text-on-surface bg-surface px-4 py-2 uppercase">{cat.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Drops Carousel */}
      <section className="bg-surface-container-low py-24 px-6 border-y-2 border-on-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-primary font-headline font-bold uppercase tracking-tighter text-sm block mb-2">{t.home.curatedSelection}</span>
              <h3 className="font-headline text-5xl md:text-6xl font-black text-on-surface tracking-tighter uppercase">{t.home.latestDrops}</h3>
            </div>
            <Link to="/products" className="font-headline font-bold uppercase border-b-2 border-on-surface pb-1 hover:text-primary hover:border-primary transition-all flex items-center gap-2">
              {t.home.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden py-4 -my-4 px-4 -mx-4" ref={emblaRef}>
                <div className="flex">
                  {(data?.results || []).map((product) => (
                    <div key={product.id} className="flex-none w-[calc(50%-16px)] md:w-[calc(25%-24px)] mr-8">
                      <ProductCard product={product} />
                    </div>
                  ))}
                  {/* Spacer to prevent first and last from touching */}
                  <div className="flex-none w-2"></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-8">
                <button onClick={scrollPrev} className="border-2 border-on-surface p-3 hover:bg-on-surface hover:text-surface transition-all">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button onClick={scrollNext} className="border-2 border-on-surface p-3 hover:bg-on-surface hover:text-surface transition-all">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Brand Story */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-primary-container text-white p-12 md:p-24 flex flex-col justify-center">
          <span className="font-headline font-bold tracking-widest text-sm mb-6 opacity-80 uppercase">{t.home.ourStory}</span>
          <h3 className="font-headline text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tighter uppercase">{t.home.brandHeadline}</h3>
          <p className="font-body text-lg max-w-lg mb-10 opacity-90">{t.home.brandBio}</p>
          <Link to="/products" className="w-fit px-8 py-4 border-2 border-white font-headline font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all">
            {t.home.exploreCatalog}
          </Link>
        </div>
        <div className="h-[500px] md:h-auto overflow-hidden">
          <img className="w-full h-full object-cover grayscale brightness-75" src="https://unsplash.com/photos/lAxv9rMj0pY/download?w=800" alt="Urban landscape" />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-surface py-24 px-6 flex flex-col items-center text-center">
        <h4 className="font-headline text-4xl md:text-6xl font-black text-on-surface uppercase tracking-tighter mb-8">{t.home.joinNetwork}</h4>
        <p className="max-w-xl font-body text-secondary text-lg mb-12 uppercase tracking-tight">{t.home.newsletterSubtitle}</p>
        <form onSubmit={handleNewsletter} className="flex flex-col md:flex-row w-full max-w-2xl gap-0">
          <input
            className="flex-grow bg-surface-container-high border-2 border-on-surface px-6 py-4 font-headline font-bold focus:ring-0 focus:border-primary-container outline-none"
            placeholder={t.home.emailPlaceholder}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="bg-primary-container text-white px-12 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary border-2 border-primary-container transition-all">
            {t.home.subscribe}
          </button>
        </form>
      </section>
    </div>
  );
}
