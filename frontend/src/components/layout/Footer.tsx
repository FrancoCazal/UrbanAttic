export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-slate-600">
          &copy; {currentYear} Urban Attic. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
