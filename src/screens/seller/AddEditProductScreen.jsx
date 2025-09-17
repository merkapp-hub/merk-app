import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeftIcon, PlusIcon, XMarkIcon, PhotoIcon } from 'react-native-heroicons/outline';
import { Api, ApiFormData } from '../../Helper/Service';
import ColorPicker from 'react-native-wheel-color-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddEditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isEdit = route.params?.productId ? true : false;
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const colorPickerRef = useRef(null);
  
  // Form state
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
    manufacturerName: '',
    manufacturerAddress: '',
    expiryDate: '',
    origin: '',
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct(route.params.productId);
    }
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

  const fetchProduct = async (id) => {
    try {
      setLoading(true);
      const response = await Api.get(`products/${id}`);
      setFormData(response.data);
      // Handle images if needed
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
      });

      if (!result.didCancel && !result.errorCode) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      
     
      if (!formData.category) {
        Alert.alert('Validation Error', 'Please select a category');
        setLoading(false);
        return;
      }
      
      
      const formDataToSend = new FormData();
      
      
      const selectedCategory = categories.find(cat => cat.value === formData.category);
      const categorySlug = selectedCategory?.slug || '';
      
      console.log('Selected category:', {
        id: formData.category,
        slug: categorySlug,
        selectedCategory
      });
      
      const productData = {
        name: formData.name,
        short_description: formData.shortDescription || '',
        long_description: formData.description || '',
        price: formData.price,
        category: formData.category, 
        category_slug: categorySlug, 
        pieces: formData.stock || '1',
        minQuantity: formData.minOrder || '1',
        parameter_type: 'size', 
        price_slot: JSON.stringify([{
          value: 'default',
          price: formData.price,
          Offerprice: formData.discountedPrice || formData.price
        }])
      };
      
     
      if (formData.manufacturerName) {
        productData.manufacturername = formData.manufacturerName;
      }
      if (formData.manufacturerAddress) {
        productData.manufactureradd = formData.manufacturerAddress;
      }
      if (formData.origin) {
        productData.origin = formData.origin;
      }
      if (formData.expiryDate) {
       
        productData.expirydate = formData.expiryDate;
      }
      
     
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value);
        }
      });

     
      if (images && images.length > 0) {
        console.log('Processing images...');
        
        
        formDataToSend.append('image_count', images.length.toString());
        
      
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (image) {
            const imageUri = image.uri || image;
            const imageType = image.mimeType || 'image/jpeg';
            const imageName = image.fileName || `product_${Date.now()}_${i}.jpg`;
            
          
            const fileExtension = imageUri.split('.').pop().toLowerCase();
            const finalImageName = imageName.endsWith(`.${fileExtension}`) 
              ? imageName 
              : `${imageName}.${fileExtension}`;
            
            // Create file object with proper format
            const file = {
              uri: imageUri,
              type: imageType,
              name: finalImageName
            };
            
            console.log(`📸 Appending image ${i + 1}:`, {
              name: finalImageName,
              type: imageType,
              size: image.fileSize || 'unknown',
              uri: imageUri
            });
            
            // For the first image, set it as the main image
            if (i === 0) {
              formDataToSend.append('image', file);
            }
            
            // Append to images array
            formDataToSend.append('images', file);
          }
        }
      } else {
        console.log('ℹ️ No images to upload');
        formDataToSend.append('image_count', '0');
      }

      // Validate required fields
      const requiredFields = ['name', 'price', 'category', 'stock'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate at least one image is uploaded
      if (images.length === 0) {
        throw new Error('Please upload at least one product image');
      }
      
      // Validate price is a valid number
      if (isNaN(parseFloat(formData.price))) {
        throw new Error('Please enter a valid price');
      }
      
      // Get auth token
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('📡 Sending POST request to: https://api.merkapp.net/api/createProduct');
      
      // Log the form data being sent (for debugging)
      console.log('📤 FormData being sent:');
      for (let [key, value] of formDataToSend._parts) {
        console.log(`${key}:`, value);
      }

      // Log the final form data for debugging
      console.log('📤 Final FormData:');
      for (let [key, value] of formDataToSend._parts) {
        console.log(`${key}:`, value);
      }

      // Using fetch API for better file upload handling
      console.log('🔄 Sending request using fetch API');
      
      const response = await fetch('https://api.merkapp.net/api/createProduct', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Let the browser set the Content-Type with the boundary
        },
        body: formDataToSend,
      });
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text}`);
      }
      
      // Create a response-like object for compatibility
      const fetchResponse = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: {},
        request: {}
      };

      console.log('✅ API Response Status:', response.status);
      console.log('📝 API Response Data:', responseData);
      
      if (responseData && responseData.status) {
        Alert.alert('✅ Success', 'Product created successfully');
        navigation.goBack();
      } else {
        const errorMessage = responseData?.message || responseData?.error || 'Failed to create product';
        console.error('❌ API Error Details:', responseData);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      
      let errorMessage = 'Failed to create product. Please try again.';
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || 
                      error.response.data.error || 
                      `Server responded with status ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#E58F14" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white py-4 px-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeftIcon size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </Text>
          </View>
          <TouchableOpacity 
            className="bg-[#E58F14] px-4 py-2 rounded-md"
            onPress={handleSubmit}
          >
            <Text className="text-white font-medium">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-4 py-4">

        {/* Product Images */}
        <View className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-sm font-medium text-gray-700 mb-3">Product Images</Text>
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
                <Text className="text-xs text-gray-500 mt-1">Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-xs text-gray-500 mt-2">Upload up to 5 images (Max 2MB each)</Text>
        </View>

        {/* Product Details Form */}
        <View className="space-y-4 mb-6">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-4">Basic Information</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Product Name</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                placeholder="Enter product name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Category</Text>
              <View className="border border-gray-300 rounded-md">
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(itemValue) => {
                    console.log('Selected category:', itemValue);
                    setFormData({...formData, category: itemValue});
                  }}
                >
                  <Picker.Item label="Select a category" value="" />
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
              <Text className="text-sm text-gray-600 mb-1">Parameter Type</Text>
              <View className="border border-gray-300 rounded-md">
                <Picker
                  selectedValue={formData.parameterType}
                  onValueChange={(itemValue) => setFormData({...formData, parameterType: itemValue})}
                >
                  <Picker.Item label="Select Parameter Type" value="" />
                  <Picker.Item label="Size" value="size" />
                  <Picker.Item label="Capacity" value="capacity" />
                  <Picker.Item label="Dimensions" value="dimensions" />
                  <Picker.Item label="Weight" value="weight" />
                </Picker>
              </View>
            </View>

            {/* Dynamic Fields based on Parameter Type */}
            {formData.parameterType === 'size' && (
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Size</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                  placeholder="Enter size (e.g., S, M, L, XL)"
                  value={formData.size}
                  onChangeText={(text) => setFormData({...formData, size: text})}
                />
              </View>
            )}

            {formData.parameterType === 'capacity' && (
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Capacity</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                  placeholder="Enter capacity (e.g., 64GB, 128GB)"
                  value={formData.capacity}
                  onChangeText={(text) => setFormData({...formData, capacity: text})}
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Short Description</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900 h-20"
                placeholder="Enter short description"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={formData.shortDescription}
                onChangeText={(text) => setFormData({...formData, shortDescription: text})}
              />
            </View>

            <View>
              <Text className="text-sm text-gray-600 mb-1">Full Description</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900 h-32"
                placeholder="Enter full description"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
              />
            </View>
          </View>

          {/* Pricing */}
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-4">Pricing</Text>
            
            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">Price ($)</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => setFormData({...formData, price: text})}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">Discounted Price ($)</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.discountedPrice}
                  onChangeText={(text) => setFormData({...formData, discountedPrice: text})}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">SKU</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                placeholder="Enter SKU"
                value={formData.sku}
                onChangeText={(text) => setFormData({...formData, sku: text})}
              />
            </View>
          </View>

          {/* Inventory */}
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-4">Inventory</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Stock Quantity</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={formData.stock}
                onChangeText={(text) => setFormData({...formData, stock: text})}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">Track stock quantity</Text>
              <Switch
                value={!!formData.stock}
                onValueChange={(value) => setFormData({...formData, stock: value ? '1' : '0'})}
                trackColor={{ false: '#9CA3AF', true: '#E58F14' }}
              />
            </View>
          </View>

          {/* Manufacturer */}
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-4">Manufacturer</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Manufacturer Name</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                placeholder="Enter manufacturer name"
                value={formData.manufacturerName}
                onChangeText={(text) => setFormData({...formData, manufacturerName: text})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Manufacturer Address</Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2.5 text-gray-900 h-20"
                placeholder="Enter manufacturer address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={formData.manufacturerAddress}
                onChangeText={(text) => setFormData({...formData, manufacturerAddress: text})}
              />
            </View>

            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">Origin</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                  placeholder="Country of origin"
                  value={formData.origin}
                  onChangeText={(text) => setFormData({...formData, origin: text})}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">Expiry Date</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2.5 text-gray-900"
                  placeholder="DD/MM/YYYY"
                  value={formData.expiryDate}
                  onChangeText={(text) => setFormData({...formData, expiryDate: text})}
                />
              </View>
            </View>

            {/* Color Variants */}
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-medium text-gray-700">Color Variants</Text>
                <TouchableOpacity 
                  className="bg-[#E58F14] px-3 py-1 rounded-md"
                  onPress={() => setShowColorPicker(true)}
                >
                  <Text className="text-white text-xs">+ Add Color</Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row flex-wrap">
                {formData.colors.map((color, index) => (
                  <View key={color.id} className="relative mr-2 mb-2">
                    <View 
                      className="w-10 h-10 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.value }}
                    />
                    <TouchableOpacity 
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      onPress={() => {
                        const newColors = formData.colors.filter((_, i) => i !== index);
                        setFormData({...formData, colors: newColors});
                      }}
                    >
                      <XMarkIcon size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Color Picker Modal */}
              <Modal
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
                          <Text className="text-lg font-medium">Select Color</Text>
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
                              setFormData({
                                ...formData,
                                colors: [
                                  ...formData.colors, 
                                  { 
                                    id: Date.now(), 
                                    value: currentColor,
                                    name: currentColor.toUpperCase()
                                  }
                                ]
                              });
                              setShowColorPicker(false);
                            }}
                          >
                            <Text className="text-white font-medium">Add Color</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>

            {/* Price Slots */}
            <View className="mt-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-medium text-gray-700">Price Slots</Text>
                <TouchableOpacity 
                  className="bg-[#E58F14] px-3 py-1 rounded-md"
                  onPress={() => {
                    const newSlot = {
                      id: Date.now(),
                      quantity: '',
                      price: '',
                      offerPrice: ''
                    };
                    setFormData({
                      ...formData,
                      priceSlots: [...formData.priceSlots, newSlot]
                    });
                  }}
                >
                  <Text className="text-white text-xs">+ Add Slot</Text>
                </TouchableOpacity>
              </View>

              {formData.priceSlots.map((slot, index) => (
                <View key={slot.id} className="mb-4 border border-gray-200 rounded-lg p-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-medium text-gray-700">Slot #{index + 1}</Text>
                    {formData.priceSlots.length > 1 && (
                      <TouchableOpacity 
                        className="bg-red-100 p-1 rounded-full"
                        onPress={() => {
                          const newSlots = formData.priceSlots.filter((_, i) => i !== index);
                          setFormData({...formData, priceSlots: newSlots});
                        }}
                      >
                        <XMarkIcon size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="flex-row space-x-2 mb-2">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Quantity</Text>
                      <TextInput
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        placeholder="Qty"
                        keyboardType="numeric"
                        value={slot.quantity}
                        onChangeText={(text) => {
                          const newSlots = [...formData.priceSlots];
                          newSlots[index].quantity = text;
                          setFormData({...formData, priceSlots: newSlots});
                        }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Price (₹)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        placeholder="Price"
                        keyboardType="numeric"
                        value={slot.price}
                        onChangeText={(text) => {
                          const newSlots = [...formData.priceSlots];
                          newSlots[index].price = text;
                          setFormData({...formData, priceSlots: newSlots});
                        }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Offer Price (₹)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        placeholder="Offer Price"
                        keyboardType="numeric"
                        value={slot.offerPrice}
                        onChangeText={(text) => {
                          const newSlots = [...formData.priceSlots];
                          newSlots[index].offerPrice = text;
                          setFormData({...formData, priceSlots: newSlots});
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
            <Text className="text-sm font-medium text-gray-700 mb-4">Status</Text>
            
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm font-medium text-gray-700">Active</Text>
                <Text className="text-xs text-gray-500">When off, product will be hidden</Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData({...formData, isActive: value})}
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
                onValueChange={(value) => setFormData({...formData, isFeatured: value})}
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
                {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Weight (g)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3"
                placeholder="0"
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(text) => setFormData({...formData, weight: text})}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Dimensions (LxWxH)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3"
                placeholder="10x10x10"
                value={formData.dimensions}
                onChangeText={(text) => setFormData({...formData, dimensions: text})}
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
                {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


