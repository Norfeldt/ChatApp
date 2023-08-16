import React, { useState } from 'react'
import { View } from 'react-native'
import { Button } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import auth from '@react-native-firebase/auth'

function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()

  async function handleGoogleLogin() {
    try {
      setLoading(true)
      const { idToken } = await GoogleSignin.signIn()
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)
      await auth().signInWithCredential(googleCredential)
      navigation.navigate('ChatRooms')
    } catch (error) {
      console.log(error)
      // Show error dialog to user
    } finally {
      setLoading(false)
    }
  }

  async function handleFacebookLogin() {
    try {
      setLoading(true)
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
      ])
      if (result.isCancelled) {
        throw new Error('User cancelled the login process')
      }
      const facebookCredential = auth.FacebookAuthProvider.credential(
        result.accessToken
      )
      await auth().signInWithCredential(facebookCredential)
      navigation.navigate('ChatRooms')
    } catch (error) {
      console.log(error)
      // Show error dialog to user
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Button mode="contained" onPress={handleFacebookLogin} loading={loading}>
        Sign in with Facebook
      </Button>
      <Button mode="contained" onPress={handleGoogleLogin} loading={loading}>
        Sign in with Google
      </Button>
    </View>
  )
}

export default LoginScreen
