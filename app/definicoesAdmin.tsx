import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './db/supabase';

const AdminPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(true); // Track authentication state
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    useEffect(() => {
        if (!authenticated) {
            router.replace('/two');
        } else {
            fetchAdminData();
        }
    }, [authenticated]);

    const fetchAdminData = async () => {
        const { data, error } = await supabase
            .from('admin')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            Alert.alert('Erro', 'Não foi possível carregar os dados do administrador.');
        } else {
            setUsername(data.username);
            setPassword(data.password);
        }
        setLoading(false);
    };

    const handleUpdate = async () => {
        const { error } = await supabase
            .from('admin')
            .update({ username, password })
            .eq('id', 1);

        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar os dados do administrador.');
        } else {
            Alert.alert('Sucesso', 'Dados do administrador atualizados com sucesso.');
        }
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
                    text: 'Sim',
                    onPress: () => {
                        setAuthenticated(false); // Set authenticated state to false
                        setUsername('');
                        setPassword('');
                        router.replace('/two'); // Use router.replace to ensure admin screen is removed from stack
                    },
                },
            ],
            { cancelable: false }
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, isDarkMode ? styles.containerDark : styles.containerLight]}>
                <Text style={[styles.title, isDarkMode ? styles.textDark : styles.textLight]}>Carregando...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDarkMode ? styles.containerDark : styles.containerLight]}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.title, isDarkMode ? styles.textDark : styles.textLight]}>Editar Admin</Text>
                <TextInput
                    style={[styles.input, isDarkMode ? styles.textDark : styles.textLight]}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                />
                <TextInput
                    style={[styles.input, isDarkMode ? styles.textDark : styles.textLight]}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                />
                <Button
                    title="Atualizar"
                    onPress={handleUpdate}
                    color={isDarkMode ? '#FFFFFF' : '#000000'}
                />
                <View style={styles.buttonSpacer} />

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    containerLight: {
        backgroundColor: '#FFF',
    },
    containerDark: {
        backgroundColor: '#000',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    textLight: {
        color: '#000',
    },
    textDark: {
        color: '#FFF',
    },
    input: {
        width: '100%',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
    },
    buttonSpacer: {
        marginVertical: 10,
    },
});

export default AdminPage;
