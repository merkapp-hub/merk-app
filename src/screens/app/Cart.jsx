import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput
} from 'react-native';

import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetApi, Post, Put, Delete } from '../../Helper/Service';
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

  const calculateTotal = () => {
    return calculateSubtotal() + SERVICE_FEE + SHIPPING_FEE;
  };

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
<<<<<<< HEAD
            
            {/* Show variant name if available */}
            {item.selectedVariantName && (
              <Text className="text-gray-600 text-sm mb-1">
                {t('variant')}: {item.selectedVariantName}
              </Text>
            )}
            
=======

>>>>>>> origin/latest-app
            {/* Show color or size if available */}
            {item.selectedColor && (
              <View className="flex-row items-center mb-2">
                <Text className="text-gray-500 text-sm mr-2">{t('color')}:</Text>
                <View
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: item.selectedColor }}
                />
              </View>
            )}

            {item.selectedSize && (
              <Text className="text-gray-500 text-sm mb-2">
                {t('size')}: {item.selectedSize}
              </Text>
            )}

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-black font-bold text-lg">
                  ${Math.round(item.product.price)}
                </Text>
                {item.product.originalPrice > item.product.price && (
                  <Text className="text-gray-400 line-through text-sm">
                    ${Math.round(item.product.originalPrice)}
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
              {t('total')}: ${Math.round(item.totalPrice)}
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
  //     <View className="flex-1 bg-white">
  //       <View className="flex-1 justify-center items-center px-4">
  //         <Text className="text-gray-500 text-lg mb-4">Please login to view your cart</Text>
  //         <TouchableOpacity 
  //           onPress={() => navigation.navigate('Auth')}
  //           className="bg-orange-500 px-6 py-3 rounded-lg"
  //         >
  //           <Text className="text-white font-medium">Login</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
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
        paymentMethod
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-gray-400 mt-4">{t('loading_cart')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={fetchCartItems}
            className="bg-orange-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <View className="bg-slate-800 px-4 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4"
            >
              <ChevronLeftIcon size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-semibold">{t('Cart')}</Text>
          </View>
        </View>
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
      </View>
    );
  }

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
          <Text className="text-white text-xl font-semibold">{t('Cart')}</Text>
        </View>
      </View>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">{t('shopping_cart')}</Text>
          <Text className="text-gray-500">{cartItems.length} {cartItems.length === 1 ? t('item') : t('items')}</Text>
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
        <View className="bg-white border-t border-gray-200 px-4 py-4 pb-20">
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">{t('subtotal')}</Text>
              <Text className="font-medium">${calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">{t('service_fee')}</Text>
              <Text className="font-medium">${SERVICE_FEE.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">{t('shipping')}</Text>
              <Text className="text-green-600 font-medium">
                {SHIPPING_FEE === 0 ? t('free') : `$${SHIPPING_FEE.toFixed(2)}`}
              </Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between mb-4">
              <Text className="text-lg font-bold">{t('total')}</Text>
              <Text className="text-lg font-bold">${calculateTotal().toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View className="mb-4">
            <Text className="font-medium mb-2">{t('payment_method')}</Text>
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
            className="bg-slate-800 py-3 rounded-lg items-center justify-center"
            disabled={cartItems.length === 0}
          >
            <Text className="text-white font-bold text-lg">
              {t('continue_to_pay')} ${calculateTotal().toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CartScreen;
