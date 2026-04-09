"""
Management command to seed the database with Urban Attic demo data.

Usage:
    python manage.py seed           # idempotent seed
    python manage.py seed --flush   # wipe seeded models first, then seed
"""

from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from apps.users.models import User
from apps.products.models import Category, Product, ProductVariant, ProductImage

SEED_IMAGES_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent.parent
    / "static"
    / "seed_images"
)


class Command(BaseCommand):
    help = "Seed the database with Urban Attic demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all seeded data before re-seeding.",
        )

    # ------------------------------------------------------------------
    # handle
    # ------------------------------------------------------------------
    def handle(self, *args, **options):
        if options["flush"]:
            from apps.orders.models import OrderItem, Order

            self.stdout.write("Flushing existing data ...")
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            ProductVariant.objects.all().delete()
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            User.objects.filter(
                email__in=["admin@urbanattic.com", "demo@urbanattic.com"]
            ).delete()

        self._create_users()
        categories = self._create_categories()
        self._create_products(categories)
        self.stdout.write(self.style.SUCCESS("Seed complete."))

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    def _create_users(self):
        if not User.objects.filter(email="admin@urbanattic.com").exists():
            User.objects.create_superuser(
                email="admin@urbanattic.com",
                first_name="Admin",
                last_name="Urban Attic",
                password="admin1234",
            )
            self.stdout.write("  Created admin user.")
        else:
            self.stdout.write("  Admin user already exists.")

        if not User.objects.filter(email="demo@urbanattic.com").exists():
            User.objects.create_user(
                email="demo@urbanattic.com",
                first_name="Demo",
                last_name="User",
                password="demo1234",
            )
            self.stdout.write("  Created demo user.")
        else:
            self.stdout.write("  Demo user already exists.")

    # ------------------------------------------------------------------
    # Categories
    # ------------------------------------------------------------------
    def _create_categories(self):
        cats = {}

        # --- Root categories (gender-based) ---
        men, _ = Category.objects.get_or_create(
            slug="men", defaults={"name": "Men", "parent": None}
        )
        women, _ = Category.objects.get_or_create(
            slug="women", defaults={"name": "Women", "parent": None}
        )
        unisex, _ = Category.objects.get_or_create(
            slug="unisex", defaults={"name": "Unisex", "parent": None}
        )
        cats.update({"men": men, "women": women, "unisex": unisex})

        # --- Men subcategories ---
        for slug, name in [
            ("t-shirts", "T-Shirts"),
            ("pants", "Pants"),
            ("jackets", "Jackets"),
        ]:
            obj, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "parent": men}
            )
            cats[slug] = obj

        # --- Women subcategories ---
        for slug, name in [
            ("tops", "Tops"),
            ("dresses", "Dresses"),
            ("skirts", "Skirts"),
        ]:
            obj, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "parent": women}
            )
            cats[slug] = obj

        # --- Unisex subcategories ---
        for slug, name in [
            ("jeans", "Jeans"),
            ("accessories", "Accessories"),
            ("backpacks", "Backpacks"),
        ]:
            obj, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "parent": unisex}
            )
            cats[slug] = obj

        self.stdout.write("  Categories seeded.")
        return cats

    # ------------------------------------------------------------------
    # Helper: generate variants + images for a product
    # ------------------------------------------------------------------
    def _generate_variants(
        self,
        product,
        colors,
        sizes,
        base_sku,
        price,
        common_attrs,
        color_images,
    ):
        """
        Create variants (and their images) for *product*.

        Parameters
        ----------
        product : Product
        colors : list[str]
        sizes : list[str] | None
            Pass ``None`` or ``[]`` for products without sizes.
        base_sku : str          e.g. "UA-001"
        price : Decimal
        common_attrs : dict     e.g. {"material": "...", "gender": "..."}
        color_images : dict     color_name -> filename  (e.g. {"Black": "var1.png"})
        """
        created_images = {}  # filename -> ProductImage (per product, avoids dups)
        counter = 1
        has_sizes = bool(sizes)

        combos = []
        if has_sizes:
            for size in sizes:
                for color in colors:
                    combos.append((size, color))
        else:
            for color in colors:
                combos.append((None, color))

        for size, color in combos:
            sku = f"{base_sku}-{counter:02d}"

            if size:
                variant_name = f"Size: {size}, Color: {color}"
            else:
                variant_name = f"Color: {color}"

            attrs = {**common_attrs}
            if size:
                attrs["size"] = size
            attrs["color"] = color

            is_main = counter == 1

            # --- Image ---
            image_obj = None
            filename = color_images.get(color)
            if filename:
                if filename not in created_images:
                    img_path = SEED_IMAGES_DIR / filename
                    if img_path.exists():
                        pi = ProductImage(
                            product=product,
                            alt_text=f"{product.name} - {color}",
                            position=len(created_images),
                            is_primary=(len(created_images) == 0),
                        )
                        with open(img_path, "rb") as f:
                            pi.image.save(filename, File(f), save=True)
                        created_images[filename] = pi
                image_obj = created_images.get(filename)

            variant, created = ProductVariant.objects.get_or_create(
                sku=sku,
                defaults={
                    "product": product,
                    "name": variant_name,
                    "price": price,
                    "stock": 15,
                    "attributes": attrs,
                    "is_main": is_main,
                    "is_active": True,
                    "image": image_obj,
                },
            )
            counter += 1

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------
    def _create_products(self, cats):

        # ==============================================================
        # PRODUCT 1 - Oversized Tee "Street Vibes"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="oversized-tee-street-vibes",
            defaults={
                "name": 'Oversized Tee "Street Vibes"',
                "description": (
                    "100% cotton oversized tee with urban print. "
                    "Perfect for a relaxed, stylish look."
                ),
                "category": cats["t-shirts"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "White", "Military Green"],
            sizes=["S", "M", "L", "XL"],
            base_sku="UA-001",
            price=Decimal("11.54"),
            common_attrs={"material": "100% Cotton", "gender": "Male"},
            color_images={
                "Black": "var1.png",
                "White": "var2.png",
                "Military Green": "var3.png",
            },
        )
        self.stdout.write("  Product 1 seeded.")

        # ==============================================================
        # PRODUCT 2 - Short Jacket "Urban Cold"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="short-jacket-urban-cold",
            defaults={
                "name": 'Short Jacket "Urban Cold"',
                "description": (
                    "Waterproof jacket with inner lining, perfect for cool "
                    "and rainy days."
                ),
                "category": cats["jackets"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Dark Gray", "Blue", "Black"],
            sizes=["M", "L", "XL"],
            base_sku="UA-002",
            price=Decimal("30.00"),
            common_attrs={"material": "Waterproof", "gender": "Male"},
            color_images={
                "Dark Gray": "var13.png",
                "Blue": "var14.png",
                "Black": "var15.png",
            },
        )
        self.stdout.write("  Product 2 seeded.")

        # ==============================================================
        # PRODUCT 3 - Jogger "Flex Street"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="jogger-flex-street",
            defaults={
                "name": 'Jogger "Flex Street"',
                "description": (
                    "Unisex jogger with ankle cuffs, drawstring waist, "
                    "and zippered side pockets."
                ),
                "category": cats["pants"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Beige"],
            sizes=["S", "M", "L", "XL"],
            base_sku="UA-003",
            price=Decimal("18.46"),
            common_attrs={"material": "Organic Cotton", "gender": "Unisex"},
            color_images={
                "Black": "var22.png",
                "Beige": "var23.png",
            },
        )
        self.stdout.write("  Product 3 seeded.")

        # ==============================================================
        # PRODUCT 4 - Crop Top "Wave"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="crop-top-wave",
            defaults={
                "name": 'Crop Top "Wave"',
                "description": (
                    "Cropped top with stretchy fabric and cross-back design. "
                    "Great for day or night."
                ),
                "category": cats["tops"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Fuchsia", "Black", "White"],
            sizes=["XS", "S", "M", "L"],
            base_sku="UA-004",
            price=Decimal("9.23"),
            common_attrs={"material": "Stretch Fabric", "gender": "Female"},
            color_images={
                "Fuchsia": "var30.png",
                "Black": "var31.png",
                "White": "var32.png",
            },
        )
        self.stdout.write("  Product 4 seeded.")

        # ==============================================================
        # PRODUCT 5 - Mom Jeans "Retro Fit"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="mom-jeans-retro-fit",
            defaults={
                "name": 'Mom Jeans "Retro Fit"',
                "description": (
                    "High-waisted relaxed fit with rigid denim. "
                    "Vintage style with a modern touch."
                ),
                "category": cats["jeans"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Blue", "Dark Blue"],
            sizes=["36", "38", "40", "42"],
            base_sku="UA-005",
            price=Decimal("22.31"),
            common_attrs={"material": "Denim", "gender": "Female"},
            color_images={
                "Blue": "var42.png",
                "Dark Blue": "var43.png",
            },
        )
        self.stdout.write("  Product 5 seeded.")

        # ==============================================================
        # PRODUCT 6 - Denim Jacket "Skyline"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="denim-jacket-skyline",
            defaults={
                "name": 'Denim Jacket "Skyline"',
                "description": (
                    "Oversized denim jacket with distressed details "
                    "and metal buttons."
                ),
                "category": cats["jackets"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Blue", "Light Blue"],
            sizes=["S", "M", "L"],
            base_sku="UA-006",
            price=Decimal("25.38"),
            common_attrs={"material": "Denim", "gender": "Female"},
            color_images={
                "Blue": "var50.png",
                "Light Blue": "var51.jpg",
            },
        )
        self.stdout.write("  Product 6 seeded.")

        # ==============================================================
        # PRODUCT 7 - Snapback Cap "Logo Urban Attic"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="snapback-cap-logo-urban-attic",
            defaults={
                "name": 'Snapback Cap "Logo Urban Attic"',
                "description": (
                    "Flat-brim adjustable cap with the store logo "
                    "embroidered on the front."
                ),
                "category": cats["accessories"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Burgundy", "Beige"],
            sizes=None,
            base_sku="UA-007",
            price=Decimal("8.46"),
            common_attrs={"gender": "Unisex"},
            color_images={
                "Black": "var56.jpg",
                "Burgundy": "var57.jpg",
                "Beige": "var58.png",
            },
        )
        self.stdout.write("  Product 7 seeded.")

        # ==============================================================
        # PRODUCT 8 - Fanny Pack "Flow Street"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="fanny-pack-flow-street",
            defaults={
                "name": 'Fanny Pack "Flow Street"',
                "description": (
                    "Multi-compartment fanny pack with adjustable strap. "
                    "Go out comfortable and in style."
                ),
                "category": cats["accessories"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Neon Green", "Camo"],
            sizes=None,
            base_sku="UA-008",
            price=Decimal("10.00"),
            common_attrs={"gender": "Unisex"},
            color_images={
                "Black": "var59.png",
                "Neon Green": "var60.png",
                "Camo": "var61.png",
            },
        )
        self.stdout.write("  Product 8 seeded.")

        # ==============================================================
        # PRODUCT 9 - Basic Tee "Daily Urban"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="basic-tee-daily-urban",
            defaults={
                "name": 'Basic Tee "Daily Urban"',
                "description": (
                    "Basic cotton tee with a classic fit. "
                    "Perfect for everyday wear."
                ),
                "category": cats["t-shirts"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "White", "Dark Gray", "Blue"],
            sizes=["S", "M", "L", "XL"],
            base_sku="UA-009",
            price=Decimal("9.08"),
            common_attrs={"material": "100% Cotton", "gender": "Male"},
            color_images={
                "Black": "var62.png",
                "White": "var63.jpg",
                "Dark Gray": "var64.jpg",
                "Blue": "var65.jpg",
            },
        )
        self.stdout.write("  Product 9 seeded.")

        # ==============================================================
        # PRODUCT 10 - Cargo Pants "Street Explorer"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="cargo-pants-street-explorer",
            defaults={
                "name": 'Cargo Pants "Street Explorer"',
                "description": (
                    "Cargo-style pants with multiple pockets "
                    "and elastic waistband."
                ),
                "category": cats["pants"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Military Green", "Beige"],
            sizes=["S", "M", "L", "XL"],
            base_sku="UA-010",
            price=Decimal("21.54"),
            common_attrs={"material": "Organic Cotton", "gender": "Male"},
            color_images={
                "Black": "var78.jpg",
                "Military Green": "var79.jpg",
                "Beige": "var80.jpg",
            },
        )
        self.stdout.write("  Product 10 seeded.")

        # ==============================================================
        # PRODUCT 11 - Basic Dress "Urban Girl"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="basic-dress-urban-girl",
            defaults={
                "name": 'Basic Dress "Urban Girl"',
                "description": (
                    "Simple cut dress, perfect to pair "
                    "with accessories."
                ),
                "category": cats["dresses"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Red", "Blue"],
            sizes=["XS", "S", "M", "L"],
            base_sku="UA-011",
            price=Decimal("17.69"),
            common_attrs={"material": "Organic Cotton", "gender": "Female"},
            color_images={
                "Black": "var90.jpg",
                "Red": "var91.jpg",
                "Blue": "var92.jpg",
            },
        )
        self.stdout.write("  Product 11 seeded.")

        # ==============================================================
        # PRODUCT 12 - Skirt "Urban District"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="skirt-urban-district",
            defaults={
                "name": 'Skirt "Urban District"',
                "description": (
                    "Short skirt with urban design and modern print."
                ),
                "category": cats["skirts"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Red"],
            sizes=["XS", "S", "M", "L"],
            base_sku="UA-012",
            price=Decimal("14.62"),
            common_attrs={"material": "Polyester", "gender": "Female"},
            color_images={
                "Black": "var102.jpg",
                "Red": "var103.jpg",
            },
        )
        self.stdout.write("  Product 12 seeded.")

        # ==============================================================
        # PRODUCT 13 - Backpack "Urban Backpack"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="backpack-urban-backpack",
            defaults={
                "name": 'Backpack "Urban Backpack"',
                "description": (
                    "Urban backpack with laptop "
                    "and accessory compartments."
                ),
                "category": cats["backpacks"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Dark Gray", "Blue"],
            sizes=None,
            base_sku="UA-013",
            price=Decimal("23.85"),
            common_attrs={"gender": "Unisex"},
            color_images={
                "Black": "var110.jpg",
                "Dark Gray": "var111.jpg",
                "Blue": "var112.jpg",
            },
        )
        self.stdout.write("  Product 13 seeded.")

        # ==============================================================
        # PRODUCT 14 - Belt "Street Belt"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="belt-street-belt",
            defaults={
                "name": 'Belt "Street Belt"',
                "description": (
                    "Urban belt with metal buckle and modern design."
                ),
                "category": cats["accessories"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "Brown"],
            sizes=["S", "M", "L", "XL"],
            base_sku="UA-014",
            price=Decimal("8.46"),
            common_attrs={"gender": "Unisex"},
            color_images={
                "Black": "var113.jpg",
                "Brown": "var114.jpg",
            },
        )
        self.stdout.write("  Product 14 seeded.")

        # ==============================================================
        # PRODUCT 15 - Socks "Street Socks"
        # ==============================================================
        product, _ = Product.objects.get_or_create(
            slug="socks-street-socks",
            defaults={
                "name": 'Socks "Street Socks"',
                "description": (
                    "Socks with urban designs and comfortable fit."
                ),
                "category": cats["accessories"],
            },
        )
        self._generate_variants(
            product=product,
            colors=["Black", "White", "Dark Gray"],
            sizes=["S", "M", "L"],
            base_sku="UA-015",
            price=Decimal("3.85"),
            common_attrs={"material": "Organic Cotton", "gender": "Unisex"},
            color_images={
                "Black": "var121.jpg",
                "White": "var122.png",
                "Dark Gray": "var123.jpg",
            },
        )
        self.stdout.write("  Product 15 seeded.")
