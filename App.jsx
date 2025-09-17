import "./global.css";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import './src/i18n';

import SignupScreen from "./src/screens/auth/SignupScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import TabNavigator from "./src/navigation/TabNavigator";
import SellerTabNavigator from "./src/navigation/SellerTabNavigator";
import ProfileScreen from "./src/screens/app/Profile";
import ProductDetails from "./src/screens/app/ProductDetail";
import SearchResultScreen from "./src/screens/SearchResultScreen";
import CreateStoreScreen from "./src/screens/seller/CreateStoreScreen";
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';

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
  
  // Set initial route based on user role and verification status
  const getInitialRouteName = () => {
    if (userInfo?.role === 'seller') {
      return userInfo?.status === 'Verified' ? 'SellerTabs' : 'CreateStore';
    }
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
      <Stack.Screen name="SearchResults" component={SearchResultScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { isLoading, userToken, userInfo } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const prepare = async () => {
      try {
        console.log('Auth state changed, userToken:', userToken ? 'exists' : 'does not exist');
        console.log('User info:', userInfo);
      } catch (e) {
        console.warn('Error in prepare:', e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, [userToken, userInfo]);

  // Render loading indicator while checking auth state
  if (isLoading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userToken ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <Stack.Screen name="App" component={AppStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView
        style={styles.container}
        edges={Platform.OS === 'ios' 
          ? ['left', 'top', 'right'] 
          : ['bottom', 'left', 'right', 'top']
        }
      >
        <RootNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});
