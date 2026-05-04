import * as ExpoFileSystem from 'expo-file-system/legacy'
import { createMobileAppStateStorage } from './mobileAppStateStorage'

export function createNativeMobileAppStateStorage() {
  return createMobileAppStateStorage(ExpoFileSystem)
}
