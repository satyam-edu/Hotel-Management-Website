export type StaffRoleType = "master_admin" | "head_admin" | "sub_admin";

export type EnquiryStatus = "pending" | "confirmed" | "rejected";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type ReservationStatus =
  | "Confirmed"
  | "Checked-In"
  | "Checked-Out"
  | "Cancelled";

export type SystemConfiguration = {
  id: number;
  primary_gold: string;
  bg_charcoal: string;
  base_font_size: number;
  hero_bg_url: string | null;
  about_photo_url: string | null;
  min_booking_age: number;
  max_adults_per_room: number;
  max_children_per_room: number;
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  tax_rate: number;
  tax_id: string;
  invoice_terms: string;
  updated_at: string;
};

export type RoomCategory = {
  id: string;
  name: string;
  nightly_rate: number;
  amenities: string;
  cover_photo_url: string | null;
  is_archived: boolean;
  is_unavailable: boolean;
  created_at: string;
  updated_at: string;
};

export type PhysicalRoom = {
  id: string;
  room_number: string;
  floor: number;
  category_id: string;
  created_at: string;
};

export type Enquiry = {
  id: string;
  reference_code: string;
  full_name: string;
  mobile: string;
  email: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  room_type_id: string | null;
  status: EnquiryStatus;
  created_at: string;
};

export type Reservation = {
  id: string;
  enquiry_id: string | null;
  assigned_room_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  room_number: string | null;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  amount_paid: number;
  internal_notes: string;
  payment_status: PaymentStatus;
  status: ReservationStatus;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  admin_id: string;
  action_taken: string;
  description: string;
  created_at: string;
};

export type StaffRole = {
  id: string;
  username: string;
  role: StaffRoleType;
  created_at: string;
};

type TableDefinition<Row, Insert, Update, Relationships = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      system_configurations: TableDefinition<
        SystemConfiguration,
        Partial<Omit<SystemConfiguration, "updated_at">> & { id?: number },
        Partial<Omit<SystemConfiguration, "id">>
      >;
      room_categories: TableDefinition<
        RoomCategory,
        Omit<RoomCategory, "id" | "created_at" | "updated_at"> & {
          id?: string;
        },
        Partial<Omit<RoomCategory, "id" | "created_at">>
      >;
      physical_rooms: TableDefinition<
        PhysicalRoom,
        Omit<PhysicalRoom, "id" | "created_at"> & { id?: string },
        Partial<Omit<PhysicalRoom, "id" | "created_at">>,
        [
          {
            foreignKeyName: "physical_rooms_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "room_categories";
            referencedColumns: ["id"];
          },
        ]
      >;
      enquiries: TableDefinition<
        Enquiry,
        Omit<Enquiry, "id" | "status" | "created_at"> & {
          id?: string;
          status?: EnquiryStatus;
        },
        Partial<Omit<Enquiry, "id" | "created_at">>,
        [
          {
            foreignKeyName: "enquiries_room_type_id_fkey";
            columns: ["room_type_id"];
            isOneToOne: false;
            referencedRelation: "room_categories";
            referencedColumns: ["id"];
          },
        ]
      >;
      reservations: TableDefinition<
        Reservation,
        Omit<
          Reservation,
          | "id"
          | "enquiry_id"
          | "assigned_room_id"
          | "adults"
          | "children"
          | "tax_amount"
          | "discount_amount"
          | "amount_paid"
          | "internal_notes"
          | "payment_status"
          | "status"
          | "is_cancelled"
          | "created_at"
          | "updated_at"
        > & {
          id?: string;
          enquiry_id?: string | null;
          assigned_room_id?: string | null;
          adults?: number;
          children?: number;
          tax_amount?: number;
          discount_amount?: number;
          amount_paid?: number;
          internal_notes?: string;
          payment_status?: PaymentStatus;
          status?: ReservationStatus;
          is_cancelled?: boolean;
        },
        Partial<Omit<Reservation, "id" | "created_at">>
      >;
      audit_logs: TableDefinition<
        AuditLog,
        Omit<AuditLog, "id" | "created_at"> & { id?: string },
        Record<string, never>
      >;
      staff_roles: TableDefinition<
        StaffRole,
        Omit<StaffRole, "created_at">,
        Partial<Omit<StaffRole, "id" | "created_at">>
      >;
    };
    Views: Record<string, never>;
    Enums: {
      staff_role_type: StaffRoleType;
      enquiry_status: EnquiryStatus;
      payment_status_type: PaymentStatus;
      reservation_status: ReservationStatus;
    };
    Functions: {
      is_staff: {
        Args: { uid: string };
        Returns: boolean;
      };
      current_staff_role: {
        Args: Record<string, never>;
        Returns: StaffRoleType;
      };
    };
  };
};
