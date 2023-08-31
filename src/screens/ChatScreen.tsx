import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { List, Avatar, Text, useTheme } from 'react-native-paper'
import { firebase } from '@react-native-firebase/database'
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
import { Image, RefreshControl, ScrollView, View } from 'react-native'

import { MESSAGE_LIMIT, useMessages } from '../hooks/useMessages'
import { Loading } from '../components/Loading'
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
  const [user, _setUser] = React.useState(firebase.auth().currentUser)
  const messages = useMessages(roomId)
  const [imageUri, setImageUri] = React.useState<string>()
  const theme = useTheme()

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
        <List.Section style={{ flex: 1 }}>
          {messages.data.map((message) => (
            <List.Item
              key={message.id}
              title={message.displayName}
              titleNumberOfLines={0}
              titleStyle={{ fontSize: 16 }}
              description={() => (
                <>
                  {message.image ? (
                    <Image
                      source={{
                        uri: message.image,
                      }}
                      style={{
                        width: 200,
                        height: 200,
                        resizeMode: 'cover',
                      }}
                    />
                  ) : null}
                  <Text variant="bodyMedium">{message.text}</Text>
                  <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                    {new Date(message.timestamp).toLocaleString()}
                  </Text>
                </>
              )}
              style={{
                backgroundColor:
                  message.uid === user?.uid
                    ? theme.colors.inversePrimary
                    : '#eee',
                borderRadius: 16,
                padding: 8,
                margin: 8,
                maxWidth: '90%',
                borderWidth: 1,
                borderColor:
                  message.uid === user?.uid ? theme.colors.primary : 'gray',
                alignSelf:
                  message.uid === user?.uid ? 'flex-end' : 'flex-start',
              }}
              {...{
                [user?.uid === message.uid ? 'right' : 'left']: () => {
                  return (
                    <Avatar.Image
                      size={48}
                      source={{
                        uri: message.photoURL,
                      }}
                    />
                  )
                },
              }}
            ></List.Item>
          ))}
          <UploadImage {...{ scrollViewRef, imageUri, setImageUri }} />
        </List.Section>
      </Animated.ScrollView>
      <MessageForm {...{ roomId, inputHeight, imageUri, setImageUri }} />
    </KeyboardControllerView>
  )
}
