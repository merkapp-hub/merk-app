import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProductGridCard = ({ item }) => {
  const navigation = useNavigation();

  // Get image - check variants first, then images array, then direct image
  const getProductImage = () => {
    if (item.varients && item.varients.length > 0 && item.varients[0].image && item.varients[0].image.length > 0) {
      return item.varients[0].image[0];
    }
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    if (item.image) {
      return item.image;
    }
    return 'https://via.placeholder.com/300';
  };

  // Get price - check all possible locations
  const getPrice = () => {
    let price = 0;
    let offerPrice = 0;
    
    // First check variants for price
    if (item.varients && item.varients.length > 0) {
      const variant = item.varients[0];
      if (variant.price) {
        price = parseFloat(variant.price) || 0;
        offerPrice = variant.Offerprice && parseFloat(variant.Offerprice) > 0 
          ? parseFloat(variant.Offerprice) 
          : price;
      }
    }
    
    // If no price from variants, check price_slot
    if (price === 0 && item.price_slot && item.price_slot.length > 0) {
      const priceSlot = item.price_slot[0];
      price = parseFloat(priceSlot.price) || 0;
      offerPrice = priceSlot.Offerprice && parseFloat(priceSlot.Offerprice) > 0 
        ? parseFloat(priceSlot.Offerprice) 
        : price;
    }
    
    // If still no price, check direct price property
    if (price === 0 && item.price) {
      price = parseFloat(item.price) || 0;
      offerPrice = price;
    }
    
    // Fallback to originalPrice if available
    if (price === 0 && item.originalPrice) {
      price = parseFloat(item.originalPrice) || 0;
      offerPrice = parseFloat(item.price) || price;
    }

    return { price, offerPrice };
  };

  const imageData = getProductImage();
  const { price, offerPrice } = getPrice();
  const discountPercentage = (offerPrice && offerPrice < price) ?
    Math.round(((price - offerPrice) / price) * 100) : 0;

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', {
        productId: item.slug || item._id,
        productName: item.name
      })}
    >
      {/* Discount badge */}
      {offerPrice && offerPrice < price && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {discountPercentage}% OFF
          </Text>
        </View>
      )}

      <Image
        source={{ uri: imageData }}
        style={styles.productImage}
        resizeMode="contain"
      />

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name || 'No name'}
        </Text>

        <View style={styles.priceContainer}>
          {offerPrice && offerPrice < price ? (
            <>
              <Text style={styles.price}>${Number(offerPrice).toFixed(2)}</Text>
              <Text style={styles.originalPrice}>${Number(price).toFixed(2)}</Text>
            </>
          ) : (
            <Text style={styles.price}>${Number(offerPrice || price).toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default ProductGridCard;
