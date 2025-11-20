import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import { ChevronLeftIcon, UserIcon, XMarkIcon, CameraIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { GetApi, Put, UploadFile } from '../../Helper/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';


const ProfileScreen = () => {
  const navigation = useNavigation();
  const { userToken, userInfo } = useAuth();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('1. Starting to fetch profile...');
      setIsLoading(true);

      // Get token from context instead of AsyncStorage directly
      const token = await AsyncStorage.getItem('userToken');
      console.log('2. Token in fetchProfile:', token ? 'Found' : 'Not found');

      if (!token) {
        console.log('3. No token found, redirecting to login...');
        // Use replace to prevent going back to the profile screen
        navigation.replace('Auth');
        return;
      }

      console.log('4. Making API call to get profile...');
      const response = await GetApi('auth/getProfile', {});

      if (response) {
        console.log('5. Profile data received:', response);
        // The API returns user data in response.data
        const userData = response.data || {};
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setEmail(userData.email || '');
        if (userData.profilePicture) {
          setProfileImage(userData.profilePicture);
        }
      } else {
        console.warn('Unexpected response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);

      if (error.message === 'Session expired. Please login again.' ||
        error.message === 'No authentication token found' ||
        (error.response && error.response.status === 401)) {
        // Clear any existing tokens
        await AsyncStorage.multiRemove(['userToken', 'userInfo']);
        // Navigate to Auth stack with a message
        navigation.navigate('Auth', {
          screen: 'Login',
          params: { message: t('session_expired') }
        });
        return;
      }

      Alert.alert(t('error'), error.message || t('failed_load_profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      const result = await ImagePicker.launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.error) {
        console.log('ImagePicker Error: ', result.error);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      } else {
        const source = { uri: result.assets[0].uri };
        setProfileImage(source.uri);

        // Upload the image to the server
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageData) => {
    try {
      setIsUpdating(true);

      // Create form data
      const formData = new FormData();

      // Get file extension from URI or default to jpg
      const fileExt = imageData.uri.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExt || 'jpg'}`;

      // Create file object with the correct format for React Native
      const file = {
        uri: imageData.uri,
        type: imageData.type || `image/${fileExt || 'jpeg'}`,
        name: fileName,
      };

      // Append the file to form data
      formData.append('profileImage', file);

      const token = await AsyncStorage.getItem('userToken');

      // Make sure to use the correct endpoint
      const response = await fetch(`${API_BASE_URL}auth/uploadProfileImage`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile image');
      }

      // Update the profile picture in the UI
      setProfileImage(data.profilePicture);

      // Update the user info in AsyncStorage
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'));
      if (userInfo) {
        userInfo.profilePicture = data.profilePicture;
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      }

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditProfile = async () => {
    if (isEditing) {
      try {
        setIsUpdating(true);

        const updateData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim()
        };

        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_BASE_URL}auth/updateProfile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update profile');
        }

        Alert.alert(t('success'), t('profile_updated_successfully'));
        // Refresh the profile data
        await fetchProfile();
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert(t('error'), error.message || t('failed_update_profile'));
      } finally {
        setIsUpdating(false);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('please_fill_all_fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('passwords_not_match'));
      return;
    }

    try {
      setIsUpdating(true);

      console.log('Using token from AuthContext:', userToken ? 'Available' : 'Not available');

      // Pass the token explicitly to ensure it's available
      const response = await Put('auth/updatePassword', {
        currentPassword,
        newPassword,
      }, { token: userToken });

      if (response) {
        Alert.alert(t('success'), t('password_updated_successfully'));
        setChangePasswordModalVisible(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert(t('error'), error.message || error.response?.data?.message || t('failed_update_password'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* Header */}
      <View className="bg-slate-800 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">{t('profile')}</Text>
          <View className="flex-1" />
          <TouchableOpacity onPress={handleEditProfile} disabled={isUpdating}>
            {isUpdating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-medium">
                {isEditing ? t('save') : t('edit')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Profile Section */}
        <View className="items-center mt-6 mb-8">
          <TouchableOpacity
            className="relative"
            onPress={handleImageUpload}
            disabled={!isEditing}
          >
            <View className="w-32 h-32 bg-gray-200 rounded-full items-center justify-center overflow-hidden">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <UserIcon size={60} color="#6b7280" />
              )}
            </View>
            {isEditing && (
              <View className="absolute bottom-0 right-0 bg-slate-800 p-2 rounded-full">
                <CameraIcon size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          <View>
            <Text className="text-gray-900 text-xl font-semibold">
              {`${firstName} ${lastName}`.trim()}
            </Text>
            <Text className="text-gray-600 text-base">{email}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" className="my-8" />
        ) : (
          <View className="space-y-4">
            {/* First Name Field */}
            <View className="mb-4">
              <Text className="text-gray-700 text-base font-medium mb-2">{t('first_name')}</Text>
              <View className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  className="text-gray-900 text-base"
                  placeholder={t('enter_first_name')}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Last Name Field */}
            <View className="mb-4">
              <Text className="text-gray-700 text-base font-medium mb-2">{t('last_name')}</Text>
              <View className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  className="text-gray-900 text-base"
                  placeholder={t('enter_last_name')}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-gray-700 text-base font-medium mb-2">{t('email')}</Text>
              <View className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  className="text-gray-900 text-base"
                  placeholder={t('enter_email')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Change Password Button */}
            <TouchableOpacity
              onPress={() => setChangePasswordModalVisible(true)}
              className="mt-8 bg-[#E58F14] py-3 rounded-lg items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-medium">{t('change_password')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={isChangePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isUpdating && setChangePasswordModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">{t('change_password')}</Text>
              <TouchableOpacity
                onPress={() => !isUpdating && setChangePasswordModalVisible(false)}
                disabled={isUpdating}
              >
                <XMarkIcon size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4 mb-6">
              <View>
                <Text className="text-gray-600 text-sm font-medium mb-1">{t('current_password')}</Text>
                <TextInput
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                  secureTextEntry
                  placeholder={t('enter_current_password')}
                  placeholderTextColor="#9CA3AF"
                  editable={!isUpdating}
                />
              </View>

              <View>
                <Text className="text-gray-600 text-sm font-medium mb-1">{t('new_password')}</Text>
                <TextInput
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                  secureTextEntry
                  placeholder={t('enter_new_password')}
                  placeholderTextColor="#9CA3AF"
                  editable={!isUpdating}
                />
              </View>

              <View>
                <Text className="text-gray-600 text-sm font-medium mb-1">{t('confirm_new_password')}</Text>
                <TextInput
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                  secureTextEntry
                  placeholder={t('confirm_new_password')}
                  placeholderTextColor="#9CA3AF"
                  editable={!isUpdating}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isUpdating}
              className="bg-[#E58F14] py-3 rounded-lg items-center justify-center"
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-medium">{t('update_password')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;