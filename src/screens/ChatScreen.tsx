import React from 'react'
import { RouteProp, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  TextInput,
  Button,
  List,
  Avatar,
  Text,
  useTheme,
  TouchableRipple,
  Portal,
  Dialog,
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

// TODO: setup absolute paths and eslint rules for import arrangement
import { firebaseFunctions } from '../utils/firebaseFunctions'

import type { RootStackParamList } from '../../App'
import type { Message, ChatRoom } from '../types/server'

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>
type EnrichedMessage = Message & { id: string } & Awaited<
    ReturnType<typeof firebaseFunctions.getUserInfo>
  >['data']
type Props = {
  route: ChatScreenRouteProp
  navigation: ChatScreenNavigationProp
}

const MESSAGE_LIMIT = 50

export function ChatScreen({ route }: Props) {
  const { roomId } = route.params
  const insets = useSafeAreaInsets()
  const contentHeight = useSharedValue(0)
  const inputHeight = useSharedValue(0)
  const scrollViewRef = useAnimatedRef<ScrollView>()
  const [user, _setUser] = React.useState(firebase.auth().currentUser)
  // TODO: discuss moving the caching of the firebaseFunctions (as a "singleton") since allows reusing caching when changing rooms
  const usersInfoCacheRef = React.useRef(
    new Map<
      string,
      Awaited<ReturnType<typeof firebaseFunctions.getUserInfo>>['data']
    >()
  )
  const ongoingFetchesRef = React.useRef(
    new Map<string, ReturnType<typeof firebaseFunctions.getUserInfo>>()
  )
  const [chatRoom, setChatRoom] = React.useState<ChatRoom>()
  const [messages, setMessages] = React.useState<EnrichedMessage[]>([])
  const [messageCount, setMessageCount] = React.useState(MESSAGE_LIMIT)
  const [refreshing, setRefreshing] = React.useState(false)
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

  React.useEffect(() => {
    const loadMessages = async () => {
      const messageRef = firestore()
        .collection(`chatRooms/${roomId}/messages`)
        .orderBy('timestamp', 'desc')
        .limit(messageCount)

      const unsubscribe = messageRef.onSnapshot(async (querySnapshot) => {
        const data = querySnapshot.docs.reverse().map((doc) => ({
          ...(doc.data() as Message),
          id: doc.id,
        })) as ({ id: string } & Message)[]
        if (data.length > 0) {
          const enrichedMessages = await Promise.all(
            data.map(async (message): Promise<EnrichedMessage> => {
              const { uid } = message
              let userInfo = usersInfoCacheRef.current.get(uid)
              if (!userInfo) {
                let ongoingFetch = ongoingFetchesRef.current.get(uid)
                if (!ongoingFetch) {
                  ongoingFetch = firebaseFunctions.getUserInfo({ uid })
                  ongoingFetchesRef.current.set(uid, ongoingFetch)
                }
                const { data } = await ongoingFetch
                userInfo = data
                usersInfoCacheRef.current.set(uid, userInfo)
                ongoingFetchesRef.current.delete(uid)
              }

              if (!message.image)
                return {
                  ...message,
                  ...userInfo,
                }
              try {
                const imageUrl = await storage()
                  .ref(message.image)
                  ?.getDownloadURL()

                return {
                  ...message,
                  ...userInfo,
                  image: imageUrl,
                }
              } catch (error) {
                return {
                  ...message,
                  ...userInfo,
                  image: await storage()
                    .ref('assets/images/no-image.jpg')
                    ?.getDownloadURL(), // TODO: use a network independent placeholder for missing images
                }
              }
            })
          )
          setMessages(enrichedMessages)
          setRefreshing(false)
        }
      })

      return () => unsubscribe()
    }
    loadMessages()
  }, [roomId, messageCount])

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

    setMessageCount(messageCount + 1)
    setMessageText('')
    setImageUri(undefined)
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    setMessageCount((messageCount) => messageCount + MESSAGE_LIMIT)
  }, [])

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onContentSizeChange={(w, h) => {
          if (messages.length <= MESSAGE_LIMIT) {
            scrollViewRef.current?.scrollToEnd() // Initial scroll to bottom
          }
        }}
      >
        <List.Section style={{ flex: 1 }}>
          {messages.map((message) => (
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

// Tend to write components for DRY or readability. Keep them in the same file until they are reusable, then they are moved to a `components` directory
function PushNotificationSubscriptionDialog(props: {
  chatRoomName: ChatRoom['name']
}) {
  const { roomId } = useRoute().params as { roomId: string }
  const [visible, setVisible] = React.useState(true)
  const hideDialog = () => setVisible(false)
  const positiveAction = () => {
    firebaseFunctions.subscribeToChatRoom({
      roomId,
    }) // TODO: missing handlers when this fails - revise UX (perhaps a subscribe button in the chat room header?)

    hideDialog()
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={hideDialog}>
        <Dialog.Title>Push notifications</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            {`Want to have notifications from ${props.chatRoomName}?`}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={hideDialog}>No</Button>
          <View style={{ width: 16 }} />
          <Button onPress={positiveAction}>Yes</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
