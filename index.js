
import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { initializeApp } from 'firebase/app';

export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}
registerRootComponent(App);