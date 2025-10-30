// components/MediaList.js
import React from 'react';
import { View, FlatList, Image, Text } from 'react-native';
import { Video } from 'expo-av';

export default function MediaList({ items }) {
  if (!items || items.length === 0) return <Text style={{color:'#666'}}>No media</Text>;

  return (
    <FlatList
      data={items}
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
  );
}