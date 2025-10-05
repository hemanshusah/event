import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Events Screens
import EventsScreen from '../screens/Events/EventsScreen';
import EventDetailScreen from '../screens/Events/EventDetailScreen';
import EventRegistrationScreen from '../screens/Events/EventRegistrationScreen';

const Stack = createStackNavigator();

const EventsStack = () => {
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
        name="EventsList" 
        component={EventsScreen}
        options={{
          title: 'Events',
        }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        options={{
          title: 'Event Details',
        }}
      />
      <Stack.Screen 
        name="EventRegistration" 
        component={EventRegistrationScreen}
        options={{
          title: 'Register for Event',
        }}
      />
    </Stack.Navigator>
  );
};

export default EventsStack;
