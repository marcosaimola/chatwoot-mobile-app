import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ContactsScreen from '@/screens/contacts/ContactsScreen';
import CreateContactScreen from '@/screens/contacts/CreateContactScreen';

export type ContactsStackParamList = {
  ContactsScreen: undefined;
  CreateContactScreen: undefined;
};

const Stack = createNativeStackNavigator<ContactsStackParamList>();

export const ContactsStack = () => {
  return (
    <Stack.Navigator initialRouteName="ContactsScreen">
      <Stack.Screen options={{ headerShown: false }} name="ContactsScreen" component={ContactsScreen} />
      <Stack.Screen options={{ headerShown: false }} name="CreateContactScreen" component={CreateContactScreen} />
    </Stack.Navigator>
  );
};
