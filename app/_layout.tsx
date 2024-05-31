import React from 'react';
import { Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
      <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Voltar' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Adicionar Temporizador' }} />
          <Stack.Screen name="definicoesAdmin" options={{ presentation: 'modal', title: 'Definições do Administrador' }} />
          <Stack.Screen name="adicionarTemporizador" options={{ presentation: 'modal', title: 'Adicionar Temporizador' }} />
          <Stack.Screen
              name="administrador"
              options={{
                presentation: 'card',
                title: 'Administrador',
                headerRight: () => (
                    <Link href="/adicionarTemporizador" asChild>
                      <Pressable>
                        {({ pressed }) => (
                            <FontAwesome
                                name="plus-circle"
                                size={25}
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                                style={{ marginLeft: 10, marginTop: 8, opacity: pressed ? 0.5 : 1 }}
                            />
                        )}
                      </Pressable>
                    </Link>
                ),
                headerLeft: () => (
                    <Link href="/definicoesAdmin" asChild>
                      <Pressable>
                        {({ pressed }) => (
                            <FontAwesome
                                name="cog"
                                size={25}
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                                style={{ marginRight: 10, marginTop: 8, opacity: pressed ? 0.5 : 1 }}
                            />
                        )}
                      </Pressable>
                    </Link>
                ),
              }}
          />
        </Stack>
      </ThemeProvider>
  );
}
