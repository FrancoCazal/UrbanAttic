export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  children: CategoryTree[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  category: number | Category;
  image: string | null;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  position: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: number;
  attributes: Record<string, string>;
  is_main: boolean;
  image_url: string | null;
}

export interface ProductDetail extends Product {
  description: string;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartItem {
  variant_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  variant_name: string;
  sku: string;
  price: string;
  image: string | null;
  quantity: number;
  line_total: string;
}

export interface CartDetail {
  items: CartItem[];
  total: string;
  count: number;
}

export interface OrderListItem {
  id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  items_count: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price: string;
  line_total: string;
}

export interface OrderDetail {
  id: number;
  status: string;
  total_amount: string;
  shipping_address: string;
  notes: string;
  items: OrderItem[];
  payment_status: 'paid' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateOrderResponse extends OrderDetail {
  checkout_url: string;
}
