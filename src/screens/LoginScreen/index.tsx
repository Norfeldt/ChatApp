import React from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Button } from 'react-native-paper'
import auth from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { WEB_CLIENT_ID, IOS_CLIENT_ID } from '@env'

GoogleSignin.configure({
  offlineAccess: true,
  scopes: ['profile', 'email'],
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  googleServicePlistPath: 'GoogleService-Info.plist',
  forceCodeForRefreshToken: true,
})

export function LoginScreen() {
  const onGoogleButtonPress = React.useCallback(async () => {
    try {
      const { idToken } = await GoogleSignin.signIn()
      if (!idToken) {
        throw new Error('Failed to get ID token')
      }
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)
      return auth().signInWithCredential(googleCredential)
    } catch (error: any) {
      Alert.alert(
        'Failed to sign in with Google',
        error.message ?? 'Please try again later or contact support'
      )
    }
  }, [])

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={() => onGoogleButtonPress()}>
        Sign in with Google
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
