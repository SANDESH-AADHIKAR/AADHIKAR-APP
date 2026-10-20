import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mutedColor } from '@/constants/theme';
import type { SchemeCategory, SchemeInfo } from '@/constants/types';
import { useTheme } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, Landmark } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

/** Pastel topic tints from the AADHIKAR high-contrast palette. */
const categoryStyles: Record<SchemeCategory, { tint: string; ink: string }> = {
  Agriculture: { tint: '#FFE19F', ink: '#5A4208' },
  Education: { tint: '#BEE6F3', ink: '#0C4653' },
  Health: { tint: '#C0EDDE', ink: '#0B4A3B' },
  Finance: { tint: '#C0E7BD', ink: '#1B4A19' },
  Housing: { tint: '#FFE4AF', ink: '#59400A' },
  Social: { tint: '#FFD8D9', ink: '#5C1F22' },
};

type SchemeCardProps = {
  scheme: SchemeInfo;
};

export function SchemeCard({ scheme }: SchemeCardProps) {
  const theme = useTheme();
  const muted = mutedColor(theme.dark);
  const topic = categoryStyles[scheme.category];

  const openLink = () => {
    WebBrowser.openBrowserAsync(scheme.link);
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${scheme.name} — open official website`}
      onPress={openLink}
      className="gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: topic.tint }}
        >
          <Landmark size={18} color={topic.ink} />
        </View>

        <View className="flex-1 gap-1">
          <View
            className="self-start rounded-full px-2 py-0.5"
            style={{ backgroundColor: topic.tint }}
          >
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: topic.ink }}
            >
              {scheme.category}
            </Text>
          </View>
          <Text className="text-base font-semibold leading-snug text-foreground">
            {scheme.name}
          </Text>
        </View>

        <ExternalLink size={16} color={muted} />
      </View>

      <View className="gap-0.5">
        <Text className="text-xs text-muted-foreground">Benefit</Text>
        <Text className="text-sm font-medium leading-5 text-foreground">
          {scheme.benefits}
        </Text>
      </View>

      <View className="gap-0.5 border-t border-border pt-3">
        <Text className="text-xs text-muted-foreground">Eligibility</Text>
        <Text className="text-sm leading-5 text-foreground">
          {scheme.eligibility}
        </Text>
      </View>
    </Pressable>
  );
}
