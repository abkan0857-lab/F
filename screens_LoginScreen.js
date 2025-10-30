// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../utils/api';
import { getDeviceId } from '../utils/device';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onLogin() {
    try {
      const deviceId = await getDeviceId();
      const res = await login({ email, password, deviceId });
      if (res.data && res.data.ok) {
        // successful — AuthProvider will update token and redirect to Dashboard via App root
      } else {
        Alert.alert('Login failed', res?.data?.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Login error', err.response?.data?.error || err.message || 'Network error');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Button title="Login" onPress={onLogin} />
      <View style={{height:12}} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, justifyContent:'center' },
  input: { borderWidth:1, borderColor:'#ccc', padding:12, marginBottom:12, borderRadius:6 },
  title: { fontSize:24, marginBottom:12, textAlign:'center' }
});