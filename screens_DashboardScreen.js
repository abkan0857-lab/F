// screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { getDeviceId } from '../utils/device';

export default function DashboardScreen() {
  const { user, logout, getMe, uploadMedia, extendAccount } = useAuth();
  const [media, setMedia] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMe() {
    try {
      const data = await getMe();
      setMedia(data.media || []);
    } catch (err) {
      console.error('getMe error', err);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  async function pickAndUpload() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All });
      if (res.cancelled) return;
      const uri = res.uri;
      const fileName = uri.split('/').pop();
      // crude mime detection
      const isVideo = res.type === 'video' || (fileName && fileName.match(/\.(mp4|mov|mkv)$/));
      const mime = isVideo ? 'video/mp4' : 'image/jpeg';

      const uploadRes = await uploadMedia(uri, mime, fileName, (percent) => {
        // Could show progress UI
        console.log('upload', percent, '%');
      });
      if (uploadRes && uploadRes.url) {
        Alert.alert('Upload', 'Upload successful');
        fetchMe();
      }
    } catch (err) {
      console.error('upload error', err);
      Alert.alert('Upload error', err.response?.data?.error || err.message || 'Upload failed');
    }
  }

  async function onExtend() {
    try {
      // For demo: extend 1 day
      const data = await extendAccount(1, 'd');
      Alert.alert('Extended', `New expireAt: ${data.expireAt}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Extend error', err.response?.data?.error || err.message || 'Error');
    }
  }

  return (
    <View style={{flex:1, padding:16}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <View>
          <Text style={{fontSize:18, fontWeight:'600'}}>{user?.email}</Text>
          <Text style={{color:'#888'}}>Expire At: {user?.expireAt}</Text>
        </View>
        <View>
          <Button title="Logout" onPress={() => logout()} />
        </View>
      </View>

      <View style={{marginBottom:12}}>
        <Button title="Pick & Upload Photo/Video" onPress={pickAndUpload} />
      </View>

      <View style={{marginBottom:12}}>
        <Button title="Extend +1 day" onPress={onExtend} />
      </View>

      <Text style={{marginBottom:8, fontWeight:'600'}}>Media</Text>
      {media.length === 0 ? <Text style={{color:'#666'}}>No media uploaded yet</Text> : (
        <FlatList
          data={media.slice().reverse()}
          keyExtractor={(item, idx) => item.key || item.url || String(idx)}
          renderItem={({item}) => (
            <View style={{marginBottom:12}}>
              {item.url.match(/\.(mp4|mov|mkv)$/) ? (
                <Video
                  source={{ uri: item.url }}
                  style={{ width: '100%', height: 200 }}
                  useNativeControls
                  resizeMode="contain"
                />
              ) : (
                <Image source={{ uri: item.url }} style={{ width: '100%', height: 200, borderRadius:8 }} />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}