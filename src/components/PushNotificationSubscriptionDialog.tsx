import React from 'react'
import { ChatRoom } from '../types/server'
import { firebaseFunctions } from '../utils/firebaseFunctions'
import { useRoute } from '@react-navigation/native'
import { Button, Dialog, Portal, Text } from 'react-native-paper'
import { View } from 'react-native'

export function PushNotificationSubscriptionDialog(props: {
  chatRoomName: ChatRoom['name']
}) {
  const { roomId } = useRoute().params as { roomId: string }
  const [visible, setVisible] = React.useState(true)

  const hideDialogHandler = () => setVisible(false)

  const subscribeHandler = () => {
    firebaseFunctions.subscribeToChatRoom({
      roomId,
    })

    // TODO: missing handlers when this fails - revise UX (perhaps a subscribe button in the chat room header?)

    hideDialogHandler()
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={hideDialogHandler}>
        <Dialog.Title>Push notifications</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            {`Want to have notifications from ${props.chatRoomName}?`}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={hideDialogHandler}>No</Button>
          <View style={{ width: 16 }} />
          <Button onPress={subscribeHandler}>Yes</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
