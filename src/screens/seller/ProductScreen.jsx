import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Platform,
  Modal,
  StyleSheet,
  StatusBar
} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL, COLORS } from '../../config';
import { GetApi } from '../../Helper/Service';
import { useAuth } from '../../context/AuthContext';
import ConnectionCheck from '../../Helper/ConnectionCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'react-native-feather';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

export default function ProductScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userToken: authToken } = useAuth() || {}; // Get token from auth context at the top level
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRefresh = useCallback(() => {
    fetchProducts(1, true);
  }, []);

  const fetchProducts = async (pageNum = 1, isRefreshing = false) => {
    try {
      if (pageNum === 1) {
        setRefreshing(true);
        setInitialLoad(true);
      } else {
        setLoading(true);
      }

      const user = await AsyncStorage.getItem('userInfo');
      const userDetail = user ? JSON.parse(user) : null;
      const sellerId = userDetail?._id;

      if (!sellerId) {
        throw new Error('Seller ID not found in user info');
      }

      const response = await GetApi(`getSellerProducts?seller_id=${sellerId}&page=${pageNum}&limit=10`, {});
      console.log('responsessss', response);
      if (response && response.status) {
        const newProducts = response.data || [];

        setProducts(prevProducts => {
          if (isRefreshing || pageNum === 1) {
            return newProducts;
          }
          return [...prevProducts, ...newProducts.filter(p => !prevProducts.some(prev => prev._id === p._id))];
        });

        if (response.pagination) {
          const { currentPage, totalPages } = response.pagination;
          setHasMore(currentPage < totalPages);
        } else {
          setHasMore(newProducts.length > 0);
        }

        setPage(pageNum);
      } else {
        throw new Error(response?.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoad(false);
    }
  };


  const confirmDelete = (productId) => {
    setSelectedProductId(productId);
    setShowDeleteModal(true);
  };


  const handleDeleteConfirm = async () => {
    if (!selectedProductId) return;

    try {

      const isConnected = await ConnectionCheck.isConnected();
      if (!isConnected) {
        throw new Error('No internet connection');
      }

      setShowDeleteModal(false);
      setLoading(true);

      console.log('1. Starting product deletion for ID:', selectedProductId);

      // Get the token from AsyncStorage or auth context
      let token = await AsyncStorage.getItem('userToken');
      console.log('2. Retrieved token from storage:', token ? 'Token exists' : 'No token found');

      // If no token in storage but we have it in context, update storage
      if (!token && authToken) {
        console.log('3. Using token from AuthContext');
        token = authToken;
        await AsyncStorage.setItem('userToken', token);
      }

      if (!token) {
        console.log('4. No authentication token found');
        // Clear any existing tokens and redirect to login
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Auth', {
          screen: 'Login',
          params: { message: 'Your session has expired. Please login again.' }
        });
        throw new Error('Please login to continue');
      }

      console.log('4. Making API call to delete product...');

      // Make direct Axios call with timeout
      const response = await axios({
        method: 'delete',
        url: `${API_BASE_URL}deleteProduct/${selectedProductId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 15000, // 15 second timeout
        validateStatus: (status) => status < 500 // Reject only if status is 500 or higher
      });

      console.log('5. API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      if (response.status === 401) {
        // Token is invalid or expired
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Auth', {
          screen: 'Login',
          params: { message: 'Your session has expired. Please login again.' }
        });
        throw new Error('Session expired. Please login again.');
      }

      // Check for success in either response.data.status or response.data.success
      if ((response.data && response.data.status === true) || (response.data && response.data.success === true)) {
        console.log('6. Product deleted successfully');
        setSuccessMessage(response.data.message || t('common:product_deleted'));
        setShowSuccessModal(true);
        await fetchProducts();
      } else {
        const errorMsg = response.data?.message || response.data?.message || t('common:delete_failed');
        console.error('7. Delete failed:', errorMsg, 'Full response:', response.data);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.message || error.message || t('common:delete_failed');

      if (error.response?.status === 401) {
        // If unauthorized, remove token and redirect to login
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Auth');
      }

      Alert.alert(t('common:error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchProducts(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(page + 1);
    }
  }, [loading, hasMore, page]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts(1, true);
    }, [])
  );

  const renderColorVariants = (colors) => {
    if (!colors || colors.length === 0) return null;

    return (
      <View className="flex-row flex-wrap gap-1 mt-2">
        {colors.slice(0, 4).map((color, index) => (
          <View
            key={index}
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: color.toLowerCase() }}
          />
        ))}
        {colors.length > 4 && (
          <View className="w-4 h-4 rounded-full bg-gray-200 items-center justify-center">
            <Text className="text-xs text-gray-600">+</Text>
          </View>
        )}
      </View>
    );
  };

  const getStockStatus = (stock) => {
    if (!stock || stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (stock <= 10) {
      return { text: `Low Stock (${stock})`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else {
      return { text: `In Stock (${stock})`, color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

  const renderProductItem = ({ item }) => {

    const getImageSource = () => {

      const variants = item.varients || item.variants;
      if (variants?.[0]?.image?.[0]) {
        const variantImage = variants[0].image[0];

        if (typeof variantImage === 'string' && variantImage.startsWith('data:image')) {
          return { uri: variantImage };
        } else if (typeof variantImage === 'string') {
          return { uri: variantImage };
        } else if (variantImage.uri) {
          return { uri: variantImage.uri };
        }
      }

      if (item.images?.[0]) {
        if (typeof item.images[0] === 'string' && item.images[0].startsWith('data:image')) {
          return { uri: item.images[0] };
        }
        return { uri: item.images[0] };
      }
      return null;
    };

    const imageSource = getImageSource();

    // Handle price from price_slot if available, otherwise use main price
    const price = item.price_slot?.[0]?.Offerprice || item.price || 0;
    const originalPrice = item.price_slot?.[0]?.price;
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const stockStatus = getStockStatus(item.stock || item.quantity || 0);
    const isActive = item.status === 'verified';



    return (
      <TouchableOpacity
        className="bg-white mx-4 my-2 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        onPress={() => navigation.navigate('SellerProductDetail', { productId: item._id })}
        activeOpacity={0.7}
      >
        {/* Header with Status and Action Buttons */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-50">
          <View className="flex-row items-center gap-2">
            <View className={`px-2 py-1 rounded-full ${stockStatus.bgColor}`}>
              <Text className={`text-xs font-medium ${stockStatus.color}`}>
                {stockStatus.text}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              style={{ backgroundColor: COLORS.mainColor }}
              className="p-2 rounded-lg"
              onPress={() => {
                console.log('Editing product ID:', item._id);
                navigation.navigate('Inventory', { screen: 'AddProduct', params: { productId: item._id } });
              }}
            >
              <Edit width={14} height={14} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: COLORS.secondaryColor }}
              className=" p-2 rounded-lg"
              onPress={() => confirmDelete(item._id)}
            >
              <Trash2 width={14} height={14} color={COLORS.mainColor} />
              {/* <Text className="text-white text-xs font-bold">🗑️</Text> */}
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-row p-4">
          {/* Product Image */}
          <View className="w-24 h-24 mr-4">
            {imageSource ? (
              <Image
                source={imageSource}
                className="w-full h-full rounded-lg"
                resizeMode="contain"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            ) : (
              <View className="w-full h-full rounded-lg bg-gray-200 items-center justify-center">
                <Text className="text-2xl text-gray-400">📷</Text>
              </View>
            )}
          </View>

          {/* Product Details */}
          <View className="flex-1">
            {/* Product Name */}
            <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={2}>
              {item.name || 'Unnamed Product'}
            </Text>

            {/* Price */}
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-2xl font-bold " style={{ color: COLORS.mainColor }}>
                ${price.toFixed(2)}
              </Text>
              {originalPrice && (
                <>
                  <Text className="text-lg text-gray-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </Text>
                  <Text className="text-sm bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    {discount}% OFF
                  </Text>
                </>
              )}
            </View>

            {/* Category */}
            <View className="flex-row items-center mb-2">
              <Text className="text-xs text-gray-500 mr-1">📂</Text>
              <Text className="text-sm text-gray-600">
                {item.category?.name || 'No Category'}
              </Text>
            </View>

            {/* Variants - using both spellings */}
            {(item.varients || item.variants)?.length > 0 && (
              <View className="mb-2">
                {/* <Text className="text-xs text-gray-500 mb-1">Variants:</Text> */}
                <View className="flex-row flex-wrap gap-1">
                  {(item.varients || item.variants || []).map((variant, idx) => (
                    <View key={idx} className="flex-row items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      {variant.color && (
                        <View
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: variant.color }}
                        />
                      )}
                      <Text className="text-xs text-gray-600">
                        {variant.value || 'Variant'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Info Row */}
            <View className="flex-row justify-between items-center mt-2">
              {item.brand && (
                <Text className="text-xs text-gray-500">
                  Brand: {item.brand}
                </Text>
              )}
              {item.sku && (
                <Text className="text-xs text-gray-500">
                  SKU: {item.sku}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bottom Section - Additional Details */}
        {(item.description || item.variants) && (
          <View className="px-4 pb-4 border-t border-gray-50 pt-3">
            {item.description && (
              <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {item.variants && item.variants.length > 0 && (
              <View className="flex-row flex-wrap gap-1">
                <Text className="text-xs text-gray-500 mr-2">Variants:</Text>
                {item.variants.slice(0, 3).map((variant, index) => (
                  <View key={index} className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="text-xs text-gray-600">
                      {variant.name || variant}
                    </Text>
                  </View>
                ))}
                {item.variants.length > 3 && (
                  <Text className="text-xs text-gray-500">+{item.variants.length - 3} more</Text>
                )}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View className="p-4 items-center">
        <ActivityIndicator size="small" color="#E58F14" />
      </View>
    );
  };

  // Success Message Component
  const SuccessMessage = ({ message, onClose }) => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={showSuccessModal}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successText}>{message}</Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={onClose}
          >
            <Text style={styles.successButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Delete Confirmation Modal
  const DeleteConfirmationModal = ({ visible, onConfirm, onCancel }) => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <Text style={styles.deleteModalTitle}>
            {t('common:delete_product_title') || 'Delete Product'}
          </Text>
          <Text style={styles.deleteModalText}>
            {t('common:delete_product_message') || 'Are you sure you want to delete this product? This action cannot be undone.'}
          </Text>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmDeleteButton}
              onPress={onConfirm}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-slate-800 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">{t('products')}</Text>
        </View>
      </View>
      {/* <StatusBar barStyle="light-content" backgroundColor="#fff" /> */}

      {/* Success Message Modal */}
      <SuccessMessage
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {initialLoad ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E58F14" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10, paddingHorizontal: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#000000']}
              tintColor="#000000"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-lg font-medium text-gray-500">
                No products found
              </Text>
              <Text className="text-sm text-gray-400 text-center mt-2">
                Add your first product to get started
              </Text>
            </View>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 100,
    alignItems: 'center',
    marginRight: 'auto',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  // Success Modal
  successModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIcon: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: -3,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 6,
  },
  successButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Delete Button
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deleteButtonIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
    marginLeft: 1,
  },
});