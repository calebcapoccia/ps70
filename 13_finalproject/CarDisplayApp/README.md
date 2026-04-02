# CarDisplay BLE App

React Native app for controlling the ESP32 CarDisplay over Bluetooth Low Energy (BLE).

## Overview

This app connects to an ESP32 device named "CarDisplay" via BLE and sends JSON messages to control an LED matrix display.

**Protocol:**
- **Device Name:** CarDisplay
- **Service UUID:** `6da6814e-13a5-4144-96a0-6db8d3b343c9`
- **Characteristic UUID:** `82b3bdc2-ccf2-4063-b820-9a66322f8234`
- **Message Format:** JSON - `{"text": "message", "repeat": 1, "pause": 0, "speed": 50}`

## Prerequisites

1. **ESP32 Setup:**
   - Flash `bluetooth_connection.ino` to your ESP32
   - Verify it's advertising as "CarDisplay" (check Serial monitor)
   - Ensure the LED display is connected and working

2. **Development Environment:**
   - Complete [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)
   - For iOS: Xcode and CocoaPods
   - For Android: Android Studio and SDK

3. **Physical Device Required:**
   - BLE does **not** work in iOS Simulator or Android Emulator
   - You must test on a real iPhone or Android device

## Quick Start

### 1. Install Dependencies

```sh
npm install
```

### 2. Install iOS Pods (iOS only)

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

### 3. Run the App

**For iOS:**
```sh
npm run ios
```

**For Android:**
```sh
npm run android
```

## Testing the BLE Connection

1. **Power on ESP32** - Ensure it's running and advertising
2. **Open the app** on your physical device
3. **Tap "Scan for CarDisplay"** - Wait up to 5 seconds
4. **Tap the device** when it appears in the list
5. **Enter a message** in the text field
6. **Tap "Send JSON to ESP32"**
7. **Check the LED display** - Your message should scroll

## Troubleshooting

### App crashes when scanning
- **iOS:** Missing Bluetooth permission in `Info.plist`
  - Check `ios/CarDisplayApp/Info.plist` has `NSBluetoothAlwaysUsageDescription`
- **Android:** Missing Bluetooth permissions in manifest
  - Check `android/app/src/main/AndroidManifest.xml` has BLUETOOTH_SCAN and BLUETOOTH_CONNECT

### Device not found during scan
- Verify ESP32 is powered on and advertising
- Check Serial monitor shows "BLE device 'CarDisplay' is advertising"
- Ensure UUIDs match exactly between ESP32 and app
- Try restarting the ESP32
- Make sure Bluetooth is enabled on your phone

### Connection fails
- ESP32 may already be connected to another device
- Reset the ESP32 and try again
- Check ESP32 Serial monitor for connection logs

### Message not displaying
- Verify connection is established (check "Connected:" status)
- Check ESP32 Serial monitor for received payload
- Ensure JSON format is correct
- Try a shorter message first

### Android build issues
- Ensure `minSdkVersion` is at least 23 (set to 24 in `android/build.gradle`)
- Grant Bluetooth permissions when prompted
- For Android 12+, location permission may be required

## Project Structure

```
CarDisplayApp/
├── App.tsx                          # Main BLE app logic
├── ios/
│   └── CarDisplayApp/
│       └── Info.plist              # iOS Bluetooth permissions
├── android/
│   └── app/src/main/
│       └── AndroidManifest.xml     # Android Bluetooth permissions
└── package.json
```

## Next Steps

After basic functionality works:
- Add message presets ("Thanks", "Please let me in", etc.)
- Implement auto-reconnect on disconnect
- Add speech-to-text for voice messages
- Improve UI/UX with better connection status indicators
- Add message history

---

# React Native Default Documentation

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
