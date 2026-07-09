export type StaffRoleType = "master_admin" | "head_admin" | "sub_admin";

export type ChildGender = "male" | "female";

export type ChildDetail = {
  age: number;
  gender: ChildGender;
};

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
  maintenance_mode: boolean;
  updated_at: string;
};

export type RoomCategory = {
  id: string;
  name: string;
  nightly_rate: number;
  amenities: string;
  description: string;
  cover_photo_url: string | null;
  is_archived: boolean;
  is_unavailable: boolean;
  max_adults: number;
  max_children: number;
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
  child_details: ChildDetail[];
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
  child_details: ChildDetail[];
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  amount_paid: number;
  internal_notes: string;
  payment_status: PaymentStatus;
  status: ReservationStatus;
  is_cancelled: boolean;
  bill_sequence: number;
  created_at: string;
  updated_at: string;
};

export type AuditActionType =
  | "create_booking"
  | "edit_ledger"
  | "check_in"
  | "check_out"
  | "cancel_booking"
  | "restore_booking"
  | "update_rates"
  | "update_availability"
  | "create_staff"
  | "revoke_staff"
  | "create_category"
  | "edit_category"
  | "archive_category"
  | "restore_category"
  | "create_room"
  | "delete_room"
  | "reassign_room_category"
  | "update_branding"
  | "update_booking_rules"
  | "update_invoice_config"
  | "update_site_content"
  | "toggle_maintenance_mode"
  | "upload_asset"
  | "upload_gallery_image"
  | "archive_gallery_image"
  | "restore_gallery_image"
  | "delete_gallery_image"
  | "update_gallery_image_folder"
  | "restore_demo_data"
  | "wipe_reservations"
  | "hard_delete_booking"
  | "update_staff_profile"
  | "delete_staff"
  | "system_purge";

export type AuditLog = {
  id: string;
  admin_id: string | null;
  action_type: AuditActionType;
  description: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  actor_role: StaffRoleType | null;
  created_at: string;
};

export type StaffRole = {
  id: string;
  username: string;
  role: StaffRoleType;
  created_at: string;
  deactivated_at: string | null;
};

export type SiteContent = {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  about_history: string;
  about_philosophy: string;
  rooms_intro: string;
  gallery_header: string;
  featured_review: string;
  updated_at: string;
};

export type GalleryImage = {
  id: string;
  folder_tag: string;
  image_url: string;
  alt_text: string;
  is_archived: boolean;
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
      site_content: TableDefinition<
        SiteContent,
        Partial<Omit<SiteContent, "updated_at">> & { id?: number },
        Partial<Omit<SiteContent, "id">>
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
        Omit<Enquiry, "id" | "status" | "created_at" | "child_details"> & {
          id?: string;
          status?: EnquiryStatus;
          child_details?: ChildDetail[];
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
          | "child_details"
          | "tax_amount"
          | "discount_amount"
          | "amount_paid"
          | "internal_notes"
          | "payment_status"
          | "status"
          | "is_cancelled"
          | "bill_sequence"
          | "created_at"
          | "updated_at"
        > & {
          id?: string;
          enquiry_id?: string | null;
          assigned_room_id?: string | null;
          adults?: number;
          children?: number;
          child_details?: ChildDetail[];
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
        Omit<AuditLog, "id" | "created_at" | "old_value" | "new_value" | "actor_role"> & {
          id?: string;
          old_value?: Record<string, unknown> | null;
          new_value?: Record<string, unknown> | null;
          actor_role?: StaffRoleType | null;
        },
        Record<string, never>,
        [
          {
            foreignKeyName: "audit_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "staff_roles";
            referencedColumns: ["id"];
          },
        ]
      >;
      staff_roles: TableDefinition<
        StaffRole,
        Omit<StaffRole, "created_at">,
        Partial<Omit<StaffRole, "id" | "created_at">>
      >;
      gallery_images: TableDefinition<
        GalleryImage,
        Omit<GalleryImage, "id" | "created_at"> & { id?: string },
        Partial<Omit<GalleryImage, "id" | "created_at">>
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
      restore_demo_reservations: {
        Args: Record<string, never>;
        Returns: number;
      };
      wipe_reservations_for_testing: {
        Args: { confirmation: string };
        Returns: number;
      };
      hard_delete_reservation: {
        Args: { target_reservation_id: string };
        Returns: undefined;
      };
      purge_audit_logs: {
        Args: { months_old: number; typed_confirmation: string };
        Returns: undefined;
      };
    };
  };
};
