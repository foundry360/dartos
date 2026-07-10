export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      board_themes: {
        Row: {
          id: string;
          name: string;
          description: string;
          colors: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          colors: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          colors?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_customers: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_customers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          nickname: string | null;
          preferred_board_theme_id: string | null;
          avatar_url: string | null;
          throwing_hand: string | null;
          skill_level: string | null;
          preferred_game: string | null;
          home_league: string | null;
          favorite_double: string | null;
          favorite_practice: string | null;
          default_match: string | null;
          haptics_enabled: boolean;
          sound_enabled: boolean;
          voice_announcements_enabled: boolean;
          confirm_finish_turn: boolean;
          recent_guest_names: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          nickname?: string | null;
          preferred_board_theme_id?: string | null;
          avatar_url?: string | null;
          throwing_hand?: string | null;
          skill_level?: string | null;
          preferred_game?: string | null;
          home_league?: string | null;
          favorite_double?: string | null;
          favorite_practice?: string | null;
          default_match?: string | null;
          haptics_enabled?: boolean;
          sound_enabled?: boolean;
          voice_announcements_enabled?: boolean;
          confirm_finish_turn?: boolean;
          recent_guest_names?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          nickname?: string | null;
          preferred_board_theme_id?: string | null;
          avatar_url?: string | null;
          throwing_hand?: string | null;
          skill_level?: string | null;
          preferred_game?: string | null;
          home_league?: string | null;
          favorite_double?: string | null;
          favorite_practice?: string | null;
          default_match?: string | null;
          haptics_enabled?: boolean;
          sound_enabled?: boolean;
          voice_announcements_enabled?: boolean;
          confirm_finish_turn?: boolean;
          recent_guest_names?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_preferred_board_theme_id_fkey";
            columns: ["preferred_board_theme_id"];
            isOneToOne: false;
            referencedRelation: "board_themes";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          nickname: string | null;
          color: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          nickname?: string | null;
          color?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          nickname?: string | null;
          color?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          stripe_payment_method_id: string;
          stripe_customer_id: string;
          type: string;
          brand: string | null;
          last4: string | null;
          exp_month: number | null;
          exp_year: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_payment_method_id: string;
          stripe_customer_id: string;
          type?: string;
          brand?: string | null;
          last4?: string | null;
          exp_month?: number | null;
          exp_year?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_payment_method_id?: string;
          stripe_customer_id?: string;
          type?: string;
          brand?: string | null;
          last4?: string | null;
          exp_month?: number | null;
          exp_year?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_session_history: {
        Row: {
          id: string;
          owner_id: string;
          drill_id: string;
          drill_title: string;
          config: Json;
          started_at: string;
          completed_at: string;
          darts_thrown: number;
          successes: number | null;
          attempts: number | null;
          duration_seconds: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          drill_id: string;
          drill_title: string;
          config?: Json;
          started_at: string;
          completed_at?: string;
          darts_thrown?: number;
          successes?: number | null;
          attempts?: number | null;
          duration_seconds?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          drill_id?: string;
          drill_title?: string;
          config?: Json;
          started_at?: string;
          completed_at?: string;
          darts_thrown?: number;
          successes?: number | null;
          attempts?: number | null;
          duration_seconds?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_session_history_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          stripe_invoice_id: string;
          stripe_customer_id: string;
          number: string | null;
          status: string;
          amount_due_cents: number;
          amount_paid_cents: number;
          currency: string;
          description: string | null;
          hosted_invoice_url: string | null;
          invoice_pdf_url: string | null;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_invoice_id: string;
          stripe_customer_id: string;
          number?: string | null;
          status: string;
          amount_due_cents?: number;
          amount_paid_cents?: number;
          currency?: string;
          description?: string | null;
          hosted_invoice_url?: string | null;
          invoice_pdf_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_invoice_id?: string;
          stripe_customer_id?: string;
          number?: string | null;
          status?: string;
          amount_due_cents?: number;
          amount_paid_cents?: number;
          currency?: string;
          description?: string | null;
          hosted_invoice_url?: string | null;
          invoice_pdf_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      player_stats: {
        Row: {
          user_id: string;
          darts_thrown: number;
          total_score: number;
          visits: number;
          highest_visit: number;
          visits100_plus: number;
          visits140_plus: number;
          visits_180_plus: number;
          highest_checkout: number;
          first_nine_score: number;
          first_nine_visits: number;
          singles_hit: number;
          doubles_hit: number;
          triples_hit: number;
          bull_hit: number;
          checkout_attempts: number;
          checkout_successes: number;
          matches_played: number;
          matches_won: number;
          legs_played: number;
          legs_won: number;
          breaks_of_throw: number;
          recent_visit_scores: unknown;
          recent_leg_results: unknown;
          recent_checkout_results: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          darts_thrown?: number;
          total_score?: number;
          visits?: number;
          highest_visit?: number;
          visits100_plus?: number;
          visits140_plus?: number;
          visits_180_plus?: number;
          highest_checkout?: number;
          first_nine_score?: number;
          first_nine_visits?: number;
          singles_hit?: number;
          doubles_hit?: number;
          triples_hit?: number;
          bull_hit?: number;
          checkout_attempts?: number;
          checkout_successes?: number;
          matches_played?: number;
          matches_won?: number;
          legs_played?: number;
          legs_won?: number;
          breaks_of_throw?: number;
          recent_visit_scores?: unknown;
          recent_leg_results?: unknown;
          recent_checkout_results?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          darts_thrown?: number;
          total_score?: number;
          visits?: number;
          highest_visit?: number;
          visits100_plus?: number;
          visits140_plus?: number;
          visits_180_plus?: number;
          highest_checkout?: number;
          first_nine_score?: number;
          first_nine_visits?: number;
          singles_hit?: number;
          doubles_hit?: number;
          triples_hit?: number;
          bull_hit?: number;
          checkout_attempts?: number;
          checkout_successes?: number;
          matches_played?: number;
          matches_won?: number;
          legs_played?: number;
          legs_won?: number;
          breaks_of_throw?: number;
          recent_visit_scores?: unknown;
          recent_leg_results?: unknown;
          recent_checkout_results?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_stats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_player_stats: {
        Row: {
          player_id: string;
          darts_thrown: number;
          total_score: number;
          visits: number;
          highest_visit: number;
          visits100_plus: number;
          visits140_plus: number;
          first_nine_score: number;
          first_nine_visits: number;
          singles_hit: number;
          doubles_hit: number;
          triples_hit: number;
          bull_hit: number;
          checkout_attempts: number;
          checkout_successes: number;
          matches_played: number;
          matches_won: number;
          legs_played: number;
          legs_won: number;
          breaks_of_throw: number;
          recent_visit_scores: unknown;
          recent_leg_results: unknown;
          recent_checkout_results: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          darts_thrown?: number;
          total_score?: number;
          visits?: number;
          highest_visit?: number;
          visits100_plus?: number;
          visits140_plus?: number;
          first_nine_score?: number;
          first_nine_visits?: number;
          singles_hit?: number;
          doubles_hit?: number;
          triples_hit?: number;
          bull_hit?: number;
          checkout_attempts?: number;
          checkout_successes?: number;
          matches_played?: number;
          matches_won?: number;
          legs_played?: number;
          legs_won?: number;
          breaks_of_throw?: number;
          recent_visit_scores?: unknown;
          recent_leg_results?: unknown;
          recent_checkout_results?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          player_id?: string;
          darts_thrown?: number;
          total_score?: number;
          visits?: number;
          highest_visit?: number;
          visits100_plus?: number;
          visits140_plus?: number;
          first_nine_score?: number;
          first_nine_visits?: number;
          singles_hit?: number;
          doubles_hit?: number;
          triples_hit?: number;
          bull_hit?: number;
          checkout_attempts?: number;
          checkout_successes?: number;
          matches_played?: number;
          matches_won?: number;
          legs_played?: number;
          legs_won?: number;
          breaks_of_throw?: number;
          recent_visit_scores?: unknown;
          recent_leg_results?: unknown;
          recent_checkout_results?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: true;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      player_active_matches: {
        Row: {
          id: string;
          owner_id: string;
          game_mode: "x01" | "cricket";
          resume_href: string;
          match_type: string;
          opponent_id: string | null;
          opponent_name: string;
          progress: string;
          game_state: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          game_mode: "x01" | "cricket";
          resume_href: string;
          match_type: string;
          opponent_id?: string | null;
          opponent_name: string;
          progress?: string;
          game_state: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          game_mode?: "x01" | "cricket";
          resume_href?: string;
          match_type?: string;
          opponent_id?: string | null;
          opponent_name?: string;
          progress?: string;
          game_state?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_active_matches_opponent_id_fkey";
            columns: ["opponent_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_active_matches_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      player_match_history: {
        Row: {
          id: string;
          owner_id: string;
          opponent_id: string | null;
          opponent_name: string;
          user_won: boolean;
          match_type: string;
          user_legs: number;
          opponent_legs: number;
          played_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          opponent_id?: string | null;
          opponent_name: string;
          user_won: boolean;
          match_type: string;
          user_legs?: number;
          opponent_legs?: number;
          played_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          opponent_id?: string | null;
          opponent_name?: string;
          user_won?: boolean;
          match_type?: string;
          user_legs?: number;
          opponent_legs?: number;
          played_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_match_history_opponent_id_fkey";
            columns: ["opponent_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_match_history_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      player_head_to_head: {
        Row: {
          owner_id: string;
          opponent_id: string;
          user_wins: number;
          opponent_wins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          opponent_id: string;
          user_wins?: number;
          opponent_wins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          opponent_id?: string;
          user_wins?: number;
          opponent_wins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_head_to_head_opponent_id_fkey";
            columns: ["opponent_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_head_to_head_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          owner_id: string;
          game_type: string;
          status: string;
          payload: Json;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          game_type: string;
          status?: string;
          payload?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          game_type?: string;
          status?: string;
          payload?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_board_theme: {
        Args: {
          theme_id: string;
          theme_name: string;
          theme_description: string;
          theme_colors: Json;
          theme_sort_order?: number;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type BoardThemeRow = Database["public"]["Tables"]["board_themes"]["Row"];
