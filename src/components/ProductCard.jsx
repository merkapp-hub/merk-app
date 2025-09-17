import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ProductCard = ({ product, onPress, style }) => {
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('ProductDetail', { 
        productId: product.slug || product.id,
        productName: product.name
      });
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.image }} 
          style={styles.image} 
          resizeMode="contain"
        />
        {product.discount && product.discount !== '0% OFF' && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{product.price}</Text>
          {product.originalPrice && product.originalPrice !== product.price && (
            <Text style={styles.originalPrice}>{product.originalPrice}</Text>
          )}
        </View>
        
        {product.rating !== undefined && (
          <View style={styles.ratingContainer}>
            {renderStars(product.rating || 0)}
            {product.reviewCount !== undefined && (
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('½');
    } else {
      stars.push('☆');
    }
  }

  return (
    <View style={styles.starsContainer}>
      {stars.map((star, index) => (
        <Text key={index} style={styles.star}>
          {star}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e63946',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b2d42',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#6c757d',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  star: {
    color: '#ffc107',
    fontSize: 14,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
});

export default ProductCard;
