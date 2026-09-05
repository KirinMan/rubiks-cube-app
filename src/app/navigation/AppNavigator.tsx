import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../shared/config/theme';
import { HistoryPage } from '../../pages/history/ui/HistoryPage';
import { SettingsPage } from '../../pages/settings/ui/SettingsPage';
import { GamePage } from '../../pages/game/ui/GamePage';
import { HomePage } from '../../pages/home/ui/HomePage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ルートパラメータ型
export type RootStackParamList = {
  Tabs: undefined;
  Game: undefined;
  Free: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// HomePageのラッパー：useNavigationでGame画面へ遷移
function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <HomePage
      onStartSolve={() => navigation.navigate('Game')}
      onHistory={() => navigation.navigate('Tabs', { screen: 'History' } as never)}
      onFreeMode={() => navigation.navigate('Free')}
    />
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.bg.secondary,
          borderTopColor: theme.colors.border.subtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryPage}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
          tabBarLabel: '履歴',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsPage}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          tabBarLabel: '設定',
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={HomeTabs} />
        <Stack.Screen
          name="Game"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        >
          {(props: NativeStackScreenProps<RootStackParamList, 'Game'>) => (
            <GamePage onBack={() => props.navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Free"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        >
          {(props: NativeStackScreenProps<RootStackParamList, 'Free'>) => (
            <GamePage mode="free" onBack={() => props.navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
