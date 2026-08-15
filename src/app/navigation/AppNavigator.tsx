import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../shared/config/theme';
import { HistoryPage } from '../../pages/history/ui/HistoryPage';
import { SettingsPage } from '../../pages/settings/ui/SettingsPage';
import { HelpPage } from '../../pages/help/ui/HelpPage';
import { GamePage } from '../../pages/game/ui/GamePage';
import { HomePage } from '../../pages/home/ui/HomePage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ルートパラメータ型
export type RootStackParamList = {
  Tabs: undefined;
  Game: undefined;
  Free: undefined;
  Help: undefined;
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

// SettingsPageのラッパー：useNavigationでHelp画面へ遷移
function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <SettingsPage onOpenHelp={() => navigation.navigate('Help')} />;
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryPage}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
          tabBarLabel: '履歴',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
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
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
        >
          {(props: NativeStackScreenProps<RootStackParamList, 'Game'>) => (
            <GamePage onBack={() => props.navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Free"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
        >
          {(props: NativeStackScreenProps<RootStackParamList, 'Free'>) => (
            <GamePage mode="free" onBack={() => props.navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Help">
          {(props: NativeStackScreenProps<RootStackParamList, 'Help'>) => (
            <HelpPage onBack={() => props.navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
