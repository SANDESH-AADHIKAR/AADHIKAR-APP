import { MarkdownMessage } from "@/components/MarkdownMessage";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { mutedColor, ON_PRIMARY } from "@/constants/theme";
import {
  describeGeminiError,
  hasGeminiKey,
  streamAadhikar,
} from "@/lib/gemini";
import { useTheme } from "expo-router";
import { Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** Error bubbles are shown to the user but never sent to the model. */
  isError?: boolean;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Namaste! I'm Aadhikar AI. Tell me a little about yourself — your state, age, occupation or family situation — and I'll help you find government schemes you may be eligible for.",
};

const SUGGESTIONS = [
  "Which schemes am I eligible for?",
  "What documents do I need?",
  "How do I apply for PM-KISAN?",
];

/** TextInput content height (excluding the wrapper's vertical padding). */
const MIN_INPUT_HEIGHT = 24;
const MAX_INPUT_HEIGHT = 88;

export default function ChatScreen() {
  const theme = useTheme();
  const muted = mutedColor(theme.dark);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      activeRequest.current?.abort();
    };
  }, []);

  // Keep the latest messages visible when the keyboard opens.
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      );
    });

    return () => subscription.remove();
  }, []);

  // A growing composer reduces the message area, so keep the bottom in view.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });

    return () => cancelAnimationFrame(frame);
  }, [inputHeight]);

  const resizeInput = (contentHeight: number) => {
    const nextHeight = Math.min(
      MAX_INPUT_HEIGHT,
      Math.max(MIN_INPUT_HEIGHT, contentHeight)
    );

    setInputHeight((current) =>
      Math.abs(current - nextHeight) > 0.5 ? nextHeight : current
    );
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || busyRef.current) return;

    busyRef.current = true;

    const history = messages
      .filter(
        (message) => message.id !== WELCOME_MESSAGE.id && !message.isError
      )
      .map((message) => ({ role: message.role, text: message.text }));

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text },
    ]);
    setInput("");
    setIsTyping(true);

    const controller = new AbortController();
    activeRequest.current = controller;
    let assistantId: string | null = null;

    try {
      await streamAadhikar(
        [...history, { role: "user", text }],
        (delta) => {
          if (assistantId === null) {
            const id = `assistant-${Date.now()}`;
            assistantId = id;
            setMessages((current) => [
              ...current,
              { id, role: "assistant", text: delta },
            ]);
          } else {
            const id = assistantId;
            setMessages((current) =>
              current.map((message) =>
                message.id === id
                  ? { ...message, text: message.text + delta }
                  : message
              )
            );
          }
        },
        { signal: controller.signal }
      );

      if (assistantId !== null) {
        const id = assistantId;
        setMessages((current) =>
          current.map((message) =>
            message.id === id
              ? { ...message, text: message.text.trim() }
              : message
          )
        );
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            text: describeGeminiError(error),
            isError: true,
          },
        ]);
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      busyRef.current = false;
      setIsTyping(false);
    }
  };

  const showSuggestions = messages.length === 1 && !isTyping;
  const lastMessage = messages[messages.length - 1];
  const showTyping = isTyping && lastMessage?.role !== "assistant";

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-background"
      style={{ flex: 1 }}
    >
      <View className="flex-row items-center gap-3 border-b border-border px-5 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Text className="text-base font-bold text-primary-foreground">A</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-foreground">
            Aadhikar AI
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View
              className={`h-1.5 w-1.5 rounded-full ${
                hasGeminiKey ? "bg-success" : "bg-warning"
              }`}
            />
            <Text className="text-xs text-muted-foreground">
              {hasGeminiKey
                ? "Online · Powered by Gemini"
                : "Offline · Gemini API key needed"}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        automaticOffset
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            gap: 16,
            paddingHorizontal: 30,
            paddingTop: 24,
            paddingBottom: 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          alwaysBounceVertical
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          <Text className="self-center text-xs text-muted-foreground">
            Today
          </Text>

          {messages.map((message) => {
            const isUser = message.role === "user";
            const isError = message.isError === true;

            return (
              <View
                key={message.id}
                className={`max-w-[85%] gap-1 ${
                  isUser ? "items-end self-end" : "items-start self-start"
                }`}
              >
                <View
                  className={`rounded-2xl px-5 py-3.5 ${
                    isUser
                      ? "rounded-br-md bg-chat-user"
                      : isError
                        ? "rounded-bl-md border border-destructive/40 bg-destructive/10"
                        : "rounded-bl-md bg-chat-assistant"
                  }`}
                >
                  {isUser || isError ? (
                    <Text
                      className={`text-sm leading-5 ${
                        isUser
                          ? "text-chat-user-foreground"
                          : "text-destructive"
                      }`}
                    >
                      {message.text}
                    </Text>
                  ) : (
                    <MarkdownMessage>{message.text}</MarkdownMessage>
                  )}
                </View>
                <Text className="px-1 text-xs text-muted-foreground">
                  {isUser ? "You" : "Aadhikar AI"}
                </Text>
              </View>
            );
          })}

          {showSuggestions ? (
            <View className="gap-2 pt-1">
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => sendMessage(suggestion)}
                  className="self-start rounded-full border border-border bg-accent px-3.5 py-2"
                >
                  <Text className="text-xs font-medium text-accent-foreground">
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {showTyping ? (
            <View className="self-start rounded-2xl rounded-bl-md bg-chat-assistant px-5 py-3.5">
              <Text className="text-sm text-chat-assistant-foreground">
                Aadhikar AI is typing...
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-border px-4 pb-2 pt-3">
          <View className="flex-row items-end gap-2">
            <View className="min-h-12 flex-1 justify-center rounded-2xl border border-input bg-card px-4 py-3">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about any scheme..."
                placeholderTextColor={muted}
                className="text-sm text-foreground"
                style={{ height: inputHeight, paddingVertical: 0 }}
                multiline
                onContentSizeChange={(event) =>
                  resizeInput(event.nativeEvent.contentSize.height)
                }
                onSubmitEditing={() => sendMessage(input)}
                returnKeyType="send"
              />
            </View>

            <Pressable
              accessibilityLabel="Send message"
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className={`h-12 w-12 items-center justify-center rounded-2xl ${
                input.trim() && !isTyping ? "bg-primary" : "bg-secondary"
              }`}
            >
              <Send
                size={18}
                color={input.trim() && !isTyping ? ON_PRIMARY : muted}
              />
            </Pressable>
          </View>

          <Text className="mt-2 text-center text-xs text-muted-foreground">
            Aadhikar AI can make mistakes. Verify details with official sources.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
