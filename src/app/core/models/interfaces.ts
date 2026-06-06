// REEMPLAZA src/app/core/models/interfaces.ts
// (incluye todas las interfaces originales + las nuevas)

export interface User {
  _id: string; name: string; email: string;
  role: 'admin' | 'cajero' | 'cliente' | 'invitado';
  isActive: boolean; createdAt: string; phone?: string; address?: string;
}
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

export interface Product {
  _id: string; name: string; barcode: string; category: Category | string;
  supplier?: Supplier | string | any;
  purchasePrice: number; salePrice: number; stock: number; minStock: number;
  imageUrl: string; description: string; isActive: boolean; createdAt: string;
}
export interface Category { _id: string; name: string; icon: string; order: number; isActive: boolean; }
export interface SaleItem { product: string; productName: string; quantity: number; unitPrice: number; subtotal: number; }
export interface Sale {
  _id: string; user: User | string; items: SaleItem[]; total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'mixto'; customerName: string;
  notes: string; createdAt: string;
}
export interface CashClosing {
  _id: string; user: User | string; openedAt: string; closedAt: string | null;
  initialAmount: number; totalSales: number; totalTransactions: number;
  expectedCash: number; actualCash: number | null; difference: number;
  notes: string; status: 'abierta' | 'cerrada';
}
export interface Alert {
  _id: string; product: Product | string;
  type: 'stock_bajo' | 'sin_stock' | 'producto_estancado';
  message: string; read: boolean; priority: 'baja' | 'media' | 'alta'; createdAt: string;
}
export interface Settings {
  _id: string; storeName: string; logoUrl: string; phone: string;
  address: string; whatsappNumber: string;
  theme: { primaryNeon: string; secondaryNeon: string; };
}
export interface PaginatedResponse<T> {
  total: number; page: number; pages: number; [key: string]: T[] | number;
}

// ── NUEVAS INTERFACES ────────────────────────────────────────────────────────

export interface Supplier {
  _id: string; name: string; code: string; categories: any[]; contactName: string; phone: string;
  email: string; address: string; nit: string; notes: string; isActive: boolean;
  createdAt: string;
}

export interface PurchaseItem {
  product: string | Product; productName: string;
  quantity: number; unitCost: number; subtotal: number;
}

export interface Purchase {
  _id: string; supplier: Supplier | string; supplierName: string;
  user: User | string; items: PurchaseItem[]; total: number;
  invoiceNumber: string; paymentMethod: 'efectivo' | 'transferencia' | 'credito' | 'mixto';
  status: 'pendiente' | 'recibida' | 'anulada'; notes: string; createdAt: string;
}

export type ExpenseCategory =
  | 'arriendo' | 'servicios_publicos' | 'nomina' | 'mantenimiento_reparaciones'
  | 'insumos_aseo' | 'papeleria_oficina' | 'transporte_logistica'
  | 'publicidad_marketing' | 'impuestos_tasas' | 'otros';

export interface Expense {
  _id: string; category: ExpenseCategory; description: string; amount: number;
  date: string; user: User | string; paymentMethod: string;
  invoiceNumber: string; supplier?: Supplier | string; notes: string;
  isRecurring: boolean; createdAt: string;
}

export interface ExpenseCategoryOption { value: ExpenseCategory; label: string; }

export interface FinancialSummary {
  period: string; startDate: string;
  totalRevenue: number; cogs: number; grossProfit: number; grossMargin: number;
  totalExpenses: number; totalPurchases: number;
  operatingProfit: number; netProfit: number; netMargin: number;
  expenseByCategory: Record<string, number>;
  salesCount: number; purchasesCount: number;
  dailySales: { _id: string; revenue: number }[];
  dailyExpenses: { _id: string; amount: number }[];
  dailyPurchases: { _id: string; amount: number }[];
}

export interface MonthlyPL {
  month: string; label: string;
  revenue: number; expenses: number; purchases: number; profit: number; salesCount: number;
}

// ── INTERFACES DEUDORES ─────────────────────────────────────────────────────

export type DebtorTransactionType = 'abono' | 'pago_completo' | 'aumento_credito' | 'nueva_deuda';

export interface DebtorTransaction {
  _id: string;
  type: DebtorTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  notes: string;
  createdAt: string;
}

export interface Debtor {
  _id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  totalDebt: number;
  creditLimit: number;
  transactions: DebtorTransaction[];
  lastPaymentDate: string | null;
  isActive: boolean;
  createdAt: string;
}
