import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, Pressable, Vibration, Platform, useColorScheme  } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';
import { supabase } from './db/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

type Timer = {
    id: number;
    nome: string;
    initialFormattedTime: string;
    countdownTime: number;
    startTime: number | null;
    ativado: boolean;
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

async function registerForPushNotificationsAsync() {
    let token;
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}

const Administrador = () => {
    const route = useRoute();
    const router = useRouter();
    const [timers, setTimers] = useState<Timer[]>([]);
    const [collapsed, setCollapsed] = useState<number | null>(null);
    const [runningTimers, setRunningTimers] = useState<{ [key: number]: boolean }>({});
    const [authenticated, setAuthenticated] = useState(true);
    const [alertedTimers, setAlertedTimers] = useState<Set<number>>(new Set());

    useEffect(() => {
        registerForPushNotificationsAsync();

        const fetchTimers = async () => {
            try {
                let { data: timers, error } = await supabase
                    .from('Countdown')
                    .select('id, timerName, Countdown_Formated, Countdown_time, start_time, ativado');

                if (error) {
                    throw error;
                }

                if (timers) {
                    const fetchedTimers = timers.map(timer => {
                        let countdownTime = timer.Countdown_time;
                        if (timer.start_time) {
                            const elapsedTime = Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000);
                            countdownTime = Math.max(timer.Countdown_time - elapsedTime, 0);
                        }

                        return {
                            id: timer.id,
                            nome: timer.timerName,
                            initialFormattedTime: timer.Countdown_Formated || '00:00:00',
                            countdownTime,
                            startTime: timer.start_time ? new Date(timer.start_time).getTime() : null,
                            ativado: timer.ativado === 1,
                        };
                    });
                    setTimers(fetchedTimers);
                }
            } catch (error) {
                Alert.alert('Erro', 'Ocorreu um erro ao buscar os temporizadores');
            }
        };

        fetchTimers();

        const subscription = supabase
            .channel('public:Countdown')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Countdown' }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    const newTimer = {
                        id: payload.new.id,
                        nome: payload.new.timerName,
                        initialFormattedTime: payload.new.Countdown_Formated || '00:00:00',
                        countdownTime: payload.new.Countdown_time,
                        startTime: payload.new.start_time ? new Date(payload.new.start_time).getTime() : null,
                        ativado: payload.new.ativado === 1,
                    };
                    setTimers((prevTimers) => [...prevTimers, newTimer]);
                } else if (payload.eventType === 'UPDATE') {
                    setTimers((prevTimers) =>
                        prevTimers.map(timer =>
                            timer.id === payload.new.id
                                ? {
                                    ...timer,
                                    nome: payload.new.timerName,
                                    initialFormattedTime: payload.new.Countdown_Formated || '00:00:00',
                                    countdownTime: payload.new.Countdown_time,
                                    startTime: payload.new.start_time ? new Date(payload.new.start_time).getTime() : null,
                                    ativado: payload.new.ativado === 1,
                                }
                                : timer
                        )
                    );
                } else if (payload.eventType === 'DELETE') {
                    setTimers((prevTimers) => prevTimers.filter(timer => timer.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimers(prevTimers => {
                const updatedTimers = prevTimers.map(timer => {
                    if (runningTimers[timer.id]) {
                        const newTime = timer.countdownTime - 1;
                        if (newTime >= 0) {
                            supabase
                                .from('Countdown')
                                .update({
                                    Countdown_time: newTime,
                                    Countdown_Formated: formatTime(newTime)
                                })
                                .eq('id', timer.id);
                            return { ...timer, countdownTime: newTime };
                        } else {
                            if (!alertedTimers.has(timer.id)) {
                                setAlertedTimers(prev => new Set(prev).add(timer.id));
                                setRunningTimers(prev => ({ ...prev, [timer.id]: false }));
                                Vibration.vibrate([500, 500, 500, 500, 500], true);

                                // Send notification
                                Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: 'Temporizador Concluído',
                                        body: `O temporizador "${timer.nome}" foi concluído.`,
                                    },
                                    trigger: null,
                                });

                                supabase
                                    .from('Countdown')
                                    .update({ ativado: 0 })
                                    .eq('id', timer.id);

                                Alert.alert(
                                    'Temporizador Concluído',
                                    `O temporizador "${timer.nome}" foi concluído.`,
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                Vibration.cancel();
                                                setTimers(prevTimers => prevTimers.map(t => (t.id === timer.id ? { ...t, countdownTime: 0, ativado: false } : t)));
                                                setRunningTimers(prev => ({ ...prev, [timer.id]: false }));
                                                setAlertedTimers(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(timer.id);
                                                    return newSet;
                                                });
                                            },
                                        },
                                    ]
                                );
                            }
                        }
                    }
                    return timer;
                });
                return updatedTimers;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [runningTimers, alertedTimers]);

    useEffect(() => {
        timers.forEach(timer => {
            if (timer.ativado && !runningTimers[timer.id]) {
                setRunningTimers(prev => ({ ...prev, [timer.id]: true }));
            }
        });
    }, [timers]);

    const toggleExpanded = (id: number) => {
        setCollapsed(collapsed === id ? null : id);
    };

    const resetTimer = (id: number) => {
        const timer = timers.find(timer => timer.id === id);
        if (timer) {
            const initialSeconds = timer.countdownTime;
            setTimers(prevTimers => prevTimers.map(t => (t.id === id ? { ...t, countdownTime: initialSeconds } : t)));
            setRunningTimers(prev => ({ ...prev, [id]: false }));
        }
    };

    const confirmDeleteTimer = (id: number) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza de que deseja excluir este temporizador?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => deleteTimer(id)
                }
            ]
        );
    };

    const deleteTimer = async (id: number) => {
        try {
            const { error } = await supabase
                .from('Countdown')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            setTimers((prevTimers) => prevTimers.filter(timer => timer.id !== id));
            setRunningTimers((prevRunning) => {
                const { [id]: _, ...rest } = prevRunning;
                return rest;
            });
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao deletar o temporizador');
        }
    };

    const deactivateTimer = async (id: number) => {
        try {
            const { error } = await supabase
                .from('Countdown')
                .update({ ativado: 0 })
                .eq('id', id);

            if (error) {
                throw error;
            }

            Alert.alert('Sucesso', 'Temporizador desativado!');
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao desativar o temporizador');
        }

        setRunningTimers(prev => ({ ...prev, [id]: false }));
    };

    const activateTimer = async (id: number) => {
        const startTime = Date.now();
        try {
            const { error } = await supabase
                .from('Countdown')
                .update({ ativado: 1, start_time: new Date(startTime).toISOString() })
                .eq('id', id);

            if (error) {
                throw error;
            }

            Alert.alert('Sucesso', 'Temporizador ativado com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao ativar o temporizador');
        }

        setRunningTimers(prev => ({ ...prev, [id]: true }));
    };

    const formatTime = (seconds: number) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

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
                    text: 'Sair',
                    onPress: () => {
                        setAuthenticated(false);
                        router.replace('/two');
                    },
                },
            ]
        );
    };

    const theme = useColorScheme();
    const isDarkMode = theme === 'dark';
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDarkMode ? '#000000' : '#FFF',
            paddingHorizontal: 16,
            paddingVertical: 24,
        },
        content: {
            flex: 1,
            justifyContent: 'space-between',
        },
        timerContainer: {
            backgroundColor: isDarkMode ? '#444' : '#F0F0F0',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
        },
        timerHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        timerName: {
            fontSize: 20,
            fontWeight: 'bold',
            color: isDarkMode ? '#FFF' : '#333',
        },
        timerTime: {
            fontSize: 24,
            fontWeight: 'bold',
            color: isDarkMode ? '#FFF' : '#333',
        },
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
        },
        button: {
            flex: 1,
            marginHorizontal: 4,
            padding: 8,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
        },
        startButton: {
            backgroundColor: 'green',
        },
        pauseButton: {
            backgroundColor: 'orange',
        },
        deleteButton: {
            backgroundColor: 'red',
        },
        activateButton: {
            marginTop: 8,
        },
        logoutButton: {
            backgroundColor: 'red',
            padding: 12,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
        },
        logoutButtonText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
            marginBottom: 12,
        },
    });

    return (
        <View style={styles.content}>
            {authenticated && (
                <ScrollView style={styles.container}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: isDarkMode ? '#FFF' : '#333' }}>Temporizadores</Text>
                    {timers.map(timer => (
                        <View key={timer.id} style={styles.timerContainer}>
                            <Pressable onPress={() => toggleExpanded(timer.id)}>
                                <View style={styles.timerHeader}>
                                    <Text style={styles.timerName}>{timer.nome}</Text>
                                    <FontAwesome name={collapsed === timer.id ? "chevron-up" : "chevron-down"} size={24} color={isDarkMode ? '#FFF' : '#333'} />
                                </View>
                            </Pressable>
                            <Collapsible collapsed={collapsed !== timer.id}>
                                <Text style={styles.timerTime}>{formatTime(timer.countdownTime || 0)}</Text>
                                <View style={styles.buttonContainer}>
                                    <Pressable style={[styles.button, styles.startButton]} onPress={() => activateTimer(timer.id)}>
                                        <FontAwesome name="play" size={18} color="white" />
                                    </Pressable>
                                    <Pressable style={[styles.button, styles.pauseButton]} onPress={() => deactivateTimer(timer.id)}>
                                        <FontAwesome name="stop" size={18} color="white" />
                                    </Pressable>
                                    <Pressable style={[styles.button, styles.deleteButton]} onPress={() => confirmDeleteTimer(timer.id)}>
                                        <FontAwesome name="trash" size={18} color="white" />
                                    </Pressable>
                                </View>
                            </Collapsible>
                        </View>
                    ))}
                </ScrollView>
            )}
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
        </View>
    );
};

export default Administrador;