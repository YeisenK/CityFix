import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { registerUser } from '../services/auth.service';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    
    // 1. Validar campos vacíos
    if (!name || !email || !password) {
      setErrorMessage('Por favor llena todos los campos.');
      return;
    }

    // 2. Validar que el nombre NO contenga números ni caracteres raros
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(name.trim())) {
      setErrorMessage('El nombre no debe contener números ni caracteres especiales.');
      return;
    }

    // 3. Validar que termine estrictamente en @gmail.com
    
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Por seguridad, solo se permiten cuentas de correo de @gmail.com');
      return;
    }

    try {
      await registerUser({ name, email, password });
      setSuccessMessage('¡Cuenta creada correctamente!');
      setTimeout(() => {
        navigation.goBack(); // Regresa al login después de un momento
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Fallo en el registro');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CityFix - Crear Cuenta</Text>

      {/* Mostrar mensaje de error visual si existe */}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      
      {/* Mostrar mensaje de éxito si existe */}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico (@gmail.com)"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={{ marginTop: 20, alignItems: 'center' }}
      >
        <Text style={{ color: '#007AFF', fontSize: 16 }}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorText: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  successText: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});