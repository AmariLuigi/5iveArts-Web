/**
 * Supabase auto-generated–style type definitions.
 *
 * These mirror the tables defined in supabase/migrations/001_schema.sql.
 * Update this file whenever the schema changes.
 */

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          images: string[];
          category: "hand-painted" | "home-printed";
          stock: number;
          details: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };

      orders: {
        Row: {
          id: string;
          stripe_session_id: string;
          stripe_payment_intent: string | null;
          customer_email: string;
          customer_name: string;
          status:
            | "pending"
            | "paid"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded";
          subtotal_pence: number;
          shipping_pence: number;
          total_pence: number;
          packlink_service_id: string | null;
          packlink_shipment_id: string | null;
          tracking_number: string | null;
          label_url: string | null;
          shipping_address: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_price_pence: number;
          quantity: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
    };
    Functions: {
      decrement_stock: {
        Args: { p_product_id: string; p_qty: number };
        Returns: number;
      };
    };
  };
}

/** Convenience alias for the orders Row type */
export type DbOrder = Database["public"]["Tables"]["orders"]["Row"];

/** Convenience alias for the order_items Row type */
export type DbOrderItem = Database["public"]["Tables"]["order_items"]["Row"];

/** Convenience alias for the products Row type */
export type DbProduct = Database["public"]["Tables"]["products"]["Row"];
