import React from 'react'
import { Alert, ViewStyle } from 'react-native'
import auth from '@react-native-firebase/auth'
import { Button } from 'react-native-paper'

type Props = {
  mx?: number
  my?: number
}

export function SignOutButton(props: Props) {
  const signOutHandler = React.useCallback(async () => {
    try {
      await auth().signOut()
    } catch (error: any) {
      Alert.alert('Error', error.message ?? "Can't sign out")
    }
  }, [])

  const propStyles: ViewStyle = {
    marginHorizontal: props.mx ?? 0,
    marginVertical: props.my ?? 0,
  }

  return (
    <Button mode="outlined" onPress={signOutHandler} style={[propStyles]}>
      Sign Out
    </Button>
  )
}
