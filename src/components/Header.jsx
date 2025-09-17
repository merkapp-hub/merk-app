import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, User, Search, X } from 'react-native-feather';
import { useAuth } from '../context/AuthContext';
import { GetApi } from '../Helper/Service';

const Header = () => {
  const navigation = useNavigation();
  const { userToken } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      console.log('Searching for:', query);
      Keyboard.dismiss();
      // Navigate to SearchResult screen with the query
      navigation.navigate('SearchResult', { query });
    } else {
      // If search is empty, navigate with empty query to clear results
      navigation.navigate('SearchResult', { query: '' });
    }
  };

  return (
    <View className="bg-slate-800 px-4 py-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <MapPin width={20} height={20} color="white" />
          <Text className="text-white ml-2">Your Location</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            if (userToken) {
              navigation.navigate('MainTabs', { screen: 'Account' });
            } else {
              navigation.navigate('Login');
            }
          }}
          className="p-2"
        >
          <User width={24} height={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="relative">
        <View className="flex-row items-center bg-white rounded-lg px-3 py-2">
          <Search width={20} height={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search for products..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="ml-2">
              <X width={18} height={18} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default Header;
