import React from 'react'
import { View } from 'react-native'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Text } from 'react-native-paper'

import { RootStackParamList } from '../../../App'

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>

type Props = {
  route: ChatScreenRouteProp
  navigation: ChatScreenNavigationProp
}

export function ChatScreen({ route }: Props) {
  const { roomId } = route.params

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Room ID: {roomId}
      </Text>
    </View>
  )
}
