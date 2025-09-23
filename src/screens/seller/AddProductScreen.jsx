import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeftIcon, PlusIcon, XMarkIcon, PhotoIcon } from 'react-native-heroicons/outline';
import { Api, ApiFormData } from '../../Helper/Service';
// import ColorPicker from 'react-native-wheel-color-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';










const predefinedColors = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];
export default function AddEditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const isEdit = route.params?.productId ? true : false;
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const colorPickerRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // Form state with safe initialization
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    minOrder: '1',
    manufacturerName: '',
    manufacturerAddress: '',
    origin: '',
    expiryDate: '',
    sku: '',
    colors: [],
    sizes: [],
    isFeatured: false,
    isActive: true,
    weight: '',
    dimensions: '',
    parameterType: '',
    size: '',
    capacity: '',
    discountedPrice: '',
    images: [],
    priceSlots: [
      {
        id: 1,
        quantity: '',
        price: '',
        offerPrice: ''
      }
    ]
  });
  
  // Safe form update function
  const updateFormData = (updates) => {
    try {
      setFormData(currentData => ({
        ...currentData,
        ...updates
      }));
    } catch (error) {
      console.error('Error updating form data:', error);
    }
  };
useEffect(() => {
  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setUserId(parsedUserData._id || parsedUserData.id);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  fetchUserData();
  fetchCategories();
  if (isEdit) {
    fetchProduct(route.params.productId);
  }

  // Cleanup function
  return () => {
    setLoading(false);
    setIsSubmitting(false);
  };
}, []);
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Fetching categories with token:', token ? 'Token exists' : 'No token found');
      
      const response = await fetch('https://api.merkapp.net/api/getCategory', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      console.log('Categories API response:', responseData);
      
      if (responseData?.status && Array.isArray(responseData.data)) {
        // Transform the categories to match your Picker's expected format
        const formattedCategories = responseData.data.map(cat => ({
          label: cat.name || 'Unnamed Category',
          value: cat._id || '',
          slug: cat.slug || ''
        }));
        
        console.log('Formatted categories:', formattedCategories);
        setCategories(formattedCategories);
        
        // If there's a product being edited, set its category
        if (isEdit && route.params?.productId) {
          const productResponse = await fetch(`https://api.merkapp.net/api/product/${route.params.productId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const productData = await productResponse.json();
          if (productData?.category) {
            setFormData(prev => ({
              ...prev,
              category: productData.category._id || productData.category
            }));
          }
        }
      } else {
        console.error('Unexpected categories format:', responseData);
        // Fallback to default categories if API fails
        const defaultCategories = [
          { label: 'Perfume', value: 'perfume', slug: 'perfume' },
          { label: 'Speakers', value: 'speakers', slug: 'speakers' },
          { label: 'Sports', value: 'sports', slug: 'sports' },
          { label: 'Clothing', value: 'clothing', slug: 'clothing' },
          { label: 'Shoes', value: 'shoes', slug: 'shoes' },
          { label: 'Furniture', value: 'furniture', slug: 'furniture' },
          { label: 'Gym Products', value: 'gym-products', slug: 'gym-products' },
          { label: 'Toys', value: 'toys', slug: 'toys' },
        ];
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    }
  };

  // const fetchProduct = async (id) => {
  //   try {
  //     setLoading(true);
  //     const response = await Api.get(`products/${id}`);
  //     setFormData(response.data);
  //     // Handle images if needed
  //   } catch (error) {
  //     console.error('Error fetching product:', error);
  //     Alert.alert('Error', 'Failed to load product');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

 const handleImagePick = async () => {
  if (images.length >= 5) {
    Alert.alert('Limit Reached', 'You can upload maximum 5 images');
    return;
  }

  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
      selectionLimit: 1, // Limit to 1 to prevent memory issues
    });

    if (result.didCancel || result.errorCode || !result.assets || !result.assets[0]) {
      return;
    }

    const imageUri = result.assets[0].uri;
    if (imageUri) {
      setImages(prev => {
        const newImages = [...prev];
        if (newImages.length < 5) {
          newImages.push(imageUri);
        }
        return newImages;
      });
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
  }
};


  const removeImage = (index) => {
    try {
      // Create a safe copy of the current images array
      const newImages = [...images];
      // Remove the image at the specified index
      if (index >= 0 && index < newImages.length) {
        newImages.splice(index, 1);
        // Update state with the new array
        setImages(newImages);
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleInputChange = (name, value) => {
    try {
      updateFormData({ [name]: value });
    } catch (error) {
      console.error(`Error updating field ${name}:`, error);
    }
  };

  const handleFocus = (scrollToY = 0) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: scrollToY, animated: true });
    }
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (!images || images.length === 0) {
      Alert.alert('Error', 'Please add at least one product image');
      return false;
    }
    return true;
  };

  const handleImageUpload = async () => {
    try {
      // Ensure images array exists
      const currentImages = Array.isArray(images) ? images : [];
      
      // Calculate how many more images can be added
      const remainingSlots = Math.max(0, 5 - currentImages.length);
      
      if (remainingSlots <= 0) {
        Alert.alert('Limit Reached', 'You can upload maximum 5 images');
        return;
      }
      
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        selectionLimit: remainingSlots,
      });

      if (!result || result.didCancel) return;
      
      // Check if assets exists and is an array
      if (!result.assets || !Array.isArray(result.assets)) {
        console.log('No assets returned from image picker');
        return;
      }
      
      // Process new images
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || `image_${Date.now()}.jpg`
      }));

      // Create a safe copy of the current images array and add new images
      const updatedImages = [...currentImages];
      newImages.forEach(img => {
        if (updatedImages.length < 5 && img && img.uri) {
          updatedImages.push(img);
        }
      });
      
      // Update state with the new array
      setImages(updatedImages);
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };
  useEffect(() => {
  return () => {
    // Cleanup on unmount
    setImages([]);
    setCategories([]);
    setLoading(false);
    setIsSubmitting(false);
    setShowColorPicker(false);
  };
}, []);

const handleSubmit = async () => {
  if (isSubmitting || loading) return;
  
  if (!validateForm()) return;
  
  setLoading(true);
  setIsSubmitting(true);
  
  try {
    const formDataToSend = new FormData();
    
    // Add user ID with validation
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }
    formDataToSend.append('userid', userId);
    
    // Add form fields safely
    const fieldsToInclude = [
      'name', 'shortDescription', 'description', 'price', 'category', 'stock',
      'minOrder', 'manufacturerName', 'manufacturerAddress', 'origin',
      'expiryDate', 'sku', 'isFeatured', 'isActive', 'weight', 'dimensions',
      'parameterType', 'size', 'capacity', 'discountedPrice'
    ];

    fieldsToInclude.forEach(key => {
      const value = formData[key];
      if (value !== null && value !== undefined && value !== '') {
        formDataToSend.append(key, String(value).trim());
      }
    });
    
    // Add priceSlots safely
    if (formData.priceSlots && formData.priceSlots.length > 0) {
      formDataToSend.append('priceSlots', JSON.stringify(formData.priceSlots));
    }
    
    // Add colors safely
    if (formData.colors && formData.colors.length > 0) {
      formDataToSend.append('colors', JSON.stringify(formData.colors));
    }
    
    // Add images with validation
    if (images && images.length > 0) {
      images.forEach((imageUri, index) => {
        if (imageUri && typeof imageUri === 'string') {
          formDataToSend.append('images', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `product_${Date.now()}_${index}.jpg`
          });
        }
      });
    }

    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch('https://api.merkapp.net/api/createProduct', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formDataToSend,
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.status) {
      Alert.alert('Success', 'Product created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } else {
      throw new Error(responseData.message || 'Failed to create product');
    }
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    Alert.alert('Error', error.message || 'Failed to create product');
  } finally {
    setLoading(false);
    setIsSubmitting(false);
  }
};

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#E58F14" />
      </View>
    );
  }

  const ColorPickerModal = () => (
  <Modal 
    visible={showColorPicker} 
    transparent 
    animationType="slide"
    onRequestClose={() => setShowColorPicker(false)} // Add this
  >
    <View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <View style={{backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10}}>
        <Text style={{fontSize: 18, marginBottom: 15}}>Select Color</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {predefinedColors.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                try {
                  const currentColors = Array.isArray(formData.colors) ? [...formData.colors] : [];
                  currentColors.push({id: Date.now(), value: color, name: color});
                  updateFormData({ colors: currentColors });
                  setShowColorPicker(false);
                } catch (error) {
                  console.error('Error adding color:', error);
                  setShowColorPicker(false);
                }
              }}
              style={{
                width: 50, height: 50, backgroundColor: color,
                margin: 5, borderRadius: 25, borderWidth: 1, borderColor: '#ccc'
              }}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => setShowColorPicker(false)}>
          <Text style={{textAlign: 'center', marginTop: 15, color: '#666'}}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white py-4 px-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeftIcon size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              {isEdit ? t('edit_product') : t('add_new_product')}
            </Text>
          </View>
          <TouchableOpacity 
            className="bg-[#E58F14] px-4 py-2 rounded-md"
            onPress={handleSubmit}
          >
            <Text className="text-white font-medium">{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-4 py-4">

        {/* Product Images */}
        <View className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-sm font-medium text-gray-700 mb-3">{t('product_images')}</Text>
          <View className="flex-row flex-wrap">
            {images.map((img, index) => (
              <View key={index} className="relative m-1">
                <Image source={{ uri: img }} className="w-20 h-20 rounded-md" />
                <TouchableOpacity 
                  onPress={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5"
                >
                  <XMarkIcon size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity 
                onPress={handleImagePick}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md justify-center items-center m-1"
              >
                <PhotoIcon size={20} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs">{t('add_image')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-xs text-gray-500 mt-2">{t('upload_up_to_5_images')}</Text>
        </View>

        {/* Product Details Form */}
        <View className="space-y-4 mb-6">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-3">{t('basic_information')}</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">{t('product_name')} *</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                placeholder={t('enter_product_name')}
                value={formData.name}
                onChangeText={(text) => updateFormData({ name: text })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">{t('category')}</Text>
              <View className="border border-gray-300 rounded-md">
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(itemValue) => {
                    console.log('Selected category:', itemValue);
                    updateFormData({ category: itemValue });
                  }}
                >
                  <Picker.Item label={t('select_category')} value="" />
                  {categories.map((category, index) => (
                    <Picker.Item 
                      key={category.value || index} 
                      label={category.label} 
                      value={category.value} 
                    />
                  ))}
                  <Picker.Item label="Perfume" value="perfume" />
                  <Picker.Item label="Speakers" value="speakers" />
                  <Picker.Item label="Sports" value="sports" />
                  <Picker.Item label="Clothing" value="clothing" />
                  <Picker.Item label="Shoes" value="shoes" />
                  <Picker.Item label="Furniture" value="furniture" />
                  <Picker.Item label="Gym Products" value="gym-products" />
                  <Picker.Item label="Toys" value="toys" />
                </Picker>
              </View>
            </View>

            {/* Parameter Type */}
            <View className="mb-4">
  <Text className="text-sm text-gray-600 mb-1">{t('parameter_type')}</Text>
  <View className="border border-gray-300 rounded-md">
    <Picker
      selectedValue={formData.parameterType || ''}
      onValueChange={(itemValue) => updateFormData({ parameterType: itemValue })}
    >
      <Picker.Item label={t('select_parameter_type')} value="" />
      <Picker.Item label={t('size')} value="size" />
      <Picker.Item label={t('capacity')} value="capacity" />
      <Picker.Item label={t('dimensions')} value="dimensions" />
      <Picker.Item label={t('weight')} value="weight" />
    </Picker>
  </View>
</View>

            {/* Dynamic Fields based on Parameter Type */}
            {formData.parameterType === 'size' && (
  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('size')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_size')}
      value={formData.size || ''}
      onChangeText={(text) => updateFormData({ size: text })}
    />
  </View>
)}

{formData.parameterType === 'capacity' && (
  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('capacity')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_capacity')}
      value={formData.capacity || ''}
      onChangeText={(text) => updateFormData({ capacity: text })}
    />
  </View>
)}

{formData.parameterType === 'dimensions' && (
  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('dimensions')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_dimensions')}
      value={formData.dimensions || ''}
      onChangeText={(text) => updateFormData({ dimensions: text })}
    />
  </View>
)}

{formData.parameterType === 'weight' && (
  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('weight')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_weight')}
      value={formData.weight || ''}
      onChangeText={(text) => updateFormData({ weight: text })}
    />
  </View>
)}

<View className="mb-4">
  <Text className="text-sm text-gray-600 mb-1">{t('short_description')}</Text>
  <TextInput
    className="border border-gray-300 rounded-md p-2.5 text-gray-900 h-20"
    placeholder={t('enter_short_description')}
    multiline
    numberOfLines={3}
    textAlignVertical="top"
    value={formData.shortDescription || ''}
    onChangeText={(text) => {
      console.log('Updating short description:', text);
      updateFormData({ shortDescription: text });
    }}
  />
</View>

<View>
  <Text className="text-sm text-gray-600 mb-1">{t('full_description')}</Text>
  <TextInput
    className="border border-gray-300 rounded-md p-2.5 text-gray-900 h-32"
    placeholder={t('enter_full_description')}
    multiline
    numberOfLines={5}
    textAlignVertical="top"
    value={formData.description || ''}
    onChangeText={(text) => {
      console.log('Updating full description:', text);
      updateFormData({ description: text });
    }}
  />
</View>
          </View>

          {/* Pricing */}
         {/* Pricing */}
<View className="bg-white rounded-lg p-4 shadow-sm">
  <Text className="text-sm font-medium text-gray-700 mb-2">{t('pricing')}</Text>
  
  <View className="flex-row space-x-4 mb-4">
    <View className="flex-1">
      <Text className="text-sm text-gray-600 mb-1">{t('price')}</Text>
      <TextInput
        className="border border-gray-300 rounded-md p-2.5 text-gray-900"
        placeholder="0.00"
        keyboardType="numeric"
        value={formData.price || ''}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9.]/g, '');
          updateFormData({ price: numericValue });
        }}
      />
    </View>
    <View className="flex-1">
      <Text className="text-sm text-gray-600 mb-1">{t('discounted_price')}</Text>
      <TextInput
        className="border border-gray-300 rounded-md p-2.5 text-gray-900"
        placeholder="0.00"
        keyboardType="numeric"
        value={formData.discountedPrice || ''}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9.]/g, '');
          updateFormData({ discountedPrice: numericValue });
        }}
      />
    </View>
  </View>

  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('sku')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_sku')}
      value={formData.sku || ''}
      onChangeText={(text) => updateFormData({ sku: text })}
    />
  </View>
</View>

{/* Inventory */}
<View className="bg-white rounded-lg p-4 shadow-sm">
  <Text className="text-sm font-medium text-gray-700 mb-4">{t('inventory')}</Text>
  
  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('stock_quantity')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_quantity')}
      keyboardType="numeric"
      value={formData.stock || ''}
      onChangeText={(text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        updateFormData({ stock: numericValue });
      }}
    />
  </View>

  <View className="flex-row justify-between items-center">
    <Text className="text-sm text-gray-600">{t('track_stock_quantity')}</Text>
    <Switch
      value={formData.stock ? !!parseInt(formData.stock) : false}
      onValueChange={(value) => updateFormData({ stock: value ? '1' : '0' })}
      trackColor={{ false: '#9CA3AF', true: '#E58F14' }}
    />
  </View>
</View>

{/* Manufacturer */}
<View className="bg-white rounded-lg p-4 shadow-sm">
  <Text className="text-sm font-medium text-gray-700 mb-4">{t('manufacturer')}</Text>
  
  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('manufacturer_name')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900"
      placeholder={t('enter_manufacturer_name')}
      value={formData.manufacturerName || ''}
      onChangeText={(text) => updateFormData({ manufacturerName: text })}
    />
  </View>

  <View className="mb-4">
    <Text className="text-sm text-gray-600 mb-1">{t('manufacturer_address')}</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2.5 text-gray-900 h-20"
      placeholder={t('enter_manufacturer_address')}
      multiline
      numberOfLines={3}
      textAlignVertical="top"
      value={formData.manufacturerAddress || ''}
      onChangeText={(text) => updateFormData({ manufacturerAddress: text })}
    />
  </View>

  <View className="flex-row space-x-4">
    <View className="flex-1">
      <Text className="text-sm text-gray-600 mb-1">{t('origin')}</Text>
      <TextInput
        className="border border-gray-300 rounded-md p-2.5 text-gray-900"
        placeholder={t('country_of_origin')}
        value={formData.origin || ''}
        onChangeText={(text) => updateFormData({ origin: text })}
      />
    </View>
    <View className="flex-1">
      <Text className="text-sm text-gray-600 mb-1">{t('expiry_date')}</Text>
      <TextInput
        className="border border-gray-300 rounded-md p-2.5 text-gray-900"
        placeholder="DD/MM/YYYY"
        value={formData.expiryDate || ''}
        onChangeText={(text) => {
          // Allow only numbers and slashes
          const formattedText = text.replace(/[^0-9/]/g, '');
          updateFormData({ expiryDate: formattedText });
        }}
      />
    </View>
  </View>

  {/* Color Variants */}
  <View className="mt-4">
    <View className="flex-row justify-between items-center mb-2">
      <Text className="text-sm font-medium text-gray-700">{t('color_variants')}</Text>
      <TouchableOpacity 
        className="bg-[#E58F14] px-3 py-1 rounded-md"
        onPress={() => setShowColorPicker(true)}
      >
        <Text className="text-white text-xs">{t('add_color')}</Text>
      </TouchableOpacity>
    </View>
    
    <View className="flex-row flex-wrap">
      {Array.isArray(formData.colors) && formData.colors.map((color, index) => (
        <View key={color?.id || index} className="relative mr-2 mb-2">
          <View 
            className="w-10 h-10 rounded-full border border-gray-300"
            style={{ backgroundColor: color?.value || '#CCCCCC' }}
          />
          <TouchableOpacity 
            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            onPress={() => {
              try {
                const newColors = [...(formData.colors || [])].filter((_, i) => i !== index);
                updateFormData({ colors: newColors });
              } catch (error) {
                console.error('Error removing color:', error);
              }
            }}
          >
            <XMarkIcon size={12} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>

    {/* Color Picker Modal */}
    {/* <Modal
      visible={showColorPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowColorPicker(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <TouchableWithoutFeedback>
            <View className="bg-white p-4 rounded-lg w-full max-w-md">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-medium">{t('select_color')}</Text>
                <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                  <XMarkIcon size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View className="h-64 mb-4">
                <ColorPicker
                  ref={colorPickerRef}
                  color={currentColor}
                  onColorChange={color => setCurrentColor(color)}
                  thumbSize={30}
                  sliderSize={30}
                  noSnap={true}
                  row={false}
                  swatches={false}
                />
              </View>
              
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View 
                    className="w-8 h-8 rounded-full border border-gray-300 mr-2"
                    style={{ backgroundColor: currentColor }}
                  />
                  <Text className="text-gray-700">{currentColor.toUpperCase()}</Text>
                </View>
                
                <TouchableOpacity 
                  className="bg-[#E58F14] px-4 py-2 rounded-md"
                  onPress={() => {
                    try {
                      // Ensure colors array exists
                      const currentColors = Array.isArray(formData.colors) ? [...formData.colors] : [];
                      
                      // Add new color
                      currentColors.push({ 
                        id: Date.now(), 
                        value: currentColor || '#000000',
                        name: (currentColor || '#000000').toUpperCase()
                      });
                      
                      // Update form data
                      updateFormData({ colors: currentColors });
                      setShowColorPicker(false);
                    } catch (error) {
                      console.error('Error adding color:', error);
                      setShowColorPicker(false);
                    }
                  }}
                >
                  <Text className="text-white font-medium">{t('add_color')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal> */}
    <ColorPickerModal />
  </View>

  {/* Price Slots */}
  <View className="mt-6">
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-sm font-medium text-gray-700">{t('price_slots')}</Text>
      <TouchableOpacity 
        className="bg-[#E58F14] px-3 py-1 rounded-md"
        onPress={() => {
          const newSlot = {
            id: Date.now(),
            quantity: '',
            price: '',
            offerPrice: ''
          };
          const updatedSlots = [...formData.priceSlots, newSlot];
          updateFormData({ priceSlots: updatedSlots });
        }}
      >
        <Text className="text-white text-xs">{t('add_slot')}</Text>
      </TouchableOpacity>
    </View>

    {formData.priceSlots.map((slot, index) => (
      <View key={slot.id} className="mb-4 border border-gray-200 rounded-lg p-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700">{t('slot')} {index + 1}</Text>
          {formData.priceSlots.length > 1 && (
            <TouchableOpacity 
              className="bg-red-100 p-1 rounded-full"
              onPress={() => {
                const newSlots = formData.priceSlots.filter((_, i) => i !== index);
                updateFormData({ priceSlots: newSlots });
              }}
            >
              <XMarkIcon size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row space-x-2 mb-2">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t('quantity')}</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 text-sm"
              placeholder={t('qty')}
              keyboardType="numeric"
              value={slot.quantity}
              onChangeText={(text) => {
                const newSlots = [...formData.priceSlots];
                newSlots[index].quantity = text;
                updateFormData({ priceSlots: newSlots });
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t('price')} ($)</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 text-sm"
              placeholder={t('price')}
              keyboardType="numeric"
              value={slot.price}
              onChangeText={(text) => {
                const newSlots = [...formData.priceSlots];
                newSlots[index].price = text;
                updateFormData({ priceSlots: newSlots });
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t('offer_price')}</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 text-sm"
              placeholder={t('offer_price')}
              keyboardType="numeric"
              value={slot.offerPrice}
              onChangeText={(text) => {
                const newSlots = [...formData.priceSlots];
                newSlots[index].offerPrice = text;
                updateFormData({ priceSlots: newSlots });
              }}
            />
          </View>
        </View>
      </View>
    ))}
  </View>
</View>

{/* Status */}
<View className="bg-white rounded-lg p-4 shadow-sm mb-6">
  <Text className="text-sm font-medium text-gray-700 mb-4">{t('status')}</Text>
  
  <View className="flex-row justify-between items-center mb-4">
    <View>
      <Text className="text-sm font-medium text-gray-700">{t('active')}</Text>
      <Text className="text-xs text-gray-500">When off, product will be hidden</Text>
    </View>
    <Switch
      value={formData.isActive}
      onValueChange={(value) => updateFormData({ isActive: value })}
      trackColor={{ false: '#9CA3AF', true: '#E58F14' }}
    />
  </View>

  <View className="flex-row justify-between items-center">
    <View>
      <Text className="text-sm font-medium text-gray-700">Featured</Text>
      <Text className="text-xs text-gray-500">Show this product in featured section</Text>
    </View>
    <Switch
      value={formData.isFeatured}
      onValueChange={(value) => updateFormData({ isFeatured: value })}
      trackColor={{ false: '#9CA3AF', true: '#E58F14' }}
    />
  </View>
</View>

{/* Submit Button */}
<View className="px-4 pb-6">
  <TouchableOpacity 
    className="bg-[#E58F14] py-3 rounded-lg mt-6"
    onPress={handleSubmit}
    disabled={loading}
  >
    <Text className="text-white text-center font-medium">
      {loading ? t('saving') : isEdit ? t('update_product') : t('add_product')}
    </Text>
  </TouchableOpacity>
</View>


        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


