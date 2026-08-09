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
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          cta_label: string | null;
          cta_href: string | null;
          audience: string;
          severity: string;
          active: boolean;
          is_signup_default: boolean;
          slug: string | null;
          recipient_user_id: string | null;
          published_at: string;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          cta_label?: string | null;
          cta_href?: string | null;
          audience?: string;
          severity?: string;
          active?: boolean;
          is_signup_default?: boolean;
          slug?: string | null;
          recipient_user_id?: string | null;
          published_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          cta_label?: string | null;
          cta_href?: string | null;
          audience?: string;
          severity?: string;
          active?: boolean;
          is_signup_default?: boolean;
          slug?: string | null;
          recipient_user_id?: string | null;
          published_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcement_reads: {
        Row: {
          announcement_id: string;
          user_id: string;
          read_at: string;
          dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          announcement_id: string;
          user_id: string;
          read_at?: string;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Update: {
          announcement_id?: string;
          user_id?: string;
          read_at?: string;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          country_code: string | null;
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
          notifications_enabled: boolean;
          confirm_finish_turn: boolean;
          league_checkout_suggestions_enabled: boolean;
          recent_guest_names: Json;
          account_kind: "player" | "member";
          deactivated_at: string | null;
          trial_offer_email_id: string | null;
          trial_offer_email_scheduled_at: string | null;
          trial_offer_email_opt_out: boolean;
          checkout_reminder_email_id: string | null;
          checkout_reminder_email_scheduled_at: string | null;
          checkout_reminder_email_opt_out: boolean;
          welcome_email_id: string | null;
          welcome_email_sent_at: string | null;
          community_invite_email_id: string | null;
          community_invite_email_scheduled_at: string | null;
          trial_ending_email_id: string | null;
          trial_ending_email_scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          nickname?: string | null;
          preferred_board_theme_id?: string | null;
          avatar_url?: string | null;
          country_code?: string | null;
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
          notifications_enabled?: boolean;
          confirm_finish_turn?: boolean;
          league_checkout_suggestions_enabled?: boolean;
          recent_guest_names?: Json;
          account_kind?: "player" | "member";
          deactivated_at?: string | null;
          trial_offer_email_id?: string | null;
          trial_offer_email_scheduled_at?: string | null;
          trial_offer_email_opt_out?: boolean;
          checkout_reminder_email_id?: string | null;
          checkout_reminder_email_scheduled_at?: string | null;
          checkout_reminder_email_opt_out?: boolean;
          welcome_email_id?: string | null;
          welcome_email_sent_at?: string | null;
          community_invite_email_id?: string | null;
          community_invite_email_scheduled_at?: string | null;
          trial_ending_email_id?: string | null;
          trial_ending_email_scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          nickname?: string | null;
          preferred_board_theme_id?: string | null;
          avatar_url?: string | null;
          country_code?: string | null;
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
          notifications_enabled?: boolean;
          confirm_finish_turn?: boolean;
          league_checkout_suggestions_enabled?: boolean;
          recent_guest_names?: Json;
          account_kind?: "player" | "member";
          deactivated_at?: string | null;
          trial_offer_email_id?: string | null;
          trial_offer_email_scheduled_at?: string | null;
          trial_offer_email_opt_out?: boolean;
          checkout_reminder_email_id?: string | null;
          checkout_reminder_email_scheduled_at?: string | null;
          checkout_reminder_email_opt_out?: boolean;
          welcome_email_id?: string | null;
          welcome_email_sent_at?: string | null;
          community_invite_email_id?: string | null;
          community_invite_email_scheduled_at?: string | null;
          trial_ending_email_id?: string | null;
          trial_ending_email_scheduled_at?: string | null;
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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          primary_contact_name: string | null;
          primary_contact_email: string | null;
          primary_contact_phone: string | null;
          board_count: number;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          primary_contact_phone?: string | null;
          board_count?: number;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          primary_contact_phone?: string | null;
          board_count?: number;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      seasons: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seasons_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seasons_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      leagues: {
        Row: {
          id: string;
          organization_id: string;
          season_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          format: string | null;
          competition_format: string | null;
          game_format: string | null;
          rules: Json | null;
          max_players: number | null;
          starts_at: string | null;
          ends_at: string | null;
          published_at: string | null;
          join_code: string | null;
          registration_mode: "invite_only" | "code" | "open";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          season_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          format?: string | null;
          competition_format?: string | null;
          game_format?: string | null;
          rules?: Json | null;
          max_players?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          published_at?: string | null;
          join_code?: string | null;
          registration_mode?: "invite_only" | "code" | "open";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          season_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          format?: string | null;
          competition_format?: string | null;
          game_format?: string | null;
          rules?: Json | null;
          max_players?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          published_at?: string | null;
          join_code?: string | null;
          registration_mode?: "invite_only" | "code" | "open";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leagues_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leagues_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      league_schedules: {
        Row: {
          id: string;
          league_id: string;
          status: string;
          frequency: string;
          match_weekday: number | null;
          match_time: string | null;
          weeks: number;
          matches_per_night: number | null;
          pattern: string;
          published_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          status?: string;
          frequency?: string;
          match_weekday?: number | null;
          match_time?: string | null;
          weeks?: number;
          matches_per_night?: number | null;
          pattern?: string;
          published_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          status?: string;
          frequency?: string;
          match_weekday?: number | null;
          match_time?: string | null;
          weeks?: number;
          matches_per_night?: number | null;
          pattern?: string;
          published_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_schedules_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: true;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_schedules_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      league_matches: {
        Row: {
          id: string;
          league_id: string;
          schedule_id: string;
          week_number: number;
          scheduled_at: string;
          home_team_id: string | null;
          away_team_id: string | null;
          home_player_id: string | null;
          away_player_id: string | null;
          home_label: string;
          away_label: string;
          status: string;
          sort_order: number;
          board_format: string | null;
          board_slot: number | null;
          lineup_round: number | null;
          winner_side: string | null;
          home_score: number;
          away_score: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          schedule_id: string;
          week_number: number;
          scheduled_at: string;
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_player_id?: string | null;
          away_player_id?: string | null;
          home_label: string;
          away_label: string;
          status?: string;
          sort_order?: number;
          board_format?: string | null;
          board_slot?: number | null;
          lineup_round?: number | null;
          winner_side?: string | null;
          home_score?: number;
          away_score?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          schedule_id?: string;
          week_number?: number;
          scheduled_at?: string;
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_player_id?: string | null;
          away_player_id?: string | null;
          home_label?: string;
          away_label?: string;
          status?: string;
          sort_order?: number;
          board_format?: string | null;
          board_slot?: number | null;
          lineup_round?: number | null;
          winner_side?: string | null;
          home_score?: number;
          away_score?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_matches_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_matches_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "league_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      league_teams: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          color: string;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          color?: string;
          status?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          color?: string;
          status?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_teams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      league_player_invites: {
        Row: {
          id: string;
          league_id: string;
          league_player_id: string | null;
          email: string | null;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          league_player_id?: string | null;
          email?: string | null;
          token: string;
          invited_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          league_player_id?: string | null;
          email?: string | null;
          token?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      league_players: {
        Row: {
          id: string;
          league_id: string;
          first_name: string;
          last_name: string;
          nickname: string | null;
          email: string | null;
          phone: string | null;
          color: string;
          avatar_url: string | null;
          team_id: string | null;
          team_name: string | null;
          status: string;
          vector_account: string;
          saved_player_id: string | null;
          profile_user_id: string | null;
          approval_email_sent_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          first_name: string;
          last_name?: string;
          nickname?: string | null;
          email?: string | null;
          phone?: string | null;
          color?: string;
          avatar_url?: string | null;
          team_id?: string | null;
          team_name?: string | null;
          status?: string;
          vector_account?: string;
          saved_player_id?: string | null;
          profile_user_id?: string | null;
          approval_email_sent_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          first_name?: string;
          last_name?: string;
          nickname?: string | null;
          email?: string | null;
          phone?: string | null;
          color?: string;
          avatar_url?: string | null;
          team_id?: string | null;
          team_name?: string | null;
          status?: string;
          vector_account?: string;
          saved_player_id?: string | null;
          approval_email_sent_at?: string | null;
          profile_user_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_players_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "league_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_players_saved_player_id_fkey";
            columns: ["saved_player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_players_profile_user_id_fkey";
            columns: ["profile_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_players_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
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
          is_active: boolean;
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
          is_active?: boolean;
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
          is_active?: boolean;
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
      support_requests: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          account_type: string;
          subject: string;
          message: string;
          user_email: string;
          alternative_email: string | null;
          image_path: string | null;
          image_filename: string | null;
          resend_email_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          account_type: string;
          subject: string;
          message: string;
          user_email: string;
          alternative_email?: string | null;
          image_path?: string | null;
          image_filename?: string | null;
          resend_email_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          account_type?: string;
          subject?: string;
          message?: string;
          user_email?: string;
          alternative_email?: string | null;
          image_path?: string | null;
          image_filename?: string | null;
          resend_email_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_name: string;
          status: string;
          amount_cents: number;
          currency: string;
          interval: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_name: string;
          status: string;
          amount_cents?: number;
          currency?: string;
          interval?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          stripe_price_id?: string;
          plan_name?: string;
          status?: string;
          amount_cents?: number;
          currency?: string;
          interval?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
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
      community_rooms: {
        Row: {
          id: string;
          code: string;
          host_id: string;
          status: "lobby" | "playing" | "ended";
          game_type: string | null;
          rules: Json;
          created_at: string;
          updated_at: string;
          expires_at: string;
          matched_at: string | null;
          closing_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          host_id: string;
          status?: "lobby" | "playing" | "ended";
          game_type?: string | null;
          rules?: Json;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
          matched_at?: string | null;
          closing_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          host_id?: string;
          status?: "lobby" | "playing" | "ended";
          game_type?: string | null;
          rules?: Json;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
          matched_at?: string | null;
          closing_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_rooms_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      community_match_states: {
        Row: {
          room_id: string;
          game_mode: "x01" | "cricket";
          revision: number;
          state: Json;
          current_user_id: string | null;
          updated_by: string | null;
          updated_at: string;
          issue_raised_by: string | null;
          issue_raised_at: string | null;
        };
        Insert: {
          room_id: string;
          game_mode: "x01" | "cricket";
          revision?: number;
          state?: Json;
          current_user_id?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          issue_raised_by?: string | null;
          issue_raised_at?: string | null;
        };
        Update: {
          room_id?: string;
          game_mode?: "x01" | "cricket";
          revision?: number;
          state?: Json;
          current_user_id?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          issue_raised_by?: string | null;
          issue_raised_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_match_states_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: true;
            referencedRelation: "community_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      community_room_members: {
        Row: {
          room_id: string;
          user_id: string;
          seat: number | null;
          role: "host" | "player" | "spectator";
          joined_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          seat?: number | null;
          role: "host" | "player" | "spectator";
          joined_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          seat?: number | null;
          role?: "host" | "player" | "spectator";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "community_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_room_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      community_room_join_requests: {
        Row: {
          id: string;
          room_id: string;
          requester_id: string;
          status: "pending" | "accepted" | "declined" | "cancelled";
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          requester_id: string;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          requester_id?: string;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_room_join_requests_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "community_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_room_join_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "declined" | "cancelled";
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey";
            columns: ["addressee_id"];
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
      create_organization: {
        Args: {
          org_name: string;
          org_description?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          org_board_count?: number;
          org_address?: string | null;
          org_city?: string | null;
          org_state?: string | null;
          org_zip?: string | null;
        };
        Returns: Database["public"]["Tables"]["organizations"]["Row"];
      };
      create_season: {
        Args: {
          org_id: string;
          season_name: string;
        };
        Returns: Database["public"]["Tables"]["seasons"]["Row"];
      };
      create_league: {
        Args: {
          org_id: string;
          league_name: string;
          season_id: string;
          league_format: string;
          league_starts_at: string;
          league_ends_at: string;
          league_description?: string | null;
          league_max_players?: number | null;
          league_competition_format?: string | null;
          league_game_format?: string | null;
        };
        Returns: Database["public"]["Tables"]["leagues"]["Row"];
      };
      notify_league_player_registered: {
        Args: {
          p_league_id: string;
          p_user_id: string;
          p_title: string;
          p_body: string;
          p_cta_label?: string | null;
          p_cta_href?: string | null;
        };
        Returns: string;
      };
      notify_community_room_invite: {
        Args: {
          p_room_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
      get_friendship_status: {
        Args: {
          p_user_id: string;
        };
        Returns: string;
      };
      request_friend: {
        Args: {
          p_user_id: string;
        };
        Returns: string;
      };
      respond_friend_request: {
        Args: {
          p_requester_id: string;
          p_accept: boolean;
        };
        Returns: string;
      };
      cancel_friend_request: {
        Args: {
          p_user_id: string;
        };
        Returns: string;
      };
      list_pending_friend_requests: {
        Args: Record<string, never>;
        Returns: {
          requester_id: string;
          display_name: string | null;
          nickname: string | null;
          avatar_url: string | null;
          country_code: string | null;
          created_at: string;
        }[];
      };
      list_friends: {
        Args: Record<string, never>;
        Returns: {
          friend_id: string;
          display_name: string | null;
          nickname: string | null;
          avatar_url: string | null;
          country_code: string | null;
          friends_since: string;
        }[];
      };
      search_vector_profiles: {
        Args: {
          search_query: string;
          result_limit?: number;
        };
        Returns: {
          id: string;
          display_name: string | null;
          nickname: string | null;
          avatar_url: string | null;
        }[];
      };
      create_community_room: {
        Args: {
          p_game_type: string;
          p_rules?: Json;
        };
        Returns: Database["public"]["Tables"]["community_rooms"]["Row"];
      };
      join_community_room: {
        Args: {
          join_code: string;
        };
        Returns: Database["public"]["Tables"]["community_rooms"]["Row"];
      };
      leave_community_room: {
        Args: {
          target_room_id: string;
        };
        Returns: undefined;
      };
      close_community_room_now: {
        Args: {
          target_room_id: string;
        };
        Returns: undefined;
      };
      start_community_room_match: {
        Args: {
          target_room_id: string;
        };
        Returns: Database["public"]["Tables"]["community_rooms"]["Row"];
      };
      get_community_match_state: {
        Args: {
          target_room_id: string;
        };
        Returns: Database["public"]["Tables"]["community_match_states"]["Row"];
      };
      seed_community_match_state: {
        Args: {
          target_room_id: string;
          p_game_mode: string;
          p_state: Json;
          p_current_user_id: string | null;
        };
        Returns: Database["public"]["Tables"]["community_match_states"]["Row"];
      };
      publish_community_match_state: {
        Args: {
          target_room_id: string;
          expected_revision: number;
          p_state: Json;
          p_current_user_id: string | null;
        };
        Returns: Database["public"]["Tables"]["community_match_states"]["Row"];
      };
      raise_community_match_issue: {
        Args: {
          target_room_id: string;
        };
        Returns: Database["public"]["Tables"]["community_match_states"]["Row"];
      };
      clear_community_match_issue: {
        Args: {
          target_room_id: string;
        };
        Returns: Database["public"]["Tables"]["community_match_states"]["Row"];
      };
      get_my_community_room: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["community_rooms"]["Row"][];
      };
      get_community_profile: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          id: string;
          display_name: string | null;
          nickname: string | null;
          avatar_url: string | null;
          country_code: string | null;
          throwing_hand: string | null;
          skill_level: string | null;
          preferred_game: string | null;
          home_league: string | null;
          member_since: string | null;
          three_dart_average: number | null;
          checkout_percent: number | null;
          highest_checkout: number | null;
          matches_won: number | null;
          matches_played: number | null;
        }[];
      };
      list_open_community_rooms: {
        Args: {
          result_limit?: number;
        };
        Returns: {
          room_id: string;
          room_code: string;
          host_id: string;
          created_at: string;
          game_type: string | null;
          rules: Json;
          host_display_name: string | null;
          host_nickname: string | null;
          host_avatar_url: string | null;
          host_country_code: string | null;
          host_three_dart_average: number | null;
          already_requested: boolean;
          has_pending_requests: boolean;
        }[];
      };
      join_community_room_by_id: {
        Args: {
          target_room_id: string;
        };
        Returns: Database["public"]["Tables"]["community_rooms"]["Row"];
      };
      request_community_room_join: {
        Args: {
          target_room_id: string;
        };
        Returns: Database["public"]["Tables"]["community_room_join_requests"]["Row"];
      };
      revoke_community_room_join: {
        Args: {
          target_room_id: string;
        };
        Returns: undefined;
      };
      respond_community_room_join: {
        Args: {
          target_request_id: string;
          accept_request: boolean;
        };
        Returns: Database["public"]["Tables"]["community_rooms"]["Row"];
      };
      list_community_room_join_requests: {
        Args: {
          target_room_id: string;
        };
        Returns: {
          request_id: string;
          room_id: string;
          requester_id: string;
          created_at: string;
          requester_display_name: string | null;
          requester_nickname: string | null;
          requester_avatar_url: string | null;
          requester_country_code: string | null;
          requester_three_dart_average: number | null;
        }[];
      };
      get_my_pending_community_join: {
        Args: Record<string, never>;
        Returns: {
          request_id: string;
          room_id: string;
          room_code: string;
          host_id: string;
          status: string;
        }[];
      };
      is_organization_member: {
        Args: {
          org_id: string;
        };
        Returns: boolean;
      };
      has_organization_role: {
        Args: {
          org_id: string;
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      user_has_elite_subscription: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      user_can_access_league_management: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      rotate_league_join_code: {
        Args: { p_league_id: string };
        Returns: string;
      };
      create_league_invite: {
        Args: { p_league_player_id: string };
        Returns: {
          invite_id: string;
          token: string;
          expires_at: string;
          notified: boolean;
          recipient_user_id: string | null;
        }[];
      };
      deliver_pending_league_invites: {
        Args: Record<string, never>;
        Returns: number;
      };
      accept_league_invite: {
        Args: { p_token: string };
        Returns: string;
      };
      join_league_by_code: {
        Args: { p_code: string };
        Returns: string;
      };
      request_league_registration: {
        Args: { p_league_id: string };
        Returns: string;
      };
      approve_league_registration: {
        Args: { p_league_player_id: string };
        Returns: undefined;
      };
      search_joinable_leagues: {
        Args: {
          search_query?: string;
          result_limit?: number;
        };
        Returns: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          organization_id: string;
          organization_name: string;
          registration_mode: string;
          starts_at: string | null;
          ends_at: string | null;
          published_at: string | null;
          game_format: string | null;
          format: string | null;
          max_players: number | null;
          player_count: number;
          membership_status: string | null;
        }[];
      };
      update_league_registration_settings: {
        Args: {
          p_league_id: string;
          p_registration_mode: string;
          p_ensure_join_code?: boolean;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type BoardThemeRow = Database["public"]["Tables"]["board_themes"]["Row"];
export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type SeasonRow = Database["public"]["Tables"]["seasons"]["Row"];
export type LeagueRow = Database["public"]["Tables"]["leagues"]["Row"];
export type LeagueScheduleRow =
  Database["public"]["Tables"]["league_schedules"]["Row"];
export type LeagueMatchRow = Database["public"]["Tables"]["league_matches"]["Row"];
export type LeagueTeamRow = Database["public"]["Tables"]["league_teams"]["Row"];
export type LeaguePlayerRow = Database["public"]["Tables"]["league_players"]["Row"];
