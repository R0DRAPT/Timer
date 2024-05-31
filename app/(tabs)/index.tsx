import React, { useState, useEffect } from 'react';
import {View, StyleSheet, Text, TextInput, Alert, useColorScheme, Modal, TouchableOpacity, Vibration} from 'react-native';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import Constants from 'expo-constants';
import { useCountdown } from 'react-native-countdown-circle-timer';
import { supabase } from '../db/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

const formatTime = (time: number): string => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${seconds.toString().padStart(2, '0')}`;
  }
};

export default function App() {
  const [timerName, setTimerName] = useState('');
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [timerLabel, setTimerLabel] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const colorScheme = useColorScheme();

  useEffect(() => {
    async function fetchCountdownData() {
      try {
        const { data, error } = await supabase
            .from('Countdown')
            .select('*')
            .limit(1)
            .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const latestCountdown = data[0];
          const { Countdown_time, timerName, ativado, start_time } = latestCountdown;

          setTimerName(timerName);
          setTimerLabel(timerName);  // Ensure timerLabel is set correctly

          setIsActive(ativado === 1);

          if (ativado === 1) {
            const now = Math.floor(Date.now() / 1000);
            const startTime = Math.floor(new Date(start_time).getTime() / 1000);
            const elapsedTime = now - startTime;
            const remainingTime = Countdown_time - elapsedTime;
            setCountdownTime(remainingTime > 0 ? remainingTime : 0);
          } else {
            setCountdownTime(Countdown_time);
          }
        } else {
          console.log('Nenhum countdown encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do countdown:', (error as Error).message);
      }
    }

    fetchCountdownData();
  }, []);

  const {
    path,
    pathLength,
    stroke,
    strokeDashoffset,
    remainingTime,
    elapsedTime,
    size,
    strokeWidth,
  } = useCountdown({
    isPlaying: isActive,
    duration: countdownTime,
    colors: 'url(#2006)',
    onComplete: () => {
      Alert.alert(
          'Temporizador Concluído',
          `O temporizador "${timerLabel}" foi concluído.`,
          [
            {
              text: 'OK',
              onPress: () => {
                Vibration.cancel();
              },
            },
          ]
      );
      Vibration.vibrate([500, 500, 500, 500, 500], true);
    },
  });

  const renderTimer = () => (
      <View style={styles.countdownContainer}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="2006" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colorScheme === 'dark' ? '#f2f2f2' : '#1a1a1a'} />
              <Stop offset="100%" stopColor={colorScheme === 'dark' ? '#1a1a1a' : '#f2f2f2'} />
            </LinearGradient>
          </Defs>
          <Path
              d={path}
              fill="none"
              // stroke={colorScheme === 'dark' ? '#f2f2f2' : '#1a1a1a'}
              // strokeWidth={strokeWidth}
          />
          {elapsedTime !== countdownTime && (
              <Path
                  d={path}
                  fill="none"
                  stroke={stroke}
                  strokeLinecap="butt"
                  strokeWidth={strokeWidth}
                  strokeDasharray={pathLength}
                  strokeDashoffset={strokeDashoffset}
              />
          )}
        </Svg>
        <View style={styles.time}>
          <Text style={[styles.timeText, colorScheme === 'dark' ? styles.textDark : styles.textLight]}>
            {formatTime(remainingTime)}
          </Text>
        </View>
      </View>
  );

  return (
      <View style={[styles.container, colorScheme === 'dark' ? styles.containerDark : styles.containerLight]}>
        <TextInput
            style={[styles.input_etiqueta, { textAlign: 'center' }, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}
            value={timerLabel}
            placeholder=""
            placeholderTextColor={colorScheme === 'dark' ? '#f2f2f2' : '#333333'}
            editable={false}
        />
        {renderTimer()}
        <TouchableOpacity
            style={[styles.fullscreenButton, colorScheme === 'dark' ? styles.fullscreenButtonDark : styles.fullscreenButtonLight]}
            onPress={() => setIsFullscreen(true)}
        >
          <Icon name="expand-outline" size={36} color={colorScheme === 'dark' ? '#f2f2f2' : '#1a1a1a'} />
        </TouchableOpacity>
        <Modal
            visible={isFullscreen}
            transparent={false}
            animationType="fade"
            onRequestClose={() => setIsFullscreen(false)}
        >
          <View style={[styles.fullscreenContainer, colorScheme === 'dark' ? styles.containerDark : styles.containerLight]}>
            <TouchableOpacity onPress={() => setIsFullscreen(false)} style={styles.closeButton}>
              <Icon name="close-outline" size={36} color={colorScheme === 'dark' ? '#f2f2f2' : '#1a1a1a'} />
            </TouchableOpacity>
            <TextInput
                style={[styles.input_etiqueta, { textAlign: 'center' }, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}
                value={timerLabel}
                editable={false}
            />
            {renderTimer()}
          </View>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    padding: 8,
  },
  containerLight: {
    backgroundColor: '#ecf0f1',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  countdownContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullscreenButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
  },
  fullscreenButtonLight: {
    backgroundColor: '#ecf0f1',
  },
  fullscreenButtonDark: {
    backgroundColor: '#1a1a1a',
  },
  time: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
  },
  timeText: {
    fontSize: 36,
  },
  textLight: {
    color: '#1a1a1a',
  },
  textDark: {
    color: '#f2f2f2',
  },
  input_etiqueta: {
    height: 40,
    width: '80%',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 20, 
    fontSize: 26,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  inputLight: {
    color: '#1a1a1a',
  },
  inputDark: {
    color: '#f2f2f2',
  },
});
