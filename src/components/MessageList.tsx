import React from 'react'
import { Image, ImageStyle, StyleSheet, ViewStyle } from 'react-native'
import { Avatar, List, Text, useTheme } from 'react-native-paper'
import { firebase } from '@react-native-firebase/database'

import { useMessages } from '../hooks/useMessages'

type Props = {
  messages: ReturnType<typeof useMessages>['data']
  children?: React.JSX.Element
}

export function MessageList({ children, ...props }: Props) {
  const [user, _setUser] = React.useState(firebase.auth().currentUser!)
  const theme = useTheme()

  return (
    <List.Section style={styles.container}>
      {props.messages.map((message) => (
        <List.Item
          key={message.id}
          title={message.displayName}
          titleNumberOfLines={0}
          titleStyle={{ fontSize: 16 }}
          description={() => (
            <>
              {message.image ? (
                <Image source={{ uri: message.image }} style={styles.image} />
              ) : null}
              <Text variant="bodyMedium">{message.text}</Text>
              <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                {new Date(message.timestamp).toLocaleString()}
              </Text>
            </>
          )}
          style={[
            styles.item,
            {
              backgroundColor:
                message.uid === user?.uid
                  ? theme.colors.inversePrimary
                  : '#eee',
              borderColor:
                message.uid === user?.uid ? theme.colors.primary : 'gray',
              alignSelf: message.uid === user?.uid ? 'flex-end' : 'flex-start',
            },
          ]}
          {...{
            [user?.uid === message.uid ? 'right' : 'left']: () => {
              return (
                <Avatar.Image
                  size={48}
                  source={{
                    uri: message.photoURL,
                  }}
                />
              )
            },
          }}
        ></List.Item>
      ))}
      {children}
    </List.Section>
  )
}

type ClassNames = {
  container: ViewStyle
  image: ImageStyle
  item: ViewStyle
}

const styles = StyleSheet.create<ClassNames>({
  container: {
    flex: 1,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  item: {
    borderRadius: 16,
    padding: 8,
    margin: 8,
    maxWidth: '90%',
    borderWidth: 1,
  },
})
