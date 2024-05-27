import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, useColorScheme, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './db/supabase';

const saveCountdownToSupabase = async (timerName: string, totalSeconds: number) => {
    try {
        const { data, error } = await supabase.from('Countdown').insert([
            {
                timerName,
                Countdown_time: totalSeconds,
                Countdown_Formated: formatTime(totalSeconds),
                created_at: new Date().toISOString(),
            },
        ]);
        if (error) {
            throw error;
        }
        console.log('Countdown saved to Supabase:', data);
    } catch (error) {
        console.error('Error saving countdown to Supabase:', (error as Error).message);
    }
};

const TabOneScreen: React.FC = () => {
    const [hours, setHours] = useState<string>('0');
    const [minutes, setMinutes] = useState<string>('0');
    const [seconds, setSeconds] = useState<string>('0');
    const [disableAddButton, setDisableAddButton] = useState<boolean>(false);
    const [timerName, setTimerName] = useState<string>('');
    const navigation = useNavigation();

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const dynamicStyles = styles(isDarkMode);

    useEffect(() => {
        if (
            parseInt(hours) === 0 &&
            parseInt(minutes) === 0 &&
            parseInt(seconds) === 0 ||
            timerName.trim() === ''
        ) {
            setDisableAddButton(true);
        } else {
            setDisableAddButton(false);
        }
    }, [hours, minutes, seconds, timerName]);

    const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

    const handleAddTimer = () => {
        if (timerName.trim() === '' || totalSeconds === 0) {
            Alert.alert('Erro', 'Preencha todos os campos antes de adicionar o temporizador.');
            return;
        }

        saveCountdownToSupabase(timerName, totalSeconds);
        navigation.goBack();
    };

    return (
        <View style={dynamicStyles.container}>
            <TextInput
                style={dynamicStyles.input_etiqueta}
                onChangeText={setTimerName}
                value={timerName}
                placeholder="Etiqueta | Digite o nome do temporizador"
                placeholderTextColor={isDarkMode ? '#BBBBBB' : '#888888'}
            />
            <View style={dynamicStyles.pickerContainer}>
                <View style={dynamicStyles.pickerWrapper}>
                    <Picker
                        style={dynamicStyles.picker}
                        selectedValue={hours}
                        onValueChange={(itemValue) => setHours(itemValue)}
                        itemStyle={dynamicStyles.pickerItem}
                    >
                        {[...Array(24).keys()].map((hour) => (
                            <Picker.Item key={hour} label={`${hour.toString()} horas`} value={hour.toString()} />
                        ))}
                    </Picker>
                </View>
                <View style={dynamicStyles.pickerWrapper}>
                    <Picker
                        style={dynamicStyles.picker}
                        selectedValue={minutes}
                        onValueChange={(itemValue) => setMinutes(itemValue)}
                        itemStyle={dynamicStyles.pickerItem}
                    >
                        {[...Array(60).keys()].map((minute) => (
                            <Picker.Item key={minute} label={`${minute.toString()} min`} value={minute.toString()} />
                        ))}
                    </Picker>
                </View>
                <View style={dynamicStyles.pickerWrapper}>
                    <Picker
                        style={dynamicStyles.picker}
                        selectedValue={seconds}
                        onValueChange={(itemValue) => setSeconds(itemValue)}
                        itemStyle={dynamicStyles.pickerItem}
                    >
                        {[...Array(60).keys()].map((second) => (
                            <Picker.Item key={second} label={`${second.toString()} s`} value={second.toString()} />
                        ))}
                    </Picker>
                </View>
            </View>
            <TouchableOpacity
                style={[dynamicStyles.button, dynamicStyles.addButton, disableAddButton && dynamicStyles.disabledButton]}
                onPress={handleAddTimer}
                disabled={disableAddButton}
            >
                <Text style={dynamicStyles.buttonText}>Adicionar</Text>
            </TouchableOpacity>
        </View>
    );
};

const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export { formatTime };

const styles = (isDarkMode: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? '#121212' : '#f2f2f2',
            padding: 20,
        },
        pickerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            position: 'absolute', // Make the picker container absolute
            top: 100, // Adjust this value as needed
        },
        pickerWrapper: {
            alignItems: 'center',
        },
        pickerLabel: {
            fontSize: 16,
            color: isDarkMode ? '#f2f2f2' : '#333',
        },
        pickerItem: {
            fontSize: 16,
            color: isDarkMode ? '#f2f2f2' : '#333',
        },
        picker: {
            width: 125,
            height: 150,
            backgroundColor: isDarkMode ? '#121212' : '#f2f2f2',
            color: isDarkMode ? '#f2f2f2' : '#333',
        },
        button: {
            borderRadius: 8,
            paddingVertical: 15,
            paddingHorizontal: 40,
            marginBottom: 10,
        },
        addButton: {
            backgroundColor: '#28a745',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 130,
            position: 'absolute',
            top: 350,
        },
        buttonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        disabledButton: {
            opacity: 0.5,
        },
        input_etiqueta: {
            height: 40,
            width: '100%',
            borderColor: 'gray',
            borderWidth: 1,
            paddingHorizontal: 10,
            marginBottom: 350,
            borderRadius: 8,
            color: isDarkMode ? '#f2f2f2' : '#333',
            backgroundColor: isDarkMode ? '#333' : '#fff',
            position: 'absolute',
            top: 50,
        },
    });

export default TabOneScreen;