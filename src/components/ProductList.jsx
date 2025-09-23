import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { PencilIcon, TrashIcon, PlusIcon } from 'react-native-heroicons/outline';

const ProductList = ({ 
  products = [], 
  loading = false, 
  refreshing = false, 
  onRefresh, 
  onDeleteProduct,
  showAddButton = true,
  showActions = true 
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleProductPress = (product) => {
    navigation.navigate('SellerProductDetail', { 
      productId: product.id,
      title: product.name
    });
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 shadow-sm mb-3 flex-row"
      onPress={() => handleProductPress(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.image }} 
        className="w-20 h-20 rounded-lg mr-3"
        resizeMode="cover"
        onError={(e) => {
          console.log('Image load error:', e.nativeEvent.error);
        }}
      />
      <View className="flex-1">
        <View className="flex-row justify-between">
          <Text className="font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-indigo-600 font-medium">${item.price}</Text>
        </View>
        <Text className="text-sm text-gray-500 mb-1">{item.category}</Text>
        <Text className="text-sm text-gray-700">{t('common:stock')}: {item.stock}</Text>
        
        <View className="flex-row justify-between mt-2">
          {showActions && (
            <View className="flex-row space-x-2">
              <TouchableOpacity 
                className="p-1"
                onPress={() => navigation.navigate('AddProduct', { productId: item.id })}
              >
                <PencilIcon size={20} color="#4F46F5" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="p-1"
                onPress={() => onDeleteProduct && onDeleteProduct(item.id)}
              >
                <TrashIcon size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-1 ${
              item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <Text className="text-xs text-gray-500">
              {item.status === 'active' ? t('common:active') : t('common:inactive')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      {showAddButton && (
        <View style={{ padding: 16, alignItems: 'flex-end' }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#E58F14',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <PlusIcon size={20} color="white" style={{ marginRight: 6 }} />
            <Text style={{ color: 'white', fontWeight: '500', fontSize: 14 }}>
              {t('common:add_product')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: showAddButton ? 0 : 16 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500 text-lg text-center">{t('common:no_products_found')}</Text>
            {showAddButton && (
              <TouchableOpacity
                className="mt-4 bg-indigo-600 px-6 py-2 rounded-lg"
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text className="text-white font-medium">{t('common:add_first_product')}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

export default ProductList;