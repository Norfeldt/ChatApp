import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { TextInput, Button, List, Avatar, Text } from 'react-native-paper'
import {
  FirebaseDatabaseTypes,
  firebase,
} from '@react-native-firebase/database'
import storage from '@react-native-firebase/storage'

import { RootStackParamList } from '../../../App'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {
  KeyboardControllerView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image, RefreshControl, ScrollView } from 'react-native'

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
  const scrollViewRef = React.useRef<ScrollView>(null)
  const [user, _setUser] = React.useState(firebase.auth().currentUser)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [message, setMessage] = React.useState<string>('')
  const [messageCount, setMessageCount] = React.useState<number>(50)
  const [refreshing, setRefreshing] = React.useState(false)
  const storageRef = storage().ref('images/')

  React.useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd()
    }, 300)
  }, [])
  React.useEffect(() => {
    let messageRef: FirebaseDatabaseTypes.Reference
    const loadMessages = async () => {
      messageRef = firebase
        .app()
        .database(
          'https://chatapp-6c027-default-rtdb.europe-west1.firebasedatabase.app'
        )
        .ref(`messages/${roomId}`)

      messageRef
        .orderByChild('timestamp')
        .limitToLast(messageCount)
        .on('value', async (snapshot) => {
          const data: RealTimeDatabase['messages'][string] = snapshot.val()
          if (data) {
            const preparedMessages = await Promise.all(
              Object.values(data)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(async (message) => {
                  const imageUrl = message.image
                    ? await storage().ref(message.image).getDownloadURL()
                    : undefined

                  return {
                    ...message,
                    image: imageUrl,
                  }
                })
            )

            setMessages(preparedMessages)
            setRefreshing(false)
          }
        })
    }
    loadMessages()

    return () => messageRef?.off('value')
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
    if (message.trim() === '') return

    await firebase
      .app()
      .database(
        'https://chatapp-6c027-default-rtdb.europe-west1.firebasedatabase.app'
      )
      .ref(`messages/${roomId}`)
      .push({
        senderId: user?.displayName ?? 'Unknown', // in production a firebase function would attach the user uid to the message
        text: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      })
    setMessageCount(messageCount + 1)
    setMessage('')
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd()
    }, 300)
  }
  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    setMessageCount((messageCount) => messageCount + 50)
  }, [])

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <List.Section style={{ flex: 1 }}>
          {messages.map((message, index) => (
            <List.Item
              key={message.timestamp}
              title={message.senderId}
              titleNumberOfLines={0}
              titleStyle={{ fontSize: 16 }}
              // description={new Date(message.timestamp).toLocaleString()}
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
                  message.senderId === user?.displayName ? '#E7E0EC' : '#eee',
                borderRadius: 16,
                padding: 8,
                margin: 8,
                maxWidth: '90%',
                borderWidth: 1,
                borderColor:
                  message.senderId === user?.displayName ? '#6750A4' : 'gray',
                alignSelf:
                  message.senderId === user?.displayName
                    ? 'flex-end'
                    : 'flex-start',
              }}
              right={(props) =>
                // using the photo url that comes with the social login
                message.senderId === user?.displayName &&
                user.photoURL && (
                  <Avatar.Image
                    {...props}
                    size={48}
                    source={{ uri: user?.photoURL }}
                  />
                )
              }
              left={(props) => {
                // when user is created photoURL should be added to the database under `users/${user.uid}`, but keeping it simple for now
                return (
                  message.senderId !== user?.displayName && (
                    <Avatar.Image
                      {...props}
                      size={48}
                      source={{
                        uri: `https://ui-avatars.com/api/?name=${message.senderId}&size=48`,
                      }}
                    />
                  )
                )
              }}
            ></List.Item>
          ))}
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
          value={message}
          onChangeText={setMessage}
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
