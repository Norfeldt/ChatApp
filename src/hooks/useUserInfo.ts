import React from 'react'
import { firebaseFunctions } from '../utils/firebaseFunctions'

type UserInfo = Awaited<
  ReturnType<typeof firebaseFunctions.getUserInfo>
>['data']

export const useUserInfo = () => {
  const usersInfoCacheRef = React.useRef(new Map<string, UserInfo>())
  const ongoingFetchesRef = React.useRef(
    new Map<string, Promise<{ data: UserInfo }>>()
  )

  const fetchUserInfo = async (uid: string): Promise<UserInfo> => {
    // Check if user info is already cached
    let userInfo = usersInfoCacheRef.current.get(uid)
    if (userInfo) {
      return userInfo
    }

    // Check if there's an ongoing fetch for this user
    let ongoingFetch = ongoingFetchesRef.current.get(uid)
    if (!ongoingFetch) {
      ongoingFetch = firebaseFunctions.getUserInfo({ uid })
      ongoingFetchesRef.current.set(uid, ongoingFetch)
    }

    // Wait for the fetch to complete and update the cache
    const { data } = await ongoingFetch
    userInfo = data
    usersInfoCacheRef.current.set(uid, userInfo)
    ongoingFetchesRef.current.delete(uid)

    return userInfo
  }

  return { fetchUserInfo }
}
