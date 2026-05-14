export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'user';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'briq' | 'fund' | 'land' | 'custom';
          description: string | null;
          status: 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['investments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['investments']['Insert']>;
      };
      briq_investments: {
        Row: {
          id: string;
          investment_id: string;
          annual_interest_rate: number;
          invested_amount: number;
          investment_date: string;
          term_months: number | null;
        };
        Insert: Omit<Database['public']['Tables']['briq_investments']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['briq_investments']['Insert']>;
      };
      fund_transactions: {
        Row: {
          id: string;
          fund_id: string;
          transaction_date: string;
          titles_quantity: number;
          title_cost: number;
          total_amount: number;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['fund_transactions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['fund_transactions']['Insert']>;
      };
      fund_title_history: {
        Row: {
          id: string;
          fund_id: string;
          date: string;
          title_value: number;
        };
        Insert: Omit<Database['public']['Tables']['fund_title_history']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['fund_title_history']['Insert']>;
      };
      land_details: {
        Row: {
          id: string;
          investment_id: string;
          total_price: number;
          purchase_date: string;
          payment_frequency: 'monthly' | 'biweekly' | 'custom';
        };
        Insert: Omit<Database['public']['Tables']['land_details']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['land_details']['Insert']>;
      };
      land_payments: {
        Row: {
          id: string;
          land_id: string;
          payment_date: string;
          amount: number;
          payment_type: 'initial' | 'installment' | 'expense';
          description: string | null;
        };
        Insert: Omit<Database['public']['Tables']['land_payments']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['land_payments']['Insert']>;
      };
    };
  };
}
