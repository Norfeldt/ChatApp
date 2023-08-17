import React from 'react'
import { Alert, FlatList, View } from 'react-native'
import auth from '@react-native-firebase/auth'
import { firebase } from '@react-native-firebase/database'
import { List, Button } from 'react-native-paper'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, NavigationProp } from '@react-navigation/native'

import { RootStackParamList } from '../../../App'

export function ChatRoomsScreen() {
  const [chatRooms, setChatRooms] = React.useState<
    { roomId: string; name: string; description: string }[]
  >([])
  const [refreshing, setRefreshing] = React.useState(false)
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const insets = useSafeAreaInsets()

  const fetchChatRooms = React.useCallback(() => {
    setRefreshing(true)
    // Fetch chat rooms without their messages
    const chatRoomsRef = firebase
      .app()
      .database(
        'https://chatapp-6c027-default-rtdb.europe-west1.firebasedatabase.app'
      )
      .ref('chatRooms')
    chatRoomsRef.once('value', (snapshot) => {
      const chatRoomData: RealTimeDatabase['chatRooms'] = snapshot.val()

      if (chatRoomData) {
        const chatRoomList = Object.keys(chatRoomData)
          .map((roomId) => ({
            roomId,
            name: chatRoomData[roomId].name,
            description: chatRoomData[roomId].description,
            lastMessageTimestamp: chatRoomData[roomId].lastMessageTimestamp,
          }))
          .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp)

        setChatRooms(chatRoomList)
      }
      setRefreshing(false)
    })

    // Clean up the listener when the component unmounts
    return () => chatRoomsRef.off('value')
  }, [])

  React.useEffect(() => {
    fetchChatRooms()
  }, [fetchChatRooms])

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.roomId}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.description}
            onPress={() => {
              navigation.navigate('Chat', { roomId: item.roomId })
            }}
            right={(props) => <MaterialIcons {...props} name="chevron-right" />}
          />
        )}
        style={{ flex: 1, flexGrow: 1 }}
        refreshing={refreshing}
        onRefresh={fetchChatRooms}
      />

      <View
        style={{
          padding: 16,
          marginBottom: insets.bottom,
        }}
      >
        <Button
          mode="outlined"
          onPress={async () => {
            try {
              await auth().signOut()
            } catch (error: any) {
              Alert.alert('Error', error.message ?? "Can't sign out")
            }
          }}
        >
          Sign Out
        </Button>
      </View>
    </View>
  )
}
