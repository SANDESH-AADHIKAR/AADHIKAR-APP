'use client';

import Logo from '@/assets/icons/Logo';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelAstrick,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ON_PRIMARY, mutedColor, trustColor } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useTheme } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthMode = 'sign-in' | 'sign-up';

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const muted = mutedColor(theme.dark);
  const trustInk = trustColor(theme.dark);
  const { session, isLoading, isConfigured, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/chat');
      }
    }
  }, [isLoading, router, session]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'sign-up') {
      if (!confirmPassword) {
        nextErrors.confirmPassword = 'Confirm your password.';
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !isConfigured) return;

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setError(null);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const result =
        mode === 'sign-in'
          ? await signIn(email, password)
          : await signUp(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.needsConfirmation) {
        setNotice(
          'Account created. Check your email to confirm it, then sign in below.'
        );
        setMode('sign-in');
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const handleBrowse = () => {
    router.replace('/');
  };

  if (isLoading || session) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-background"
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <VStack className="flex-1 items-center justify-center gap-3 px-5">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text className="text-sm text-muted-foreground">
            {session ? 'Taking you to Aadhikar AI...' : 'Checking your session...'}
          </Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background"
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerClassName="px-5 py-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VStack space="xl" className="mx-auto w-full max-w-md">
            <HStack className="items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3"
                onPress={handleBack}
              >
                <ArrowLeft size={16} color={muted} />
                <ButtonText className="text-muted-foreground">Back</ButtonText>
              </Button>
              <View className="rounded-full border border-border px-2.5 py-1">
                <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Secure access
                </Text>
              </View>
            </HStack>

            <VStack space="sm" className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full border border-border bg-white">
                <Logo size={48} />
              </View>
              <Heading size="2xl" className="text-center text-foreground">
                Meet Aadhikar AI
              </Heading>
              <Text className="max-w-sm text-center text-sm leading-5 text-muted-foreground">
                Browse every scheme without an account. Sign in only when you
                want to ask the AI for guidance.
              </Text>
            </VStack>

            <Card
              className="gap-5 rounded-2xl"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              }}
            >
              <HStack className="rounded-xl border border-border bg-muted p-1" space="xs">
                <Button
                  variant={mode === 'sign-in' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onPress={() => switchMode('sign-in')}
                >
                  <ButtonText>Sign in</ButtonText>
                </Button>
                <Button
                  variant={mode === 'sign-up' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onPress={() => switchMode('sign-up')}
                >
                  <ButtonText>Create account</ButtonText>
                </Button>
              </HStack>

              {!isConfigured ? (
                <Alert variant="destructive">
                  <AlertIcon as={AlertCircle} />
                  <AlertText>
                    Supabase is not configured. Add the URL and publishable key
                    to .env, then restart Expo.
                  </AlertText>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertIcon as={AlertCircle} />
                  <AlertText>{error}</AlertText>
                </Alert>
              ) : null}

              {notice ? (
                <Alert>
                  <AlertIcon as={CheckCircle2} />
                  <AlertText>{notice}</AlertText>
                </Alert>
              ) : null}

              <VStack space="md">
                <FormControl isInvalid={Boolean(fieldErrors.email)}>
                  <FormControlLabel>
                    <FormControlLabelText>Email</FormControlLabelText>
                    <FormControlLabelAstrick>*</FormControlLabelAstrick>
                  </FormControlLabel>
                  <Input
                    className="min-h-12 rounded-xl bg-background"
                    isInvalid={Boolean(fieldErrors.email)}
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <InputSlot className="pl-3">
                      <Mail size={16} color={muted} />
                    </InputSlot>
                    <InputField
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        if (fieldErrors.email) {
                          setFieldErrors((current) => ({
                            ...current,
                            email: undefined,
                          }));
                        }
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor={muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                    />
                  </Input>
                  {fieldErrors.email ? (
                    <FormControlError>
                      <FormControlErrorText>
                        {fieldErrors.email}
                      </FormControlErrorText>
                    </FormControlError>
                  ) : null}
                </FormControl>

                <FormControl isInvalid={Boolean(fieldErrors.password)}>
                  <FormControlLabel>
                    <FormControlLabelText>Password</FormControlLabelText>
                    <FormControlLabelAstrick>*</FormControlLabelAstrick>
                  </FormControlLabel>
                  <Input
                    className="min-h-12 rounded-xl bg-background"
                    isInvalid={Boolean(fieldErrors.password)}
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <InputSlot className="pl-3">
                      <Lock size={16} color={muted} />
                    </InputSlot>
                    <InputField
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (fieldErrors.password) {
                          setFieldErrors((current) => ({
                            ...current,
                            password: undefined,
                          }));
                        }
                      }}
                      placeholder="At least 6 characters"
                      placeholderTextColor={muted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete={
                        mode === 'sign-in' ? 'current-password' : 'new-password'
                      }
                      textContentType={
                        mode === 'sign-in' ? 'password' : 'newPassword'
                      }
                      returnKeyType={mode === 'sign-in' ? 'go' : 'next'}
                      onSubmitEditing={
                        mode === 'sign-in' ? handleSubmit : undefined
                      }
                    />
                    <InputSlot
                      className="pr-3"
                      onPress={() => setShowPassword((current) => !current)}
                      accessibilityLabel={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={16} color={muted} />
                      ) : (
                        <Eye size={16} color={muted} />
                      )}
                    </InputSlot>
                  </Input>
                  {fieldErrors.password ? (
                    <FormControlError>
                      <FormControlErrorText>
                        {fieldErrors.password}
                      </FormControlErrorText>
                    </FormControlError>
                  ) : mode === 'sign-up' ? (
                    <FormControlHelper>
                      <FormControlHelperText>
                        Use at least 6 characters.
                      </FormControlHelperText>
                    </FormControlHelper>
                  ) : null}
                </FormControl>

                {mode === 'sign-up' ? (
                  <FormControl isInvalid={Boolean(fieldErrors.confirmPassword)}>
                    <FormControlLabel>
                      <FormControlLabelText>
                        Confirm password
                      </FormControlLabelText>
                      <FormControlLabelAstrick>*</FormControlLabelAstrick>
                    </FormControlLabel>
                    <Input
                      className="min-h-12 rounded-xl bg-background"
                      isInvalid={Boolean(fieldErrors.confirmPassword)}
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <InputSlot className="pl-3">
                        <Lock size={16} color={muted} />
                      </InputSlot>
                      <InputField
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors((current) => ({
                              ...current,
                              confirmPassword: undefined,
                            }));
                          }
                        }}
                        placeholder="Repeat your password"
                        placeholderTextColor={muted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="go"
                        onSubmitEditing={handleSubmit}
                      />
                    </Input>
                    {fieldErrors.confirmPassword ? (
                      <FormControlError>
                        <FormControlErrorText>
                          {fieldErrors.confirmPassword}
                        </FormControlErrorText>
                      </FormControlError>
                    ) : null}
                  </FormControl>
                ) : null}
              </VStack>

              <Button
                size="lg"
                className="min-h-12 rounded-xl"
                onPress={handleSubmit}
                isDisabled={isSubmitting || !isConfigured}
              >
                {isSubmitting ? (
                  <ButtonSpinner color={ON_PRIMARY} />
                ) : mode === 'sign-in' ? (
                  <LogIn size={18} color={ON_PRIMARY} />
                ) : (
                  <UserPlus size={18} color={ON_PRIMARY} />
                )}
                <ButtonText>
                  {isSubmitting
                    ? mode === 'sign-in'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : mode === 'sign-in'
                      ? 'Sign in'
                      : 'Create account'}
                </ButtonText>
              </Button>

              <HStack space="sm" className="items-center justify-center">
                <ShieldCheck size={14} color={muted} />
                <Text className="text-xs text-muted-foreground">
                  Secured by Supabase
                </Text>
              </HStack>
            </Card>

            <VStack space="sm" className="rounded-2xl bg-trust-tint p-4">
              <HStack space="sm" className="items-center">
                <Sparkles size={16} color={theme.colors.primary} />
                <Text className="text-sm font-semibold text-foreground">
                  What stays free
                </Text>
              </HStack>
              <HStack space="sm" className="items-start">
                <CheckCircle2 size={15} color={trustInk} />
                <Text className="flex-1 text-xs leading-4 text-muted-foreground">
                  Browse, search and filter all government schemes.
                </Text>
              </HStack>
              <HStack space="sm" className="items-start">
                <CheckCircle2 size={15} color={trustInk} />
                <Text className="flex-1 text-xs leading-4 text-muted-foreground">
                  Open official application links without signing in.
                </Text>
              </HStack>
            </VStack>

            <Button variant="link" onPress={handleBrowse}>
              <ButtonText>Continue browsing without signing in</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
