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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      about_content: {
        Row: {
          content: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_accounts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          order_alerts: boolean
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          order_alerts?: boolean
          role: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          order_alerts?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          action: string
          created_at?: string | null
          email: string
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          action?: string
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          expiry_date: string | null
          id: string
          image: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expiry_date?: string | null
          id?: string
          image: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expiry_date?: string | null
          id?: string
          image?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          date: string
          expiry_date: string | null
          id: string
          image: string
          meta_description: string | null
          published: boolean
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category: string
          content: string
          created_at?: string
          date: string
          expiry_date?: string | null
          id: string
          image: string
          meta_description?: string | null
          published?: boolean
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          date?: string
          expiry_date?: string | null
          id?: string
          image?: string
          meta_description?: string | null
          published?: boolean
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          bg_color: string
          created_at: string | null
          description: string
          id: string
          image: string
          order_num: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string
          created_at?: string | null
          description?: string
          id?: string
          image: string
          order_num?: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string
          created_at?: string | null
          description?: string
          id?: string
          image?: string
          order_num?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      class_materials: {
        Row: {
          created_at: string
          detail: string
          id: string
          link: string
          program_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          link?: string
          program_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          link?: string
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "class_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      class_programs: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          name: string
          num_meetings: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          num_meetings?: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          num_meetings?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          created_at: string
          id: string
          logo: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string
          name?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_fund_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          fund_source_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description: string
          fund_source_id?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          fund_source_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_fund_source_id_fkey"
            columns: ["fund_source_id"]
            isOneToOne: false
            referencedRelation: "expense_fund_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_en: string
          answer_id: string
          category: string
          created_at: string
          id: string
          order_num: number
          question_en: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_en: string
          answer_id: string
          category?: string
          created_at?: string
          id?: string
          order_num?: number
          question_en: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_en?: string
          answer_id?: string
          category?: string
          created_at?: string
          id?: string
          order_num?: number
          question_en?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          child_age: string | null
          child_birthdate: string | null
          child_name: string | null
          created_at: string | null
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          id: string
          lookup_token: string | null
          notes: string | null
          payment_method: string
          promo_code: string | null
          status: string
          stock_deducted: boolean
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          child_age?: string | null
          child_birthdate?: string | null
          child_name?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount?: number | null
          id?: string
          lookup_token?: string | null
          notes?: string | null
          payment_method: string
          promo_code?: string | null
          status?: string
          stock_deducted?: boolean
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          child_age?: string | null
          child_birthdate?: string | null
          child_name?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number | null
          id?: string
          lookup_token?: string | null
          notes?: string | null
          payment_method?: string
          promo_code?: string | null
          status?: string
          stock_deducted?: boolean
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      other_income: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          fund_source_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          description: string
          fund_source_id?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          fund_source_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "other_income_fund_source_id_fkey"
            columns: ["fund_source_id"]
            isOneToOne: false
            referencedRelation: "expense_fund_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string
          account_number: string
          active: boolean
          bank_name: string
          created_at: string
          id: string
          image: string | null
          mdr_rate: number
          payment_steps: Json | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          active?: boolean
          bank_name: string
          created_at?: string
          id?: string
          image?: string | null
          mdr_rate?: number
          payment_steps?: Json | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          active?: boolean
          bank_name?: string
          created_at?: string
          id?: string
          image?: string | null
          mdr_rate?: number
          payment_steps?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          order_num: number
          price: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_num?: number
          price: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_num?: number
          price?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string
          first_payment: number
          id: string
          image: string
          installment: number
          installment_months: number
          is_hidden: boolean
          is_sold_out: boolean
          media: Json | null
          name: string
          price: number
          product_id: string
          schedule: Json | null
          stock: number
          tax: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          first_payment?: number
          id?: string
          image: string
          installment?: number
          installment_months?: number
          is_hidden?: boolean
          is_sold_out?: boolean
          media?: Json | null
          name: string
          price: number
          product_id: string
          schedule?: Json | null
          stock?: number
          tax?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          first_payment?: number
          id?: string
          image?: string
          installment?: number
          installment_months?: number
          is_hidden?: boolean
          is_sold_out?: boolean
          media?: Json | null
          name?: string
          price?: number
          product_id?: string
          schedule?: Json | null
          stock?: number
          tax?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_category_slugs: string[] | null
          applicable_product_ids: string[] | null
          applies_to: string
          code: string
          created_at: string | null
          description: string | null
          discount_percentage: number
          id: string
          is_active: boolean | null
          updated_at: string | null
          usage_count: number
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_category_slugs?: string[] | null
          applicable_product_ids?: string[] | null
          applies_to?: string
          code: string
          created_at?: string | null
          description?: string | null
          discount_percentage: number
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_category_slugs?: string[] | null
          applicable_product_ids?: string[] | null
          applies_to?: string
          code?: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      student_attendance: {
        Row: {
          attendance_status: string
          bahasa: string | null
          created_at: string | null
          date: string
          enrollment_id: string
          id: string
          kemandirian: string | null
          kognisi: string | null
          meeting_number: number
          motorik_halus: string | null
          motorik_kasar: string | null
          sosial_emosional: string | null
          tahfidz: string | null
          tahsin: string | null
          teacher_email: string
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string
          bahasa?: string | null
          created_at?: string | null
          date?: string
          enrollment_id: string
          id?: string
          kemandirian?: string | null
          kognisi?: string | null
          meeting_number: number
          motorik_halus?: string | null
          motorik_kasar?: string | null
          sosial_emosional?: string | null
          tahfidz?: string | null
          tahsin?: string | null
          teacher_email: string
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string
          bahasa?: string | null
          created_at?: string | null
          date?: string
          enrollment_id?: string
          id?: string
          kemandirian?: string | null
          kognisi?: string | null
          meeting_number?: number
          motorik_halus?: string | null
          motorik_kasar?: string | null
          sosial_emosional?: string | null
          tahfidz?: string | null
          tahsin?: string | null
          teacher_email?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          created_at: string | null
          id: string
          program_id: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          program_id: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          program_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "class_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_attendance: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          date: string
          evidence_url: string | null
          id: string
          leave_time: string | null
          remarks: string | null
          sessions: string[] | null
          teacher_email: string
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          date?: string
          evidence_url?: string | null
          id?: string
          leave_time?: string | null
          remarks?: string | null
          sessions?: string[] | null
          teacher_email: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          date?: string
          evidence_url?: string | null
          id?: string
          leave_time?: string | null
          remarks?: string | null
          sessions?: string[] | null
          teacher_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_leaves: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          remarks: string | null
          start_date: string
          status: string
          teacher_email: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          remarks?: string | null
          start_date: string
          status?: string
          teacher_email: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          remarks?: string | null
          start_date?: string
          status?: string
          teacher_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_settings: {
        Row: {
          created_at: string | null
          google_drive_folder: string | null
          id: string
          teacher_email: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          google_drive_folder?: string | null
          id?: string
          teacher_email: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          google_drive_folder?: string | null
          id?: string
          teacher_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          avatar: string | null
          created_at: string
          id: string
          name: string
          order_num: number
          rating: number
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar?: string | null
          created_at?: string
          id?: string
          name: string
          order_num?: number
          rating?: number
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar?: string | null
          created_at?: string
          id?: string
          name?: string
          order_num?: number
          rating?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      website_copy: {
        Row: {
          content: Json
          id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_cancel_stale_orders: { Args: never; Returns: number }
      deduct_stock_for_order: { Args: { p_order_id: string }; Returns: boolean }
      get_order_by_token: {
        Args: { p_order_id: string; p_token: string }
        Returns: {
          created_at: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount: number
          id: string
          lookup_token: string
          notes: string
          payment_method: string
          promo_code: string
          status: string
          stock_deducted: boolean
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }[]
      }
      get_order_items_by_token: {
        Args: { p_order_id: string; p_token: string }
        Returns: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }[]
      }
      increment_promo_usage: {
        Args: { expected_count: number; promo_id: string }
        Returns: boolean
      }
      increment_promo_usage_by_code: {
        Args: { promo_code_value: string }
        Returns: boolean
      }
      is_admin_account: { Args: { email: string }; Returns: boolean }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      is_super_admin: { Args: { email: string }; Returns: boolean }
      restore_stock_for_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      validate_promo_code: {
        Args: { code_input: string }
        Returns: {
          applicable_category_slugs: string[]
          applicable_product_ids: string[]
          applies_to: string
          code: string
          discount_percentage: number
          id: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "orders_manager"
        | "order_staff"
        | "content_manager"
        | "content_staff"
        | "teacher"
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
      admin_role: [
        "super_admin",
        "orders_manager",
        "order_staff",
        "content_manager",
        "content_staff",
        "teacher",
      ],
    },
  },
} as const
