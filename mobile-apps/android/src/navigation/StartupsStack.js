import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Startups Screens
import StartupsScreen from '../screens/Startups/StartupsScreen';
import StartupDetailScreen from '../screens/Startups/StartupDetailScreen';
import CreateStartupScreen from '../screens/Startups/CreateStartupScreen';
import EditStartupScreen from '../screens/Startups/EditStartupScreen';

const Stack = createStackNavigator();

const StartupsStack = () => {
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
        name="StartupsList" 
        component={StartupsScreen}
        options={{
          title: 'Startups',
        }}
      />
      <Stack.Screen 
        name="StartupDetail" 
        component={StartupDetailScreen}
        options={{
          title: 'Startup Details',
        }}
      />
      <Stack.Screen 
        name="CreateStartup" 
        component={CreateStartupScreen}
        options={{
          title: 'Create Startup',
        }}
      />
      <Stack.Screen 
        name="EditStartup" 
        component={EditStartupScreen}
        options={{
          title: 'Edit Startup',
        }}
      />
    </Stack.Navigator>
  );
};

export default StartupsStack;
