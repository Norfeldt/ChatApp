import React from 'react'
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import { ChatRoom } from '../types/server'

const QUERY_CHAT_ROOMS = firestore()
  .collection('chatRooms')
  .orderBy('lastMessageTimestamp', 'desc')

type UseChatRoomsResult = {
  data: Array<
    { roomId: string } & Omit<
      ChatRoom,
      'members' | 'pushNotificationSubscribers'
    >
  >
  loading: boolean
  error: Error | undefined
  refetch: () => void
}

export function useChatRooms(): UseChatRoomsResult {
  const [data, setData] = React.useState<UseChatRoomsResult['data']>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error>()

  const dataHandle = React.useCallback(
    (querySnapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
      const chatRoomList = querySnapshot.docs.map((doc) => {
        const chatRoom = doc.data() as ChatRoom
        return {
          roomId: doc.id,
          name: chatRoom.name,
          description: chatRoom.description,
          lastMessageTimestamp: chatRoom.lastMessageTimestamp,
        }
      })
      setData(chatRoomList)
      setLoading(false)
    },
    [setData, setLoading]
  )
  const errorHandle = React.useCallback(
    (error: Error) => {
      // report to error monitoring service (sentry etc)
      // alternative would be to use a global error boundary or navigate to some error screen
      setError(error)
      setLoading(false)
    },
    [setError, setLoading]
  )

  React.useEffect(() => {
    const unsubscribe = QUERY_CHAT_ROOMS.onSnapshot(dataHandle, errorHandle)

    return () => unsubscribe()
  }, [])

  const refetch = () => {
    setLoading(true)
    setError(undefined)
    QUERY_CHAT_ROOMS.get().then(dataHandle).catch(errorHandle)
  }

  return { data, loading, error, refetch }
}
