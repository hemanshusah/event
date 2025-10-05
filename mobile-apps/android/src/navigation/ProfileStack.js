import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Profile Screens
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import LeaderboardScreen from '../screens/Profile/LeaderboardScreen';
import AchievementsScreen from '../screens/Profile/AchievementsScreen';

const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          title: 'Leaderboard',
        }}
      />
      <Stack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{
          title: 'Achievements',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
