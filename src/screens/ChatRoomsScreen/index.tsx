import React from 'react'
import { Alert, View } from 'react-native'
import auth from '@react-native-firebase/auth'

import { Text, Button } from 'react-native-paper'

export function ChatRoomsScreen() {
  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        ChatRoomsScreen
      </Text>

      <Button
        mode="outlined"
        onPress={async () => {
          try {
            await auth().signOut()
          } catch (error: any) {
            Alert.alert('Error', error.message ?? "Can't sign out")
          }
        }}
      >
        Sign Out
      </Button>
    </View>
  )
}
