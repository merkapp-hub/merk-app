import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PlusIcon } from 'react-native-heroicons/solid';
import { PencilIcon, TrashIcon } from 'react-native-heroicons/outline';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { Post ,GetApi} from '../../Helper/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductList from '../../components/ProductList'; // Import the new component

const TabButton = ({ title, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 py-3 items-center justify-center border-b-2 ${
      active ? 'border-indigo-600' : 'border-gray-200'
    }`}
  >
    <Text
      className={`text-sm font-medium ${
        active ? 'text-indigo-600' : 'text-gray-500'
      }`}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function SellerOrdersScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Get seller ID from AsyncStorage
      const user = await AsyncStorage.getItem('userInfo');
      const userDetail = user ? JSON.parse(user) : null;
      const sellerId = userDetail?._id;
      
      console.log('User info from AsyncStorage (Orders):', userDetail);
      
      if (!sellerId) {
        throw new Error('Seller ID not found in user info');
      }
      
      console.log('Fetching orders for seller ID:', sellerId);
      
      // Fetch orders for the seller with pagination
      const page = 1;
      const limit = 20;
      const response = await Post(
        `getOrderBySeller?page=${page}&limit=${limit}`, 
        { seller_id: sellerId }
      );
      
      console.log('Orders API Response:', response);
      
      if (response && response.status) {
        // Transform the API response to match your component's expected format
        const apiOrders = response.data || [];
        
        const formattedOrders = apiOrders.map(order => ({
          id: order._id,
          orderNumber: order.orderId || `ORD-${order._id.slice(-6).toUpperCase()}`,
          customerName: order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Guest User' : 'Guest User',
          date: new Date(order.createdAt).toLocaleDateString(),
          amount: order.total || 0,
          status: order.status || 'Pending',
          items: order.productDetail?.map(item => ({
            id: item.product?._id || '',
            name: item.product?.name || item.productDetails?.name || 'Unknown Product',
            price: item.price || 0,
            quantity: item.qty || item.quantity || 1,
            image: Array.isArray(item.image) && item.image.length > 0 
              ? item.image[0] 
              : (item.product?.images?.[0]?.url || 'https://via.placeholder.com/150?text=No+Image')
          })) || []
        }));
        
        console.log('Formatted orders:', formattedOrders);
        setOrders(formattedOrders);
      } else {
        throw new Error(response?.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', error.message || 'Failed to load orders');
      
      // Fallback to mock data if API fails (for testing)
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'John Doe',
          date: new Date().toLocaleDateString(),
          amount: 99.99, // Changed from total to amount
          status: 'Pending', // Capitalized
          items: [
            { id: '1', name: 'Product 1', price: 49.99, quantity: 1 },
            { id: '2', name: 'Product 2', price: 50.00, quantity: 1 },
          ],
        },
      ];
      setOrders(mockOrders);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Get seller ID from AsyncStorage
      const user = await AsyncStorage.getItem('userInfo');
      const userDetail = user ? JSON.parse(user) : null;
      const sellerId = userDetail?._id;
      
      console.log('User info from AsyncStorage (Products):', userDetail);
      
      if (!sellerId) {
        throw new Error('Seller ID not found in user info');
      }
      
      console.log('Fetching products for seller ID:', sellerId);
      
      // Use the seller-specific endpoint for products
      const response = await GetApi(`getSellerProducts?seller_id=${sellerId}&page=1&limit=20`, {});
      
      console.log('Products API Response:', response);
      
      if (response && response.status) {
        // Transform the API response to match your component's expected format
        const products = response.data || [];
        const formattedProducts = products.map(product => {
          // Get price from price_slot array
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
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchProducts();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchProducts();
    }
  }, [activeTab]);

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 shadow-sm mb-3"
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-semibold text-gray-900">{item.orderNumber}</Text>
          <Text className="text-sm text-gray-500">{item.customerName}</Text>
          <Text className="text-sm text-gray-500">{item.date}</Text>
        </View>
        <View className="items-end">
          <Text className="font-semibold">${item.amount?.toFixed(2) || '0.00'}</Text>
          <View className={`px-2 py-1 rounded-full mt-1 ${
            item.status === 'Delivered' ? 'bg-green-100' :
            item.status === 'Processing' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            <Text className={`text-xs ${
              item.status === 'Delivered' ? 'text-green-800' :
              item.status === 'Processing' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46F5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500 text-lg">No orders found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}