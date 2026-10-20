import { trustColor } from "@/constants/theme";
import { useTheme } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useMemo } from "react";
import { Platform, StyleSheet, type TextStyle } from "react-native";
import Markdown, { MarkdownIt } from "react-native-markdown-display";

// `linkify` also turns bare URLs into tappable links.
const markdownIt = MarkdownIt({ typographer: true, linkify: true });

type MarkdownMessageProps = {
  children: string;
};

/**
 * Renders assistant replies as markdown inside the chat bubble.
 * Colours mirror the `chat-assistant` tokens in `global.css`.
 */
export function MarkdownMessage({ children }: MarkdownMessageProps) {
  const theme = useTheme();
  const dark = theme.dark;

  const textColor = dark ? "#DAF4DA" : "#143426";
  const linkColor = trustColor(dark);
  const codeBackground = dark
    ? "rgba(218, 244, 218, 0.08)"
    : "rgba(20, 82, 79, 0.08)";
  const ruleColor = dark
    ? "rgba(218, 244, 218, 0.2)"
    : "rgba(20, 52, 38, 0.18)";
  const codeFont = Platform.select({ ios: "Menlo", default: "monospace" });

  const styles = useMemo<Record<string, TextStyle>>(
    () => ({
      body: {
        color: textColor,
        fontSize: 14,
        lineHeight: 20,
      },
      text: {
        color: textColor,
        fontSize: 14,
        lineHeight: 20,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 6,
      },
      strong: {
        color: textColor,
        fontWeight: "700",
      },
      em: {
        color: textColor,
      },
      link: {
        color: linkColor,
        textDecorationLine: "underline",
      },
      bullet_list: {
        marginVertical: 2,
      },
      ordered_list: {
        marginVertical: 2,
      },
      list_item: {
        marginBottom: 2,
      },
      bullet_list_icon: {
        marginLeft: 2,
        marginRight: 8,
      },
      ordered_list_icon: {
        marginLeft: 2,
        marginRight: 8,
      },
      code_inline: {
        backgroundColor: codeBackground,
        borderWidth: 0,
        borderRadius: 4,
        color: textColor,
        fontFamily: codeFont,
        fontSize: 13,
        paddingHorizontal: 4,
        paddingVertical: 1,
      },
      code_block: {
        backgroundColor: codeBackground,
        borderWidth: 0,
        borderRadius: 8,
        color: textColor,
        fontFamily: codeFont,
        fontSize: 12,
        marginVertical: 4,
        padding: 8,
      },
      fence: {
        backgroundColor: codeBackground,
        borderWidth: 0,
        borderRadius: 8,
        color: textColor,
        fontFamily: codeFont,
        fontSize: 12,
        marginVertical: 4,
        padding: 8,
      },
      blockquote: {
        backgroundColor: "transparent",
        borderColor: ruleColor,
        borderLeftWidth: 3,
        marginLeft: 0,
        marginVertical: 4,
        paddingHorizontal: 8,
      },
      hr: {
        backgroundColor: ruleColor,
        height: StyleSheet.hairlineWidth,
        marginVertical: 8,
      },
      heading1: {
        color: textColor,
        fontSize: 18,
        fontWeight: "700",
        lineHeight: 24,
        marginBottom: 4,
        marginTop: 4,
      },
      heading2: {
        color: textColor,
        fontSize: 17,
        fontWeight: "700",
        lineHeight: 23,
        marginBottom: 4,
        marginTop: 4,
      },
      heading3: {
        color: textColor,
        fontSize: 16,
        fontWeight: "700",
        lineHeight: 22,
        marginBottom: 3,
        marginTop: 3,
      },
      heading4: {
        color: textColor,
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
        marginBottom: 2,
        marginTop: 2,
      },
      heading5: {
        color: textColor,
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
      },
      heading6: {
        color: textColor,
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 20,
      },
      table: {
        borderColor: ruleColor,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 6,
        marginVertical: 4,
      },
      tr: {
        borderColor: ruleColor,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      th: {
        color: textColor,
        fontWeight: "700",
        padding: 4,
      },
      td: {
        color: textColor,
        padding: 4,
      },
    }),
    [textColor, linkColor, codeBackground, ruleColor, codeFont]
  );

  const handleLinkPress = useCallback((url: string) => {
    if (/^https?:\/\//i.test(url)) {
      // Open in the in-app browser, same as the scheme cards.
      WebBrowser.openBrowserAsync(url);
    }
    // Returning false stops the library's default Linking.openURL call.
    return false;
  }, []);

  return (
    <Markdown
      style={styles}
      markdownit={markdownIt}
      onLinkPress={handleLinkPress}
    >
      {children}
    </Markdown>
  );
}
