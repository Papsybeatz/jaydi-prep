export type TrainingRow = {
  id: string;
  user_id: string | null;
  resume: string;
  jobDescription: string;
  lectureText: string;
  audioPath: string;
  createdAt: string;
};

export type PurchaseRow = {
  id: string;
  user_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  amount_total: number;
  currency: string;
  credits_granted: number;
  credits_remaining: number;
  status: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      trainings: {
        Row: TrainingRow;
        Insert: Omit<TrainingRow, "id" | "createdAt"> & {
          id?: string;
          createdAt?: string;
        };
        Update: Partial<Omit<TrainingRow, "id">>;
        Relationships: [];
      };
      purchases: {
        Row: PurchaseRow;
        Insert: Omit<PurchaseRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PurchaseRow, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_audio_credit: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      refund_audio_credit: {
        Args: { p_purchase_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
