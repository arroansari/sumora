import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { PlatformProvider } from './src/context/PlatformContext';
import { RootNavigator } from './src/navigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PlatformProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </PlatformProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
