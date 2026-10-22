import Logo from "@/assets/icons/Logo";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { mutedColor, ON_PRIMARY } from "@/constants/theme";
import { useSchemes } from "@/hooks/useSchemes";
import {
  buildSchemeContext,
  describeGeminiError,
  hasGeminiKey,
  streamAadhikar,
} from "@/lib/gemini";
import { useAuth } from "@/providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useTheme } from "expo-router";
import {
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
  isError?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const MIN_INPUT_HEIGHT = 24;
const MAX_INPUT_HEIGHT = 88;

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const muted = mutedColor(theme.dark);
  const { session, user, isLoading: isAuthLoading, signOut } = useAuth();

  const WELCOME_MESSAGE = useMemo<ChatMessage>(
    () => ({
      id: "welcome",
      role: "assistant",
      text: t(
        "chat_welcome",
        "Namaste! I'm Aadhikar AI. Tell me a little about yourself — your state, age, occupation or family situation — and I'll help you find government schemes you may be eligible for.",
      ),
    }),
    [t],
  );

  const SUGGESTIONS = useMemo(
    () => [
      t("suggest_1", "Which schemes am I eligible for?"),
      t("suggest_2", "What documents do I need?"),
      t("suggest_3", "How do I apply for PM-KISAN?"),
    ],
    [t],
  );

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [input, setInput] = useState("");
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [isTyping, setIsTyping] = useState(false);

  const { schemes } = useSchemes();
  const schemeContext = useMemo(() => buildSchemeContext(schemes), [schemes]);

  const scrollRef = useRef<ScrollView>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  // 1. LOAD ALL SESSIONS ON MOUNT
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setSessions([]);
        setIsHistoryLoaded(true);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(`chat_sessions_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatSession[];
          setSessions(parsed.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsHistoryLoaded(true);
        // Start fresh every time the app opens
        setActiveSessionId(null);
        setMessages([WELCOME_MESSAGE]);
      }
    };

    if (!isAuthLoading) {
      loadHistory();
    }
  }, [user?.id, isAuthLoading, WELCOME_MESSAGE]);

  // 2. AUTO-SAVE SESSION WHEN STREAM FINISHES
  useEffect(() => {
    if (!isHistoryLoaded || !user?.id || isTyping || !activeSessionId) return;

    const cleanMessages = messages.filter((m) => !m.isError);
    if (cleanMessages.length <= 1) return; // Don't save empty chats

    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, updatedAt: Date.now(), messages: cleanMessages }
          : s,
      );
      AsyncStorage.setItem(
        `chat_sessions_${user.id}`,
        JSON.stringify(updated),
      ).catch(console.error);
      return updated;
    });
  }, [isTyping, messages, activeSessionId, isHistoryLoaded, user?.id]);

  useEffect(() => {
    return () => {
      activeRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !session) {
      activeRequest.current?.abort();
      busyRef.current = false;
      setIsTyping(false);
      Keyboard.dismiss();
    }
  }, [isAuthLoading, session]);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [inputHeight, messages.length]);

  const resizeInput = (contentHeight: number) => {
    const nextHeight = Math.min(
      MAX_INPUT_HEIGHT,
      Math.max(MIN_INPUT_HEIGHT, contentHeight),
    );
    setInputHeight((current) =>
      Math.abs(current - nextHeight) > 0.5 ? nextHeight : current,
    );
  };

  const handleNewChat = () => {
    activeRequest.current?.abort();
    busyRef.current = false;
    setIsTyping(false);
    setActiveSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setIsHistoryOpen(false);
  };

  const loadSession = (id: string) => {
    const selected = sessions.find((s) => s.id === id);
    if (selected) {
      activeRequest.current?.abort();
      busyRef.current = false;
      setIsTyping(false);
      setActiveSessionId(id);
      setMessages(selected.messages);
      setIsHistoryOpen(false);
    }
  };

  const deleteSession = async (id: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== id);
    setSessions(updatedSessions);
    if (user?.id) {
      await AsyncStorage.setItem(
        `chat_sessions_${user.id}`,
        JSON.stringify(updatedSessions),
      );
    }
    // If we deleted the active chat, reset to a new chat
    if (activeSessionId === id) {
      handleNewChat();
    }
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || busyRef.current) return;
    if (!session) return;

    busyRef.current = true;

    // Create session ID if this is a brand new chat
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      setActiveSessionId(currentSessionId);
      const title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
      setSessions((prev) => [
        { id: currentSessionId, title, updatedAt: Date.now(), messages: [] },
        ...prev,
      ]);
    }

    const history = messages
      .filter(
        (message) => message.id !== WELCOME_MESSAGE.id && !message.isError,
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

    const langNames: Record<string, string> = {
      en: "English",
      hi: "Hindi",
      mr: "Marathi",
    };
    const currentLangName = langNames[i18n.language] || "English";
    const localizedContext = `${schemeContext}\n\nIMPORTANT INSTRUCTION: You must reply to the user entirely in ${currentLangName}. Current language context: ${currentLangName}.`;

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
                  : message,
              ),
            );
          }
        },
        { signal: controller.signal, schemeContext: localizedContext },
      );

      if (assistantId !== null) {
        const id = assistantId;
        setMessages((current) =>
          current.map((message) =>
            message.id === id
              ? { ...message, text: message.text.trim() }
              : message,
          ),
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

  const handleSignOut = () => {
    activeRequest.current?.abort();
    router.replace("/");
    void signOut();
  };

  const showSuggestions = messages.length === 1 && !isTyping;
  const lastMessage = messages[messages.length - 1];
  const showTyping = isTyping && lastMessage?.role !== "assistant";

  if (!isHistoryLoaded && session) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-background"
      style={{ flex: 1 }}
    >
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        {session ? (
          <Button
            variant="ghost"
            size="icon"
            onPress={() => setIsHistoryOpen(true)}
          >
            <Menu size={22} color={theme.colors.text} />
          </Button>
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-white">
            <Logo size={30} />
          </View>
        )}

        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-foreground">
            Aadhikar AI
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View
              className={`h-1.5 w-1.5 rounded-full ${hasGeminiKey ? "bg-success" : "bg-warning"}`}
            />
            <Text className="text-xs text-muted-foreground">
              {hasGeminiKey
                ? t("chat_online", "Online · Powered by Gemini")
                : t("chat_offline", "Offline · Gemini API key needed")}
            </Text>
          </View>
        </View>

        {session ? (
          <HStack space="sm" className="items-center">
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={t("chat_new", "New Chat")}
              onPress={handleNewChat}
            >
              <Plus size={22} color={theme.colors.text} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={t("chat_sign_out", "Sign out")}
              onPress={handleSignOut}
            >
              <LogOut size={20} color={muted} />
            </Button>
          </HStack>
        ) : null}
      </View>

      {/* CHAT HISTORY ACTIONSHEET */}
      <Actionsheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="h-[75%] max-h-[75%] bg-card pb-10">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full px-5 py-4 flex-1">
            <HStack className="items-center justify-between mb-4">
              <Heading size="lg" className="text-foreground">
                {t("chat_history_title", "Chat History")}
              </Heading>
              <Button
                variant="outline"
                size="sm"
                onPress={handleNewChat}
                className="rounded-full"
              >
                <Plus size={16} color={theme.colors.text} className="mr-1" />
                <ButtonText>{t("chat_new", "New Chat")}</ButtonText>
              </Button>
            </HStack>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {sessions.length === 0 ? (
                <View className="items-center py-10 opacity-60">
                  <MessageSquare size={32} color={muted} className="mb-2" />
                  <Text className="text-muted-foreground">
                    {t("chat_no_history", "No past conversations.")}
                  </Text>
                </View>
              ) : (
                sessions.map((session) => (
                  <HStack
                    key={session.id}
                    className="w-full items-center justify-between py-4 border-b border-border"
                  >
                    <Pressable
                      onPress={() => loadSession(session.id)}
                      className="flex-1 pr-4"
                    >
                      <Text
                        className={`text-sm font-medium ${activeSessionId === session.id ? "text-primary" : "text-foreground"}`}
                        numberOfLines={1}
                      >
                        {session.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </Text>
                    </Pressable>
                    <Button
                      variant="ghost"
                      size="icon"
                      onPress={() => deleteSession(session.id)}
                    >
                      <Trash2 size={18} color={theme.colors.destructive} />
                    </Button>
                  </HStack>
                ))
              )}
            </ScrollView>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

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
          {messages.map((message) => {
            const isUser = message.role === "user";
            const isError = message.isError === true;

            return (
              <View
                key={message.id}
                className={`max-w-[85%] gap-1 ${isUser ? "items-end self-end" : "items-start self-start"}`}
              >
                <View
                  className={`rounded-2xl px-5 py-3.5 ${isUser ? "rounded-br-md bg-chat-user" : isError ? "rounded-bl-md border border-destructive/40 bg-destructive/10" : "rounded-bl-md bg-chat-assistant"}`}
                >
                  {isUser || isError ? (
                    <Text
                      className={`text-sm leading-5 ${isUser ? "text-chat-user-foreground" : "text-destructive"}`}
                    >
                      {message.text}
                    </Text>
                  ) : (
                    <MarkdownMessage>{message.text}</MarkdownMessage>
                  )}
                </View>
                <Text className="px-1 text-xs text-muted-foreground">
                  {isUser ? t("chat_you", "You") : "Aadhikar AI"}
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
                {t("chat_typing", "Aadhikar AI is typing...")}
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
                placeholder={t("chat_input_ph", "Ask about any scheme...")}
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
              accessibilityLabel={t("chat_send_msg", "Send message")}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className={`h-12 w-12 items-center justify-center rounded-2xl ${input.trim() && !isTyping ? "bg-primary" : "bg-secondary"}`}
            >
              <Send
                size={18}
                color={input.trim() && !isTyping ? ON_PRIMARY : muted}
              />
            </Pressable>
          </View>
          <Text className="mt-2 text-center text-xs text-muted-foreground">
            {t(
              "chat_disclaimer",
              "Aadhikar AI can make mistakes. Verify details with official sources.",
            )}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {!session ? (
        <View
          className="absolute inset-0 z-30 items-center justify-center px-5"
          accessibilityViewIsModal
          onStartShouldSetResponder={() => true}
        >
          <View
            className="absolute inset-0"
            style={{ backgroundColor: theme.colors.background, opacity: 0.92 }}
            pointerEvents="none"
          />
          <Card
            className="w-full max-w-md gap-5 rounded-2xl"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }}
          >
            <VStack space="sm" className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-trust-tint">
                <ShieldCheck size={28} color={theme.colors.primary} />
              </View>
              <Heading size="xl" className="text-center text-foreground">
                {t("chat_signin_title", "Sign in to use the AI chatbot")}
              </Heading>
              <Text className="max-w-sm text-center text-sm leading-5 text-muted-foreground">
                {t(
                  "chat_signin_desc",
                  "Browsing schemes stays free. Sign in to ask Aadhikar AI about eligibility, benefits, and how to apply.",
                )}
              </Text>
            </VStack>

            {isAuthLoading ? (
              <HStack space="sm" className="items-center justify-center">
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text className="text-sm text-muted-foreground">
                  {t("chat_checking_session", "Checking your session...")}
                </Text>
              </HStack>
            ) : (
              <Button
                className="min-h-12 rounded-xl"
                onPress={() => router.push("/auth")}
              >
                <LogIn size={18} color={ON_PRIMARY} />
                <ButtonText>{t("chat_signin_btn", "Sign in")}</ButtonText>
              </Button>
            )}
            <HStack space="sm" className="items-center justify-center">
              <ShieldCheck size={14} color={muted} />
              <Text className="text-xs text-muted-foreground">
                {t("chat_secure_access", "Secure access with Supabase")}
              </Text>
            </HStack>
          </Card>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
