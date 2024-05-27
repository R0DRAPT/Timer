import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, useColorScheme, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

const LogoutComponent = () => {
    const router = useRouter();

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    // Estados para os campos de edição
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Função para salvar as alterações
    const saveChanges = () => {

        Alert.alert('Changes Saved', 'Your account has been updated successfully.');
    };

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Editar Conta</Text>
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Username:</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor={isDarkMode ? '#FFFFFF' : '#000000'}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Password:</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    placeholder="Enter your password"
                    placeholderTextColor={isDarkMode ? '#FFFFFF' : '#000000'}
                />
            </View>
            <Button title="Save Changes" onPress={saveChanges} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        marginBottom: 5,
    },
    input: {
        width: 250,
        height: 40,
        borderWidth: 1,
        borderColor: '#999999',
        borderRadius: 5,
        paddingHorizontal: 10,
        color: '#000000',
    },
});

export default LogoutComponent;
