import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { Scheme, SchemeStatus } from '@/constants/schemes';
import { useTheme } from 'expo-router';
import { Landmark } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

const statusStyles: Record<
  SchemeStatus,
  { label: string; container: string; text: string }
> = {
  open: {
    label: 'Open',
    container: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  'closing-soon': {
    label: 'Closing soon',
    container: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
  ongoing: {
    label: 'Ongoing',
    container: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-400',
  },
};

type SchemeCardProps = {
  scheme: Scheme;
};

export function SchemeCard({ scheme }: SchemeCardProps) {
  const theme = useTheme();
  const status = statusStyles[scheme.status];

  return (
    <Card size="sm" className="gap-3 rounded-2xl p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Landmark size={18} color={theme.colors.primary} />
        </View>

        <View className="flex-1 gap-1.5">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {scheme.category}
            </Text>
            <View className={`rounded-full px-2 py-0.5 ${status.container}`}>
              <Text className={`text-xs font-medium ${status.text}`}>
                {status.label}
              </Text>
            </View>
          </View>
          <Text className="text-base font-semibold leading-snug text-foreground">
            {scheme.title}
          </Text>
        </View>
      </View>

      <Text
        className="text-sm leading-5 text-muted-foreground"
        numberOfLines={2}
      >
        {scheme.description}
      </Text>

      <View className="flex-row items-end justify-between gap-3 border-t border-border pt-3">
        <View className="gap-0.5">
          <Text className="text-xs text-muted-foreground">Benefit</Text>
          <Text className="text-sm font-semibold text-foreground">
            {scheme.benefit}
          </Text>
        </View>

        {scheme.deadline ? (
          <View className="items-end gap-0.5">
            <Text className="text-xs text-muted-foreground">Deadline</Text>
            <Text className="text-sm font-medium text-foreground">
              {scheme.deadline}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
