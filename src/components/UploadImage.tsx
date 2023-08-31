import React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import { TouchableRipple, useTheme } from 'react-native-paper'
import { AnimatedRef } from 'react-native-reanimated'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

type Props = {
  imageUri: string | undefined
  setImageUri: React.Dispatch<React.SetStateAction<string | undefined>>
  scrollViewRef: AnimatedRef<ScrollView>
}
export function UploadImage(props: Props) {
  const theme = useTheme()

  const addPhoto = async (from: 'library' | 'camera') => {
    try {
      const response =
        from == 'library'
          ? await launchImageLibrary({ mediaType: 'photo' })
          : await launchCamera({ mediaType: 'photo' })
      if (
        response.didCancel ||
        response.errorCode ||
        !response.assets ||
        !response.assets.length
      ) {
        return
      }
      props.setImageUri(response.assets?.[0]?.uri ?? undefined)
      setTimeout(() => {
        props.scrollViewRef.current?.scrollToEnd()
      }, 300)
    } catch (error) {
      props.setImageUri(undefined)
    }
  }

  if (props.imageUri) {
    return (
      <Image
        source={{ uri: props.imageUri }}
        style={{
          width: 200,
          height: 200,
          resizeMode: 'cover',
          alignSelf: 'center',
          opacity: 0.5,
        }}
      />
    )
  }

  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
      <TouchableRipple
        style={{
          marginRight: 8,
          aspectRatio: 1,
          height: 48,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
        onPress={() => addPhoto('library')}
      >
        <MaterialIcons name="photo" size={48} color={theme.colors.primary} />
      </TouchableRipple>
      <View style={{ width: 24 }}></View>
      <TouchableRipple
        style={{
          marginRight: 8,
          aspectRatio: 1,
          height: 48,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
        onPress={() => addPhoto('camera')}
      >
        <MaterialIcons name="camera" size={48} color={theme.colors.primary} />
      </TouchableRipple>
    </View>
  )
}
