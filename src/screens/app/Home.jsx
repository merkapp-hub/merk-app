import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import FlashSale from '../../components/FlashSale';
import { GetApi } from '../../Helper/Service';
import { useTranslation } from 'react-i18next';
import SwiperFlatList from 'react-native-swiper-flatlist';


const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [carouselImages, setCarouselImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // 
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [exploreProducts, setExploreProducts] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  const handleProductPress = (product) => {
    console.log('Navigating to product:', product.id || product._id, product.name);
    // Use slug if available, otherwise use _id
    const productSlug = product.slug || product._id;
    navigation.navigate('ProductDetail', {
      productId: productSlug,
      productName: product.name,
      // Pass the entire product object for debugging
      _product: product
    });
  };
  const setCarouselRef = useCallback((ref) => {
    flatListRef.current = ref;
    console.log('ScrollView ref set:', ref !== null);
  }, []);


  useEffect(() => {
    let interval = null;

    if (carouselImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % carouselImages.length);
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [carouselImages.length]);
  // Fetch best selling products
  const fetchBestSellingProducts = async () => {
    try {
      setLoadingProducts(true);
      setError(null);


      const response = await GetApi("getTopSoldProduct");


      // Handle different response formats
      let productsData = response;

      // If response has data property, use that
      if (response && response.data) {
        productsData = response.data;
      }

      if (Array.isArray(productsData)) {
        const products = productsData.map((product, index) => {
          // Image handling - check if it's base64 or URL
          let imageUrl = 'https://via.placeholder.com/300';

          if (product.varients?.[0]?.image?.[0]) {
            const imageData = product.varients[0].image[0];

            if (imageData.startsWith('data:image/')) {
              imageUrl = imageData;
            } else {
              imageUrl = imageData;
            }
          } else if (product.image) {
            imageUrl = product.image;
          }

          return {
            id: product._id || `product-${index}`,
            slug: product.slug || product._id,
            name: product.name || 'Unnamed Product',
            price: `$${Math.round(product.price_slot?.[0]?.Offerprice || 0)}`,
            originalPrice: `$${Math.round(product.price_slot?.[0]?.price || 0)}`,
            discount: (product.price_slot?.[0]?.price && product.price_slot?.[0]?.Offerprice)
              ? `${Math.round(((product.price_slot[0].price - product.price_slot[0].Offerprice) /
                product.price_slot[0].price * 100))}% OFF`
              : '0% OFF',
            rating: 4.0,
            image: imageUrl,
            category: product.category?.name || 'Uncategorized',
            soldPieces: product.sold_pieces || 0
          };
        });


        setBestSellingProducts(products);
      } else {
        console.warn('Invalid response structure:', response);
        setBestSellingProducts([]);
        setError(t('no_products_found_invalid_format'));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setBestSellingProducts([]);

      const errorMessage = error.message || 'An error occurred';
      console.error('API Error:', errorMessage);

      if (errorMessage.includes('No internet connection')) {
        setError(t('no_internet_connection'));
      } else if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        setError(t('session_expired'));
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        setError(t('request_timed_out'));
      } else if (errorMessage.includes('No response from server') || errorMessage.includes('Network Error')) {
        setError(t('unable_connect_server'));
      } else {
        setError(t('failed_load_products'));
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await GetApi("getCategory");
      if (response && response.data && Array.isArray(response.data)) {
        // Take first 8 categories
        setCategories(response.data.slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchBestSellingProducts();
    fetchCategories();
  }, []);


  const newArrivals = [
    {
      id: 1,
      title: 'PlayStation 5',
      subtitle: 'Stock may Vary in Console of the PS5 Game or Add-on Sales.',
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
      category: 'gaming',
    },
    {
      id: 2,
      title: "Women's Collections",
      subtitle: 'Featured women collections that give you another vibe.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      category: 'fashion',
    },
  ];


  useEffect(() => {
    const fetchBestSellingProducts = async () => {
      try {
        setLoadingProducts(true);
        setError(null);


        const response = await GetApi("getTopSoldProduct");


        // Handle different response formats
        let productsData = response;

        // If response has data property, use that
        if (response && response.data) {
          productsData = response.data;
        }


        if (Array.isArray(productsData)) {
          const products = productsData.map((product, index) => {
            // Image handling - check if it's base64 or URL
            let imageUrl = 'https://via.placeholder.com/300';

            if (product.varients?.[0]?.image?.[0]) {
              const imageData = product.varients[0].image[0];

              if (imageData.startsWith('data:image/')) {
                imageUrl = imageData;
              } else {
                imageUrl = imageData;
              }
            } else if (product.image) {
              imageUrl = product.image;
            }

            return {
              id: product._id || `product-${index}`,
              slug: product.slug || product._id,
              name: product.name || 'Unnamed Product',
              price: `$${Math.round(product.price_slot?.[0]?.Offerprice || 0)}`,
              originalPrice: `$${Math.round(product.price_slot?.[0]?.price || 0)}`,
              discount: (product.price_slot?.[0]?.price && product.price_slot?.[0]?.Offerprice)
                ? `${Math.round(((product.price_slot[0].price - product.price_slot[0].Offerprice) /
                  product.price_slot[0].price * 100))}% OFF`
                : '0% OFF',
              rating: 4.0,
              image: imageUrl,
              category: product.category?.name || 'Uncategorized',
              soldPieces: product.sold_pieces || 0
            };
          });

          console.log('Processed products:', products);
          setBestSellingProducts(products);
        } else {
          console.warn('Invalid response structure:', response);
          setBestSellingProducts([]);
          setError(t('no_products_found_invalid_format'));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setBestSellingProducts([]);


        const errorMessage = error.message || 'An error occurred';
        console.error('API Error:', errorMessage);

        if (errorMessage.includes('No internet connection')) {
          setError('No internet connection. Please check your connection and try again.');
        } else if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
          setError('Your session has expired. Please login again.');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          setError('Request timed out. The server is taking too long to respond.');
        } else if (errorMessage.includes('No response from server') || errorMessage.includes('Network Error')) {
          setError('Unable to connect to the server. Please try again later.');
        } else {
          setError(`Failed to load products: ${errorMessage}`);
        }
      } finally {
        setLoadingProducts(false);
      }
    };


  }, []);
  const fetchCarouselImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await GetApi("getsetting");


      if (response && response.success !== false && response.setting && response.setting[0]?.carousel) {
        const carouselItems = response.setting[0].carousel;
        const images = carouselItems.map((item, index) => item.image);



        setCarouselImages(images);
      } else {
        console.warn('No carousel data found in response:', response);
        setCarouselImages([]);
        setError(t('no_carousel_images'));
      }
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      setCarouselImages([]);
      setError(t('failed_load_carousel'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  const fetchExploreProducts = useCallback(async (retryCount = 0) => {
    try {
      setLoadingExplore(true);
      setError(null);
      console.log(`Fetching explore products (attempt ${retryCount + 1})...`);

      const response = await GetApi("getProduct");
      console.log('Explore products response:', response);

      let productsData = response;
      if (response && response.data) {
        productsData = response.data;
      }

      if (Array.isArray(productsData)) {
        const products = productsData.map((product, index) => {
          let imageUrl = 'https://via.placeholder.com/300';

          if (product.varients?.[0]?.image?.[0]) {
            const imageData = product.varients[0].image[0];

            if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
              imageUrl = imageData;
            } else if (typeof imageData === 'string') {
              imageUrl = imageData.replace(/^"|"$/g, '');
            }
          } else if (product.image) {
            imageUrl = typeof product.image === 'string' ?
              product.image.replace(/^"|"$/g, '') :
              'https://via.placeholder.com/300';
          }

          return {
            id: product._id || `product-${index}`,
            slug: product.slug || product._id,
            name: product.name || 'Unnamed Product',
            price: `$${Math.round(product.price_slot?.[0]?.Offerprice || 0)}`,
            originalPrice: `$${Math.round(product.price_slot?.[0]?.price || 0)}`,
            discount: (product.price_slot?.[0]?.price && product.price_slot?.[0]?.Offerprice)
              ? `${Math.round(((product.price_slot[0].price - product.price_slot[0].Offerprice) /
                product.price_slot[0].price * 100))}% OFF`
              : '0% OFF',
            rating: 4.0,
            image: imageUrl,
            category: product.category?.name || 'Uncategorized',
            soldPieces: product.sold_pieces || 0
          };
        });

        console.log('Processed explore products:', products);
        setExploreProducts(products);
      } else {
        console.warn('Invalid response structure for explore products:', response);
        setExploreProducts([]);
        setError(t('no_explore_products_found'));
      }
    } catch (error) {
      console.error('Error fetching explore products:', error);
      setExploreProducts([]);

      const errorMessage = error.message || 'An error occurred';
      console.error('Explore Products API Error:', errorMessage);

      const isTimeoutError = errorMessage.includes('timeout') ||
        errorMessage.includes('timed out') ||
        error.code === 'ECONNABORTED';

      if (isTimeoutError && retryCount < 1) {
        console.log(`Retrying explore products fetch (attempt ${retryCount + 2})...`);
        return fetchExploreProducts(retryCount + 1);
      }

      if (errorMessage.includes('No internet connection')) {
        setError(t('no_internet_connection'));
      } else if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        setError(t('session_expired'));
      } else if (isTimeoutError) {
        setError(t('server_taking_too_long'));
      } else if (errorMessage.includes('No response from server') || errorMessage.includes('Network Error')) {
        setError(t('unable_connect_server'));
      } else {
        setError(t('failed_load_products'));
      }
    } finally {
      setLoadingExplore(false);
    }
  }, []);

  useEffect(() => {
    fetchCarouselImages();
    fetchExploreProducts();
  }, [fetchExploreProducts]);



  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push('☆');
    }

    return stars.map((star, index) => (
      <Text key={index} className="text-orange-400 text-sm">
        {star}
      </Text>
    ));
  };

  const renderCarouselItem = ({ item, index }) => (
    <TouchableOpacity
      key={`carousel-${index}`}
      style={{ width: width, height: 200, paddingHorizontal: 10 }}
      onPress={() => navigation.navigate('BestSellingProducts')}
      activeOpacity={0.8}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Image
          key={`carousel-img-${index}`}
          source={{ uri: item }}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
        />
      </View>
    </TouchableOpacity>
  );

  // Add this to handle initial scroll
  // useEffect(() => {
  //   if (flatListRef.current && carouselImages.length > 0) {
  //     flatListRef.current.scrollToIndex({ index: currentImageIndex, animated: false });
  //   }
  // }, []);

  const renderExploreProduct = ({ item }) => (
    <TouchableOpacity
      key={`explore-${item.id}`}
      onPress={() => handleProductPress(item)}
      className="w-40 mr-4 mb-4"
    >
      <View className="bg-gray-100 rounded-lg p-4 w-full">
        <Image
          source={{ uri: item.image }}
          className="w-full h-32 rounded-lg mb-3"
          resizeMode="contain"
        />
        <Text className="text-black font-medium text-sm mb-2" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-black font-bold text-lg">
          ${typeof item.price === 'string' ? item.price : (item.price || '0.00')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBestSellingProduct = ({ item }) => (
    <TouchableOpacity
      key={`best-selling-${item.id}`}
      onPress={() => handleProductPress(item)}
      className="bg-gray-100 rounded-lg mr-4 p-4 w-48"
    >
      {/* Discount badge */}
      {item.discount !== '0% OFF' && (
        <View key={`discount-badge-${item.id}`} className="bg-slate-800 px-2 py-1 rounded absolute top-4 left-4 z-10">
          <Text key={`discount-text-${item.id}`} className="text-white text-xs font-medium">{item.discount}</Text>
        </View>
      )}

      <Image
        key={`product-img-${item.id}`}
        source={{
          uri: item.image,
        }}
        className="w-full h-32 rounded-lg mb-3"
        resizeMode="contain"
        onError={(error) => {
          console.log('Image load error for product:', item.name, error.nativeEvent.error);
        }}
      />

      <Text key={`product-name-${item.id}`} className="text-black font-medium text-sm mb-2" numberOfLines={2}>
        {item.name}
      </Text>

      <View key={`price-container-${item.id}`} className="flex-row items-center mb-2">
        <Text key={`price-text-${item.id}`} className="text-black font-bold text-lg mr-2">{item.price}</Text>
        {item.originalPrice !== item.price && (
          <Text key={`original-price-text-${item.id}`} className="text-gray-400 line-through text-sm">{item.originalPrice}</Text>
        )}
      </View>

      <View key={`rating-container-${item.id}`} className="flex-row items-center mb-2">
        <View className="flex-row">{renderStars(item.rating).map((star, i) => (
          <Text key={`star-${item.id}-${i}`} className="text-orange-400 text-sm">
            {star}
          </Text>
        ))}</View>
        <Text key={`rating-text-${item.id}`} className="text-gray-400 text-xs ml-1">({item.rating})</Text>
      </View>

      <Text key={`sold-text-${item.id}`} className="text-gray-500 text-xs">{t('sold')}: {item.soldPieces}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      key={`explore-${item.id}`}
      onPress={() => handleProductPress(item)}
      className="w-40 mr-4 mb-4"
    >
      <View className="bg-gray-100 rounded-lg p-4 w-full">
        <Image
          source={{ uri: item.image }}
          className="w-full h-32 rounded-lg mb-3"
          resizeMode="contain"
        />
        <Text className="text-black font-medium text-sm mb-2" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-black font-bold text-lg">
          ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Carousel */}


        {/* Carousel */}
        <View style={{ marginVertical: 20 }}>
          {loading ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : error ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'red' }}>{error}</Text>
            </View>
          ) : carouselImages && carouselImages?.length > 0 ? (
            <View>
              {/* Simple Image Display with Index Change */}
              <View style={{ width: width, alignItems: 'center', height: 200 }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('BestSellingProducts')}
                  style={{
                    height: 180,
                    width: width - 20,
                    borderRadius: 20,
                    overflow: 'hidden',
                    alignSelf: 'center',
                  }}
                >
                  <Image
                    source={{ uri: carouselImages[currentImageIndex] }}
                    style={{
                      height: '100%',
                      width: '100%',
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>

              {/* Dots */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                paddingTop: 10
              }}>
                {carouselImages.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index === currentImageIndex ? '#f97316' : '#d1d5db',
                      marginHorizontal: 4
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Explore Categories */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-orange-500 rounded-full mr-2" />
              <Text className="text-black text-xl font-bold">{t('explore_categories')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Categories')}
              className="bg-slate-800 px-4 py-1 rounded-full"
            >
              <Text className="text-white text-sm">{t('see_all')}</Text>
            </TouchableOpacity>
          </View>

          {loadingCategories ? (
            <View className="flex-row justify-center py-4">
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : categories.length > 0 ? (
            <View className="flex-row flex-wrap -mx-1">
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={`category-${category._id || index}`}
                  className="w-1/4 p-1 mb-2"
                  onPress={() => {
                    navigation.navigate('CategoryProducts', {
                      categoryId: category._id || category.id,
                      categoryName: category.name
                    });
                  }}
                >
                  <View className="bg-gray-100 rounded-lg p-2 items-center">
                    <Image
                      source={{ uri: category.image }}
                      className="w-12 h-12 rounded-full mb-2"
                      resizeMode="cover"
                    />
                    <Text
                      className="text-xs text-center text-gray-800 font-medium h-10"
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="py-4 items-center">
              <Text className="text-gray-500">{t('no_categories_found')}</Text>
            </View>
          )}
        </View>

        {/* Flash Sale Section */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-4 h-6 bg-orange-500 rounded mr-3" />
            <Text className="text-orange-500 font-semibold">{t('todays')}</Text>
          </View>
          <Text className="text-2xl font-bold text-black mb-4">{t('flash_sales')}</Text>
          <FlashSale />
        </View>

        {/* This Month - Best Selling Products */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-4 h-6 bg-orange-500 rounded mr-3" />
            <Text className="text-orange-500 font-semibold">{t('this_month')}</Text>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-black">{t('best_selling_products')}</Text>
            <TouchableOpacity
              className="bg-slate-800 px-6 py-2 rounded"
              onPress={() => navigation.navigate('BestSellingProducts', { products: bestSellingProducts })}
            >
              <Text className="text-white font-medium">{t('view_all')}</Text>
            </TouchableOpacity>
          </View>

          {loadingProducts ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-gray-400 mt-2">{t('loading_best_selling')}</Text>
            </View>
          ) : error ? (
            <View className="items-center py-8 bg-red-50 rounded-lg mx-4">
              <Text className="text-red-500 text-center mb-3">{error}</Text>
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  fetchBestSellingProducts();
                }}
                className="bg-orange-500 px-4 py-2 rounded"
              >
                <Text className="text-white font-medium">{t('retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : bestSellingProducts.length > 0 ? (
            <FlatList
              data={bestSellingProducts}
              renderItem={renderBestSellingProduct}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          ) : (
            <View className="items-center py-8">
              <Text className="text-gray-400">{t('no_products_available')}</Text>
            </View>
          )}
        </View>

        {/* Explore Our Products - Temporarily Commented Out 
        <View className="mb-6 px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Explore Our Products</Text>
            <TouchableOpacity>
              <Text className="text-orange-500">See All</Text>
            </TouchableOpacity>
          </View>

          {loadingExplore ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-gray-400 mt-2">Loading products...</Text>
            </View>
          ) : exploreProducts.length > 0 ? (
            <FlatList
              data={exploreProducts}
              renderItem={renderExploreProduct}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          ) : (
            <View className="items-center py-8">
              <Text className="text-gray-400">{t('no_products_available')}</Text>
            </View>
          )}
        </View>
        */}

        {/* Featured - New Arrivals */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-4 h-6 bg-orange-500 rounded mr-3" />
            <Text className="text-orange-500 font-semibold">{t('featured')}</Text>
          </View>
          <Text className="text-2xl font-bold text-black mb-4">{t('new_arrival')}</Text>

          {newArrivals.map((item) => (
            <View key={item.id} className="mb-4">
              <View className="relative">
                <View className="relative">
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black opacity-40 rounded-lg" />
                </View>
                <View className="absolute bottom-4 left-4">
                  <Text className="text-white text-xl font-bold mb-1">{item.title}</Text>
                  <Text className="text-white text-sm mb-3 opacity-80">{item.subtitle}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('BestSellingProducts')}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-sm underline">{t('shop_now')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Services */}
        <View className="px-4 pb-8">
          <View className="space-y-6">

            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-3">
                <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
                  <Text className="text-white text-lg">🚚</Text>
                </View>
              </View>
              <Text className="text-black font-bold text-lg mb-1">{t('free_fast_delivery')}</Text>
              <Text className="text-gray-600 text-center">{t('free_delivery_over_140')}</Text>
            </View>


            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-3">
                <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
                  <Text className="text-white text-lg">🎧</Text>
                </View>
              </View>
              <Text className="text-black font-bold text-lg mb-1">{t('customer_service_24_7')}</Text>
              <Text className="text-gray-600 text-center">{t('friendly_customer_support')}</Text>
            </View>

            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-3">
                <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
                  <Text className="text-white text-lg">✓</Text>
                </View>
              </View>
              <Text className="text-black font-bold text-lg mb-1">{t('money_back_guarantee')}</Text>
              <Text className="text-gray-600 text-center mb-2">{t('money_back_30_days')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;