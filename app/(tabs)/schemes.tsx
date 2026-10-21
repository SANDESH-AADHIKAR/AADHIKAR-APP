import { SchemeCard } from '@/components/SchemeCard';
import { Text } from '@/components/ui/text';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { CATEGORIES } from '@/constants/schemes';
import { ON_PRIMARY, mutedColor } from '@/constants/theme';
import { useSchemes } from '@/hooks/useSchemes';
import { useTheme } from 'expo-router';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SchemesScreen() {
  const theme = useTheme();
  const muted = mutedColor(theme.dark);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const { schemes, isLoading, isRefreshing, error, refetch } = useSchemes();
  const isBusy = isLoading || isRefreshing;

  const categories = useMemo(
    () =>
      Array.from(
        new Set<string>([
          ...CATEGORIES,
          ...schemes.map((scheme) => scheme.category),
        ])
      ),
    [schemes]
  );

  const filteredSchemes = useMemo(() => {
    const search = query.trim().toLowerCase();

    return schemes.filter((scheme) => {
      const matchesCategory =
        category === 'All' || scheme.category === category;
      const matchesSearch =
        !search ||
        `${scheme.name} ${scheme.benefits} ${scheme.eligibility} ${scheme.category}`
          .toLowerCase()
          .includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [category, query, schemes]);

  const sections = useMemo(() => {
    const grouped = new Map<string, typeof filteredSchemes>();

    for (const scheme of filteredSchemes) {
      const group = grouped.get(scheme.category) ?? [];
      group.push(scheme);
      grouped.set(scheme.category, group);
    }

    return Array.from(grouped, ([title, data]) => ({ title, data }));
  }, [filteredSchemes]);

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-background"
      style={{ flex: 1 }}
    >
      <SectionList
        sections={sections}
        keyExtractor={(scheme) => scheme.id}
        renderItem={({ item }) => <SchemeCard scheme={item} />}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center justify-between pb-1 pt-2">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {section.data.length}
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        style={{ flex: 1 }}
        contentContainerClassName="gap-3 px-5 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={isRefreshing}
        onRefresh={refetch}
        ListHeaderComponent={
          <View className="gap-4 pb-1">
            <View className="gap-1">
              <Text className="text-2xl font-bold tracking-tight text-foreground">
                Schemes
              </Text>
              <Text className="text-sm text-muted-foreground">
                Government benefits you may be eligible for.
              </Text>
            </View>

            <Input className="min-h-12 rounded-xl bg-card">
              <InputSlot className="pl-1">
                <Search size={16} color={muted} />
              </InputSlot>
              <InputField
                value={query}
                onChangeText={setQuery}
                placeholder="Search schemes, categories..."
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-1"
            >
              {categories.map((item) => {
                const isActive = item === category;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
                      isActive
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    {item === 'All' ? (
                      <SlidersHorizontal
                        size={12}
                        color={isActive ? ON_PRIMARY : muted}
                      />
                    ) : null}
                    <Text
                      className={`text-xs font-medium ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {!isBusy && !error ? (
              <Text className="text-xs text-muted-foreground">
                {filteredSchemes.length}{' '}
                {filteredSchemes.length === 1 ? 'scheme' : 'schemes'} found
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isBusy ? (
            <View className="items-center gap-2 py-16">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="text-sm text-muted-foreground">
                Loading schemes...
              </Text>
            </View>
          ) : error ? (
            <Pressable
              accessibilityRole="button"
              onPress={refetch}
              className="items-center gap-2 py-16"
            >
              <Text className="text-base font-semibold text-foreground">
                Could not load schemes
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                {error}
              </Text>
              <Text className="text-sm font-medium text-primary">
                Tap to retry
              </Text>
            </Pressable>
          ) : (
            <View className="items-center gap-2 py-16">
              <Search size={24} color={muted} />
              <Text className="text-base font-semibold text-foreground">
                No schemes found
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                Try a different search term or category.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
