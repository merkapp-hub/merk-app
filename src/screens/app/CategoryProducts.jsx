import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { GetApi } from '../../Helper/Service';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';


const { width } = Dimensions.get('window');

const CategoryProducts = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, categoryName } = route.params || {};
  const { t } = useTranslation();
  const { convertPrice, currencySymbol } = useCurrency();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const fetchProducts = useCallback(async () => {
    if (!categoryId) return;

    try {
      // Only show loading indicator on first page load or refresh
      if (page === 1) {
        setLoading(true);
        setProducts([]); 
      } else {
        setLoading(false);
        setLoadingMore(true); // Show footer loader for pagination
      }

      setError(null);

      console.log('Fetching products for category ID:', categoryId, 'Page:', page);

  
      const response = await GetApi(`getProductByCategory/${categoryId}?page=${page}&limit=${limit}&is_verified=true`);

      console.log('API Response:', {
        status: response?.status,
        dataCount: response?.data?.length,
        firstProduct: response?.data?.[0],
        pagination: response?.pagination
      });

      if (!response || !response.data) {
        throw new Error('Invalid API response');
      }

      const productsData = response.data;
      const pagination = response.pagination || {};

      if (Array.isArray(productsData)) {
     
        if (productsData.length > 0) {
          console.log('First product category:', {
            productId: productsData[0]._id,
            productName: productsData[0].name,
            category: productsData[0].category,
            expectedCategoryId: categoryId
          });
        }

        // Format the products - server should already filter by category
        const formattedProducts = productsData.map((product) => {
          // Get image - check variants first, then images array, then direct image
          const getImage = () => {
            if (product.varients && product.varients.length > 0 && product.varients[0].image && product.varients[0].image.length > 0) {
              return product.varients[0].image[0];
            }
            if (product.images && product.images.length > 0) {
              return product.images[0];
            }
            if (product.image) {
              return product.image;
            }
            return 'https://via.placeholder.com/300';
          };

          // Get price - check variants first, then price_slot
          let price = 0;
          let originalPrice = 0;
          
          if (product.varients && product.varients.length > 0) {
            const variant = product.varients[0];
            originalPrice = variant.price || 0;
            price = variant.Offerprice && variant.Offerprice > 0 ? variant.Offerprice : variant.price || 0;
          }
          
          if (price === 0 && product.price_slot && product.price_slot.length > 0) {
            originalPrice = product.price_slot[0].price || 0;
            // Use Offerprice only if it's greater than 0, otherwise use price
            price = product.price_slot[0].Offerprice && product.price_slot[0].Offerprice > 0 
              ? product.price_slot[0].Offerprice 
              : product.price_slot[0].price || 0;
          }

          const discount = originalPrice > 0 && price < originalPrice
            ? Math.round(((originalPrice - price) / originalPrice * 100))
            : 0;

          return {
            id: product._id,
            slug: product.slug || product._id,
            name: product.name || 'Unnamed Product',
            price: price,
            originalPrice: originalPrice,
            discount: discount,
            rating: 4.0,
            image: getImage(),
            category: typeof product.category === 'object' ? product.category.name : 'Uncategorized',
            soldPieces: product.sold_pieces || 0,
            _raw: product
          };
        });



        setProducts(prev => {
          console.log('📦 Setting products:');
          console.log('   Current products count:', prev.length);
          console.log('   New products count:', formattedProducts.length);
          console.log('   Page:', page);

          if (page === 1) {
            console.log('   ✅ First page - replacing all products');
            return formattedProducts;
          }

          const combined = [...prev, ...formattedProducts];
          console.log('   ✅ Appending - Total products now:', combined.length);
          return combined;
        });

        // Update hasMore based on pagination or data count
        let hasMorePages = false;
        
        if (pagination && pagination.currentPage && pagination.totalPages) {
          // If pagination object exists, use it
          hasMorePages = pagination.currentPage < pagination.totalPages;
          console.log('📊 Using pagination object for hasMore calculation');
        } else {
          // Fallback: if we got exactly the limit, there might be more
          hasMorePages = formattedProducts.length === limit;
          console.log('📊 Using data count for hasMore calculation');
          console.log('   Products received:', formattedProducts.length);
          console.log('   Limit:', limit);
          console.log('   Assuming more pages:', hasMorePages);
        }
        
        console.log('📊 Pagination Info:');
        console.log('   Current Page:', pagination?.currentPage || page);
        console.log('   Total Pages:', pagination?.totalPages || 'Unknown');
        console.log('   Items Per Page:', pagination?.itemsPerPage || limit);
        console.log('   Total Items:', pagination?.totalItems || 'Unknown');
        console.log('   Has More Pages:', hasMorePages);
        console.log('   Products loaded this page:', formattedProducts.length);
        setHasMore(hasMorePages);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(t('failed_load_products'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId, page]);

  // Reset pagination when category changes
  useEffect(() => {
    console.log('Category changed to:', categoryId);
    if (categoryId) {
      console.log('Resetting pagination for new category');
      setPage(1);
      setProducts([]);
      setHasMore(true);
      setLoading(true);
    }
  }, [categoryId]);

  // Fetch products when page or category changes
  useEffect(() => {
    if (categoryId) {

      const fetchData = async () => {
        try {
          await fetchProducts();
        } catch (error) {
          console.error('Error in fetchData:', error);
          // If the first attempt fails, try the alternative endpoint
          if (page === 1) {

            try {
              const response = await GetApi(`getProducts?category=${categoryId}&page=${page}&limit=${limit}&is_verified=true`);
              if (response && response.data) {
                const formattedProducts = response.data.map((product) => {
                  // Get image - check variants first, then images array, then direct image
                  const getImage = () => {
                    if (product.varients && product.varients.length > 0 && product.varients[0].image && product.varients[0].image.length > 0) {
                      return product.varients[0].image[0];
                    }
                    if (product.images && product.images.length > 0) {
                      return product.images[0];
                    }
                    if (product.image) {
                      return product.image;
                    }
                    return 'https://via.placeholder.com/300';
                  };

                  // Get price - check variants first, then price_slot
                  let price = 0;
                  let originalPrice = 0;
                  
                  if (product.varients && product.varients.length > 0) {
                    const variant = product.varients[0];
                    originalPrice = variant.price || 0;
                    price = variant.Offerprice && variant.Offerprice > 0 ? variant.Offerprice : variant.price || 0;
                  }
                  
                  if (price === 0 && product.price_slot && product.price_slot.length > 0) {
                    originalPrice = product.price_slot[0].price || 0;
                    // Use Offerprice only if it's greater than 0, otherwise use price
                    price = product.price_slot[0].Offerprice && product.price_slot[0].Offerprice > 0 
                      ? product.price_slot[0].Offerprice 
                      : product.price_slot[0].price || 0;
                  }

                  const discount = originalPrice > 0 && price < originalPrice
                    ? Math.round(((originalPrice - price) / originalPrice * 100))
                    : 0;

                  return {
                    id: product._id,
                    slug: product.slug || product._id,
                    name: product.name || 'Unnamed Product',
                    price: price,
                    originalPrice: originalPrice,
                    discount: discount,
                    rating: 4.0,
                    image: getImage(),
                    category: typeof product.category === 'object' ? product.category.name : 'Uncategorized',
                    soldPieces: product.sold_pieces || 0,
                    _raw: product
                  };
                });
                setProducts(formattedProducts);
                setHasMore(response.pagination?.currentPage < response.pagination?.totalPages);
              }
            } catch (fallbackError) {
              console.error('Fallback endpoint also failed:', fallbackError);
              setError('Failed to load products. Please try again.');
            }
          }
        }
      };
      fetchData();
    }
  }, [page, categoryId, fetchProducts]);

  // Debug effect
  useEffect(() => {

    if (products.length > 0) {
      console.log('Sample product data:', {
        id: products[0].id,
        name: products[0].name,
        category: products[0]._raw?.category,
        price: products[0].price,
        originalPrice: products[0].originalPrice
      });
    }
    console.log('==================');
  }, [products, categoryId, categoryName]);

  const loadMore = useCallback(() => {
    console.log('🔄 Load More Triggered:');
    console.log('   Current page:', page);
    console.log('   Has more:', hasMore);
    console.log('   Loading:', loading);
    console.log('   Total products:', products.length);
    
    if (!loading && hasMore) {
      console.log('   ✅ Loading next page:', page + 1);
      setPage(prev => prev + 1);
    } else {
      console.log('   ❌ Not loading more:');
      if (loading) console.log('      - Already loading');
      if (!hasMore) console.log('      - No more pages');
    }
  }, [page, hasMore, loading, products.length]);

  const renderItem = ({ item }) => {
    const discountText = item.discount > 0 ? `${item.discount}% OFF` : null;
    const isOnSale = item.price < item.originalPrice;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          // Navigate to ProductDetail within the current stack
          navigation.push('ProductDetail', {
            productId: item.slug || item.id,
            productName: item.name
          });
        }}
      >
        {discountText && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountText}</Text>
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
            {isOnSale ? (
              <>
                <Text style={styles.price}>{currencySymbol} {convertPrice(Number(item.price)).toLocaleString()}</Text>
                <Text style={styles.originalPrice}>{currencySymbol} {convertPrice(Number(item.originalPrice)).toLocaleString()}</Text>
              </>
            ) : (
              <Text style={styles.price}>{currencySymbol} {convertPrice(Number(item.originalPrice)).toLocaleString()}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeftIcon size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName || t('category_products')}
          </Text>
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={[styles.productList, { paddingBottom: 80 }]}
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
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#E58F14" />
              <Text style={styles.loadingText}>Loading more products...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
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
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  discountText: {
    color: 'white',
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
    marginTop: 4,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
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
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  loadMoreText: {
    color: '#333',
    fontWeight: '600',
  },
});

export default CategoryProducts;
