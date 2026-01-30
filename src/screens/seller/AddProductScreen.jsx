// Complete React Native CLI Version - AddProductScreen.jsx
// Copy this entire file to: C:\Users\vaibh\Music\mobapp\merkapp\src\screens\seller\AddProductScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  Alert, ActivityIndicator, Modal, StyleSheet, Platform, PermissionsAndroid
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Postwithimage, GetApi, UploadFilesFormData } from '../../Helper/Service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

const API_BASE_URL = 'https://api.merkapp.net/api/';
const SIZE_LIST = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'For adult'];
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
  '#808080', '#008000', '#000080', '#800000', '#808000', '#008080',
  '#FFD700', '#C0C0C0', '#FF6347', '#4169E1', '#32CD32', '#FF1493'
];


const DEFAULT_SIZE = {
  id: Date.now() + Math.random(),
  label: "Size",
  value: "",
  total: 0,
};

const DEFAULT_CAPACITY = {
  id: Date.now() + Math.random(),
  label: "ML",
  value: 0,
  total: 0,
};

const DEFAULT_DIMENSIONS = {
  id: Date.now() + Math.random(),
  label: "Height (Inches)",
  label2: "Width (Inches)",
  Height: 0,
  Width: 0,
  total: 0,
};

const DEFAULT_WEIGHT = {
  id: Date.now() + Math.random(),
  label: "GR",
  value: 0,
  total: 0,
};


