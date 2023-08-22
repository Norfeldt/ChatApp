declare module '@env' {
  export const WEB_CLIENT_ID: string
  export const IOS_CLIENT_ID: string
}

type ChatRoom = {
  name: string
  description: string
  lastMessageTimestamp: number
  pushNotificationSubscribers: string[]
}

type Message = {
  uid: string
  text: string
  timestamp: number
  image?: string
}

type RealTimeDatabase = {
  chatRooms: {
    [key: string]: ChatRoom
  }
  messages: {
    [key: string]: {
      [key: string]: Message
    }
  }
}
