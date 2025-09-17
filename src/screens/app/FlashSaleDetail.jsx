import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GetApi } from '../../Helper/Service';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const FlashSaleDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { saleId, productId } = route.params || {};
  const { t } = useTranslation();

  // Add back button to header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: t('flash_sale'),
      headerTitleAlign: 'center',
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 10 }}
        >
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  const [saleData, setSaleData] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSaleDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      // First fetch all flash sales
      const response = await GetApi("getOneFlashSalePerSeller");
      
      if (response && response.data) {
        // Find the specific sale by ID
        const sale = response.data.find(sale => sale._id === saleId);
        
        if (sale) {
          // If we have a productId but no product data, fetch the product
          if (productId && (!sale.products || !sale.products[0])) {
            const productResponse = await GetApi(`getProductById/${productId}`);
            if (productResponse && productResponse.data) {
              sale.products = [productResponse.data];
            }
          }
          
          setSaleData(sale);
        } else {
          console.log('Flash sale not found in the list');
        }
      } else {
        console.log('No flash sales data received');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [saleId, productId]);

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails();
    } else {
      setIsLoading(false);
    }
  }, [saleId, fetchSaleDetails]);

  const updateTimer = useCallback(() => {
    if (!saleData?.endDateTime) return;
    
    const now = new Date().getTime();
    const endTime = new Date(saleData.endDateTime).getTime();
    const distance = endTime - now;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  }, [saleData]);

  useEffect(() => {
    let interval = null;
    
    if (saleData?.endDateTime) {
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [saleData, updateTimer]);



  const handleBuyNow = (product) => {
    if (!product?._id) {
      console.error('Invalid product data:', product);
      return;
    }
    
    const productData = product.products?.[0] || product;
    
    navigation.navigate('ProductDetail', {
      productId: productData._id || productData.slug,
      flashSaleId: saleData?._id,
      flashSalePrice: saleData?.price,
      isFlashSale: true,
      productData: productData // Pass the full product data as well
    });
  };

  const renderProduct = (product) => {
    if (!product) return null;

    const imageUrl = product.varients?.[0]?.image?.[0] || 
                    product.image || 
                    'https://via.placeholder.com/300';
    
    const originalPrice = product.price_slot?.[0]?.price || 0;
    const salePrice = saleData?.price || originalPrice;
    const discount = originalPrice > 0 
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

    return (
      <View style={styles.productContainer}>
        <Image 
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name || t('product_name')}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.salePrice}>${salePrice.toFixed(2)}</Text>
            {originalPrice > salePrice && (
              <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
            )}
            {discount > 0 && (
              <Text style={styles.discountBadge}>{discount}% OFF</Text>
            )}
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{t('sale_ends_in')}: </Text>
            <Text style={styles.timerValue}>
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.buyNowButton}
            onPress={() => handleBuyNow(product)}
          >
            <Text style={styles.buyNowText}>{t('buy_now')}</Text>
          </TouchableOpacity>
          
          <Text style={styles.description}>
            {product.description || t('no_description_available')}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!saleData) {
    return (
      <View style={styles.container}>
        <Text>{t('flash_sale_not_found')}</Text>
      </View>
    );
  }

  const saleProduct = saleData.products?.[0];
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sellerName}>{t('seller_flash_sale')}</Text>
        <Text style={styles.timeLeft}>
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s {t('left')}
        </Text>
      </View>
      
      <View style={styles.offerBanner}>
        <Text style={styles.offerText}>{t('limited_time_offer')}</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {saleData?.products?.map((product, index) => (
          <View key={index}>
            {renderProduct(product)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeLeft: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  offerBanner: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffecb3',
  },
  offerText: {
    textAlign: 'center',
    color: '#ff8f00',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContainer: {
    padding: 15,
  },
  productImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    marginTop: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  timerValue: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  buyNowButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginTop: 10,
  },
});

export default FlashSaleDetail;
