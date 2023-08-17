/**
 * @format
 */

import { AppRegistry } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { GestureHandlerRootView } from 'react-native-gesture-handler' // https://reactnavigation.org/docs/stack-navigator

import { App } from './App'
import { name as appName } from './app.json'

export default function Main() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <KeyboardProvider>
          <App />
        </KeyboardProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  )
}

AppRegistry.registerComponent(appName, () => Main)
