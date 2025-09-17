import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon, UserIcon, ArrowLeftIcon, TrashIcon } from 'react-native-heroicons/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Api } from '../../Helper/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageModal from '../../components/LanguageModal';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const AccountScreen = () => {
  const navigation = useNavigation();
  const { logout, userInfo } = useAuth();
  const { t } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  const menuItems = [
    { id: 1, title: t('my_orders'), hasArrow: true },
    { 
      id: 2, 
      title: t('change_language'), 
      subtitle: currentLanguage === 'en' ? t('english') : t('spanish'), 
      hasArrow: true,
      onPress: () => setLanguageModalVisible(true)
    },
    { id: 3, title: t('help_center'), hasArrow: true },
    { id: 4, title: t('delete_account'), hasArrow: true },
    { id: 5, title: t('log_out'), hasArrow: true },
  ];
  
  // Load saved language on component mount
  React.useEffect(() => {
    loadLanguage();
  }, []);
  
  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('@app_language');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };
  
  const handleLanguageSelect = async (language) => {
    try {
      await AsyncStorage.setItem('@app_language', language.code);
      setCurrentLanguage(language.code);
      i18n.changeLanguage(language.code);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleMenuPress = async (item) => {
    if (item.onPress) {
      item.onPress();
      return;
    }
    
    if (item.title === t('log_out')) {
      Alert.alert(
        t('log_out'),
        t('confirm_logout'),
        [
          {
            text: t('cancel'),
            style: 'cancel',
          },
          {
            text: t('log_out'),
            onPress: async () => {
              await logout();
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    } else if (item.title === t('my_orders')) {
      navigation.navigate('Orders');
    } else if (item.title === t('delete_account')) {
      handleDeleteAccount();
    } else {
      console.log(`Pressed: ${item.title}`);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    Alert.alert(
      t('delete_account'),
      t('confirm_delete_account'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await Api.delete('/users/delete-account');
              if (response.data.success) {
                // Logout user and redirect to login
                await logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(t('error'), t('failed_delete_account'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      {/* Header */}
      <View className="bg-slate-800 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">{t('my_account')}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Profile Section */}
        <View className="flex-row items-center mb-5">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            className="w-16 h-16 bg-black rounded-full items-center justify-center mr-4"
          >
            <UserIcon size={32} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-gray-900 text-xl font-semibold">
              {userInfo?.firstName} 
            </Text>
            <Text className="text-gray-600 text-base">{userInfo?.email}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="space-y-6">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMenuPress(item)}
              className="bg-white rounded-lg p-5 my-2 flex-row items-center justify-between shadow-sm border border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-1">
                <Text className="text-slate-800 text-base font-medium">
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text className="text-gray-500 text-sm mt-1">
                    {item.subtitle}
                  </Text>
                )}
              </View>
              {item.hasArrow && (
                <ChevronRightIcon size={20} color="black" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {/* Language Selection Modal */}
      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={handleLanguageSelect}
        currentLanguage={currentLanguage}
      />
    </SafeAreaView>
  );

};

export default AccountScreen;