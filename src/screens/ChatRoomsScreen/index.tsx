import React from 'react'
import { Alert, FlatList, View } from 'react-native'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
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
    const chatRoomsRef = firestore()
      .collection('chatRooms')
      .orderBy('lastMessageTimestamp', 'desc')

    const unsubscribe = chatRoomsRef.onSnapshot(
      (querySnapshot) => {
        querySnapshot = querySnapshot

        const chatRoomList = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            roomId: doc.id,
            name: data.name,
            description: data.description,
            lastMessageTimestamp: data.lastMessageTimestamp,
          }
        })

        setChatRooms(chatRoomList)
        setRefreshing(false)
      },
      (error) => {
        console.error('Error fetching chat rooms: ', error)
        setRefreshing(false)
      }
    )

    return () => unsubscribe()
  }, [])

  React.useEffect(() => {
    fetchChatRooms()
  }, [fetch])

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
