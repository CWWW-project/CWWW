import { useMinihompyStore } from '../store/minihompyStore'
import { minihompyApi } from '../api/minihompy'

export async function uploadProfileImage(file: File) {
  await minihompyApi.uploadProfileImage(file)
  const res = await minihompyApi.getMyMinihompy()
  useMinihompyStore.getState().setMain(res.data.data)
  useMinihompyStore.getState().setMyProfileImageUrl(res.data.data.profileImageUrl)
}

export async function deleteProfileImage() {
  await minihompyApi.deleteProfileImage()
  const res = await minihompyApi.getMyMinihompy()
  useMinihompyStore.getState().setMain(res.data.data)
  useMinihompyStore.getState().setMyProfileImageUrl(res.data.data.profileImageUrl)
}