import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Pressable } from "@/components/ui/pressable";
import { useTheme } from "expo-router";
import { Languages } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang); // This automatically saves to AsyncStorage via our plugin
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityLabel="Change Language"
        onPress={() => setIsOpen(true)}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <Languages size={18} color={theme.colors.text} />
      </Pressable>

      <Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem onPress={() => changeLanguage("en")}>
            <ActionsheetItemText>English</ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={() => changeLanguage("hi")}>
            <ActionsheetItemText>हिन्दी</ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={() => changeLanguage("mr")}>
            <ActionsheetItemText>मराठी</ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={() => changeLanguage("gj")}>
            <ActionsheetItemText>ગુજરાતી</ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={() => changeLanguage("be")}>
            <ActionsheetItemText>বাংলা</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
