import React from 'react'
import { FlatList, StyleSheet, View, ViewStyle } from 'react-native'
import { Button, List, Text } from 'react-native-paper'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useNavigation, NavigationProp } from '@react-navigation/native'

import { RootStackParamList } from '../../App'
import { SignOutButton } from '../components/SignOutButton'
import { useChatRooms } from '../hooks/useChatRooms'

export function ChatRoomsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const chatRooms = useChatRooms()

  if (chatRooms.error) {
    return (
      <View style={styles.container}>
        <View style={styles.margin}>
          <Text variant="displayMedium">Ups...</Text>
          <Text variant="displaySmall">Noget gik galt 🤷‍♂️</Text>
          <View style={styles.spacer} />
          <Button mode="outlined" onPress={chatRooms.refetch}>
            Prøv igen
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms.data}
        keyExtractor={(item) => item.roomId}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.description}
            onPress={() => navigation.navigate('Chat', { roomId: item.roomId })}
            right={(props) => <MaterialIcons {...props} name="chevron-right" />}
          />
        )}
        style={styles.list}
        refreshing={chatRooms.loading}
        onRefresh={chatRooms.refetch}
      />

      <SignOutButton mx={16} my={16} />
    </View>
  )
}

type ClassNames = {
  container: ViewStyle
  list: ViewStyle
  spacer: ViewStyle
  margin: ViewStyle
}

const styles = StyleSheet.create<ClassNames>({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    flexGrow: 1,
  },
  spacer: {
    height: 32,
  },
  margin: {
    margin: 16,
  },
})
