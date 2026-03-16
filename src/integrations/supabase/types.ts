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
      block_purchases: {
        Row: {
          amount_paid: number
          block_id: string | null
          buyer_id: string
          currency: string | null
          current_week: number | null
          id: string
          platform_fee: number | null
          purchased_at: string | null
          seller_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_paid?: number
          block_id?: string | null
          buyer_id: string
          currency?: string | null
          current_week?: number | null
          id?: string
          platform_fee?: number | null
          purchased_at?: string | null
          seller_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_paid?: number
          block_id?: string | null
          buyer_id?: string
          currency?: string | null
          current_week?: number | null
          id?: string
          platform_fee?: number | null
          purchased_at?: string | null
          seller_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_purchases_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "training_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_ratings: {
        Row: {
          block_id: string | null
          id: string
          rated_at: string | null
          rated_by: string
          rating: number | null
          review_text: string | null
        }
        Insert: {
          block_id?: string | null
          id?: string
          rated_at?: string | null
          rated_by: string
          rating?: number | null
          review_text?: string | null
        }
        Update: {
          block_id?: string | null
          id?: string
          rated_at?: string | null
          rated_by?: string
          rating?: number | null
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_ratings_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "training_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_saves: {
        Row: {
          block_id: string | null
          id: string
          saved_at: string | null
          saved_by: string
        }
        Insert: {
          block_id?: string | null
          id?: string
          saved_at?: string | null
          saved_by: string
        }
        Update: {
          block_id?: string | null
          id?: string
          saved_at?: string | null
          saved_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_saves_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "training_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_participant_feedback: {
        Row: {
          booking_id: string
          coach_id: string
          created_at: string | null
          id: string
          notes: string | null
          player_id: string
          rating: number | null
        }
        Insert: {
          booking_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id: string
          rating?: number | null
        }
        Update: {
          booking_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_participant_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_waitlist: {
        Row: {
          coach_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          notified_at: string | null
          package_id: string
          player_id: string
          requested_date: string
          status: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          package_id: string
          player_id: string
          requested_date: string
          status?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          package_id?: string
          player_id?: string
          requested_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_waitlist_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "coach_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          coach_id: string
          coach_payout: number
          created_at: string | null
          currency: string
          end_time: string
          id: string
          location_address: string | null
          location_type: string | null
          notes: string | null
          package_id: string | null
          platform_fee: number
          player_id: string
          start_time: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coach_id: string
          coach_payout?: number
          created_at?: string | null
          currency?: string
          end_time: string
          id?: string
          location_address?: string | null
          location_type?: string | null
          notes?: string | null
          package_id?: string | null
          platform_fee?: number
          player_id: string
          start_time: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coach_id?: string
          coach_payout?: number
          created_at?: string | null
          currency?: string
          end_time?: string
          id?: string
          location_address?: string | null
          location_type?: string | null
          notes?: string | null
          package_id?: string | null
          platform_fee?: number
          player_id?: string
          start_time?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "coach_packages"
            referencedColumns: ["id"]
          },
        ]
      }
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
          auto_confirm: boolean | null
          coach_id: string
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          is_recurring_group: boolean | null
          max_group_size: number | null
          min_participants: number | null
          price_per_session: number
          pricing_type: string | null
          recurring_day_of_week: number | null
          recurring_start_time: string | null
          session_type: Database["public"]["Enums"]["session_type"]
          sport: Database["public"]["Enums"]["sport_type"]
          title: string
          total_sessions: number | null
        }
        Insert: {
          auto_confirm?: boolean | null
          coach_id: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_recurring_group?: boolean | null
          max_group_size?: number | null
          min_participants?: number | null
          price_per_session?: number
          pricing_type?: string | null
          recurring_day_of_week?: number | null
          recurring_start_time?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          sport?: Database["public"]["Enums"]["sport_type"]
          title: string
          total_sessions?: number | null
        }
        Update: {
          auto_confirm?: boolean | null
          coach_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_recurring_group?: boolean | null
          max_group_size?: number | null
          min_participants?: number | null
          price_per_session?: number
          pricing_type?: string | null
          recurring_day_of_week?: number | null
          recurring_start_time?: string | null
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
          primary_sport: string | null
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
          primary_sport?: string | null
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
          primary_sport?: string | null
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
      coach_requests: {
        Row: {
          block_id: string | null
          coach_has_program_access: boolean | null
          coach_id: string
          created_at: string | null
          id: string
          message: string | null
          package_id: string | null
          player_id: string
          proposed_sessions: number | null
          proposed_start_date: string | null
          request_type: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          block_id?: string | null
          coach_has_program_access?: boolean | null
          coach_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          package_id?: string | null
          player_id: string
          proposed_sessions?: number | null
          proposed_start_date?: string | null
          request_type?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          block_id?: string | null
          coach_has_program_access?: boolean | null
          coach_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          package_id?: string | null
          player_id?: string
          proposed_sessions?: number | null
          proposed_start_date?: string | null
          request_type?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_requests_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "training_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          amount_paid: number | null
          event_id: string
          id: string
          payment_status: string | null
          player_id: string
          registered_at: string | null
          status: string | null
        }
        Insert: {
          amount_paid?: number | null
          event_id: string
          id?: string
          payment_status?: string | null
          player_id: string
          registered_at?: string | null
          status?: string | null
        }
        Update: {
          amount_paid?: number | null
          event_id?: string
          id?: string
          payment_status?: string | null
          player_id?: string
          registered_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_group: string | null
          coach_id: string
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          current_participants: number | null
          description: string | null
          end_datetime: string
          event_type: string
          id: string
          is_online: boolean | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_name: string | null
          max_participants: number | null
          price_per_person: number | null
          skill_level: string | null
          sport: string
          start_datetime: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          coach_id: string
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          current_participants?: number | null
          description?: string | null
          end_datetime: string
          event_type?: string
          id?: string
          is_online?: boolean | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_name?: string | null
          max_participants?: number | null
          price_per_person?: number | null
          skill_level?: string | null
          sport?: string
          start_datetime: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          coach_id?: string
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          current_participants?: number | null
          description?: string | null
          end_datetime?: string
          event_type?: string
          id?: string
          is_online?: boolean | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_name?: string | null
          max_participants?: number | null
          price_per_person?: number | null
          skill_level?: string | null
          sport?: string
          start_datetime?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      founder_share_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      founder_spend: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          month: string
          notes: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          month: string
          notes?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          month?: string
          notes?: string | null
        }
        Relationships: []
      }
      health_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_data: {
        Row: {
          calories_active: number | null
          date: string
          hrv_ms: number | null
          id: string
          provider: string
          raw_data: Json | null
          readiness_score: number | null
          recovery_score: number | null
          resting_hr: number | null
          sleep_hours: number | null
          sleep_score: number | null
          steps: number | null
          strain_score: number | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          calories_active?: number | null
          date: string
          hrv_ms?: number | null
          id?: string
          provider: string
          raw_data?: Json | null
          readiness_score?: number | null
          recovery_score?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_score?: number | null
          steps?: number | null
          strain_score?: number | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          calories_active?: number | null
          date?: string
          hrv_ms?: number | null
          id?: string
          provider?: string
          raw_data?: Json | null
          readiness_score?: number | null
          recovery_score?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_score?: number | null
          steps?: number | null
          strain_score?: number | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          avatar_url: string | null
          city: string | null
          current_level: string | null
          current_streak_days: number | null
          display_name: string | null
          rank_global: number | null
          rank_updated_at: string | null
          sport: string | null
          total_sessions: number | null
          total_xp: number | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          current_level?: string | null
          current_streak_days?: number | null
          display_name?: string | null
          rank_global?: number | null
          rank_updated_at?: string | null
          sport?: string | null
          total_sessions?: number | null
          total_xp?: number | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          current_level?: string | null
          current_streak_days?: number | null
          display_name?: string | null
          rank_global?: number | null
          rank_updated_at?: string | null
          sport?: string | null
          total_sessions?: number | null
          total_xp?: number | null
          user_id?: string
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
          coach_video_url: string | null
          created_at: string
          created_by: string
          description: string | null
          difficulty: Database["public"]["Enums"]["module_difficulty"] | null
          duration_minutes: number | null
          equipment: string[] | null
          id: string
          instructions: string | null
          is_shared: boolean | null
          sport: string
          tags: string[] | null
          title: string
          video_url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["module_category"]
          coach_video_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["module_difficulty"] | null
          duration_minutes?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          is_shared?: boolean | null
          sport?: string
          tags?: string[] | null
          title: string
          video_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["module_category"]
          coach_video_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["module_difficulty"] | null
          duration_minutes?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          is_shared?: boolean | null
          sport?: string
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
      page_views: {
        Row: {
          created_at: string | null
          id: string
          page_type: string
          reference_id: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_type: string
          reference_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_type?: string
          reference_id?: string | null
          viewer_id?: string | null
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
          block_id: string | null
          coach_note: string | null
          completed_at: string | null
          id: string
          is_completed: boolean | null
          module_id: string
          order_index: number
          plan_id: string
        }
        Insert: {
          block_id?: string | null
          coach_note?: string | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id: string
          order_index?: number
          plan_id: string
        }
        Update: {
          block_id?: string | null
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
            foreignKeyName: "player_day_plan_items_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "training_blocks"
            referencedColumns: ["id"]
          },
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
          referral_code: string | null
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
          referral_code?: string | null
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
          referral_code?: string | null
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
      referrals: {
        Row: {
          booking_reward_paid: boolean | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          signup_reward_paid: boolean | null
          status: string | null
        }
        Insert: {
          booking_reward_paid?: boolean | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          signup_reward_paid?: boolean | null
          status?: string | null
        }
        Update: {
          booking_reward_paid?: boolean | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          signup_reward_paid?: boolean | null
          status?: string | null
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
      stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      training_blocks: {
        Row: {
          author_avatar_url: string | null
          author_id: string | null
          author_name: string | null
          block_type: string | null
          category: string
          coach_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          difficulty: string
          duration_minutes: number
          exercises: Json | null
          goal: string
          goals: string[] | null
          id: string
          is_custom: boolean | null
          is_for_sale: boolean | null
          is_public: boolean | null
          is_system: boolean | null
          module_durations: number[]
          module_ids: string[]
          module_notes: string[]
          preview_exercises: Json | null
          price: number | null
          rating_avg: number | null
          rating_count: number | null
          sport: string
          tags: string[] | null
          target_level: string | null
          target_sport: string | null
          thumbnail_url: string | null
          times_used: number | null
          title: string
          week_count: number | null
          weekly_structure: Json | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_id?: string | null
          author_name?: string | null
          block_type?: string | null
          category?: string
          coach_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          exercises?: Json | null
          goal: string
          goals?: string[] | null
          id?: string
          is_custom?: boolean | null
          is_for_sale?: boolean | null
          is_public?: boolean | null
          is_system?: boolean | null
          module_durations?: number[]
          module_ids?: string[]
          module_notes?: string[]
          preview_exercises?: Json | null
          price?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          sport?: string
          tags?: string[] | null
          target_level?: string | null
          target_sport?: string | null
          thumbnail_url?: string | null
          times_used?: number | null
          title: string
          week_count?: number | null
          weekly_structure?: Json | null
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string | null
          author_name?: string | null
          block_type?: string | null
          category?: string
          coach_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          exercises?: Json | null
          goal?: string
          goals?: string[] | null
          id?: string
          is_custom?: boolean | null
          is_for_sale?: boolean | null
          is_public?: boolean | null
          is_system?: boolean | null
          module_durations?: number[]
          module_ids?: string[]
          module_notes?: string[]
          preview_exercises?: Json | null
          price?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          sport?: string
          tags?: string[] | null
          target_level?: string | null
          target_sport?: string | null
          thumbnail_url?: string | null
          times_used?: number | null
          title?: string
          week_count?: number | null
          weekly_structure?: Json | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_key: string
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_key: string
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_key?: string
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
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
      user_stats: {
        Row: {
          avg_hrv: number | null
          avg_recovery_score: number | null
          avg_sleep_hours: number | null
          calories_estimate: number | null
          cities_trained_in: string[] | null
          current_level: string | null
          current_streak_days: number | null
          longest_streak_days: number | null
          raffle_tickets: number | null
          total_calories: number | null
          total_coaches: number | null
          total_minutes: number | null
          total_sessions: number | null
          total_steps: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
          wallet_balance: number | null
        }
        Insert: {
          avg_hrv?: number | null
          avg_recovery_score?: number | null
          avg_sleep_hours?: number | null
          calories_estimate?: number | null
          cities_trained_in?: string[] | null
          current_level?: string | null
          current_streak_days?: number | null
          longest_streak_days?: number | null
          raffle_tickets?: number | null
          total_calories?: number | null
          total_coaches?: number | null
          total_minutes?: number | null
          total_sessions?: number | null
          total_steps?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          wallet_balance?: number | null
        }
        Update: {
          avg_hrv?: number | null
          avg_recovery_score?: number | null
          avg_sleep_hours?: number | null
          calories_estimate?: number | null
          cities_trained_in?: string[] | null
          current_level?: string | null
          current_streak_days?: number | null
          longest_streak_days?: number | null
          raffle_tickets?: number | null
          total_calories?: number | null
          total_coaches?: number | null
          total_minutes?: number | null
          total_sessions?: number | null
          total_steps?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      user_xp_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string | null
          id: string
          video_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string | null
          id?: string
          video_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "progress_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
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
      award_xp: {
        Args: {
          p_amount: number
          p_description?: string
          p_event_type: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      credit_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
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
      increment_block_usage: {
        Args: { p_block_id: string }
        Returns: undefined
      }
      increment_raffle_tickets: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_session_stats: {
        Args: { p_minutes?: number; p_user_id: string }
        Returns: undefined
      }
      recalculate_rankings: { Args: never; Returns: undefined }
      update_block_rating_avg: {
        Args: { p_block_id: string }
        Returns: undefined
      }
      update_streak: { Args: { p_user_id: string }; Returns: undefined }
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
        | "tennis_drill"
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
        "tennis_drill",
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
