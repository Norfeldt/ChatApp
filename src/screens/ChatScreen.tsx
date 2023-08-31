import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  TextInput,
  Button,
  List,
  Avatar,
  Text,
  useTheme,
  TouchableRipple,
} from 'react-native-paper'
import { firebase } from '@react-native-firebase/database'
import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'
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
import { Alert, Image, RefreshControl, ScrollView, View } from 'react-native'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import { firebaseFunctions } from '../utils/firebaseFunctions'
import { PushNotificationSubscriptionDialog } from '../components/PushNotificationSubscriptionDialog'
import { MESSAGE_LIMIT, useMessages } from '../hooks/useMessages'
import { Loading } from '../components/Loading'

import type { RootStackParamList } from '../../App'
import type { ChatRoom } from '../types/server'

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
  const [chatRoom, setChatRoom] = React.useState<ChatRoom>()
  const messages = useMessages(roomId)
  const [messageText, setMessageText] = React.useState('')
  const [imageUri, setImageUri] = React.useState<string>()
  const [askForPushNotifications, setAskForPushNotifications] =
    React.useState(false)
  const theme = useTheme()

  React.useEffect(() => {
    const getChatroom = async () => {
      const chatRoomRef = firestore().doc(`chatRooms/${roomId}`)
      const chatRoomSnapshot = await chatRoomRef.get()
      const chatRoom = chatRoomSnapshot.data() as ChatRoom
      setChatRoom(chatRoom)
    }
    getChatroom()
  }, [roomId])

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()
  const animatedScrollViewStyle = useAnimatedStyle(() => {
    return {
      flex: 0,
      flexGrow: 0,
      height: contentHeight.value + keyboardHeight.value - inputHeight.value,
    }
  }, [keyboardHeight.value])

  const sendMessage = async () => {
    if (messageText.trim() === '' && !imageUri) return

    if (chatRoom && !chatRoom.members.includes(user?.uid!)) {
      setAskForPushNotifications(true)
    }

    const image = imageUri ? `images/${Date.now()}` : undefined
    if (imageUri) await storage().ref(image).putFile(imageUri)

    const {
      data: { success },
    } = await firebaseFunctions.sendMessageFunction({
      roomId,
      text: messageText,
      image,
    })
    if (!success) {
      Alert.alert('Error', 'Error sending message')

      return
    }

    setMessageText('')
    setImageUri(undefined)
  }

  const addPhoto = async (from: 'library' | 'camera') => {
    try {
      const response =
        from == 'library'
          ? await launchImageLibrary({ mediaType: 'photo' })
          : await launchCamera({ mediaType: 'photo' })
      if (
        response.didCancel ||
        response.errorCode ||
        !response.assets ||
        !response.assets.length
      ) {
        return
      }
      setImageUri(response.assets?.[0]?.uri ?? undefined)
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd()
      }, 300)
    } catch (error) {
      setImageUri(undefined)
    }
  }

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
      {askForPushNotifications ? (
        <PushNotificationSubscriptionDialog
          chatRoomName={chatRoom?.name ?? 'this chat room'}
        />
      ) : null}
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

          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: 200,
                height: 200,
                resizeMode: 'cover',
                alignSelf: 'center',
                opacity: 0.5,
              }}
            />
          ) : (
            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
              <TouchableRipple
                style={{
                  marginRight: 8,
                  aspectRatio: 1,
                  height: 48,
                  alignSelf: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => addPhoto('library')}
              >
                <MaterialIcons
                  name="photo"
                  size={48}
                  color={theme.colors.primary}
                />
              </TouchableRipple>
              <View style={{ width: 24 }}></View>
              <TouchableRipple
                style={{
                  marginRight: 8,
                  aspectRatio: 1,
                  height: 48,
                  alignSelf: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => addPhoto('camera')}
              >
                <MaterialIcons
                  name="camera"
                  size={48}
                  color={theme.colors.primary}
                />
              </TouchableRipple>
            </View>
          )}
        </List.Section>
      </Animated.ScrollView>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
          },
        ]}
        onLayout={(event) => {
          inputHeight.value = event.nativeEvent.layout.height
        }}
      >
        <TextInput
          style={{
            flex: 1,
            marginRight: 8,
          }}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message"
          onSubmitEditing={sendMessage}
        />
        <Button style={{ marginLeft: 8 }} onPress={sendMessage}>
          Send
        </Button>
      </Animated.View>
    </KeyboardControllerView>
  )
}
