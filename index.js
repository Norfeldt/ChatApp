/**
 * @format
 */

import { AppRegistry } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-gesture-handler' // https://reactnavigation.org/docs/stack-navigator

import { App } from './App'
import { name as appName } from './app.json'

export default function Main() {
  return (
    <PaperProvider>
      <KeyboardProvider>
        <App />
      </KeyboardProvider>
    </PaperProvider>
  )
}

AppRegistry.registerComponent(appName, () => Main)
