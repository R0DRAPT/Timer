import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, useColorScheme, KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../db/supabase';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        try {
            let { data: admin, error } = await supabase
                .from('admin')
                .select('*')
                .eq('username', username)
                .eq('password', password);

            if (error) {
                throw error;
            }

            if (admin && admin.length > 0) {
                Alert.alert('Sucesso', `Bem-Vindo ${username}!`);
                // Limpar os campos de entrada
                setUsername('');
                setPassword('');
                router.replace({ pathname: '../administrador', params: { username } });
            } else {
                Alert.alert('Erro', 'Nome de utilizador ou palavra-passe inválidas!');
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao fazer login');
        }
    };

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, isDarkMode && styles.containerDark]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.innerContainer}>
                        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Entrar como Administrador</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Nome de Utilizador"
                            placeholderTextColor={isDarkMode ? '#CCC' : '#666'}
                        />
                        <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Palavra-Passe"
                            placeholderTextColor={isDarkMode ? '#CCC' : '#666'}
                            secureTextEntry
                        />
                        <Button title="Entrar" onPress={handleLogin} color={isDarkMode ? '#007AFF' : '#1E90FF'} />
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        </KeyboardAvoidingView>
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
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#000',
        textAlign: 'center',
    },
    titleDark: {
        color: '#FFF',
    },
    input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 16,
        paddingLeft: 8,
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    inputDark: {
        borderColor: '#444',
        backgroundColor: '#222',
        color: '#FFF',
    },
});

export default LoginScreen;
