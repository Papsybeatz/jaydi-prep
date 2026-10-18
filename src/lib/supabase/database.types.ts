export type TrainingRow = {
  id: string;
  user_id: string | null;
  resume: string;
  jobDescription: string;
  lectureText: string;
  audioUrl: string;
  createdAt: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
