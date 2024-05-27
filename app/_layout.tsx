import React, { useState } from 'react';
import { Pressable, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter } from 'expo-router';
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

// LogoutComponent com a lógica de logout
const LogoutComponent: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [spaces, setSpaces] = useState([]);
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Confirmação',
      'Tem a certeza que pretende sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sim',
          onPress: () => {
            setSpaces([]);
            router.replace('/two'); 
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <Pressable onPress={handleLogout}>
      {({ pressed }) => (
        <FontAwesome
          name="sign-out"
          size={25}
          color={isDarkMode ? '#FFFFFF' : '#000000'}
          style={{ marginLeft: 10, marginTop: 8, opacity: pressed ? 0.5 : 1 }}
        />
      )}
    </Pressable>
  );
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return <RootLayoutNav LogoutComponent={LogoutComponent} isDarkMode={isDarkMode} />;
}

function RootLayoutNav({ LogoutComponent, isDarkMode }: { LogoutComponent: React.ComponentType<{ isDarkMode: boolean }>, isDarkMode: boolean }) {
  const renderHeaderRight = () => (
    <LogoutComponent isDarkMode={isDarkMode} />
  );

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Voltar' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Adicionar Temporizador' }} />
        <Stack.Screen name="adicionarEspaco" options={{ presentation: 'modal', title: 'Adicionar Espaço' }} />
        <Stack.Screen 
          name="definicoesAdmin" 
          options={{ 
            presentation: 'modal', 
            title: 'Definições do Administrador',
            headerRight: renderHeaderRight // Adicionando o ícone de logout ao lado direito do cabeçalho.
          }} />
        <Stack.Screen
          name="administrador"
          options={{
            presentation: 'card',
            title: 'Administrador',
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
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
