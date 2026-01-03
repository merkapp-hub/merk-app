import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, CommonActions } from '@react-navigation/native-stack';
import { Home, ShoppingBag, Heart, ShoppingCart, User } from 'react-native-feather';
import { useAuth } from '../context/AuthContext';


import HomeScreen from '../screens/app/Home';
import CategoriesScreen from '../screens/app/Categories';
import FavoritesScreen from '../screens/app/Favorites';
import CartScreen from '../screens/app/Cart';
import AccountScreen from '../screens/app/Account';
import OrdersScreen from '../screens/app/Orders';
import OrderDetails from '../screens/app/OrderDetails';
import ProductDetails from '../screens/app/ProductDetail';
import BillingDetails from '../screens/app/BillingDetails';
import OrderConfirmation from '../screens/app/OrderConfirmation';
import PayPalPayment from '../screens/app/PayPalPayment';
import BestSellingProducts from '../screens/app/BestSellingProducts';
import TopSellingProducts from '../screens/app/TopSellingProducts';
import CategoryProducts from '../screens/app/CategoryProducts';
import FlashSaleDetail from '../screens/app/FlashSaleDetail';
import SearchResultScreen from '../screens/SearchResultScreen';
import HelpCenter from '../screens/app/HelpCenter';
import { COLORS } from '../config';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CategoriesStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();

// Create a stack navigator for the Home tab
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen
        name="ProductDetail"
        component={ProductDetails}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="BestSellingProducts"
        component={BestSellingProducts}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="TopSellingProducts"
        component={TopSellingProducts}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="CategoryProducts"
        component={CategoryProducts}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="FlashSaleDetail"
        component={FlashSaleDetail}
        options={{
          animation: 'slide_from_right',
          title: 'Flash Sale'
        }}
      />
      <HomeStack.Screen
        name="SearchResult"
        component={SearchResultScreen}
        options={{
          animation: 'slide_from_right',
          title: 'Search Results'
        }}
      />
    </HomeStack.Navigator>
  );
}

// Create a stack navigator for the Categories tab
function CategoriesStackScreen() {
  return (
    <CategoriesStack.Navigator screenOptions={{ headerShown: false }}>
      <CategoriesStack.Screen name="CategoriesScreen" component={CategoriesScreen} />
      <CategoriesStack.Screen
        name="CategoryProducts"
        component={CategoryProducts}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <CategoriesStack.Screen
        name="ProductDetail"
        component={ProductDetails}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </CategoriesStack.Navigator>
  );
}

// Create a stack navigator for the Cart tab
function CartStackScreen() {
  return (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
      <CartStack.Screen name="CartScreen" component={CartScreen} />
      <CartStack.Screen
        name="ProductDetail"
        component={ProductDetails}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <CartStack.Screen
        name="BillingDetails"
        component={BillingDetails}
        options={{
          animation: 'slide_from_right',
          title: 'Billing Details',
          headerShown: false,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1F2937',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <CartStack.Screen
        name="PayPalPayment"
        component={PayPalPayment}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <CartStack.Screen
        name="OrderConfirmation"
        component={OrderConfirmation}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </CartStack.Navigator>
  );
}

// Create a stack navigator for the Account tab
function AccountStackScreen() {
  return (
    <AccountStack.Navigator
      initialRouteName="AccountScreen"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <AccountStack.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{
          headerShown: false,
        }}
      />
      <AccountStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          headerShown: false,
        }}
      />
      <AccountStack.Screen
        name="OrderDetails"
        component={OrderDetails}
        options={{
          headerShown: false,
        }}
      />
      <AccountStack.Screen
        name="HelpCenter"
        component={HelpCenter}
        options={{
          headerShown: false,
        }}
      />
    </AccountStack.Navigator>
  );
}

const TabNavigator = () => {
  const { cartCount, favoritesCount } = useAuth();
  
  console.log('🛒 TabNavigator - Cart Count:', cartCount);
  console.log('❤️ TabNavigator - Favorites Count:', favoritesCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E58F14',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          minHeight: Platform?.OS === 'android' ? 70 : 95,
          paddingBottom: Platform?.OS === 'android' ? 16 : 25,
          paddingTop: Platform?.OS === 'android' ? 12 : 15,
          paddingHorizontal: 10,
          backgroundColor: COLORS.mainColor,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: Platform?.OS === 'android' ? 8 : 10,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform?.OS === 'android' ? 2 : 4,
          marginTop: Platform?.OS === 'android' ? -2 : 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home width={size} height={size} fill={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Always navigate to Home tab with HomeScreen as initial
            navigation.navigate('HomeTab', {
              screen: 'HomeScreen'
            });
          },
        })}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesStackScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag width={size} height={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Always navigate to Categories tab with CategoriesScreen as initial
            navigation.navigate('CategoriesTab', {
              screen: 'CategoriesScreen'
            });
          },
        })}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Heart width={size} height={size} color={color} />
              {favoritesCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#E58F14',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CartStack"
        component={CartStackScreen}
        options={{
          tabBarLabel: 'Cart',
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            console.log('🎨 Rendering Cart Icon - cartCount:', cartCount);
            return (
              <View style={{ position: 'relative' }}>
                <ShoppingCart width={size} height={size} color={color} />
                {cartCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#E58F14',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Always navigate to Cart tab with CartScreen as initial
            navigation.navigate('CartStack', {
              screen: 'CartScreen'
            });
          },
        })}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackScreen}
        options={{
          tabBarLabel: 'Account',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <User width={size} height={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Always navigate to Account tab with AccountScreen as initial
            navigation.navigate('Account', {
              screen: 'AccountScreen'
            });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
