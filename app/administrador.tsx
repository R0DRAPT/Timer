import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, useColorScheme, Pressable, Vibration } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';
import { supabase } from './db/supabase'; 

type Timer = {
    id: number;
    nome: string;
    initialFormattedTime: string;
};

const AdminScreen = () => {
    const route = useRoute();
    const { username } = route.params as { username: string };
    const [timers, setTimers] = useState<Timer[]>([]);
    const [collapsed, setCollapsed] = useState<number | null>(null);
    const [runningTimers, setRunningTimers] = useState<{ [key: number]: boolean }>({});
    const [timerValues, setTimerValues] = useState<{ [key: number]: number }>({});

    const fetchTimers = async () => {
        try {
            let { data: timers, error } = await supabase
                .from('Countdown')
                .select('id, timerName, Countdown_Formated');

            if (error) {
                throw error;
            }

            if (timers) {
                const fetchedTimers = timers.map(timer => ({
                    id: timer.id,
                    nome: timer.timerName,
                    initialFormattedTime: timer.Countdown_Formated || '00:00:00'
                }));
                setTimers(fetchedTimers);

                // Initialize timer values with the initial formatted time in seconds
                const initialTimerValues: { [key: number]: number } = {};
                fetchedTimers.forEach(timer => {
                    const timeParts = timer.initialFormattedTime.split(':').map(Number);
                    const initialSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                    initialTimerValues[timer.id] = initialSeconds;
                });
                setTimerValues(initialTimerValues);
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao buscar os temporizadores');
        }
    };

    useEffect(() => {
        fetchTimers();
        const subscription = supabase
            .channel('public:Countdown')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Countdown' }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    const newTimer = { id: payload.new.id, nome: payload.new.timerName, initialFormattedTime: payload.new.Countdown_Formated || '00:00:00' };
                    setTimers((prevTimers) => {
                        const updatedTimers = [...prevTimers, newTimer];
                        const initialTimerValues = { ...timerValues };
                        const timeParts = newTimer.initialFormattedTime.split(':').map(Number);
                        const initialSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                        initialTimerValues[newTimer.id] = initialSeconds;
                        setTimerValues(initialTimerValues);
                        return updatedTimers;
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setTimers((prevTimers) => {
                        const updatedTimers = prevTimers.map(timer =>
                            timer.id === payload.new.id
                                ? { id: payload.new.id, nome: payload.new.timerName, initialFormattedTime: payload.new.Countdown_Formated || '00:00:00' }
                                : timer
                        );
                        const initialTimerValues = { ...timerValues };
                        const updatedTimer = updatedTimers.find(timer => timer.id === payload.new.id);
                        if (updatedTimer) {
                            const timeParts = updatedTimer.initialFormattedTime.split(':').map(Number);
                            const initialSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                            initialTimerValues[updatedTimer.id] = initialSeconds;
                        }
                        setTimerValues(initialTimerValues);
                        return updatedTimers;
                    });
                } else if (payload.eventType === 'DELETE') {
                    setTimers((prevTimers) => prevTimers.filter(timer => timer.id !== payload.old.id));
                    setTimerValues((prevValues) => {
                        const { [payload.old.id]: _, ...rest } = prevValues;
                        return rest;
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const toggleExpanded = (id: number) => {
        setCollapsed(collapsed === id ? null : id);
    };

    const startTimer = (id: number) => {
        setRunningTimers((prev) => ({ ...prev, [id]: true }));
    };

    const pauseTimer = (id: number) => {
        setRunningTimers((prev) => ({ ...prev, [id]: false }));
    };

    const resetTimer = (id: number) => {
        const timer = timers.find(timer => timer.id === id);
        if (timer) {
            const timeParts = timer.initialFormattedTime.split(':').map(Number);
            const initialSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            setTimerValues((prev) => ({ ...prev, [id]: initialSeconds }));
            setRunningTimers((prev) => ({ ...prev, [id]: false }));
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTimerValues((prev) => {
                const updatedTimers = { ...prev };
                for (const id in runningTimers) {
                    if (runningTimers[id]) {
                        if (updatedTimers[id] > 0) {
                            updatedTimers[id] -= 1;
                        } else if (updatedTimers[id] === 0 && runningTimers[id]) {
                            setRunningTimers((prev) => ({ ...prev, [id]: false }));
                            const timer = timers.find(timer => timer.id === parseInt(id));
                            if (timer) {
                                Alert.alert(
                                    'Temporizador Concluído',
                                    `O temporizador "${timer.nome}" foi concluído.`,
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                Vibration.cancel();
                                                resetTimer(timer.id); // Reinicie o temporizador aqui
                                            },
                                        },
                                    ]
                                );
                                Vibration.vibrate([500, 500, 500, 500, 500], true);
                            }
                        }
                    }
                }
                return updatedTimers;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [runningTimers, timers]);

    const formatTime = (seconds: number) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).
        padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={styles.adminHeader}>
                <Text style={[styles.titleAdmin, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Temporizadores</Text>
            </View>
            <ScrollView style={styles.content}>
                {timers.map((timer) => (
                    <View key={timer.id}>
                        <Pressable onPress={() => toggleExpanded(timer.id)} style={styles.timerHeader}>
                            <Text style={[styles.timerName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{timer.nome}</Text>
                            <FontAwesome name={collapsed === timer.id ? 'chevron-up' : 'chevron-down'} size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                        </Pressable>
                        <Collapsible collapsed={collapsed !== timer.id}>
                            <View style={[styles.timerContent, { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' }]}>
                                <View style={styles.timerRow}>
                                    <Text style={[styles.timerValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{formatTime(timerValues[timer.id])}</Text>
                                    <View style={styles.buttonContainer}>
                                        <Pressable style={[styles.iconButton, { backgroundColor: runningTimers[timer.id] ? 'red' : 'green' }]} onPress={() => runningTimers[timer.id] ? pauseTimer(timer.id) : startTimer(timer.id)}>
                                            <FontAwesome name={runningTimers[timer.id] ? 'stop' : 'play'} size={18} color="#fff" />
                                        </Pressable>
                                        <Pressable style={[styles.iconButton, { backgroundColor: 'blue' }]} onPress={() => resetTimer(timer.id)}>
                                            <FontAwesome name="refresh" size={18} color="#fff" />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </Collapsible>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    containerDark: {
        backgroundColor: '#000',
    },
    adminHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    titleAdmin: {
        fontSize: 35,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    timerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    timerName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    timerContent: {
        padding: 16,
    },
    timerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timerValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft:10,
    },
});

export default AdminScreen;