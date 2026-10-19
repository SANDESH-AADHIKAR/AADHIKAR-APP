import Logo from '@/assets/icons/Logo';
import { SchemeCard } from '@/components/SchemeCard';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { SCHEMES } from '@/constants/schemes';
import { mutedColor } from '@/constants/theme';
import { useRouter, useTheme } from 'expo-router';
import {
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const muted = mutedColor(theme.dark);
  const onPrimary = theme.dark ? '#171717' : '#fafafa';

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-background"
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerClassName="gap-6 px-5 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Logo />
          <Pressable
            accessibilityLabel="Open chat"
            onPress={() => router.push('/chat')}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <MessageCircle size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View className="gap-1.5">
          <Text className="text-sm text-muted-foreground">Namaste 👋</Text>
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            Find benefits you deserve.
          </Text>
        </View>

        <Pressable
          accessibilityRole="search"
          onPress={() => router.push('/schemes')}
          className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4"
        >
          <Search size={18} color={muted} />
          <Text className="text-sm text-muted-foreground">
            Search schemes, benefits and more
          </Text>
        </Pressable>

        <View className="gap-4 overflow-hidden rounded-3xl bg-primary p-5">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-foreground/10">
            <Sparkles size={18} color={onPrimary} />
          </View>

          <View className="gap-2">
            <Text className="text-xl font-bold text-primary-foreground">
              Personalised scheme matches
            </Text>
            <Text className="text-sm leading-5 text-primary-foreground/70">
              Answer a few questions and Aadhikar AI will find the schemes you
              are eligible for.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/chat')}
            className="mt-1 flex-row items-center gap-2 self-start rounded-full bg-primary-foreground px-4 py-2.5"
          >
            <Text className="text-sm font-semibold text-primary">
              Ask Aadhikar AI
            </Text>
            <ArrowRight size={14} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">
              Featured schemes
            </Text>
            <Pressable
              onPress={() => router.push('/schemes')}
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm font-medium text-muted-foreground">
                See all
              </Text>
              <ChevronRight size={14} color={muted} />
            </Pressable>
          </View>

          {SCHEMES.slice(0, 2).map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-background">
            <ShieldCheck size={18} color={muted} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-foreground">
              Private by design
            </Text>
            <Text className="text-xs leading-4 text-muted-foreground">
              Your documents and personal details stay on your device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
