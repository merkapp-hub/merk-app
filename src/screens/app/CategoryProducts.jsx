import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';
import { GetApi } from '../../Helper/Service';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const CategoryProducts = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, categoryName } = route.params || {};
  const { t } = useTranslation();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const fetchProducts = useCallback(async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      const response = await GetApi(`getProductBycategoryId?category=${categoryId}&page=${page}&limit=${limit}`);
      
      // Handle different response formats
      let productsData = response.data || response;
      
      if (Array.isArray(productsData)) {
        const formattedProducts = productsData.map((product) => ({
          id: product._id,
          slug: product.slug || product._id,
          name: product.name || 'Unnamed Product',
          price: `$${Math.round(product.price_slot?.[0]?.Offerprice || 0)}`,
          originalPrice: `$${Math.round(product.price_slot?.[0]?.price || 0)}`,
          discount: product.price_slot?.[0]?.price && product.price_slot?.[0]?.Offerprice
            ? `${Math.round(((product.price_slot[0].price - product.price_slot[0].Offerprice) / 
                 product.price_slot[0].price * 100))}% OFF`
            : null,
          rating: 4.0,
          image: product.varients?.[0]?.image?.[0] || product.image || 'https://via.placeholder.com/300',
          category: product.category?.name || 'Uncategorized',
          soldPieces: product.sold_pieces || 0
        }));
        
        setProducts(prev => page === 1 ? formattedProducts : [...prev, ...formattedProducts]);
        setHasMore(formattedProducts.length === limit);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(t('failed_load_products'));
    } finally {
      setLoading(false);
    }
  }, [categoryId, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { 
        productId: item.slug || item.id,
        productName: item.name
      })}
    >
      {item.discount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
      )}

      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="contain"
      />

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}</Text>
          {item.originalPrice && item.originalPrice !== item.price && (
            <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProducts}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName || t('category_products')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('no_products_found_category')}</Text>
          </View>
        }
        ListFooterComponent={
          loading && products.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#0000ff" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  productList: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productCard: {
    width: width / 2 - 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discountBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  productInfo: {
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
    minHeight: 36,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerLoader: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryProducts;
