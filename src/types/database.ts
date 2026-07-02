export type StaffRoleType = "master_admin" | "head_admin" | "sub_admin";

export type EnquiryStatus = "pending" | "confirmed" | "rejected";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface SystemConfiguration {
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
  updated_at: string;
}

export interface RoomCategory {
  id: string;
  name: string;
  nightly_rate: number;
  amenities: string;
  cover_photo_url: string | null;
  is_archived: boolean;
  is_unavailable: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhysicalRoom {
  id: string;
  room_number: string;
  floor: number;
  category_id: string;
  created_at: string;
}

export interface Enquiry {
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
}

export interface Reservation {
  id: string;
  enquiry_id: string | null;
  assigned_room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  tax_amount: number;
  payment_status: PaymentStatus;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action_taken: string;
  description: string;
  created_at: string;
}

export interface StaffRole {
  id: string;
  username: string;
  role: StaffRoleType;
  created_at: string;
}

interface TableDefinition<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
}

export interface Database {
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
        Partial<Omit<PhysicalRoom, "id" | "created_at">>
      >;
      enquiries: TableDefinition<
        Enquiry,
        Omit<Enquiry, "id" | "status" | "created_at"> & {
          id?: string;
          status?: EnquiryStatus;
        },
        Partial<Omit<Enquiry, "id" | "created_at">>
      >;
      reservations: TableDefinition<
        Reservation,
        Omit<
          Reservation,
          "id" | "payment_status" | "is_cancelled" | "created_at" | "updated_at"
        > & {
          id?: string;
          payment_status?: PaymentStatus;
          is_cancelled?: boolean;
        },
        Partial<Omit<Reservation, "id" | "created_at">>
      >;
      audit_logs: TableDefinition<
        AuditLog,
        Omit<AuditLog, "id" | "created_at"> & { id?: string },
        never
      >;
      staff_roles: TableDefinition<
        StaffRole,
        Omit<StaffRole, "created_at">,
        Partial<Omit<StaffRole, "id" | "created_at">>
      >;
    };
    Enums: {
      staff_role_type: StaffRoleType;
      enquiry_status: EnquiryStatus;
      payment_status_type: PaymentStatus;
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
}
