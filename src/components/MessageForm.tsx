import React from 'react'
import { Alert } from 'react-native'
import { Button, TextInput } from 'react-native-paper'
import Animated, { SharedValue } from 'react-native-reanimated'
import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'
import { firebase } from '@react-native-firebase/database'

import { PushNotificationSubscriptionDialog } from './PushNotificationSubscriptionDialog'
import { firebaseFunctions } from '../utils/firebaseFunctions'

import type { ChatRoom } from '../types/server'

type Props = {
  roomId: string
  inputHeight: SharedValue<number>
  imageUri: string | undefined
  setImageUri: React.Dispatch<React.SetStateAction<string | undefined>>
}

export function MessageForm(props: Props) {
  const [messageText, setMessageText] = React.useState('')
  const [enabled, setEnabled] = React.useState(true)
  const user = React.useRef(firebase.auth().currentUser)
  const [chatRoom, setChatRoom] = React.useState<ChatRoom>()
  const [askForPushNotifications, setAskForPushNotifications] =
    React.useState(false)

  React.useEffect(() => {
    const getChatroom = async () => {
      const chatRoomRef = firestore().doc(`chatRooms/${props.roomId}`)
      const chatRoomSnapshot = await chatRoomRef.get()
      const chatRoom = chatRoomSnapshot.data() as ChatRoom
      setChatRoom(chatRoom)
    }
    getChatroom()
  }, [props.roomId])

  const sendMessageHandler = React.useCallback(async () => {
    if (messageText.trim() === '' && !props.imageUri) return
    setEnabled(false)

    if (chatRoom && !chatRoom.members.includes(user.current?.uid!)) {
      setAskForPushNotifications(true)
    }

    const image = props.imageUri ? `images/${Date.now()}` : undefined
    if (props.imageUri) await storage().ref(image).putFile(props.imageUri)

    const {
      data: { success },
    } = await firebaseFunctions.sendMessageFunction({
      roomId: props.roomId,
      text: messageText,
      image,
    })
    setEnabled(true)
    if (!success) {
      Alert.alert('Error', 'Error sending message')

      return
    }

    setMessageText('')
    props.setImageUri(undefined)
  }, [props.roomId, messageText, props.imageUri, chatRoom, props.setImageUri])

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
      }}
      onLayout={(event) => {
        props.inputHeight.value = event.nativeEvent.layout.height
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
        onSubmitEditing={sendMessageHandler}
        editable={enabled}
      />
      <Button
        style={{ marginLeft: 8 }}
        onPress={sendMessageHandler}
        disabled={!enabled}
      >
        Send
      </Button>
      {askForPushNotifications ? (
        <PushNotificationSubscriptionDialog
          chatRoomName={chatRoom?.name ?? 'this chat room'}
        />
      ) : null}
    </Animated.View>
  )
}
