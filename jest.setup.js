/* global jest */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return props => React.createElement(View, props);
});

jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-config', () => ({
  GOOGLE_MAPS_API_KEY: 'test-google-maps-key',
}));

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: { open: jest.fn(() => Promise.resolve({})) },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: { dirs: { DocumentDir: '/documents', DownloadDir: '/downloads' } },
    config: jest.fn(() => ({
      fetch: jest.fn(() => Promise.resolve({ path: () => '/downloads/report.pdf' })),
    })),
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({ assets: [] })),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );

  MapView.displayName = 'MapView';

  return {
    __esModule: true,
    default: MapView,
    Marker: props => React.createElement(View, props),
    PROVIDER_GOOGLE: 'google',
  };
});
