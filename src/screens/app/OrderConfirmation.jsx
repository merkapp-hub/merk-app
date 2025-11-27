import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert
} from 'react-native';

import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { CheckCircleIcon } from 'react-native-heroicons/outline';
import { useTranslation } from 'react-i18next';

const OrderConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, orderNumber, total } = route.params || {};
  const { t } = useTranslation();

  const handleContinueShopping = () => {
    // Navigate to the Home tab in the bottom tab navigator
    navigation.navigate('HomeTab');

    // Then navigate to the Home screen within the Home stack
    navigation.navigate('HomeScreen');

    // Reset the navigation stack to prevent going back to order confirmation
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: 'HomeTab' },
        ],
      })
    );
  };

  const handleTrackOrder = () => {
    Alert.alert(t('track_order'), t('order_tracking_available_soon'));
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@merkapp.net');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 py-8 items-center">
          {/* Success Icon */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <CheckCircleIcon size={50} color="#10B981" />
            </View>
          </View>

          {/* Title and Description */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
              {t('order_confirmed')}
            </Text>
            <Text className="text-base text-gray-600 text-center leading-6 px-4">
              {t('order_confirmation_message')}
            </Text>
          </View>

          {/* Order Details Card */}
          <View className="bg-gray-50 rounded-2xl p-5 w-full mb-8 border border-gray-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 font-medium flex-1">{t('order_id')}</Text>
              <Text className="font-semibold text-gray-900 flex-1 text-right" numberOfLines={1}>
                {orderId || 'N/A'}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 font-medium">{t('date')}</Text>
              <Text className="font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 font-medium">{t('total')}</Text>
              <Text className="font-bold text-gray-900 text-lg">
                ${total?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 font-medium">{t('payment_method')}</Text>
              <Text className="font-semibold text-gray-900">{t('cash_on_delivery')}</Text>
            </View>
          </View>

          {/* What's Next Section */}
          {/* <View className="w-full mb-8">
            <Text className="font-bold text-xl mb-5 text-center text-gray-900">
              What's next?
            </Text>
            
            <View className="space-y-5">
              <View className="flex-row items-start">
                <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-4 mt-0.5">
                  <Text className="text-blue-600 font-bold text-sm">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold mb-1 text-gray-900">Order Confirmation</Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    We've sent you an email with your order confirmation and details.
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-4 mt-0.5">
                  <Text className="text-blue-600 font-bold text-sm">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold mb-1 text-gray-900">Order Processing</Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    Your order is being processed and will be shipped soon.
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-4 mt-0.5">
                  <Text className="text-blue-600 font-bold text-sm">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold mb-1 text-gray-900">Order Delivery</Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    You will receive a notification when your order is out for delivery.
                  </Text>
                </View>
              </View>
            </View>
          </View> */}

          {/* Action Buttons */}
          <View className="w-full mb-6">
            <TouchableOpacity
              onPress={handleTrackOrder}
              className="border-2 border-gray-300 bg-white py-4 rounded-xl items-center mb-4 active:bg-gray-50"
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-gray-700 text-base">{t('track_order')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinueShopping}
              className="bg-slate-800 py-4 rounded-xl items-center active:bg-orange-600"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">{t('continue_shopping')}</Text>
            </TouchableOpacity>
          </View>

          {/* Support Link */}
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-base">{t('need_help')} </Text>
            <TouchableOpacity onPress={handleContactSupport} activeOpacity={0.7}>
              <Text className="text-orange-500 font-semibold text-base">{t('contact_support')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OrderConfirmation;