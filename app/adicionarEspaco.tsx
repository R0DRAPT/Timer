import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from './db/supabase';
import { useNavigation } from '@react-navigation/native';

export default function TabOneScreen() {
    const [name, setName] = useState('');
    const colorScheme = useColorScheme();
    const navigation = useNavigation(); // Inicialize a navegação

    const handleAdd = async () => {
        if (name.trim() === '') {
            Alert.alert('Erro', 'O campo não pode estar vazio.');
        } else {
            try {
                const { data, error } = await supabase
                    .from('espacos')
                    .insert([{ nome: name }]);

                if (error) {
                    Alert.alert('Erro', 'Houve um problema ao adicionar o espaço.');
                    console.error(error);
                } else {
                    Alert.alert('Sucesso', `Espaço "${name}" adicionado!`, [
                        {
                            text: 'OK',
                            onPress: () => {
                                setName('');
                                navigation.goBack();
                            },
                        },
                    ]);
                }
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
                console.error(error);
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
        >
            <View style={styles.innerContainer}>
                <Text style={styles.title}>Adicionar Espaço</Text>
                <TextInput
                    style={[styles.input, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}
                    placeholder="Nome do Espaço"
                    placeholderTextColor={colorScheme === 'dark' ? "#ccc" : "#555"}
                    value={name}
                    onChangeText={setName}
                />
                <TouchableOpacity style={styles.button} onPress={handleAdd}>
                    <Text style={styles.buttonText}>Adicionar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        height: 40,
        width: '80%',
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    inputLight: {
        backgroundColor: '#fff',
        color: '#000',
    },
    inputDark: {
        backgroundColor: '#333',
        color: '#fff',
    },
    button: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
