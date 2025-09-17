import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GetApi } from '../../Helper/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StarIcon } from 'react-native-heroicons/solid';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';

const { width } = Dimensions.get('window');

export default function SellerProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await GetApi(`getProductById/${productId}`);
      console.log('Productttttttt API Response:', response);
      
      if (response && response.status) {
        setProduct(response.data);
        // If reviews are included in product response
        if (response.data.reviews && Array.isArray(response.data.reviews)) {
          setReviews(response.data.reviews);
        }
      } else {
        throw new Error(response?.message || 'Failed to load product details');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError(error.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch product reviews
  const fetchReviews = async () => {
    if (!productId) return;
    
    setLoadingReviews(true);
    try {
      const user = await AsyncStorage.getItem('userInfo');
      const userData = user ? JSON.parse(user) : null;
      const token = userData?.token;

      const response = await fetch(`https://api.merkapp.net/api/getProductReviews/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Reviews API Response:', response);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const result = await response.json();
      console.log('Fetched reviews:', result);
      
      // Handle different response formats
      if (result?.data?.reviews) {
        setReviews(result.data.reviews);
      } else if (result?.data) {
        setReviews(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        setReviews(result);
      } else {
        setReviews([]);
      }
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    // Fetch reviews separately if not included in product details
    if (!reviews.length) {
      fetchReviews();
    }
  }, [productId]);

  const renderImages = () => {
    // Fix: Use 'varients' instead of 'variants' to match API response
    const hasImages = product?.varients?.[0]?.image?.length > 0;
    const images = hasImages ? product.varients[0].image : [];

    // If no images, show placeholder
    if (!hasImages) {
      return (
        <View style={styles.imageSection}>
          <View style={styles.mainImageContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' }} 
              style={styles.mainImage}
              resizeMode="contain"
            />
          </View>
        </View>
      );
    }

    // Process the first image as main image
    const mainImage = images[0];
    const otherImages = images.slice(1, 4);

    // Function to handle image source (supports both URL and base64)
    const getImageSource = (img) => {
      if (!img) return { uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' };
      
      // Check if it's a base64 image
      if (img.startsWith('data:image/')) {
        return { uri: img };
      }
      
      // Check if it's a URL
      if (img.startsWith('http')) {
        return { uri: img };
      }
      
      // Default to Unsplash placeholder
      return { uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' };
    };

    return (
      <View style={styles.imageSection}>
        <View style={styles.mainImageContainer}>
          <Image 
            source={getImageSource(mainImage)}
            style={styles.mainImage}
            resizeMode="contain"
            onError={(e) => console.log('Failed to load image:', e.nativeEvent.error)}
          />
        </View>
        
        {otherImages.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
          >
            {otherImages.map((img, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image 
                  source={getImageSource(img)}
                  style={styles.thumbnail}
                  resizeMode="cover"
                  onError={(e) => console.log('Failed to load thumbnail:', e.nativeEvent.error)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderPrice = () => {
    if (!product?.price_slot?.[0]) return null;
    
    const priceSlot = product.price_slot[0];
    const hasDiscount = priceSlot.Offerprice && priceSlot.Offerprice < priceSlot.price;
    
    return (
      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>
          ${priceSlot.Offerprice || priceSlot.price}
        </Text>
        {hasDiscount && (
          <Text style={styles.originalPrice}>
            ${priceSlot.price}
          </Text>
        )}
      </View>
    );
  };

  const renderRating = () => {
    if (!product?.rating) return null;
    
    return (
      <View style={styles.ratingContainer}>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon 
              key={star}
              size={20}
              color={star <= Math.round(product.rating) ? '#F59E0B' : '#D1D5DB'}
              fill={star <= Math.round(product.rating) ? '#F59E0B' : 'none'}
            />
          ))}
        </View>
        <Text style={styles.ratingText}>
          {product.rating.toFixed(1)} ({reviews.length} reviews)
        </Text>
      </View>
    );
  };

  const renderReviews = () => {
    if (loadingReviews) {
      return <ActivityIndicator size="small" color="#4F46E5" style={styles.loading} />;
    }

    if (!reviews.length) {
      return <Text style={styles.noReviews}>No reviews yet</Text>;
    }

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    return (
      <View style={styles.reviewsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {reviews.length > 2 && (
            <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={styles.seeAll}>
                {showAllReviews ? 'Show Less' : `See All (${reviews.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {displayedReviews.map((review, index) => (
          <View key={review._id || index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>
                {review.posted_by?.firstName && review.posted_by?.lastName 
                  ? `${review.posted_by.firstName} ${review.posted_by.lastName}`
                  : 'Anonymous'}
              </Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon 
                    key={star}
                    size={16}
                    color={star <= (review.rating || 0) ? '#F59E0B' : '#D1D5DB'}
                    fill={star <= (review.rating || 0) ? '#F59E0B' : 'none'}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewDate}>
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
            </Text>
            <Text style={styles.reviewText}>
              {review.description || 'No review text provided'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProductDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeftIcon size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Product Images */}
        {renderImages()}

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          {renderRating()}
          {renderPrice()}
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || product.short_description || 'No description available'}
            </Text>
          </View>

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {product.category?.name || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text 
                  style={[
                    styles.detailValue, 
                    styles[`status${product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}`]
                  ]}
                >
                  {product.status || 'N/A'}
                </Text>
              </View>
              {/* <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Stock</Text>
                <Text style={styles.detailValue}>
                  {product.stock || 0} available
                </Text>
              </View> */}
              {/* Add more details as needed */}
            </View>
          </View>

          {/* Customer Reviews */}
          {renderReviews()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  imageSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  mainImageContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mainImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  thumbnailWrapper: {
    width: 70,
    height: 70,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    width: '50%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  statusActive: {
    color: '#10B981',
  },
  statusInactive: {
    color: '#EF4444',
  },
  statusPending: {
    color: '#F59E0B',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  loading: {
    marginVertical: 16,
  },
});
