// Нүүр: газруудын жагсаалт. Хайлт, ангиллаар шүүх,
// infinite scroll (гүйлгэх тусам ачаална), pull-to-refresh (доош татаж шинэчлэх).
// Зочин (нэвтрээгүй) ч энэ дэлгэцийг үзэж чадна.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { Business, Category } from '@/lib/types';
import BusinessCard from '@/components/BusinessCard';
import Chip from '@/components/Chip';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, radius, space } from '@/lib/theme';

const PAGE_SIZE = 10;

export default function Home() {
  const [items, setItems] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);      // анхны ачаалал
  const [refreshing, setRefreshing] = useState(false); // доош татсан
  const [loadingMore, setLoadingMore] = useState(false); // доод хэсэгт хүрсэн
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const page = useRef(0);

  // Ангиллуудыг нэг удаа ачаална
  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => setCategories(data ?? []));
  }, []);

  // pageIndex-р хуудаслан татах. reset=true бол жагсаалтыг шинээр эхлүүлнэ.
  const fetchPage = useCallback(
    async (pageIndex: number, reset: boolean) => {
      const from = pageIndex * PAGE_SIZE;
      let query = supabase
        .from('businesses')
        .select('*, categories(name, icon)')
        .range(from, from + PAGE_SIZE - 1); // 0-9, 10-19 ...

      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`); // нэрээр хайх
      if (categoryId) query = query.eq('category_id', categoryId);         // ангиллаар шүүх
      query = query.order('created_at', { ascending: false }); // шинэ нь эхэндээ

      const { data, error: err } = await query;
      if (err) {
        setError('Интернэт холболтоо шалгана уу');
        return;
      }
      setError('');
      const rows = (data ?? []) as Business[];
      setItems((prev) => (reset ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE); // бүтэн хуудас ирээгүй бол цааш байхгүй
      page.current = pageIndex;
    },
    [search, categoryId]
  );

  // Хайлт/шүүлт өөрчлөгдөхөд 400ms хүлээгээд (debounce) дахин ачаална
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      await fetchPage(0, true);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [fetchPage]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchPage(0, true);
    setRefreshing(false);
  }

  async function onEndReached() {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await fetchPage(page.current + 1, false);
    setLoadingMore(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Хайлтын талбар */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Салон, эмнэлэг, заал хайх..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {search ? <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setSearch('')} /> : null}
      </View>

      {/* Ангилал */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Бүгд" active={categoryId === null} onPress={() => setCategoryId(null)} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingView />
      ) : error && items.length === 0 ? (
        <ErrorView message={error} onRetry={onRefresh} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BusinessCard item={item} onPress={() => router.push(`/business/${item.id}`)} />
          )}
          contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, flexGrow: 1 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyView text="Илэрц олдсонгүй" icon="search-outline" />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: space.lg }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    margin: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  chips: { paddingHorizontal: space.lg, paddingTop: space.sm, flexDirection: 'row' },
});
