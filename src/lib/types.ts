// Өгөгдлийн сангийн хүснэгтүүдийн TypeScript төрөл (schema.sql-тэй ижил)
export type Role = 'user' | 'admin';
export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'completed';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
};

export type Category = { id: number; name: string; icon: string };

export type Business = {
  id: string;
  category_id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  open_hour: number;
  close_hour: number;
  created_at: string;
  categories?: { name: string; icon: string } | null;
};

export type Service = {
  id: string;
  business_id: string;
  name: string;
  price: number;
  duration_min: number;
};

export type Staff = { id: string; name: string; title: string | null };

export type Booking = {
  id: string;
  user_id: string;
  business_id: string;
  service_id: string;
  staff_id: string | null;
  start_at: string;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  services?: { name: string; price: number; duration_min: number } | null;
  businesses?: { name: string; address: string | null } | null;
  staff?: { name: string } | null;
};
