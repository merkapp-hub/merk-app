import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { GetApi, Api } from '../../Helper/Service';
import { useAuth } from '../../context/AuthContext';
import { HeartIcon as HeartIconSolid, ArrowLeftIcon } from 'react-native-heroicons/solid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

const Favorites = () => {
  const navigation = useNavigation();
  const { userInfo: user, addToCart, updateFavoritesCount } = useAuth();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quantities, setQuantities] = useState({});

  const fetchFavorites = async () => {
    try {
      setRefreshing(true);

      const localFavorites = await AsyncStorage.getItem('favorites');
      console.log('Local favorites from storage:', localFavorites);

      if (localFavorites && localFavorites !== 'null') {
        const favIds = JSON.parse(localFavorites);
        console.log('Parsed favorite IDs:', favIds);

        if (favIds.length === 0) {
          setFavorites([]);
          return;
        }

        const products = [];
        for (const id of favIds) {
          try {
            // Try different API endpoints for fetching product
            let productRes;

            // First try with getProductByslug
            try {
              productRes = await GetApi(`getProductByslug/${id}`);
            } catch (slugError) {
              // If that fails, try with getProductById
              try {
                productRes = await GetApi(`getProductById/${id}`);
              } catch (idError) {
                console.warn(`Both API calls failed for product ${id}`);
                // Remove this ID from local storage since product doesn't exist
                const currentFavs = await AsyncStorage.getItem('favorites');
                if (currentFavs) {
                  let favArray = JSON.parse(currentFavs);
                  favArray = favArray.filter(favId => favId !== id);
                  await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
                }
                continue;
              }
            }

            console.log(`Product ${id} response:`, productRes);

            // Handle different response formats
            let productData = productRes;
            if (productRes?.data) {
              productData = productRes.data;
            } else if (productRes?.product) {
              productData = productRes.product;
            }

            if (productData && productData._id) {
              products.push(productData);
            }
          } catch (err) {
            console.warn(`Failed to fetch product ${id}:`, err);
            // Remove invalid product ID from favorites
            const currentFavs = await AsyncStorage.getItem('favorites');
            if (currentFavs) {
              let favArray = JSON.parse(currentFavs);
              favArray = favArray.filter(favId => favId !== id);
              await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
            }
          }
        }

        console.log('Final favorite products:', products);
        setFavorites(products);
      } else {
        console.log('No favorites found in local storage');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      // Update local storage
      const localFavorites = await AsyncStorage.getItem('favorites');
      if (localFavorites) {
        let favArray = JSON.parse(localFavorites);
        favArray = favArray.filter(id => id !== productId);
        await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
        console.log('Removed from local favorites:', productId);
      }

      // Refresh the list
      fetchFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert(t('error'), t('failed_remove_favorites'));
    }
  };

  // Handle add to cart
  const handleAddToCart = async (product) => {
    try {
      const response = await addToCart(product, 0, 1); // Default to first variant and quantity 1
      if (response.success) {
        Alert.alert(t('success'), t('product_added_cart'));
      } else {
        Alert.alert(t('error'), response.error || t('failed_add_cart'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert(t('error'), t('failed_add_cart'));
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites();
    });
    return unsubscribe;
  }, [navigation, user]);

  // Render product item
  const renderProduct = ({ item }) => {
    const price = item.price_slot?.[0]?.Offerprice || 0;
    const originalPrice = item.price_slot?.[0]?.price || 0;
    const discount = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
    const image = item.varients?.[0]?.image?.[0] || item.image || 'https://via.placeholder.com/150';

    return (
      <View className="bg-white rounded-lg shadow-sm mb-4 mx-4 p-4 border border-gray-100">
        <View className="flex-row">
          <Image
            source={{ uri: image }}
            className="w-24 h-24 rounded-lg mr-4"
            resizeMode="cover"
          />
          <View className="flex-1">
            <View className="flex-row justify-between">
              <Text
                className="text-base font-semibold text-gray-900 flex-1 mr-2"
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveFavorite(item._id)}
                className="p-1"
              >
                <HeartIconSolid size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center mt-1">
              <Text className="text-lg font-bold text-gray-900">
                ${Math.round(price)}
              </Text>
              {originalPrice > price && (
                <Text className="text-sm text-gray-500 line-through ml-2">
                  ${Math.round(originalPrice)}
                </Text>
              )}
              {discount > 0 && (
                <Text className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded ml-2">
                  {discount}% OFF
                </Text>
              )}
            </View>

            {quantities[item._id] === undefined || quantities[item._id] === 0 ? (
              <TouchableOpacity
                onPress={() => {
                  handleAddToCart(item);
                  setQuantities(prev => ({ ...prev, [item._id]: 1 }));
                }}
                className="mt-3 bg-slate-800 py-1.5 px-4 rounded-lg items-center self-start"
              >
                <Text className="text-white font-semibold text-sm">{t('add_to_cart')}</Text>
              </TouchableOpacity>
            ) : (
              <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => setQuantities(prev => ({
                      ...prev,
                      [item._id]: Math.max(0, (prev[item._id] || 1) - 1)
                    }))}
                    className="w-8 h-8 bg-gray-200 rounded-md items-center justify-center"
                  >
                    <Text className="text-lg font-bold">-</Text>
                  </TouchableOpacity>
                  <Text className="mx-4 text-lg font-semibold">{quantities[item._id] || 0}</Text>
                  <TouchableOpacity
                    onPress={() => setQuantities(prev => ({
                      ...prev,
                      [item._id]: Math.min(10, (prev[item._id] || 1) + 1)
                    }))}
                    className="w-8 h-8 bg-gray-200 rounded-md items-center justify-center"
                  >
                    <Text className="text-lg font-bold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Text className="text-xl font-semibold text-gray-700 mb-2">{t('no_favorites_yet')}</Text>
      <Text className="text-gray-500 text-center mb-6">
        {t('no_favorites_message')}
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('HomeTab')}
        className="bg-slate-800 px-6 py-3 rounded-lg"
      >
        <Text className="text-white font-medium">{t('continue_shopping')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
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
          <Text className="text-white text-xl font-semibold">{t('my_favorites')}</Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 90
        }}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={fetchFavorites}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Favorites;