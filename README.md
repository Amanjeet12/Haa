# Haa Health

React Native foundation for the Haa Health mobile app. The project includes an
onboarding, location, phone login, and PIN flow; native Android and iOS shells;
TypeScript; typed stack navigation; persisted appearance preferences; shared
design tokens; reusable UI components; and API/storage utilities.

## Requirements

- Node.js 22.11 or newer
- JDK 17 and Android Studio for Android
- macOS with Xcode and CocoaPods for iOS

Follow the React Native environment guide before the first native build:
https://reactnative.dev/docs/set-up-your-environment

## Install

```sh
npm install
```

Native Android libraries are autolinked by React Native. For iOS, run this on a
Mac after installing or changing native packages:

```sh
bundle install
cd ios && bundle exec pod install && cd ..
```

## Run

Start Metro in one terminal:

```sh
npm start
```

Then launch a platform build in another terminal:

```sh
npm run android
npm run ios
```

## Push notifications

OneSignal uses app ID `0d7b5bcd-c378-4baa-8092-5a078c02347d` in
`src/config/app.ts`. This is a public app ID, not a REST API secret.
The app requests notification permission on launch, including for guests.
Users must accept the native prompt themselves. Successful login and restored
sessions set the OneSignal external ID to `customer_<customer_id>` (for example,
`customer_42`). Notification senders must target this prefixed external ID.
Logout clears that identity and retains anonymous guest notifications.

Configure Android FCM credentials and iOS APNs credentials in that OneSignal
app's dashboard. For iOS, use your registered bundle ID and a provisioning profile
with Push Notifications enabled; install pods on macOS after pulling this change.
Basic push capabilities are configured. Rich iOS attachments and confirmed receipt
require an additional Notification Service Extension and App Group; see the
[OneSignal setup guide](https://documentation.onesignal.com/docs/en/react-native-sdk-setup).
Rebuild the native app after installing the package (a Metro reload is insufficient).

On a device, verify the first-launch permission prompt, guest delivery, login
external ID, restored-session identity, and removal of the external ID on logout.
Then log into a different customer account and verify notifications target that ID.

## Quality checks

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
```

## Project structure

```text
src/
  api/          Fetch client and API errors
  assets/       Shared application images
  components/   Theme-aware reusable UI
  config/       App constants and storage keys
  navigation/   Typed navigation container
  screens/      App screens
  services/     Native device services such as geolocation
  storage/      Typed persistence helpers
  theme/        Color, spacing, radius, and typography tokens
  types/        Shared TypeScript types
  utils/        Pure utility functions
```

Android icons live under `android/app/src/main/res/mipmap-*`. iOS icons belong in
`ios/Haa_Health/Images.xcassets/AppIcon.appiconset`. Replace the generated
placeholder icons with approved brand artwork before a store build.

Foreground location access is declared in AndroidManifest.xml and Info.plist.
The app asks for permission only when the user taps **Use current location**.
