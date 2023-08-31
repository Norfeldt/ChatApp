import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {
  KeyboardControllerView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshControl, ScrollView, View } from 'react-native'

import { MESSAGE_LIMIT, useMessages } from '../hooks/useMessages'
import { Loading } from '../components/Loading'
import { MessageList } from '../components/MessageList'
import { UploadImage } from '../components/UploadImage'
import { MessageForm } from '../components/MessageForm'

import type { RootStackParamList } from '../../App'

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>
type Props = {
  route: ChatScreenRouteProp
  navigation: ChatScreenNavigationProp
}

export function ChatScreen({ route }: Props) {
  const { roomId } = route.params
  const insets = useSafeAreaInsets()
  const contentHeight = useSharedValue(0)
  const inputHeight = useSharedValue(0)
  const scrollViewRef = useAnimatedRef<ScrollView>()
  const messages = useMessages(roomId)
  const [imageUri, setImageUri] = React.useState<string>()

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()
  const animatedScrollViewStyle = useAnimatedStyle(() => {
    return {
      flex: 0,
      flexGrow: 0,
      height: contentHeight.value + keyboardHeight.value - inputHeight.value,
    }
  }, [keyboardHeight.value])

  if (messages.initialLoading) {
    return (
      <View style={{ flex: 1 }}>
        <Loading />
      </View>
    )
  }

  return (
    <KeyboardControllerView
      style={{
        flex: 1,
        paddingBottom: insets.bottom,
      }}
      onLayout={(event) => {
        contentHeight.value = event.nativeEvent.layout.height
      }}
      onKeyboardMoveStart={() => {
        scrollViewRef.current?.scrollToEnd()
      }}
    >
      <Animated.ScrollView
        style={[animatedScrollViewStyle]}
        // @ts-ignore
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl
            refreshing={messages.loading}
            onRefresh={messages.fetchMore}
          />
        }
        onContentSizeChange={(w, h) => {
          if (messages.data.length <= MESSAGE_LIMIT) {
            scrollViewRef.current?.scrollToEnd() // Initial scroll to bottom
          }
        }}
      >
        <MessageList messages={messages.data}>
          <UploadImage {...{ scrollViewRef, imageUri, setImageUri }} />
        </MessageList>
      </Animated.ScrollView>
      <MessageForm {...{ roomId, inputHeight, imageUri, setImageUri }} />
    </KeyboardControllerView>
  )
}
