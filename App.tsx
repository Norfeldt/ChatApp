/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react'

import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import auth from '@react-native-firebase/auth'
import RNBootSplash from 'react-native-bootsplash'

// Prefer to do named export since it's easier to rename
import { LoginScreen } from './src/screens/LoginScreen'
import { ChatRoomsScreen } from './src/screens/ChatRoomsScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { PushNotificationWrapper } from './src/components/PushNotificationWrapper'
import { NoInterNetBanner } from './src/components/NoInternetBanner'

export type RootStackParamList = {
  Login: undefined

  ChatRooms: undefined
  Chat: { roomId: string }
}
const Stack = createStackNavigator<RootStackParamList>()

export function App(): JSX.Element {
  const [authState, setAuthState] = React.useState<boolean>()
  React.useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setAuthState(!!user)
    })
    return () => unsubscribe()
  }, [])

  return (
    <NavigationContainer
      onReady={() => {
        setTimeout(() => {
          // Give auth a chance to get check the user
          RNBootSplash.hide({ fade: true, duration: 500 })
        }, 500)
      }}
    >
      <NoInterNetBanner />
      <PushNotificationWrapper>
        {!authState ? (
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator initialRouteName="ChatRooms">
            <Stack.Screen name="ChatRooms" component={ChatRoomsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Navigator>
        )}
      </PushNotificationWrapper>
    </NavigationContainer>
  )
}
