import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetApi, Post } from '../../Helper/Service';
import { useAuth } from '../../context/AuthContext';
import { Country, State, City } from 'country-state-city';
import { useTranslation } from 'react-i18next';

const BillingDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userInfo: user } = useAuth();
  const { t } = useTranslation();
  
  // Get cart data from route params
  const { cartItems, subtotal, serviceFee, shipping, total, paymentMethod } = route.params;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
    companyName: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Country State City Selector
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Load countries on component mount
  useEffect(() => {
    const allCountries = Country.getAllCountries().map(country => ({
      code: country.isoCode,
      name: country.name,
      phonecode: country.phonecode,
    }));
    setCountries(allCountries);
    
    // Set default country (United States)
    const usCountry = allCountries.find(c => c.name === 'United States');
    if (usCountry) {
      const usStates = State.getStatesOfCountry(usCountry.code);
      setStates(usStates);
    }
  }, []);
  
  // Load states when country changes
  useEffect(() => {
    if (formData.country) {
      const selectedCountry = countries.find(c => c.name === formData.country);
      if (selectedCountry) {
        const countryStates = State.getStatesOfCountry(selectedCountry.code);
        setStates(countryStates);
        // Reset state and city when country changes
        setFormData(prev => ({
          ...prev,
          state: '',
          city: ''
        }));
      }
    }
  }, [formData.country]);
  
  // Load cities when state changes
  useEffect(() => {
    if (formData.state && formData.country) {
      const selectedCountry = countries.find(c => c.name === formData.country);
      if (selectedCountry) {
        const selectedState = states.find(s => s.name === formData.state);
        if (selectedState) {
          const stateCities = City.getCitiesOfState(selectedCountry.code, selectedState.isoCode);
          setCities(stateCities);
        }
      }
      // Reset city when state changes
      setFormData(prev => ({
        ...prev,
        city: ''
      }));
    }
  }, [formData.state]);

  // Check authentication and cart items on component mount
  useEffect(() => {
    console.log('BillingDetails mounted with cartItems:', cartItems);
    
    // Log detailed product info for debugging
    if (cartItems && cartItems.length > 0) {
      console.log('Cart items details:');
      cartItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          name: item?.product?.name,
          image: item?.product?.image,
          quantity: item?.quantity,
          hasImage: !!item?.product?.image,
          fullItem: item
        });
      });
    }
    
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(
          t('authentication_required'),
          t('please_login_continue'),
          [
            {
              text: t('login'),
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    };
    
    // Cart items validation
    if (!cartItems || cartItems.length === 0) {
      Alert.alert(t('empty_cart'), t('no_items_cart'), [
        { text: t('ok'), onPress: () => navigation.goBack() }
      ]);
      return;
    }
    
    // Check if all cart items have valid product data
    const invalidItems = cartItems.filter(item => 
      !item || !item.product || !item.product._id
    );
    
    if (invalidItems.length > 0) {
      Alert.alert(t('invalid_cart_items'), t('some_items_invalid'), [
        { text: t('ok'), onPress: () => navigation.goBack() }
      ]);
    }
    
    checkAuth();
  }, [cartItems]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = t('first_name_required');
    if (!formData.lastName.trim()) newErrors.lastName = t('last_name_required');
    if (!formData.email.trim()) newErrors.email = t('email_required');
    if (!formData.phone.trim()) newErrors.phone = t('phone_required');
    if (!formData.address.trim()) newErrors.address = t('address_required');
    if (!formData.city.trim()) newErrors.city = t('city_required');
    if (!formData.postalCode.trim()) newErrors.postalCode = t('postal_code_required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  // Render dropdown item
  const renderDropdownItem = (item, onSelect, field) => (
    <TouchableOpacity
      key={item.name || item}
      style={styles.dropdownItem}
      onPress={() => {
        handleChange(field, item.name || item);
        if (field === 'country') {
          setShowCountryDropdown(false);
          setShowStateDropdown(false);
          setShowCityDropdown(false);
        } else if (field === 'state') {
          setShowStateDropdown(false);
          setShowCityDropdown(false);
        } else {
          setShowCityDropdown(false);
        }
        onSelect(item.name || item);
      }}
    >
      <Text style={styles.dropdownItemText}>{item.name || item}</Text>
    </TouchableOpacity>
  );
  
  // Render dropdown
  const renderDropdown = (visible, setVisible, data, value, field, placeholder) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[
          styles.input, 
          errors[field] && styles.inputError,
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
        ]}
        onPress={() => setVisible(!visible)}
      >
        <Text 
          style={[
            styles.dropdownText, 
            !value && styles.placeholderText,
            { flex: 1, marginRight: 8 }
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.dropdownList}>
          <FlatList
            data={data}
            keyExtractor={(item, index) => (item.name || item.toString()) + index}
            renderItem={({ item }) => renderDropdownItem(item, (value) => {
              handleChange(field, value);
            }, field)}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        </View>
      </Modal>
    </View>
  );

  // Place order
  const placeOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Token check करें पहले
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token check before order:', token ? 'Found' : 'Not found');
      
      if (!token) {
        Alert.alert(t('authentication_required'), t('please_login_place_order'));
        navigation.navigate('Login');
        return;
      }
      
      // Products array को properly format करें backend के according
      const productDetail = cartItems.map(item => {
        // Null/undefined checks add करें
        if (!item || !item.product || !item.product._id) {
          console.error('Invalid cart item:', item);
          throw new Error('Invalid product in cart');
        }
        
        return {
          product: item.product._id,
          qty: item.quantity || 1,
          price: item.product.price || 0,
          color: item.selectedColor || null,
          size: item.selectedSize || null,
          name: item.product.name || 'Unknown Product',
          image: item.product.image || null,
        };
      });
      
      console.log('Formatted productDetail:', productDetail);
      
      // Backend के format के according order data बनाएं
      const orderData = {
        productDetail,
        shipping_address: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          address: formData.address.trim(),
          apartment: formData.apartment.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          postalCode: formData.postalCode.trim(),
          phone: formData.phone.trim(),
        },
        paymentmode: paymentMethod === 'cod' ? 'cod' : 'pay',
        deliveryCharge: shipping || 0,
        deliveryTip: 0,
        timeslot: null, // Add if needed
      };
      
      console.log('Final order data:', orderData);
      
      const response = await Post('createProductRequest', orderData);
      
      if (response.success || response.status) {
        // Clear cart on successful order
        await AsyncStorage.removeItem('cartData');
        
        // Navigate to order confirmation
        navigation.replace('OrderConfirmation', {
          orderId: response.data?.orders?.[0]?._id || 'N/A',
          orderNumber: response.data?.orders?.[0]?._id || 'N/A',
          total
        });
      } else {
        Alert.alert(t('error'), response.message || t('failed_place_order'));
      }
    } catch (error) {
      console.error('Order error:', error);
      
      // Handle specific authentication errors
      if (error.message && error.message.includes('authentication')) {
        Alert.alert(
          t('authentication_required'), 
          t('session_expired'),
          [
            {
              text: t('login'),
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(t('error'), error.message || t('failed_place_order_try_again'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Render form field
  const renderField = (label, field, placeholder, keyboardType = 'default', required = true) => (
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 ${errors[field] ? 'border-red-500' : 'border-gray-300'}`}
        value={formData[field]}
        onChangeText={(text) => handleChange(field, text)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={!loading}
      />
      {errors[field] && (
        <Text className="text-red-500 text-xs mt-1">{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          <Text className="text-xl font-bold mb-4">{t('billing_details')}</Text>
          
          {/* Contact Information */}
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="font-bold text-lg mb-3">{t('contact_information')}</Text>
            <View className="flex-row">
              <View className="flex-1 pr-2">
                {renderField(t('first_name'), 'firstName', 'John', 'default')}
              </View>
              <View className="flex-1 pl-2">
                {renderField(t('last_name'), 'lastName', 'Doe', 'default')}
              </View>
            </View>
            {renderField(t('email'), 'email', 'your@email.com', 'email-address')}
            {renderField(t('phone'), 'phone', '+1 (___) ___-____', 'phone-pad')}
          </View>
          
          {/* Shipping Address */}
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="font-bold text-lg mb-3">{t('shipping_address')}</Text>
            {renderField(t('address'), 'address', '123 Main St', 'default')}
            {renderField(t('apartment_optional'), 'apartment', 'Apt 4B', 'default', false)}
            
            {/* Country Dropdown */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">
                {t('country')} <Text className="text-red-500">*</Text>
              </Text>
              {renderDropdown(
                showCountryDropdown,
                setShowCountryDropdown,
                countries,
                formData.country,
                'country',
                t('select_country')
              )}
              {errors.country && <Text className="text-red-500 text-xs mt-1">{errors.country}</Text>}
            </View>
            
            {/* State Dropdown */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">
                {t('state_province')} <Text className="text-red-500">*</Text>
              </Text>
              {formData.country ? (
                <>
                  {renderDropdown(
                    showStateDropdown,
                    setShowStateDropdown,
                    states,
                    formData.state,
                    'state',
                    t('select_state_province')
                  )}
                  {errors.state && <Text className="text-red-500 text-xs mt-1">{errors.state}</Text>}
                </>
              ) : (
                <Text className="text-gray-500 text-sm">{t('select_country_first')}</Text>
              )}
            </View>
            
            {/* City Dropdown */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">
                {t('city')} <Text className="text-red-500">*</Text>
              </Text>
              {formData.state ? (
                <>
                  {renderDropdown(
                    showCityDropdown,
                    setShowCityDropdown,
                    cities.length > 0 ? cities : [formData.city || t('no_cities_found')],
                    formData.city,
                    'city',
                    t('select_city')
                  )}
                  {errors.city && <Text className="text-red-500 text-xs mt-1">{errors.city}</Text>}
                </>
              ) : (
                <Text className="text-gray-500 text-sm">{t('select_state_first')}</Text>
              )}
            </View>
            
            {/* ZIP/Postal Code */}
            <View className="mb-4">
              {renderField(t('zip_postal_code'), 'postalCode', '10001', 'number-pad')}
            </View>
            
            {renderField(t('company_optional'), 'companyName', t('company_name'), 'default', false)}
          </View>
          
          {/* Order Summary */}
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="font-bold text-lg mb-3">{t('order_summary')}</Text>
            
            {cartItems.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 overflow-hidden">
                  {item.product?.image ? (
                    <Image 
                      source={{ uri: item.product.image }} 
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-gray-100">
                      <Text className="text-gray-400 text-xs text-center">{t('no_image')}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-medium" numberOfLines={1}>{item.product.name}</Text>
                  <Text className="text-gray-500 text-sm">{t('qty')}: {item.quantity}</Text>
                  {item.selectedColor && (
                    <View className="flex-row items-center mt-1">
                      <Text className="text-gray-500 text-xs mr-1">{t('color')}:</Text>
                      <View 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: item.selectedColor }}
                      />
                    </View>
                  )}
                  {item.selectedSize && (
                    <Text className="text-gray-500 text-xs">{t('size')}: {item.selectedSize}</Text>
                  )}
                </View>
                <Text className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            
            <View className="border-t border-gray-200 my-3" />
            
            <View className="mb-2">
              <View className="flex-row justify-between mb-1">
                <Text>{t('subtotal')}</Text>
                <Text>${subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text>{t('service_fee')}</Text>
                <Text>${serviceFee.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text>{t('shipping')}</Text>
                <Text className={shipping === 0 ? 'text-green-600' : ''}>
                  {shipping === 0 ? t('free') : `$${shipping.toFixed(2)}`}
                </Text>
              </View>
              <View className="border-t border-gray-200 my-2" />
              <View className="flex-row justify-between">
                <Text className="font-bold">{t('total')}</Text>
                <Text className="font-bold">${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          {/* Payment Method */}
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="font-bold text-lg mb-3">{t('payment_method')}</Text>
            <View className="flex-row items-center p-3 border border-slate-700 rounded-lg">
              <View className="w-5 h-5 rounded-full bg-slate-800 mr-3 items-center justify-center">
                <View className="w-2 h-2 rounded-full bg-white" />
              </View>
              <Text className="font-medium">
                {paymentMethod === 'cod' ? t('cash_on_delivery') : t('credit_debit_card')}
              </Text>
            </View>
          </View>
          
          {/* Place Order Button */}
          <View className="bg-white border-t border-gray-200 p-4 mb-20">
            <TouchableOpacity
              onPress={placeOrder}
              disabled={loading}
              className={`py-3 rounded-lg items-center justify-center ${loading ? 'bg-slate-400' : 'bg-slate-700'}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {t('place_order')} - ${total.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 50,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdownIcon: {
    color: '#6b7280',
    fontSize: 10,
    marginLeft: 8,
    transform: [{ scaleY: 0.8 }],
  },
  dropdownList: {
    position: 'absolute',
    top: '20%',
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1f2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default BillingDetails;