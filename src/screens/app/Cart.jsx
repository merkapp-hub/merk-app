import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

const CartScreen = () => {
  const navigation = useNavigation();
  const { userInfo: user, updateCartCount } = useAuth();
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [taxRate, setTaxRate] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  
  // Constants
  const SERVICE_FEE = 25;
  const SHIPPING_FEE = 0; // Free shipping

  // Fetch cart items from localStorage
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cartData = await AsyncStorage.getItem('cartData');
      console.log('Cart data from storage:', cartData);
      
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        if (Array.isArray(parsedCart)) {
          const formattedItems = parsedCart.map(item => ({
            id: item._id,
            product: {
              _id: item.product_id,
              name: item.name,
              image: item.image || 'https://via.placeholder.com/300',
              price: item.price || 0,
              originalPrice: item.originalPrice || 0,
              category: 'Uncategorized'
            },
            variant: item.selectedVariant,
            selectedVariantName: item.selectedVariantName || '',
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            quantity: item.qty,
            totalPrice: item.total
          }));
          
          setCartItems(formattedItems);
        } else {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity in localStorage
  const updateCartQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    try {
      setUpdatingItem(itemId);
      
      const cartData = await AsyncStorage.getItem('cartData');
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        const updatedCart = parsedCart.map(item => {
          if (item._id === itemId) {
            return {
              ...item,
              qty: newQuantity,
              total: item.price * newQuantity
            };
          }
          return item;
        });
        
        await AsyncStorage.setItem('cartData', JSON.stringify(updatedCart));
        
        // Update local state
        setCartItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity, totalPrice: item.product.price * newQuantity }
            : item
        ));
        
        // Update cart count in tab navigator
        updateCartCount();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      Alert.alert(t('error'), error.message || t('failed_update_quantity'));
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove item from cart (localStorage)
  const removeFromCart = async (itemId) => {
    try {
      setUpdatingItem(itemId);
      
      const cartData = await AsyncStorage.getItem('cartData');
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        const updatedCart = parsedCart.filter(item => item._id !== itemId);
        
        await AsyncStorage.setItem('cartData', JSON.stringify(updatedCart));
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        
        // Update cart count in tab navigator
        updateCartCount();
        Alert.alert(t('success'), t('item_removed_cart'));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert(t('error'), error.message || t('failed_remove_item'));
    } finally {
      setUpdatingItem(null);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * taxRate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + tax + deliveryCharge + SERVICE_FEE;
  };

  // const calculateTotal = () => {
  //   return calculateSubtotal() + SERVICE_FEE + SHIPPING_FEE;
  // };

  // Render cart item
  const renderCartItem = ({ item }) => {
    const isUpdating = updatingItem === item.id;
    
    return (
      <View className="bg-white mx-4 mb-4 p-4 rounded-lg border border-gray-200">
        <View className="flex-row">
          {/* Product Image */}
          <Image
            source={{ uri: item.product.image }}
            className="w-20 h-20 rounded-lg mr-4"
            resizeMode="contain"
          />
          
          {/* Product Info */}
          <View className="flex-1">
            <Text className="text-black font-semibold text-base mb-1" numberOfLines={2}>
              {item.product.name}
            </Text>
            
            {/* Show variant details */}
            <View className="mb-2">
              {item.selectedVariantName && (
                <Text className="text-gray-600 text-xs mb-1">
                  {item.selectedVariantName}
                </Text>
              )}
              
              <View className="flex-row items-center flex-wrap">
                {item.selectedColor && (
                  <View className="flex-row items-center mr-3">
                    <Text className="text-gray-500 text-xs mr-1">Color:</Text>
                    <View 
                      className="w-3 h-3 rounded-full border border-gray-400"
                      style={{ backgroundColor: item.selectedColor }}
                    />
                  </View>
                )}
                
                {item.selectedSize && (
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 text-xs mr-1">Size:</Text>
                    <Text className="text-gray-700 text-xs font-medium">{item.selectedSize}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-black font-bold text-lg">
                  ${Number(item.product.price || 0).toFixed(2)}
                </Text>
                {item.product.originalPrice > item.product.price && (
                  <Text className="text-gray-400 line-through text-sm">
                    ${Number(item.product.originalPrice || 0).toFixed(2)}
                  </Text>
                )}
              </View>
             
         {/* Quantity Controls */}
<View className="flex-row items-center">
  <TouchableOpacity
    onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
    disabled={isUpdating}
    className={`w-8 h-8 rounded items-center justify-center ${isUpdating ? 'bg-gray-100' : 'bg-gray-200'}`}
  >
    <Text className={`text-lg font-bold ${isUpdating ? 'text-gray-400' : 'text-black'}`}>-</Text>
  </TouchableOpacity>
  
  <View className="mx-2 min-w-[25px] items-center">
    <Text className="text-base font-semibold">
      {item.quantity}
    </Text>
  </View>
  
  <TouchableOpacity
    onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
    disabled={isUpdating}
    className={`w-8 h-8 rounded items-center justify-center ${isUpdating ? 'bg-gray-100' : 'bg-gray-200'}`}
  >
    <Text className={`text-lg font-bold ${isUpdating ? 'text-gray-400' : 'text-black'}`}>+</Text>
  </TouchableOpacity>
</View>
            </View>
            
            {/* Item Total */}
            <Text className="text-right text-black font-bold text-lg mt-2">
              {t('total')}: ${Number(item.totalPrice || 0).toFixed(2)}
            </Text>
          </View>
        </View>
        
        {/* Remove Button */}
        <TouchableOpacity
          onPress={() => removeFromCart(item.id)}
          disabled={updatingItem === item.id && updatingItem !== null}
          className="mt-3 py-1 px-3 rounded self-end bg-slate-800"
        >
          <Text className="text-white text-center font-medium text-sm">
            {t('remove')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Fetch tax rate and delivery charges
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        // Fetch tax rate
        const { GetApi } = require('../../Helper/Service');
        const taxResponse = await GetApi('getTax');
        console.log(taxResponse)
        if (taxResponse?.taxRate !== undefined) {
          setTaxRate(taxResponse.taxRate);
        }

        // Fetch delivery charge
        const deliveryResponse = await GetApi('getDeliveryCharge');
        console.log("ddddddd",deliveryCharge)
        if (deliveryResponse?.data?.deliveryCharge !== undefined) {
          setDeliveryCharge(deliveryResponse.data.deliveryCharge);
        }
      } catch (error) {
        console.error('Error fetching charges:', error);
      }
    };

    fetchCharges();
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Add focus listener to refresh cart when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCartItems();
    });

    return unsubscribe;
  }, [navigation]);

  // Remove login requirement for cart - allow guest cart
  // if (!user) {
  //   return (
  //     <SafeAreaView className="flex-1 bg-white">
  //       <View className="flex-1 justify-center items-center px-4">
  //         <Text className="text-gray-500 text-lg mb-4">Please login to view your cart</Text>
  //         <TouchableOpacity 
  //           onPress={() => navigation.navigate('Auth')}
  //           className="bg-orange-500 px-6 py-3 rounded-lg"
  //         >
  //           <Text className="text-white font-medium">Login</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  const navigateToBilling = () => {
    // Pass complete product data including image
    const simplifiedCartItems = cartItems.map(item => ({
      id: item.id,
      product: {
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image, // Include the image URL
        originalPrice: item.product.originalPrice
      },
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    }));

    navigation.navigate('CartStack', {
      screen: 'BillingDetails',
      params: {
        cartItems: simplifiedCartItems,
        subtotal: calculateSubtotal(),
        serviceFee: SERVICE_FEE,
        shipping: SHIPPING_FEE,
        total: calculateTotal(),
        paymentMethod,
        taxRate: taxRate,
        deliveryCharge: deliveryCharge
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-gray-400 mt-4">{t('loading_cart')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity 
            onPress={fetchCartItems}
            className="bg-orange-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-lg mb-4">{t('cart_empty')}</Text>
          <TouchableOpacity 
            onPress={() => {
              // Reset the navigation stack and navigate to the Home tab
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'HomeTab' }],
                })
              );
            }}
            className="bg-orange-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">{t('continue_shopping')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
    <View className="flex-1">
      {/* Header */}
      <View className="bg-slate-800 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-semibold">{t('shopping_cart')}</Text>
            <Text className="text-gray-300 text-sm">{cartItems.length} {cartItems.length === 1 ? t('item') : t('items')}</Text>
          </View>
        </View>
      </View>

      {/* Cart Items - with proper flex to leave space for bottom section */}
      <View className="flex-1">
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ 
            paddingBottom: 20,
            paddingTop: 10
          }} 
          showsVerticalScrollIndicator={false}
          className="flex-1"
        />
      </View>

      {/* Order Summary - Fixed at bottom */}
      <View className="bg-white border-t border-gray-200 px-4 py-2 pb-28">
        <View className="mb-2">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 text-sm">{t('subtotal')}</Text>
            <Text className="font-medium text-sm">${calculateSubtotal().toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 text-sm">{t('service_fee')}</Text>
            <Text className="font-medium text-sm">${SERVICE_FEE.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 text-sm">Tax ({taxRate}%)</Text>
            <Text className="font-medium text-sm">${calculateTax().toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 text-sm">Delivery Charge</Text>
            <Text className="font-medium text-sm">${deliveryCharge.toFixed(2)}</Text>
          </View>
          {/* <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600 text-sm">{t('shipping')}</Text>
            <Text className="text-green-600 font-medium text-sm">
              {SHIPPING_FEE === 0 ? t('free') : `$${SHIPPING_FEE.toFixed(2)}`}
            </Text>
          </View> */}
          <View className="h-px bg-gray-200 my-2" />
          <View className="flex-row justify-between mb-2">
            <Text className="text-base font-bold">{t('total')}</Text>
            <Text className="text-base font-bold">${calculateTotal().toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View className="mb-2">
          <Text className="font-medium text-sm mb-1">{t('payment_method')}</Text>
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => setPaymentMethod('online')}
              className="flex-row items-center flex-1 p-3 border rounded-lg mr-2"
              style={{
                borderColor: paymentMethod === 'online' ? '#E58F14' : '#E5E7EB',
                backgroundColor: paymentMethod === 'online' ? '#FEF3C7' : '#FFFFFF'
              }}
            >
              <View className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 items-center justify-center"
                style={{
                  borderColor: paymentMethod === 'online' ? '#E58F14' : '#9CA3AF',
                  backgroundColor: paymentMethod === 'online' ? '#E58F14' : 'transparent'
                }}
              >
                {paymentMethod === 'online' && (
                  <View className="w-2 h-2 rounded-full bg-white" />
                )}
              </View>
              <Text className="font-medium">{t('pay_online')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          onPress={navigateToBilling}
          className="bg-slate-800 py-3 rounded-lg items-center justify-center mb-2"
          disabled={cartItems.length === 0}
        >
          <Text className="text-white font-bold text-base">
            {t('continue_to_pay')} ${calculateTotal().toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
  );
};

export default CartScreen;
