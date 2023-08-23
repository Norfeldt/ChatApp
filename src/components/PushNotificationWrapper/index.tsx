import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { PermissionsAndroid, Platform } from 'react-native'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import notifee from '@notifee/react-native'

import { RootStackParamList } from '../../../App'

//  A lot of async logic so keeping the logs for dev mode only 🔈
const debugLog = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log(...args)
  }
}

async function requestPostNotificationPermissions() {
  try {
    const authStatus =
      Platform.OS === 'android'
        ? // https://reactnative.dev/docs/permissionsandroid#permissions-that-require-prompting-the-user
          await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS'
          )
        : // .requestPermission a no-op on Android and will promise resolve `void`
          await messaging().requestPermission({
            alert: true,
            announcement: false,
            badge: true,
            carPlay: false,
            provisional: true,
            sound: true,
          })
    debugLog(
      'notification permission status: ',
      typeof authStatus === 'number'
        ? FirebaseMessagingTypes.AuthorizationStatus[authStatus]
        : authStatus
    )
    if (
      authStatus === 'granted' ||
      authStatus === messaging.AuthorizationStatus.AUTHORIZED
    ) {
      await messaging().registerDeviceForRemoteMessages()
      const token = await messaging().getToken()
      debugLog('FCM Token: ', token)
      await uploadFcmToken(token)
      await messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        await notifee.displayNotification({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        })
        debugLog('Message handled in the background!', remoteMessage)
      })
      debugLog('setBackgroundMessageHandler set')
    }
    debugLog('requestPostNotificationPermissions done')
    debugLog('\n')
  } catch (error) {
    // Send to error tracking service (sentry etc)
  }
}

// making sure we ask after the user is logged in
auth().onAuthStateChanged((user) => {
  if (user) {
    requestPostNotificationPermissions()
  }
})

messaging().onTokenRefresh(async (token) => {
  await uploadFcmToken(token)
})

async function uploadFcmToken(token: string) {
  const userUid = auth().currentUser?.uid
  if (userUid) {
    const ref = firestore().collection('users').doc(userUid)
    await ref.update({
      fcmTokens: firestore.FieldValue.arrayUnion(token),
    })
  }
}

// 🔇 Silence warning
notifee.onBackgroundEvent(() => new Promise(() => {}))

// Making this Wrapper as a separate component so that we can use useNavigation which requires a NavigationContainer parent
export function PushNotificationWrapper({
  children,
}: {
  children: JSX.Element | JSX.Element[]
}): JSX.Element {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  React.useEffect(() => {
    // app-in-background-listner
    const unsubscribe = messaging().onNotificationOpenedApp(
      async (remoteMessage) => {
        const roomId = remoteMessage.data?.roomId
        if (typeof roomId === 'string') {
          navigation.navigate('Chat', { roomId })
        }
      }
    )

    // app-closed-listener
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        const roomId = remoteMessage?.data?.roomId
        if (typeof roomId === 'string') {
          navigation.navigate('Chat', { roomId })
        }
      })

    return unsubscribe
  }, [navigation])

  return <>{children}</>
}
