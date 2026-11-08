// Нэгдсэн дизайны систем: өнгө, зай, булангийн радиус бүгд нэг газраас
export const colors = {
  primary: '#0F766E',      // гүн ногоон-цэнхэр (teal)
  primarySoft: '#CCFBF1',
  accent: '#F59E0B',       // шар — онцлох зүйлс
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

// Захиалгын төлөв бүрийн монгол нэр, өнгө
export const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Хүлээгдэж буй', color: '#B45309', bg: '#FEF3C7' },
  paid:      { label: 'Төлөгдсөн',     color: '#15803D', bg: '#DCFCE7' },
  cancelled: { label: 'Цуцлагдсан',    color: '#B91C1C', bg: '#FEE2E2' },
  completed: { label: 'Дууссан',       color: '#1D4ED8', bg: '#DBEAFE' },
};
