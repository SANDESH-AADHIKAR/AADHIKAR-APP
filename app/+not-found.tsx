import React from 'react';
import { Link, Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Center className="flex-1 bg-background">
        <Text className="text-muted-foreground">This screen doesn't exist.</Text>
        <Link href="/" style={{ marginTop: 10 }}>
          <Text className="text-trust">Go to home screen!</Text>
        </Link>
      </Center>
    </>
  );
}
