// Firestore Database Structure:
// |
// ├── users (Collection)
// |   |
// |   ├── [uid] (Document)
// |   |   |
// |   |   └── fcmTokens: string[]
// |   |
// |   └── ... (Other users)
// |
// └── chatRooms (Collection)
//     |
//     ├── [chatRoomId] (Document)
//     |   |
//     |   ├── name: string
//     |   ├── description: string
//     |   ├── lastMessageTimestamp: number
//     |   ├── members: array of user uids
//     |   ├── pushNotificationSubscribers: array of user uids
//     |   |
//     |   └── messages (Sub-collection)
//     |       |
//     |       ├── [messageId] (Document)
//     |       |   |
//     |       |   ├── uid: string
//     |       |   ├── text: string
//     |       |   ├── timestamp: number
//     |       |   └── image?: string
//     |       |
//     |       └── ... (Other messages)
//     |
//     └── ... (Other chat rooms)

export type User = {
  fcmTokens: string[]
}

export type Message = {
  uid: string
  text: string
  timestamp: number
  image?: string
}

export type ChatRoom = {
  name: string
  description: string
  lastMessageTimestamp: number
  members: string[]
  pushNotificationSubscribers: string[]
}

export type ChatRoomWithMessages = ChatRoom & {
  messages: Message[]
}

export type FirestoreData = {
  users: {
    [uid: string]: User
  }
  chatRooms: {
    [chatRoomId: string]: ChatRoomWithMessages
  }
}