const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export default function AddProductScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const productId = route?.params?.productId || null;
  
 
 
  
  const [productData, setProductData] = useState({
    name: '', category: '', sku: '', model: '', origin: '', expirydate: '',
    manufacturername: '', manufactureradd: '', short_description: '',
    long_description: '', price: '', Offerprice: '', stock: '', hasVariants: false, 
    images: [], attributes: []
  });

  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([{
    color: '#000000', image: [], selected: [], price: '', Offerprice: '', stock: ''
  }]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 });
  const [imageUrl, setImageUrl] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [parameterType, setParameterType] = useState('');
  const [selectedParameterList, setSelectedParameterList] = useState([]);

  const updateColorFromRgb = (r, g, b) => {
    const hex = rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    setSelectedColor(hex);
    setRgbValues({ r, g, b });
  };

  const updateColorFromHex = (hex) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const rgb = hexToRgb(hex);
      setRgbValues(rgb);
      setSelectedColor(hex.toUpperCase());
    }
  };

  const resetForm = () => {
    console.log('Resetting form...');
    setProductData({
      name: '', category: '', sku: '', model: '', origin: '', expirydate: '',
      manufacturername: '', manufactureradd: '', short_description: '',
      long_description: '', price: '', Offerprice: '', stock: '', hasVariants: false, 
      images: [], attributes: []
    });
    setVariants([{
      color: '#000000', image: [], selected: [], price: '', Offerprice: '', stock: ''
    }]);
    setParameterType('');
    setSelectedParameterList([]);
  };

  useEffect(() => {
    loadUserData();
    fetchCategories();
    if (productId) {
      fetchProductById();
    } else {
    
      resetForm();
    }
  }, [productId]);


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
    
      if (!productId) {
     
        resetForm();
      }
    });

    return unsubscribe;
  }, [navigation, productId]);

  const loadUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('userInfo');
      console.log('Loading user data...');
      if (user) {
        const userData = JSON.parse(user);
        console.log('User data loaded:', userData);
        setUserId(userData._id);
        console.log('User ID set:', userData._id);
      } else {
        console.error('No user data found in AsyncStorage');
        Alert.alert('Error', 'Please login again to continue');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user data. Please login again.');
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await GetApi('getCategory');
      if (response?.status) setCategories(response.data);
    } catch (error) {
      console.error('Fetch categories error:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async () => {
    try {
    
      
      setLoading(true);
      const response = await GetApi(`getProductById/${productId}`);
      
      console.log('Product fetch response:', response);
      
      if (response?.status) {
        const product = response.data;
        console.log('Product data:', product);
        
        const hasVariants = product.varients?.length > 0;
     
        
        setProductData({
          ...productData,
          name: product.name || '',
          category: product.category?._id || '',
          sku: product.sku || '',
          model: product.model || '',
          origin: product.origin || '',
          expirydate: product.expirydate || '',
          manufacturername: product.manufacturername || '',
          manufactureradd: product.manufactureradd || '',
          short_description: product.short_description || '',
          long_description: product.long_description || '',
          hasVariants,
          price: hasVariants ? '' : (product.price_slot?.[0]?.price || ''),
          Offerprice: hasVariants ? '' : (product.price_slot?.[0]?.Offerprice || ''),
          stock: hasVariants ? '' : (product.stock || ''),
          images: product.images || [],
          attributes: product.attributes || []
        });
        
        if (hasVariants) {
          console.log('Setting variants:', product.varients);
          setVariants(product.varients);
        }
        
        console.log('Product data loaded successfully');
      } else {
        console.error('Failed to fetch product - no status in response');
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      Alert.alert('Error', 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        
      
        if (apiLevel >= 33) {
          return true;
        }
        
       
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your photos to upload images',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const pickImage = async (variantIndex = null) => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required', 
          'Please grant storage permission from app settings to upload images',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              Alert.alert('Info', 'Please enable storage permission from Settings > Apps > MerkApp > Permissions');
            }}
          ]
        );
        return;
      }

      launchImageLibrary({ 
        mediaType: 'photo', 
        quality: 0.7, 
        selectionLimit: 5, 
        includeBase64: false,
        maxWidth: 1200, 
        maxHeight: 1200,
      }, async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        } 
        
        if (response.errorCode) {
          console.error('ImagePicker Error:', response.errorCode, response.errorMessage);
          Alert.alert('Error', `Failed to pick image: ${response.errorMessage || 'Unknown error'}`);
          return;
        } 
        
        if (response.assets && response.assets.length > 0) {
       
          setLoading(true);
          
        
          const loadingTimeout = setTimeout(() => {
            console.warn('Upload timeout - forcing loading to stop');
            setLoading(false);
            Alert.alert('Timeout', 'Upload is taking too long. Please check your internet connection and try again.');
          }, 120000); 
          
          try {
            const imageFiles = response.assets.map((asset, index) => ({
              uri: asset.uri,
              type: asset.type || 'image/jpeg',
              name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
            }));
            
            console.log('Image files prepared:', imageFiles);
            
        
            const uploadedUrls = await uploadImagesToServer(imageFiles);
            
          
            clearTimeout(loadingTimeout);
            
            if (variantIndex !== null) {
             
              const newVariants = [...variants];
              newVariants[variantIndex].image = [
                ...newVariants[variantIndex].image, 
                ...uploadedUrls
              ];
              setVariants(newVariants);
              Alert.alert('Success', `${uploadedUrls.length} image(s) uploaded successfully!`);
            } else {
              
              setProductData(prev => ({ 
                ...prev, 
                images: [...prev.images, ...uploadedUrls] 
              }));
              Alert.alert('Success', `${uploadedUrls.length} image(s) uploaded successfully!`);
            }
          } catch (error) {
            console.error('Upload error:', error);
            clearTimeout(loadingTimeout);
            Alert.alert('Upload Failed', error.message || 'Failed to upload images. Please try again.');
          } finally {
        
            console.log('Turning off loading spinner');
            setLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Pick image error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

const uploadImagesToServer = async (images) => {
  try {
    console.log('=== Starting Image Upload ===');
    console.log('Number of images:', images.length);
    
    // Log each image details
    images.forEach((img, idx) => {
      console.log(`Image ${idx + 1}:`, {
        uri: img.uri,
        type: img.type,
        name: img.name,
        uriExists: !!img.uri
      });
    });
    
    // Use backend upload (proven to work)
    console.log('Uploading via backend...');
    const response = await UploadFilesFormData('uploadImagesAlt', images);
    
    console.log('=== Upload Response Received ===');
    console.log('Response:', response);
    
    // Handle success response
    if (response?.status && response?.data?.images) {
      console.log('✓ Images uploaded successfully:', response.data.images);
      return response.data.images;
    } else if (response?.images) {
      console.log('✓ Images uploaded successfully:', response.images);
      return response.images;
    } else if (Array.isArray(response?.data)) {
      console.log('✓ Images uploaded successfully:', response.data);
      return response.data;
    } else if (Array.isArray(response)) {
      console.log('✓ Images uploaded successfully:', response);
      return response;
    }
    
    console.error('✗ Unexpected response format:', response);
    throw new Error('Server did not return image URLs');
    
  } catch (error) {
    console.error('=== Upload Error ===');
    console.error('Error:', error.message);
    throw error;
  }
};

  const handleParameterTypeChange = (selectedType) => {
    setParameterType(selectedType);
    
    const parameterDefaults = {
      size: [DEFAULT_SIZE],
      weight: [DEFAULT_WEIGHT],
      dimensions: [DEFAULT_DIMENSIONS],
      capacity: [DEFAULT_CAPACITY],
    };

    const defaultParameters = parameterDefaults[selectedType] || [];
    setSelectedParameterList(defaultParameters);

    // Update first variant with default parameters
    const newVariants = [...variants];
    newVariants[0].selected = [...defaultParameters];
    setVariants(newVariants);
  };

  const updateParameterSlot = (variantIndex, slotIndex, field, value) => {
    const newVariants = [...variants];
    if (newVariants[variantIndex]?.selected[slotIndex]) {
      newVariants[variantIndex].selected[slotIndex][field] = value;
      setVariants(newVariants);
    }
  };

  const addParameterSlot = (variantIndex) => {
    if (selectedParameterList.length > 0) {
      const newVariants = [...variants];
      newVariants[variantIndex].selected.push({ 
        ...selectedParameterList[0],
        id: Date.now() + Math.random()
      });
      setVariants(newVariants);
    }
  };

  const removeParameterSlot = (variantIndex, slotIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].selected.splice(slotIndex, 1);
    setVariants(newVariants);
  };

  // Parameter Type Component for rendering different parameter types
  const renderParameterSlot = (slot, variantIndex, slotIndex) => {
    if (!slot.label2 && slot.label !== "Size") {
      // Capacity or Weight
      return (
        <View key={slotIndex} style={styles.parameterCard}>
          <TouchableOpacity
            style={styles.parameterRemoveBtn}
            onPress={() => removeParameterSlot(variantIndex, slotIndex)}
          >
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.parameterLabel}>{slot.label}</Text>
          <TextInput
            style={styles.parameterInput}
            placeholder="Value"
            value={slot.value ? slot.value.toString() : ''}
            onChangeText={(text) => updateParameterSlot(variantIndex, slotIndex, 'value', text)}
            keyboardType="number-pad"
          />
          <Text style={styles.parameterLabel}>Qty</Text>
          <TextInput
            style={styles.parameterInput}
            placeholder="Quantity"
            value={slot.total ? slot.total.toString() : ''}
            onChangeText={(text) => updateParameterSlot(variantIndex, slotIndex, 'total', text)}
            keyboardType="number-pad"
          />
        </View>
      );
    } else if (!slot.label2 && slot.label === "Size") {
      // Size
      return (
        <View key={slotIndex} style={styles.parameterCard}>
          <TouchableOpacity
            style={styles.parameterRemoveBtn}
            onPress={() => removeParameterSlot(variantIndex, slotIndex)}
          >
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.parameterLabel}>{slot.label}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={slot.value}
              style={styles.picker}
              onValueChange={(value) => updateParameterSlot(variantIndex, slotIndex, 'value', value)}
            >
              <Picker.Item label="Select Size" value="" />
              {SIZE_LIST.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
          <Text style={styles.parameterLabel}>Qty</Text>
          <TextInput
            style={styles.parameterInput}
            placeholder="Quantity"
            value={slot.total ? slot.total.toString() : ''}
            onChangeText={(text) => updateParameterSlot(variantIndex, slotIndex, 'total', text)}
            keyboardType="number-pad"
          />
        </View>
      );
    } else if (slot.label2) {
      // Dimensions
      return (
        <View key={slotIndex} style={styles.parameterCard}>
          <TouchableOpacity
            style={styles.parameterRemoveBtn}
            onPress={() => removeParameterSlot(variantIndex, slotIndex)}
          >
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.parameterLabel}>{slot.label}</Text>
          <TextInput
            style={styles.parameterInput}
            placeholder="Height"
            value={slot.Height ? slot.Height.toString() : ''}
            onChangeText={(text) => updateParameterSlot(variantIndex, slotIndex, 'Height', text)}
            keyboardType="number-pad"
          />
          <Text style={styles.parameterLabel}>{slot.label2}</Text>
          <TextInput
            style={styles.parameterInput}
            placeholder="Width"
            value={slot.Width ? slot.Width.toString() : ''}
            onChangeText={(text) => updateParameterSlot(variantIndex, slotIndex, 'Width', text)}
            keyboardType="number-pad"
          />
          <Text style={styles.parameterLabel}>Qty</Text>
          <TextInput
            style={styles.parameterInput}
            placeholder="Quantity"
            value={slot.total ? slot.total.toString() : ''}
            onChangeText={(text) => updateParameterSlot(variantIndex, slotIndex, 'total', text)}
            keyboardType="number-pad"
          />
        </View>
      );
    }
  };



  const handleSubmit = async () => {
    // Validation
    if (!productData.name || !productData.category) {
      Alert.alert('Error', 'Please fill required fields: Product Name and Category');
      return;
    }

    if (!productData.hasVariants) {
      if (!productData.price) {
        Alert.alert('Error', 'Please enter product price');
        return;
      }
      if (productData.images.length === 0) {
        Alert.alert('Error', 'Please add at least one product image');
        return;
      }
    } else {
      // Validate variants
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.color) {
          Alert.alert('Error', `Please select color for Variant #${i + 1}`);
          return;
        }
        if (!variant.price) {
          Alert.alert('Error', `Please enter price for Variant #${i + 1}`);
          return;
        }
        
        // Validation based on parameter type
        if (parameterType && parameterType !== '') {
          // If parameter type is selected, check for parameter slots
          if (!variant.selected || variant.selected.length === 0) {
            Alert.alert('Error', `Please add at least one parameter for Variant #${i + 1}`);
            return;
          }
        } else {
          // If no parameter type, check for stock quantity
          if (!variant.stock) {
            Alert.alert('Error', `Please enter stock quantity for Variant #${i + 1}`);
            return;
          }
          // Sizes are optional when no parameter type
        }
        
        if (variant.image.length === 0) {
          Alert.alert('Error', `Please add at least one image for Variant #${i + 1}`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      console.log('Submitting product...');
      
      if (!userId) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log('User ID:', userId);
      
      // Images are already uploaded when selected from gallery
      // No need to upload again, just use the URLs
      
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'hasVariants' && key !== 'pendingImages' && 
            key !== 'attributes' && key !== 'stock' && key !== 'price' && key !== 'Offerprice') {
          const value = productData[key];
          console.log(`Adding ${key}:`, value);
          formData.append(key, value || '');
        }
      });
      formData.append('userid', userId);
      formData.append('hasVariants', productData.hasVariants);
      
      // Add attributes as JSON (not in the loop above)
      formData.append('attributes', JSON.stringify(productData.attributes || []));
      
      if (productData.hasVariants) {
        // For variant products, set stock to 0 (stock is in variants)
        formData.append('stock', '0');
        formData.append('price_slot', JSON.stringify([]));
        // Send variants with image URLs
        formData.append('varients', JSON.stringify(variants));
        console.log('Variants:', JSON.stringify(variants, null, 2));
      } else {
        // For normal products, use the entered stock and price
        formData.append('stock', productData.stock || '0');
        formData.append('price_slot', JSON.stringify([{
          value: 1,
          price: parseFloat(productData.price) || 0,
          Offerprice: parseFloat(productData.Offerprice) || 0
        }]));
        formData.append('varients', JSON.stringify([]));
        formData.append('imageUrls', JSON.stringify(productData.images));
        console.log('Images:', productData.images);
      }
      
      if (productId) formData.append('id', productId);
      
      const endpoint = productId ? 'updateProduct' : 'createProduct';
      console.log('Calling endpoint:', endpoint);
      
      const response = await Postwithimage(endpoint, formData);
      
      console.log('Response:', response);
      
      if (response?.status) {
        const message = productId 
          ? 'Product updated successfully' 
          : 'Product submitted for admin approval';
        Alert.alert('Success', message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Handle specific error cases
        let errorMessage = response?.message || 'Failed to save product';
        
        // Check for duplicate SKU error
        if (response?.message?.includes('E11000') && response?.message?.includes('sku')) {
          errorMessage = 'This SKU is already in use. Please use a different SKU or leave it empty for auto-generation.';
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Request data:', {
        name: productData.name,
        category: productData.category,
        hasVariants: productData.hasVariants,
        userId: userId,
        variantsCount: variants.length,
        imagesCount: productData.images.length
      });
      
      let errorMessage = 'Failed to save product';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check all required fields and try again.';
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
      <View style={styles.container}>
        {/* Header */}
        <View className="bg-slate-800 px-4 py-5">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mr-4"
            >
              <ChevronLeftIcon size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{productId ? 'Edit Product' : 'Add Product'}</Text>
          </View>
        </View>
        
        {/* Loading Overlay */}
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#E59013" />
            {/* <Text style={styles.loadingText}>Uploading images...</Text> */}
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{productId ? 'Edit Product' : 'Add Product'}</Text>
        <View style={styles.headerRight} />
      </View> */}<View className="bg-slate-800 px-4 py-5">
                    <View className="flex-row items-center">
                      <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="mr-4"
                      >
                        <ChevronLeftIcon size={24} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>{productId ? 'Edit Product' : 'Add Product'}</Text>
                    </View>
                  </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            value={productData.name}
            onChangeText={(text) => setProductData({ ...productData, name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={productData.category}
              style={styles.picker}
              onValueChange={(value) => {
                const selectedCategory = categories.find(cat => cat._id === value);
                setProductData({ 
                  ...productData, 
                  category: value,
                  attributes: selectedCategory?.attributes || []
                });
              }}
            >
              <Picker.Item label="Select Category" value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
              ))}
            </Picker>
          </View>
        </View>

        {productData.hasVariants && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parameter Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={parameterType}
                style={styles.picker}
                onValueChange={(value) => handleParameterTypeChange(value)}
              >
                <Picker.Item label="Select Parameter Type" value="" />
                <Picker.Item label="Size" value="size" />
                <Picker.Item label="Capacity" value="capacity" />
                <Picker.Item label="Dimensions" value="dimensions" />
                <Picker.Item label="Weight" value="weight" />
              </Picker>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SKU (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Auto-generated if empty"
            value={productData.sku}
            onChangeText={(text) => {
              console.log('SKU changed to:', text);
              setProductData({ ...productData, sku: text });
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter model"
            value={productData.model}
            onChangeText={(text) => setProductData({ ...productData, model: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country of Origin *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter country"
            value={productData.origin}
            onChangeText={(text) => setProductData({ ...productData, origin: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expiry Date *</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {productData.expirydate || 'Select expiry date'}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={productData.expirydate ? new Date(productData.expirydate) : selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) {
                  const formattedDate = date.toISOString().split('T')[0];
                  setProductData({ ...productData, expirydate: formattedDate });
                  setSelectedDate(date);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Manufacturer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter manufacturer name"
            value={productData.manufacturername}
            onChangeText={(text) => setProductData({ ...productData, manufacturername: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Manufacturer Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address"
            value={productData.manufactureradd}
            onChangeText={(text) => setProductData({ ...productData, manufactureradd: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Short Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter short description"
            value={productData.short_description}
            onChangeText={(text) => setProductData({ ...productData, short_description: text })}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Long Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter detailed description"
            value={productData.long_description}
            onChangeText={(text) => setProductData({ ...productData, long_description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Attributes Section */}
        {productData.attributes && productData.attributes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Attributes</Text>
            {productData.attributes.map((attr, idx) => (
              <View key={idx} style={styles.attributeRow}>
                <Text style={styles.attributeName}>{attr.name}:</Text>
                <Text style={styles.attributeValue}>{attr.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Product Type */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Type</Text>
          <TouchableOpacity
            style={[styles.radioOption, !productData.hasVariants && styles.radioOptionSelected]}
            onPress={() => setProductData({ ...productData, hasVariants: false })}
          >
            <View style={[styles.radio, !productData.hasVariants && styles.radioSelected]} />
            <Text style={styles.radioText}>Normal Product (Single Price)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioOption, productData.hasVariants && styles.radioOptionSelected]}
            onPress={() => setProductData({ ...productData, hasVariants: true })}
          >
            <View style={[styles.radio, productData.hasVariants && styles.radioSelected]} />
            <Text style={styles.radioText}>Product with Variants</Text>
          </TouchableOpacity>
        </View>

        {/* Normal Product */}
        {!productData.hasVariants && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Pricing</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Regular Price ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={productData.price}
                onChangeText={(text) => setProductData({ ...productData, price: text })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Offer Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={productData.Offerprice}
                onChangeText={(text) => setProductData({ ...productData, Offerprice: text })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Stock Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={productData.stock}
                onChangeText={(text) => setProductData({ ...productData, stock: text })}
                keyboardType="number-pad"
              />
            </View>

            <Text style={styles.cardTitle}>Product Images</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Enter image URL"
                value={imageUrl}
                onChangeText={setImageUrl}
              />
              <TouchableOpacity style={styles.btnSmall} onPress={() => {
                if (imageUrl) {
                  setProductData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
                  setImageUrl('');
                }
              }}>
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(null)}>
              <Text style={styles.btnText}>Upload from Gallery</Text>
            </TouchableOpacity>
            <View style={styles.imageGrid}>
              {/* URL Images */}
              {productData.images.map((img, idx) => (
                <View key={`url-${idx}`} style={styles.imageWrapper}>
                  <Image source={{ uri: img }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => {
                      const newImages = [...productData.images];
                      newImages.splice(idx, 1);
                      setProductData({ ...productData, images: newImages });
                    }}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Variants */}
        {productData.hasVariants && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Variants</Text>
            {variants.map((variant, vIdx) => (
              <View key={vIdx} style={styles.variantCard}>
                <View style={styles.variantHeader}>
                  <Text style={styles.variantTitle}>Variant #{vIdx + 1}</Text>
                  {variants.length > 1 && (
                    <TouchableOpacity
                      style={styles.btnDanger}
                      onPress={() => {
                        if (variants.length > 1) {
                          setVariants(variants.filter((_, i) => i !== vIdx));
                        }
                      }}
                    >
                      <Text style={styles.btnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Color *</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      placeholder="#000000"
                      value={variant.color}
                      onChangeText={(text) => {
                        const newVariants = [...variants];
                        newVariants[vIdx].color = text;
                        setVariants(newVariants);
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.colorBox, { backgroundColor: variant.color }]}
                      onPress={() => {
                        setCurrentVariantIndex(vIdx);
                        const rgb = hexToRgb(variant.color);
                        setRgbValues(rgb);
                        setSelectedColor(variant.color);
                        setShowColorPicker(true);
                      }}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Regular Price ($) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={variant.price}
                    onChangeText={(text) => {
                      const newVariants = [...variants];
                      newVariants[vIdx].price = text;
                      setVariants(newVariants);
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Offer Price ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={variant.Offerprice}
                    onChangeText={(text) => {
                      const newVariants = [...variants];
                      newVariants[vIdx].Offerprice = text;
                      setVariants(newVariants);
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Parameter Type or Stock Quantity */}
                {parameterType && parameterType !== '' ? (
                  // Show Parameters when parameter type is selected
                  <View>
                    <Text style={styles.label}>Parameters</Text>
                    <View style={styles.parameterGrid}>
                      {variant.selected && variant.selected.map((slot, sIdx) => renderParameterSlot(slot, vIdx, sIdx))}
                    </View>
                    <TouchableOpacity
                      style={styles.btnSuccess}
                      onPress={() => addParameterSlot(vIdx)}
                    >
                      <Text style={styles.btnText}>Add More Parameter</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Show only Stock Quantity when no parameter type
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Stock Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={variant.stock?.toString() || ''}
                      onChangeText={(text) => {
                        const newVariants = [...variants];
                        newVariants[vIdx].stock = text;
                        setVariants(newVariants);
                      }}
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <Text style={styles.label}>Variant Images</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="Enter image URL"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                  />
                  <TouchableOpacity
                    style={styles.btnSmall}
                    onPress={() => {
                      if (imageUrl) {
                        const newVariants = [...variants];
                        newVariants[vIdx].image.push(imageUrl);
                        setVariants(newVariants);
                        setImageUrl('');
                      }
                    }}
                  >
                    <Text style={styles.btnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(vIdx)}>
                  <Text style={styles.btnText}>Upload from Gallery</Text>
                </TouchableOpacity>
                <View style={styles.imageGrid}>
                  {/* URL Images */}
                  {variant.image.map((img, imgIdx) => (
                    <View key={`url-${imgIdx}`} style={styles.imageWrapper}>
                      <Image source={{ uri: img }} style={styles.imageThumb} />
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => {
                          const newVariants = [...variants];
                          newVariants[vIdx].image.splice(imgIdx, 1);
                          setVariants(newVariants);
                        }}
                      >
                        <Text style={styles.removeBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => setVariants([...variants, {
                color: '#000000', 
                image: [], 
                selected: selectedParameterList.length > 0 ? [selectedParameterList[0]] : [], 
                price: '', 
                Offerprice: '',
                stock: ''
              }])}
            >
              <Text style={styles.btnText}>Add More Variant</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
          <Text style={styles.btnSubmitText}>
            {productId ? 'Update Product' : 'Create Product'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Color</Text>
              
              {/* Color Preview */}
              <View style={styles.selectedColorPreview}>
                <View style={[styles.colorPreviewBox, { backgroundColor: selectedColor }]} />
                <Text style={styles.colorText}>{selectedColor}</Text>
              </View>

              {/* Preset Colors */}
              <Text style={styles.sectionLabel}>Quick Colors:</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => {
                      const rgb = hexToRgb(color);
                      setRgbValues(rgb);
                      setSelectedColor(color);
                    }}
                  >
                    {selectedColor === color && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Hex Input */}
              <Text style={styles.sectionLabel}>Or Enter Hex Code:</Text>
              <TextInput
                style={styles.input}
                placeholder="#000000"
                value={selectedColor}
                onChangeText={(text) => {
                  setSelectedColor(text.toUpperCase());
                  updateColorFromHex(text);
                }}
                maxLength={7}
                autoCapitalize="characters"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowColorPicker(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={() => {
                    const newVariants = [...variants];
                    newVariants[currentVariantIndex].color = selectedColor;
                    setVariants(newVariants);
                    setShowColorPicker(false);
                  }}
                >
                  <Text style={styles.btnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#1F2937', 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: { 
    padding: 8,
    marginLeft: -8,
  },
  backIcon: { 
    fontSize: 32, 
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: { 
    width: 40,
  },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1f2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  datePickerButton: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  datePickerText: { fontSize: 14, color: '#1f2937' },
  calendarIcon: { fontSize: 20 },
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
  picker: { color: '#1f2937', backgroundColor: 'transparent' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  radioOption: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 8 },
  radioOptionSelected: { backgroundColor: '#fef3c7' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#9ca3af', marginRight: 8 },
  radioSelected: { borderColor: '#E58F14', backgroundColor: '#E58F14' },
  radioText: { fontSize: 14, color: '#1f2937' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  flex1: { flex: 1 },
  btnSmall: { backgroundColor: '#E58F14', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  btnSecondary: { backgroundColor: '#E58F14', paddingVertical: 12, borderRadius: 8, marginBottom: 8 },
  btnPrimary: { backgroundColor: '#E58F14', paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  btnSuccess: { backgroundColor: '#E58F14', paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  btnDanger: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  btnSubmit: { backgroundColor: '#E58F14', paddingVertical: 16, borderRadius: 8, marginTop: 24, marginBottom: 32 },
  btnSubmitText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imageWrapper: { position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 8 },
  pendingBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(229, 143, 20, 0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pendingText: { fontSize: 12 },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  variantCard: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  variantTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  colorBox: { width: 48, height: 48, borderRadius: 8, borderWidth: 2, borderColor: '#9ca3af' },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  qtyInput: { width: 80 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8 },
  modalBtnCancel: { backgroundColor: '#6b7280' },
  modalBtnConfirm: { backgroundColor: '#E58F14' },
  modalScrollView: { maxHeight: '90%' },
  selectedColorPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 12 },
  colorPreviewBox: { width: 80, height: 80, borderRadius: 12, borderWidth: 3, borderColor: '#d1d5db' },
  colorText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  colorOption: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  colorOptionSelected: { borderColor: '#E58F14', borderWidth: 3 },
  checkmark: { color: '#fff', fontSize: 20, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  sliderGroup: { marginBottom: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  sliderValue: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  slider: { width: '100%', height: 40 },
  helperText: { fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
  attributeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  attributeName: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  attributeValue: { fontSize: 14, color: '#1f2937', flex: 2 },
  parameterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  parameterCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, width: '48%', position: 'relative' },
  parameterRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  parameterLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  parameterInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, color: '#1f2937' },
});
