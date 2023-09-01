import React from 'react'
import { AppState, NativeModules, Platform, View } from 'react-native'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { Banner } from 'react-native-paper'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function NoInterNetBanner() {
  const [visible, setVisible] = React.useState(false)
  const inserts = useSafeAreaInsets()

  React.useEffect(() => {
    const subAppState = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (Platform.OS === 'ios' && nextAppState == 'active') {
          const newNetInfo = (await NativeModules.RNCNetInfo.getCurrentState(
            'wifi'
          )) as NetInfoState
          if (newNetInfo.isConnected) {
            setVisible(!newNetInfo.isInternetReachable)
          }
        }
      }
    )
    const unsubscribeNetState = NetInfo.addEventListener((state) => {
      setVisible(!state.isInternetReachable)
    })

    return () => {
      if (subAppState) {
        subAppState.remove()
      }
      unsubscribeNetState()
    }
  }, [])

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: 'Dismiss',
          onPress: () => setVisible(false),
        },
      ]}
      icon={({ size }) => (
        <MaterialIcons name="signal-wifi-off" size={size} color="#888" />
      )}
      style={{
        marginTop: visible ? inserts.top : 0,
      }}
    >
      No network connection. This may cause some features to be unavailable and
      unexpected behavior.
    </Banner>
  )
}
