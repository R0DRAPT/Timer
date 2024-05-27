import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, Alert } from 'react-native';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import Constants from 'expo-constants';
import { useCountdown } from 'react-native-countdown-circle-timer';
import * as Notifications from 'expo-notifications';
import { supabase } from '../db/supabase';

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
  const [countdownTime, setCountdownTime] = useState(0);
  const [timerLabel, setTimerLabel] = useState('');

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
          const { Countdown_time, created_at, timerName } = latestCountdown;

          const startTime = new Date(created_at).getTime();
          const currentTime = Date.now();
          const elapsedTime = Math.floor((currentTime - startTime) / 1000);
          const remainingTime = Countdown_time - elapsedTime;

          setCountdownTime(remainingTime > 0 ? remainingTime : 0);
          setTimerLabel(timerName);
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
    isPlaying: true,
    duration: countdownTime,
    colors: 'url(#2006)',
    onComplete: () => {
      Alert.alert("Temporizador concluído");
      scheduleNotification();
    }
  });

  const scheduleNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Temporizador concluído',
        body: 'Seu temporizador chegou ao fim.',
      },
      trigger: null,
    });
  };

  const secondsPresent = remainingTime % 60 !== 0 || elapsedTime === countdownTime;

  const timeFormat = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.countdownContainer}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="2006" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1a1a1a" />
              <Stop offset="100%" stopColor="#f2f2f2" />
            </LinearGradient>
          </Defs>
          <Path
            d={path}
            fill="none"
            stroke="#d9d9d9"
            strokeWidth={strokeWidth}
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
          <Text style={{ fontSize: 36 }}>
            {secondsPresent ? formatTime(remainingTime) : timeFormat(remainingTime)}
          </Text>
        </View>
      </View>
      <TextInput
        style={[styles.input_etiqueta, { textAlign: 'center' }]}
        onChangeText={setTimerName}
        value={timerLabel}
        placeholder=""
        placeholderTextColor="#333333"
        editable={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  countdownContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  time: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
  },
  input_etiqueta: {
    height: 40,
    width: '80%',
    paddingHorizontal: 10,
    borderRadius: 8,
    bottom: 300,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
