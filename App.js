import "./global.css";
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Platform, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './src/i18n';
// import SplashScreen from './src/components/SplashScreen';

import SignupScreen from "./src/screens/auth/SignupScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import TabNavigator from "./src/navigation/TabNavigator";
import SellerTabNavigator from "./src/navigation/SellerTabNavigator";
import ProfileScreen from "./src/screens/app/Profile";
import ProductDetails from "./src/screens/app/ProductDetail";
import SearchResultScreen from "./src/screens/SearchResultScreen";
import CreateStoreScreen from "./src/screens/seller/CreateStoreScreen";
import SellerProductDetailScreen from "./src/screens/seller/SellerProductDetailScreen";
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { COLORS } from "./src/config";
import HelpCenter from "./src/screens/app/HelpCenter";
// import BootSplash from "react-native-bootsplash";
// import SplashScreen from 'react-native-splash-screen';

Sentry.init({
  dsn: 'https://c20ad320af1fbfdfaac5f0090a939e0f@o4510084981391360.ingest.us.sentry.io/4510084987813888',
  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,
  integrations: [Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={({ route }) => ({
          message: route.params?.message
        })}
      />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  const { userInfo } = useAuth();
  
  console.log('User Info in AppStack:', userInfo);

  // Always start with MainTabs (Home screen) regardless of login status
  // Authentication will be checked when needed (like checkout)
  const getInitialRouteName = () => {
    // Only redirect sellers to their specific screens
    if (userInfo?.role === 'seller') {
      return userInfo?.status === 'Verified' ? 'SellerTabs' : 'CreateStore';
    }
    // For all other cases (logged in users, guests), show Home screen
    return 'MainTabs';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="SellerTabs"
        component={SellerTabNavigator}
        options={{
          // Prevent going back to CreateStore if user is verified
          gestureEnabled: userInfo?.status === 'Verified',
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="CreateStore"
        component={CreateStoreScreen}
        options={{
          // Prevent going back to login
          gestureEnabled: false,
          headerLeft: () => null
        }}
      />
      <Stack.Screen name="ProductDetail" component={ProductDetails} />
      <Stack.Screen name="SellerProductDetail" component={SellerProductDetailScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenter} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { isLoading, userToken, userInfo, isGuestMode } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef();

  // Navigate to appropriate screen when userInfo loads (only for sellers)
  useEffect(() => {
    if (userToken && userInfo && navigationRef.current) {
      console.log('UserInfo loaded in RootNavigator, role:', userInfo.role, 'status:', userInfo.status);
      
      // Only redirect sellers, let regular users stay on Home
      if (userInfo.role === 'seller') {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          const targetScreen = userInfo.status === 'Verified' ? 'SellerTabs' : 'CreateStore';
          console.log('Navigating seller to:', targetScreen);
          navigationRef.current?.navigate('App', {
            screen: targetScreen
          });
        }, 100);
      }
      // Regular users and guests will automatically be on Home screen via AppStack
    }
  }, [userToken, userInfo]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always show App stack first - authentication will be checked when needed */}
        <Stack.Screen name="App" component={AppStack} />
        <Stack.Screen name="Auth" component={AuthStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Sentry.wrap(function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView
        style={styles.container}
        edges={Platform.OS === 'ios'
          ? ['left', 'top', 'right']
          : ['bottom', 'left', 'right', 'top']
        }
      >
        <CurrencyProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </CurrencyProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.mainColor
  }
});