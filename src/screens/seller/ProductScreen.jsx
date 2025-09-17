import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GetApi } from '../../Helper/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductList from '../../components/ProductList';

export default function ProductScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
    
      const user = await AsyncStorage.getItem('userInfo');
      const userDetail = user ? JSON.parse(user) : null;
      const sellerId = userDetail?._id;
      
      console.log('User info from AsyncStorage (Products):', userDetail);
      
      if (!sellerId) {
        throw new Error('Seller ID not found in user info');
      }
      
      console.log('Fetching products for seller ID:', sellerId);
      
      
      const response = await GetApi(`getSellerProducts?seller_id=${sellerId}&page=1&limit=20`, {});
      
      console.log('Products API Response:', response);
      
      if (response && response.status) {
      
        const products = response.data || [];
        const formattedProducts = products.map(product => {
        
          const priceSlot = product.price_slot && product.price_slot.length > 0 ? product.price_slot[0] : null;
          const price = priceSlot?.price || priceSlot?.Offerprice || 0;
          
          // Get image from variants - FIX: Handle base64 image data
          let imageUrl = 'https://via.placeholder.com/150?text=No+Image';
          if (product.varients && product.varients.length > 0 && product.varients[0].image) {
            const imageData = product.varients[0].image;
            // Check if imageData is array and get first base64 image
            if (Array.isArray(imageData) && imageData.length > 0) {
              // Base64 images already have data:image prefix, use directly
              imageUrl = imageData[0];
            } else if (typeof imageData === 'string') {
              imageUrl = imageData;
            }
          }
          
          return {
            id: product._id,
            name: product.name || 'Unnamed Product',
            price: price,
            stock: product.sold_pieces || 0,
            image: imageUrl, 
            category: product.category?.name || 'Uncategorized',
            status: product.status === 'verified' ? 'active' : 'inactive',
            description: product.short_description || '',
            slug: product.slug || '',
            createdAt: product.createdAt
          };
        });
        
        console.log('Formatted products:', formattedProducts);
        setProducts(formattedProducts);
      } else {
        throw new Error(response?.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      Alert.alert(
        'Delete Product',
        'Are you sure you want to delete this product? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                // Call the API to delete the product
                const response = await Api.delete(`products/delete/${productId}`);
                
                if (response && response.success) {
                  // Refresh the products list after successful deletion
                  await fetchProducts();
                  Alert.alert('Success', 'Product deleted successfully');
                } else {
                  throw new Error(response?.message || 'Failed to delete product');
                }
              } catch (error) {
                console.error('Error deleting product:', error);
                Alert.alert('Error', error.message || 'Failed to delete product');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46F5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ProductList
        products={products}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onDeleteProduct={deleteProduct}
        showAddButton={true}
        showActions={true}
      />
    </SafeAreaView>
  );
}