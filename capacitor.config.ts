import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'is.nickot.fishbox',
  appName: 'FinDex',
  webDir: 'out',
  server: {
    url: 'https://fishbox.nickot.is',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'FinDex',
    backgroundColor: '#0f2333',
  },
  android: {
    backgroundColor: '#0f2333',
  },
}

export default config
