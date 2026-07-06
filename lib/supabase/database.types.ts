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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_board_theme_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_board_theme_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          preferred_board_theme_id?: string | null;
          avatar_url?: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          nickname?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          nickname?: string | null;
          color?: string | null;
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
      player_stats: {
        Row: {
          user_id: string;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type BoardThemeRow = Database["public"]["Tables"]["board_themes"]["Row"];
