// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Picker } from 'react-native';
import { useAuth } from '../utils/api';
import { getDeviceId } from '../utils/device';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('d'); // 'h' or 'd'

  async function onRegister() {
    try {
      const deviceId = await getDeviceId();
      const res = await register({
        email,
        password,
        durationAmount: amount,
        durationUnit: unit,
        deviceId
      });
      if (res.data && res.data.ok) {
        // registered — AuthProvider will set token
      } else {
        Alert.alert('Register failed', res?.data?.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Register error', err.response?.data?.error || err.message || 'Network error');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <View style={{flexDirection:'row', alignItems:'center', marginBottom:12}}>
        <Text style={{marginRight:8}}>Duration:</Text>
        <TextInput keyboardType="numeric" value={amount} onChangeText={setAmount} style={{borderWidth:1,borderColor:'#ccc',padding:8,width:80,borderRadius:6}} />
        <View style={{width:8}} />
        <Picker selectedValue={unit} style={{height:44,width:120}} onValueChange={(v)=>setUnit(v)}>
          <Picker.Item label="Days" value="d" />
          <Picker.Item label="Hours" value="h" />
        </Picker>
      </View>
      <Button title="Register" onPress={onRegister} />
      <View style={{height:12}} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, justifyContent:'center' },
  input: { borderWidth:1, borderColor:'#ccc', padding:12, marginBottom:12, borderRadius:6 },
  title: { fontSize:24, marginBottom:12, textAlign:'center' }
});