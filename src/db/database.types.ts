export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      preferences: {
        Row: {
          allergies: string | null;
          created_at: string;
          daily_calorie_requirement: number | null;
          diet_type: string | null;
          excluded_ingredients: string | null;
          food_intolerances: string | null;
          id: number;
          macro_distribution_carbohydrates: number | null;
          macro_distribution_fats: number | null;
          macro_distribution_protein: number | null;
          preferred_cuisines: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          allergies?: string | null;
          created_at?: string;
          daily_calorie_requirement?: number | null;
          diet_type?: string | null;
          excluded_ingredients?: string | null;
          food_intolerances?: string | null;
          id?: never;
          macro_distribution_carbohydrates?: number | null;
          macro_distribution_fats?: number | null;
          macro_distribution_protein?: number | null;
          preferred_cuisines?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          allergies?: string | null;
          created_at?: string;
          daily_calorie_requirement?: number | null;
          diet_type?: string | null;
          excluded_ingredients?: string | null;
          food_intolerances?: string | null;
          id?: never;
          macro_distribution_carbohydrates?: number | null;
          macro_distribution_fats?: number | null;
          macro_distribution_protein?: number | null;
          preferred_cuisines?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      recipe_modification_errors: {
        Row: {
          ai_model: string;
          error_code: number | null;
          error_description: string | null;
          id: number;
          recipe_text: string;
          timestamp: string;
        };
        Insert: {
          ai_model: string;
          error_code?: number | null;
          error_description?: string | null;
          id?: never;
          recipe_text: string;
          timestamp?: string;
        };
        Update: {
          ai_model?: string;
          error_code?: number | null;
          error_description?: string | null;
          id?: never;
          recipe_text?: string;
          timestamp?: string;
        };
        Relationships: [];
      };
      recipe_modifications: {
        Row: {
          ai_model: string;
          id: number;
          modified_recipe: Json;
          original_recipe: Json;
          recipe_id: number;
          timestamp: string;
          user_id: string;
        };
        Insert: {
          ai_model: string;
          id?: never;
          modified_recipe: Json;
          original_recipe: Json;
          recipe_id: number;
          timestamp?: string;
          user_id: string;
        };
        Update: {
          ai_model?: string;
          id?: never;
          modified_recipe?: Json;
          original_recipe?: Json;
          recipe_id?: number;
          timestamp?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_modifications_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_statistics: {
        Row: {
          last_updated: string;
          modification_count: number;
          recipe_id: number;
          search_count: number;
        };
        Insert: {
          last_updated?: string;
          modification_count?: number;
          recipe_id: number;
          search_count?: number;
        };
        Update: {
          last_updated?: string;
          modification_count?: number;
          recipe_id?: number;
          search_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_statistics_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: true;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          id: number;
          name: string;
          rating: number | null;
          recipe: Json;
          source: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          name: string;
          rating?: number | null;
          recipe: Json;
          source: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          name?: string;
          rating?: number | null;
          recipe?: Json;
          source?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
