import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { store } from './src/store';
import { usePushNotifications } from './src/services/usePushNotifications';
import { UpdateAppModal } from './src/components/UpdateAppModal';

function AppContent() {
  usePushNotifications();
  const { theme } = useAppTheme();

  return (
    <>
      <StatusBar
        animated
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />
      <RootNavigator />
      <UpdateAppModal />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
