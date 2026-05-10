export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'cajero' | 'cliente' | 'invitado';
  isActive: boolean;
  createdAt: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  _id: string;
  name: string;
  barcode: string;
  category: Category | string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  imageUrl: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  order: number;
  isActive: boolean;
}

export interface SaleItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  user: User | string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'mixto';
  customerName: string;
  notes: string;
  createdAt: string;
}

export interface CashClosing {
  _id: string;
  user: User | string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  totalSales: number;
  totalTransactions: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number;
  notes: string;
  status: 'abierta' | 'cerrada';
}

export interface Alert {
  _id: string;
  product: Product | string;
  type: 'stock_bajo' | 'sin_stock' | 'producto_estancado';
  message: string;
  read: boolean;
  priority: 'baja' | 'media' | 'alta';
  createdAt: string;
}

export interface Settings {
  _id: string;
  storeName: string;
  logoUrl: string;
  phone: string;
  address: string;
  whatsappNumber: string;
  theme: {
    primaryNeon: string;
    secondaryNeon: string;
  };
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pages: number;
  [key: string]: T[] | number;
}
