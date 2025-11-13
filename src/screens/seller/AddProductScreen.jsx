import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  PermissionsAndroid,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
// import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker'
import CoustomDropdown from '../../components/CustomDropdown'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetApi } from '../../Helper/Service';

const AddProductScreen = (props) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused()
  const route = useRoute();
  const { productId } = route.params;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryName, setcategoryName] = useState('');

  // Date picker states
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    origin: '',
    expirydate: new Date(),
    manufacturername: '',
    manufactureradd: '',
    short_description: '',
    long_description: '',
    price: '',
    Offerprice: '',
    minQuantity: '1',
    pieces: '1',
  });



  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      // Reset categories to empty array first
      setCategories([]);

      console.log('Fetching categories from API...');
      const response = await axios.get('https://api.merkapp.net/api/getCategory', {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // console.log('API Response received, status:', response?.status);
      // console.log('Response data:', JSON.stringify(response?.data, null, 2));

      // More defensive check for response data
      if (response && response.data) {
        if (response.data.status === true && Array.isArray(response.data.data)) {
          console.log(`Received ${response.data.data.length} categories`);
          setCategories(response.data.data);
          return; // Exit early on success
        }
        console.warn('Unexpected API response format:', response.data);
      } else {
        console.warn('Empty or invalid API response');
      }

      // If we reach here, there was an issue with the response format
      Alert.alert('Error', 'Could not load categories. Please try again later.');
    } catch (error) {
      console.error('Error in fetchCategories:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });

      let errorMessage = 'Failed to load categories';

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        errorMessage = `Server responded with status ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message || 'Failed to process request';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {

      if (Platform.OS === 'android') {
        const androidVersion = Platform.Version;

        if (androidVersion >= 33) {

          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Media Permission Required',
              message: 'App needs access to your photos to upload images',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Media access permission is required to upload images', [
              {
                text: 'Settings',
                onPress: () => {
                  // Optional: Open app settings
                  // Linking.openSettings();
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]);
            return;
          }
        } else {
          // Android 12 और उससे पहले के लिए READ_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'App needs access to your storage to upload images',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Storage permission is required to upload images', [
              {
                text: 'Settings',
                onPress: () => {
                  // Optional: Open app settings
                  // Linking.openSettings();
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]);
            return;
          }
        }
      }

      const options = {
        mediaType: 'photo',
        selectionLimit: 5 - images.length,
        quality: 0.8,
        includeBase64: false,
        maxWidth: 1024,
        maxHeight: 1024,
      };

      const result = await launchImageLibrary(options);

      if (!result.didCancel && !result.errorCode && result.assets) {
        const selectedImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        setImages([...images, ...selectedImages]);
      } else if (result.errorCode) {
        Alert.alert('Error', `Image selection failed: ${result.errorMessage}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Generate arrays for date picker
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);
  const months = [
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
  ];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  const showDatepicker = () => {
    const currentDate = formData.expirydate;
    setSelectedDay(currentDate.getDate());
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setFormData({ ...formData, expirydate: newDate });
    setShowDatePicker(false);
  };
  const onDateChange = (event, selectDate) => {
    setFormData({ ...formData, expirydate: selectDate });
    setShowDatePicker(false);
  }
  const cancelDate = () => {
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.category || !formData.price) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);

      const data = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'expirydate') {
          data.append(key, formData[key].toISOString().split('T')[0]);
        } else {
          data.append(key, formData[key]);
        }
      });

      images.forEach((image, index) => {
        data.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `product_${Date.now()}_${index}.jpg`
        });
      });

      data.append('price_slot[0][value]', '1');
      data.append('price_slot[0][price]', formData.price);
      data.append('price_slot[0][Offerprice]', formData.Offerprice || formData.price);
      let token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(`${API_BASE_URL}createProduct`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        }
      });
      console.log('Add Product Response:', response);
      if (response.data.status) {
        setFormData({
          name: '',
          category: '',
          origin: '',
          expirydate: new Date(),
          manufacturername: '',
          manufactureradd: '',
          short_description: '',
          long_description: '',
          price: '',
          Offerprice: '',
          minQuantity: '1',
          pieces: '1',
        })
        Alert.alert('Success', 'Product added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error.response);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [showDrop, setShowDrop] = useState(false);
  const getDropValue = res => {
    setShowDrop(false);
    console.log('===>', res);
    setFormData(prev => ({ ...prev, category: res?._id }));
    setcategoryName(res?.name)
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await GetApi(`getProductById/${productId}`);
      console.log('Productttttttt API Response:', response);

      if (response && response.status) {
        setFormData({
          name: response?.data?.name,
          // category: '',
          origin: response?.data?.origin || '',
          expirydate: new Date(response?.data?.expirydate) || new Date(),
          manufacturername: response?.data?.manufacturername || '',
          manufactureradd: response?.data?.manufactureradd || '',
          short_description: response?.data?.short_description || '',
          long_description: response?.data?.long_description || '',
          price: response?.data?.price || '',
          Offerprice: response?.data?.Offerprice || '',
          minQuantity: response?.data?.minQuantity?.toString() || '1',
          pieces: response?.data?.pieces?.toString() || '1',
        })
        // setProduct(response.data);
        // If reviews are included in product response
      } else {
        throw new Error(response?.message || 'Failed to load product details');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError(error.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching categories...');
    console.log('AddProductScreen props:', props);
    fetchCategories().catch(err => {
      console.error('Error in fetchCategories:', err);
      setError(err.message);
    });
  }, []);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  // Debug render
  console.log('Rendering with state:', {
    categories: categories?.length || 0,
    formDataCategory: formData.category,
    error
  });
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-red-50 p-4">
        <Text className="text-red-600 text-lg font-bold mb-2">Error Loading Categories</Text>
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={fetchCategories}
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1">
          <ScrollView
            className="flex-1 p-4"
            contentContainerStyle={{ paddingBottom: 90 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product Name */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">
                Product Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Enter product name"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Category - Simplified Picker */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">
                Category <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity className="bg-white border border-gray-200 rounded-xl" onPress={() => setShowDrop(true)}>
                <Text className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800">{categoryName ? categoryName : 'Select Category'}</Text>
                {/* <Picker
              selectedValue={formData.category || ''}
              // onValueChange={(itemValue) => {
              //   console.log('Selected category ID:', itemValue);
              //   setFormData(prev => ({ ...prev, category: itemValue }));
              // }}
              onChangeText={text => console.log("text",text)}
              style={{
                color: formData.category ? '#1F2937' : '#9CA3AF',
              }}
              dropdownIconColor="#6B7280"
            >
              <Picker.Item 
                label="Select a category" 
                value="" 
              />
              {Array.isArray(categories) && categories.map((category) => (
                <Picker.Item 
                  key={category?._id || Math.random().toString()} 
                  label={category?.name || 'Unnamed Category'} 
                  value={category?._id || ''} 
                />
              ))}
            </Picker> */}
              </TouchableOpacity>
            </View>
            <CoustomDropdown
              visible={showDrop}
              setVisible={setShowDrop}
              onClose={() => {
                setShowDrop(!showDrop);
              }}
              getDropValue={getDropValue}
              data={categories}
            />

            {/* Origin */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Origin</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Product origin"
                placeholderTextColor="#9CA3AF"
                value={formData.origin}
                onChangeText={(text) => setFormData({ ...formData, origin: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Manufacturer Name */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Manufacturer Name</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Manufacturer name"
                placeholderTextColor="#9CA3AF"
                value={formData.manufacturername}
                onChangeText={(text) => setFormData({ ...formData, manufacturername: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Manufacturer Address */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Manufacturer Address</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Manufacturer address"
                placeholderTextColor="#9CA3AF"
                value={formData.manufactureradd}
                onChangeText={(text) => setFormData({ ...formData, manufactureradd: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Expiry Date */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Expiry Date</Text>
              <TouchableOpacity
                className="bg-white p-4 rounded-xl border border-gray-200 flex-row justify-between items-center"
                onPress={showDatepicker}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text className="text-gray-800 font-medium">{formatDate(formData.expirydate)}</Text>
                <View className="bg-blue-50 p-2 rounded-lg">
                  <Text className="text-xl">📅</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Price */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">
                Price ($) <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Enter price"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Offer Price */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Offer Price ($)</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Enter offer price (optional)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.Offerprice}
                onChangeText={(text) => setFormData({ ...formData, Offerprice: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Minimum Quantity */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Minimum Quantity</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Minimum quantity"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.minQuantity}
                onChangeText={(text) => setFormData({ ...formData, minQuantity: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Total Pieces */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Total Pieces</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Total pieces"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.pieces}
                onChangeText={(text) => setFormData({ ...formData, pieces: text })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Short Description */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Short Description</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Short description"
                placeholderTextColor="#9CA3AF"
                value={formData.short_description}
                onChangeText={(text) => setFormData({ ...formData, short_description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Long Description */}
            <View className="mb-4">
              <Text className="text-gray-800 mb-2 font-semibold text-base">Long Description</Text>
              <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
                placeholder="Detailed description"
                placeholderTextColor="#9CA3AF"
                value={formData.long_description}
                onChangeText={(text) => setFormData({ ...formData, long_description: text })}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Image Upload */}
            <View className="mb-30">
              <Text className="text-gray-800 mb-3 font-semibold text-base">Product Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row">
                  {images.map((image, index) => (
                    <View key={index} className="relative mr-3">
                      <Image
                        source={{ uri: image.uri }}
                        className="w-28 h-28 rounded-2xl"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-7 h-7 items-center justify-center"
                        onPress={() => removeImage(index)}
                        style={{
                          shadowColor: '#EF4444',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.4,
                          shadowRadius: 3,
                          elevation: 4,
                        }}
                      >
                        <Text className="text-white text-base font-bold">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 5 && (
                    <TouchableOpacity
                      className="w-28 h-28 border-2 border-dashed border-blue-300 rounded-2xl items-center justify-center bg-blue-50"
                      onPress={handleImagePick}
                      style={{
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                        <Text className="text-blue-600 text-2xl font-bold">+</Text>
                      </View>
                      <Text className="text-blue-600 text-xs font-medium">Add Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
              <Text className="text-gray-500 text-xs">📷 You can add up to 5 images</Text>
            </View>

            {/* Fixed Submit Button */}
            {/* <View 
        className=" bg-white px-4 pt-3 pb-6"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 10,
        }}
      > */}
            <TouchableOpacity
              className={`p-4 mt-3 rounded-2xl items-center justify-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? '⏳ Adding Product...' : '✓ Add Product'}
              </Text>
            </TouchableOpacity>
            {/* </View> */}
          </ScrollView>

          {showDatePicker && <DateTimePicker
            mode='date'
            value={formData.expirydate}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />}
          {/* Custom Date Picker Modal */}
          {/* <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelDate}
      >
        <TouchableOpacity 
          className="flex-1 justify-end" 
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1}
          onPress={cancelDate}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="bg-white rounded-t-3xl"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              <View className="px-6 pt-5 pb-4">
                <View className="flex-row justify-between items-center">
                  <TouchableOpacity 
                    onPress={cancelDate} 
                    className="py-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text className="text-gray-600 text-base font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <View className="items-center">
                    <Text className="text-xl font-bold text-gray-900">Select Date</Text>
                    <Text className="text-sm text-gray-500 mt-1">Expiry Date</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={confirmDate} 
                    className="bg-blue-600 py-2 px-5 rounded-xl"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-white text-base font-bold">Done</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="px-5 pb-6">
                <View className="bg-blue-600 p-5 rounded-2xl mb-5"
                  style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 5,
                  }}
                >
                  <Text className="text-center text-blue-100 text-sm font-medium mb-2 tracking-wide">
                    SELECTED DATE
                  </Text>
                  <Text className="text-center text-white text-3xl font-bold tracking-wider">
                    {selectedDay.toString().padStart(2, '0')} / {(selectedMonth + 1).toString().padStart(2, '0')} / {selectedYear}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-1 mr-2 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="bg-blue-600 py-3">
                      <Text className="text-center text-base font-bold text-white tracking-wide">DAY</Text>
                    </View>
                    <Picker
                      selectedValue={selectedDay}
                      onValueChange={(value) => setSelectedDay(value)}
                      style={{ height: 180 }}
                      itemStyle={{ fontSize: 18 }}
                    >
                      {days.map((day) => (
                        <Picker.Item 
                          key={day} 
                          label={day.toString().padStart(2, '0')} 
                          value={day}
                          style={{ fontSize: 18 }}
                        />
                      ))}
                    </Picker>
                  </View>

                  <View className="flex-1 mx-1 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="bg-blue-600 py-3">
                      <Text className="text-center text-base font-bold text-white tracking-wide">MONTH</Text>
                    </View>
                    <Picker
                      selectedValue={selectedMonth}
                      onValueChange={(value) => setSelectedMonth(value)}
                      style={{ height: 180 }}
                      itemStyle={{ fontSize: 16 }}
                    >
                      {months.map((month) => (
                        <Picker.Item 
                          key={month.value} 
                          label={month.label.slice(0, 3)} 
                          value={month.value}
                          style={{ fontSize: 16 }}
                        />
                      ))}
                    </Picker>
                  </View>

                  <View className="flex-1 ml-2 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="bg-blue-600 py-3">
                      <Text className="text-center text-base font-bold text-white tracking-wide">YEAR</Text>
                    </View>
                    <Picker
                      selectedValue={selectedYear}
                      onValueChange={(value) => setSelectedYear(value)}
                      style={{ height: 180 }}
                      itemStyle={{ fontSize: 18 }}
                    >
                      {years.map((year) => (
                        <Picker.Item 
                          key={year} 
                          label={year.toString()} 
                          value={year}
                          style={{ fontSize: 18 }}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal> */}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddProductScreen;