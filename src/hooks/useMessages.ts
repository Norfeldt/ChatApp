import React from 'react'
import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'

import { firebaseFunctions } from '../utils/firebaseFunctions'

import type { Message } from '../types/server'
import { useUserInfo } from './useUserInfo'

export const MESSAGE_LIMIT = 50

type HookResult = {
  data: Array<
    Message & { id: string } & Awaited<
        ReturnType<typeof firebaseFunctions.getUserInfo>
      >['data']
  >
  initialLoading: boolean
  loading: boolean
  error: Error | undefined
  fetchMore: () => void
}

export function useMessages(
  roomId: string,
  messageLimit = MESSAGE_LIMIT
): HookResult {
  const [data, setData] = React.useState<HookResult['data']>([])
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error>()
  const [messageCount, setMessageCount] = React.useState(messageLimit)
  const { fetchUserInfo } = useUserInfo()

  React.useEffect(() => {
    const loadMessages = async () => {
      try {
        const messageRef = firestore()
          .collection(`chatRooms/${roomId}/messages`)
          .orderBy('timestamp', 'desc')
          .limit(messageCount)

        const unsubscribe = messageRef.onSnapshot(async (querySnapshot) => {
          setLoading(true)
          const data = querySnapshot.docs.reverse().map((doc) => ({
            ...(doc.data() as Message),
            id: doc.id,
          })) as ({ id: string } & Message)[]
          if (data.length > 0) {
            const enrichedMessages = await Promise.all(
              data.map(async (message) => {
                const userInfo = await fetchUserInfo(message.uid)

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
            setData(enrichedMessages)
            setInitialLoading(false)
            setLoading(false)
          }
        })

        return () => unsubscribe()
      } catch (error) {
        setError(error as Error)
        setInitialLoading(false)
        setLoading(false)
      }
    }
    loadMessages()
  }, [messageCount])

  const fetchMore = () => {
    setMessageCount((prev) => prev + MESSAGE_LIMIT)
  }

  return { data, initialLoading, loading, error, fetchMore }
}
