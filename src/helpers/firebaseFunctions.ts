import functions from '@react-native-firebase/functions'
import { Message } from '../types/server'

// this typing has to do, but it would be better if it came from the backend
export const firebaseFunctions = {
  sendMessageFunction: functions().httpsCallable('sendMessage') as unknown as (
    data: { roomId: string } & Pick<Message, 'text' | 'image'>
  ) => Promise<{ data: { success: boolean } }>,

  getUserInfo: functions().httpsCallable('getUserInfo') as unknown as (data: {
    uid: string
  }) => Promise<{ data: { displayName: string; photoURL: string } }>,

  subscribeToChatRoom: functions().httpsCallable(
    'subscribeToChatRoom'
  ) as unknown as (data: {
    roomId: string
  }) => Promise<{ data: { success: boolean } }>,
}
