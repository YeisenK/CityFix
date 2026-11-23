//Inicio de Sesion
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // 1. Validar que los campos no estén vacíos
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }

    // 2. Validar que obligatoriamente termine en @gmail.com
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Correo no válido', 'Por seguridad, debes usar una cuenta de correo de @gmail.com');
      return;
    }

    try {
      /* 
        AQUÍ ES DONDE LLAMARÁS AL BACKEND DE TU COMPAÑERO CUANDO ESTÉ LISTO:
        const response = await loginUser({ email, password });
      */

      // --- SIMULACIÓN TEMPORAL DE SEGURIDAD ---
      // Como estás probando sin el backend real, aquí simulamos una pequeña espera
      // y validamos si "simulas" un inicio de sesión correcto.
      // (O puedes llamar a una función de tu auth.service que verifique credenciales)
      
      // Por ahora, si pasó el filtro del correo, simulamos el éxito:
      Alert.alert('¡Bienvenido!', 'Has iniciado sesión correctamente.');
      navigation.replace('Home');

    } catch (error: any) {
      Alert.alert('Acceso denegado', error.message || 'Credenciales incorrectas o usuario no registrado');
    }
  };

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CityFix - Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      {/* Botón para navegar a la pantalla de Sign Up */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Register')} 
        style={styles.registerLink}
      >
        <Text style={styles.registerLinkText}>
          ¿No tienes una cuenta? Regístrate aquí
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#333' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { color: '#007AFF', fontSize: 16, fontWeight: '500' },
});