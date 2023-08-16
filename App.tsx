/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react'

import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

// Prefer to do named export since it's easier to rename
import { LoginScreen } from './src/screens/LoginScreen'
import { ChatRoomsScreen } from './src/screens/ChatRoomsScreen'
import { ChatScreen } from './src/screens/ChatScreen'

export type RootStackParamList = {
  Login: undefined
  ChatRooms: undefined
  Chat: { roomId: string }
}

const Stack = createStackNavigator<RootStackParamList>()

export function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChatRooms" component={ChatRoomsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
