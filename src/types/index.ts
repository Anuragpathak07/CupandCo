export const ROLES = ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'UPI'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type DataMode = 'mock' | 'supabase';
export type RealtimeStatus = 'connecting' | 'live' | 'offline';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  notes: string;
  paymentMethod: PaymentMethod | null;
  createdBy: string | null;
  createdByName?: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  items: OrderItem[];
}

export interface CreateOrderLine {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export interface CreateOrderInput {
  notes: string;
  createdBy: string | null;
  items: CreateOrderLine[];
}

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface MenuMutationInput {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
}

export interface OrderStatusCounts {
  completed: number;
  pending: number;
  inProgress: number;
  cancelled: number;
}

export interface AnalyticsData {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  averagePrepSeconds: number;
  statusCounts: OrderStatusCounts;
  popularItems: {
    menuItemId: string | null;
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export const ROLE_LABELS: Record<Role, string> = {
  BARISTA: 'Barista',
  CASHIER: 'Cashier',
  MANAGER: 'Manager',
  OWNER: 'Owner',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: Role | null;
          created_at: string;
          updated_at: string;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: Role | null;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['menu_categories']['Insert']>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          status: OrderStatus;
          notes: string;
          payment_method: PaymentMethod | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          order_number?: number;
          status?: OrderStatus;
          notes?: string;
          payment_method?: PaymentMethod | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          quantity: number;
          unit_price: number;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          item_name?: string;
          quantity: number;
          unit_price?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: Role;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
