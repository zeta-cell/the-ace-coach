export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      coach_availability_slots: {
        Row: {
          coach_id: string
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_blocked: boolean | null
          is_recurring: boolean | null
          specific_date: string | null
          start_time: string
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_blocked?: boolean | null
          is_recurring?: boolean | null
          specific_date?: string | null
          start_time: string
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_blocked?: boolean | null
          is_recurring?: boolean | null
          specific_date?: string | null
          start_time?: string
        }
        Relationships: []
      }
      coach_packages: {
        Row: {
          coach_id: string
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          max_group_size: number | null
          price_per_session: number
          session_type: Database["public"]["Enums"]["session_type"]
          sport: Database["public"]["Enums"]["sport_type"]
          title: string
          total_sessions: number | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_group_size?: number | null
          price_per_session?: number
          session_type?: Database["public"]["Enums"]["session_type"]
          sport?: Database["public"]["Enums"]["sport_type"]
          title: string
          total_sessions?: number | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_group_size?: number | null
          price_per_session?: number
          session_type?: Database["public"]["Enums"]["session_type"]
          sport?: Database["public"]["Enums"]["sport_type"]
          title?: string
          total_sessions?: number | null
        }
        Relationships: []
      }
      coach_player_assignments: {
        Row: {
          assigned_at: string
          coach_id: string
          id: string
          player_id: string
        }
        Insert: {
          assigned_at?: string
          coach_id: string
          id?: string
          player_id: string
        }
        Update: {
          assigned_at?: string
          coach_id?: string
          id?: string
          player_id?: string
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          backhand_pct: number | null
          badge_level: Database["public"]["Enums"]["badge_level"]
          best_shot: string | null
          bio: string | null
          certifications: string[] | null
          coaching_style: string | null
          created_at: string
          dominant_hand: Database["public"]["Enums"]["dominant_hand"] | null
          forehand_pct: number | null
          hourly_rate_from: number | null
          id: string
          is_verified: boolean
          languages: string[] | null
          lob_pct: number | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          nationality: string | null
          phone: string | null
          playtomic_level: number | null
          playtomic_url: string | null
          preferred_side: string | null
          profile_slug: string | null
          racket_brand: string | null
          racket_model: string | null
          racket_type: Database["public"]["Enums"]["racket_type"] | null
          response_time_hours: number
          serve_pct: number | null
          smash_pct: number | null
          specializations: string[] | null
          total_sessions_coached: number
          updated_at: string
          user_id: string
          volley_pct: number | null
          weakest_shot: string | null
          years_experience: number | null
        }
        Insert: {
          backhand_pct?: number | null
          badge_level?: Database["public"]["Enums"]["badge_level"]
          best_shot?: string | null
          bio?: string | null
          certifications?: string[] | null
          coaching_style?: string | null
          created_at?: string
          dominant_hand?: Database["public"]["Enums"]["dominant_hand"] | null
          forehand_pct?: number | null
          hourly_rate_from?: number | null
          id?: string
          is_verified?: boolean
          languages?: string[] | null
          lob_pct?: number | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          nationality?: string | null
          phone?: string | null
          playtomic_level?: number | null
          playtomic_url?: string | null
          preferred_side?: string | null
          profile_slug?: string | null
          racket_brand?: string | null
          racket_model?: string | null
          racket_type?: Database["public"]["Enums"]["racket_type"] | null
          response_time_hours?: number
          serve_pct?: number | null
          smash_pct?: number | null
          specializations?: string[] | null
          total_sessions_coached?: number
          updated_at?: string
          user_id: string
          volley_pct?: number | null
          weakest_shot?: string | null
          years_experience?: number | null
        }
        Update: {
          backhand_pct?: number | null
          badge_level?: Database["public"]["Enums"]["badge_level"]
          best_shot?: string | null
          bio?: string | null
          certifications?: string[] | null
          coaching_style?: string | null
          created_at?: string
          dominant_hand?: Database["public"]["Enums"]["dominant_hand"] | null
          forehand_pct?: number | null
          hourly_rate_from?: number | null
          id?: string
          is_verified?: boolean
          languages?: string[] | null
          lob_pct?: number | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          nationality?: string | null
          phone?: string | null
          playtomic_level?: number | null
          playtomic_url?: string | null
          preferred_side?: string | null
          profile_slug?: string | null
          racket_brand?: string | null
          racket_model?: string | null
          racket_type?: Database["public"]["Enums"]["racket_type"] | null
          response_time_hours?: number
          serve_pct?: number | null
          smash_pct?: number | null
          specializations?: string[] | null
          total_sessions_coached?: number
          updated_at?: string
          user_id?: string
          volley_pct?: number | null
          weakest_shot?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      module_exercises: {
        Row: {
          duration_sec: number | null
          id: string
          module_id: string
          name: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_sec: number | null
          sets: number | null
        }
        Insert: {
          duration_sec?: number | null
          id?: string
          module_id: string
          name: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_sec?: number | null
          sets?: number | null
        }
        Update: {
          duration_sec?: number | null
          id?: string
          module_id?: string
          name?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_sec?: number | null
          sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "module_exercises_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: Database["public"]["Enums"]["module_category"]
          created_at: string
          created_by: string
          description: string | null
          difficulty: Database["public"]["Enums"]["module_difficulty"] | null
          duration_minutes: number | null
          equipment: string[] | null
          id: string
          instructions: string | null
          is_shared: boolean | null
          tags: string[] | null
          title: string
          video_url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["module_category"]
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["module_difficulty"] | null
          duration_minutes?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          is_shared?: boolean | null
          tags?: string[] | null
          title: string
          video_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["module_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["module_difficulty"] | null
          duration_minutes?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          is_shared?: boolean | null
          tags?: string[] | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          user_id?: string
        }
        Relationships: []
      }
      player_day_plan_items: {
        Row: {
          coach_note: string | null
          completed_at: string | null
          id: string
          is_completed: boolean | null
          module_id: string
          order_index: number
          plan_id: string
        }
        Insert: {
          coach_note?: string | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id: string
          order_index?: number
          plan_id: string
        }
        Update: {
          coach_note?: string | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string
          order_index?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_day_plan_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_day_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "player_day_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      player_day_plans: {
        Row: {
          coach_id: string
          created_at: string
          end_time: string | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          notes: string | null
          plan_date: string
          player_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          plan_date: string
          player_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          plan_date?: string
          player_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      player_profiles: {
        Row: {
          apple_health_connected: boolean
          backhand_pct: number | null
          best_shot: string | null
          club_location: string | null
          club_name: string | null
          created_at: string
          current_usta_ntrp: number | null
          date_of_birth: string | null
          dominant_hand: Database["public"]["Enums"]["dominant_hand"] | null
          favourite_players: string[] | null
          fitness_level: Database["public"]["Enums"]["fitness_level"] | null
          forehand_pct: number | null
          goals: string[] | null
          id: string
          injuries: string | null
          left_tendency_pct: number | null
          lob_pct: number | null
          nationality: string | null
          plays_since_year: number | null
          playtomic_level: number | null
          playtomic_url: string | null
          preferred_court_surface: string | null
          preferred_sport: Database["public"]["Enums"]["preferred_sport"] | null
          right_tendency_pct: number | null
          serve_pct: number | null
          shirt_size: string | null
          shot_data_source:
            | Database["public"]["Enums"]["shot_data_source"]
            | null
          smash_pct: number | null
          target_ranking: string | null
          training_freq:
            | Database["public"]["Enums"]["training_frequency"]
            | null
          updated_at: string
          user_id: string
          volley_pct: number | null
          weakest_shot: string | null
          years_playing: number | null
        }
        Insert: {
          apple_health_connected?: boolean
          backhand_pct?: number | null
          best_shot?: string | null
          club_location?: string | null
          club_name?: string | null
          created_at?: string
          current_usta_ntrp?: number | null
          date_of_birth?: string | null
          dominant_hand?: Database["public"]["Enums"]["dominant_hand"] | null
          favourite_players?: string[] | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          forehand_pct?: number | null
          goals?: string[] | null
          id?: string
          injuries?: string | null
          left_tendency_pct?: number | null
          lob_pct?: number | null
          nationality?: string | null
          plays_since_year?: number | null
          playtomic_level?: number | null
          playtomic_url?: string | null
          preferred_court_surface?: string | null
          preferred_sport?:
            | Database["public"]["Enums"]["preferred_sport"]
            | null
          right_tendency_pct?: number | null
          serve_pct?: number | null
          shirt_size?: string | null
          shot_data_source?:
            | Database["public"]["Enums"]["shot_data_source"]
            | null
          smash_pct?: number | null
          target_ranking?: string | null
          training_freq?:
            | Database["public"]["Enums"]["training_frequency"]
            | null
          updated_at?: string
          user_id: string
          volley_pct?: number | null
          weakest_shot?: string | null
          years_playing?: number | null
        }
        Update: {
          apple_health_connected?: boolean
          backhand_pct?: number | null
          best_shot?: string | null
          club_location?: string | null
          club_name?: string | null
          created_at?: string
          current_usta_ntrp?: number | null
          date_of_birth?: string | null
          dominant_hand?: Database["public"]["Enums"]["dominant_hand"] | null
          favourite_players?: string[] | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          forehand_pct?: number | null
          goals?: string[] | null
          id?: string
          injuries?: string | null
          left_tendency_pct?: number | null
          lob_pct?: number | null
          nationality?: string | null
          plays_since_year?: number | null
          playtomic_level?: number | null
          playtomic_url?: string | null
          preferred_court_surface?: string | null
          preferred_sport?:
            | Database["public"]["Enums"]["preferred_sport"]
            | null
          right_tendency_pct?: number | null
          serve_pct?: number | null
          shirt_size?: string | null
          shot_data_source?:
            | Database["public"]["Enums"]["shot_data_source"]
            | null
          smash_pct?: number | null
          target_ranking?: string | null
          training_freq?:
            | Database["public"]["Enums"]["training_frequency"]
            | null
          updated_at?: string
          user_id?: string
          volley_pct?: number | null
          weakest_shot?: string | null
          years_playing?: number | null
        }
        Relationships: []
      }
      player_rackets: {
        Row: {
          brand: string
          created_at: string
          grip_size: string | null
          id: string
          is_favorite: boolean | null
          model: string
          player_id: string
          string_brand: string | null
          string_tension: string | null
          type: Database["public"]["Enums"]["racket_type"] | null
        }
        Insert: {
          brand?: string
          created_at?: string
          grip_size?: string | null
          id?: string
          is_favorite?: boolean | null
          model?: string
          player_id: string
          string_brand?: string | null
          string_tension?: string | null
          type?: Database["public"]["Enums"]["racket_type"] | null
        }
        Update: {
          brand?: string
          created_at?: string
          grip_size?: string | null
          id?: string
          is_favorite?: boolean | null
          model?: string
          player_id?: string
          string_brand?: string | null
          string_tension?: string | null
          type?: Database["public"]["Enums"]["racket_type"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          notification_preferences: Json | null
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_videos: {
        Row: {
          coach_feedback: string | null
          coach_id: string | null
          created_at: string
          description: string | null
          id: string
          player_id: string
          shot_tag: string | null
          title: string
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          coach_feedback?: string | null
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          player_id: string
          shot_tag?: string | null
          title: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          coach_feedback?: string | null
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          player_id?: string
          shot_tag?: string | null
          title?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          player_id: string
          rating: number
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          player_id: string
          rating: number
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          player_id?: string
          rating?: number
        }
        Relationships: []
      }
      training_blocks: {
        Row: {
          category: string
          coach_id: string | null
          created_at: string | null
          description: string | null
          goal: string
          id: string
          is_system: boolean | null
          module_durations: number[]
          module_ids: string[]
          module_notes: string[]
          title: string
        }
        Insert: {
          category?: string
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          goal: string
          id?: string
          is_system?: boolean | null
          module_durations?: number[]
          module_ids?: string[]
          module_notes?: string[]
          title: string
        }
        Update: {
          category?: string
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          goal?: string
          id?: string
          is_system?: boolean | null
          module_durations?: number[]
          module_ids?: string[]
          module_notes?: string[]
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_stats: { Args: never; Returns: Json }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "player" | "coach" | "admin"
      badge_level: "starter" | "pro" | "elite" | "legend"
      dominant_hand: "left" | "right"
      fitness_level: "beginner" | "intermediate" | "advanced" | "elite"
      module_category:
        | "warm_up"
        | "padel_drill"
        | "footwork"
        | "fitness"
        | "strength"
        | "mental"
        | "recovery"
        | "cool_down"
        | "nutrition"
        | "video"
      module_difficulty: "beginner" | "intermediate" | "advanced" | "elite"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      payment_type: "camp" | "monthly" | "annual" | "session" | "other"
      preferred_sport: "tennis" | "padel" | "both"
      racket_type: "power" | "control" | "mixed"
      session_type: "individual" | "group" | "kids" | "online"
      shot_data_source: "player" | "coach"
      sport_type: "tennis" | "padel" | "both"
      training_frequency: "daily" | "3-4x_week" | "1-2x_week" | "occasional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["player", "coach", "admin"],
      badge_level: ["starter", "pro", "elite", "legend"],
      dominant_hand: ["left", "right"],
      fitness_level: ["beginner", "intermediate", "advanced", "elite"],
      module_category: [
        "warm_up",
        "padel_drill",
        "footwork",
        "fitness",
        "strength",
        "mental",
        "recovery",
        "cool_down",
        "nutrition",
        "video",
      ],
      module_difficulty: ["beginner", "intermediate", "advanced", "elite"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      payment_type: ["camp", "monthly", "annual", "session", "other"],
      preferred_sport: ["tennis", "padel", "both"],
      racket_type: ["power", "control", "mixed"],
      session_type: ["individual", "group", "kids", "online"],
      shot_data_source: ["player", "coach"],
      sport_type: ["tennis", "padel", "both"],
      training_frequency: ["daily", "3-4x_week", "1-2x_week", "occasional"],
    },
  },
} as const
