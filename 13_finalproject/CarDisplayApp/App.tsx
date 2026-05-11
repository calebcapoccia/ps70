import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Voice from '@react-native-voice/voice';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';

const SERVICE_UUID = '6da6814e-13a5-4144-96a0-6db8d3b343c9';
const CHARACTERISTIC_UUID = '82b3bdc2-ccf2-4063-b820-9a66322f8234';
const BATTERY_CHARACTERISTIC_UUID = 'b2c3d4e5-1234-5678-9abc-def012345678';

function toBase64(input: string): string {
  // @ts-ignore - btoa is available in React Native
  return btoa(unescape(encodeURIComponent(input)));
}

function fromBase64(input: string): string {
  // @ts-ignore - atob is available in React Native
  return decodeURIComponent(escape(atob(input)));
}

type Battery = { voltage: number; percent: number };

export default function App() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [battery, setBattery] = useState<Battery | null>(null);
  const speechTimeoutRef = React.useRef<number | null>(null);
  const isManualDisconnectRef = React.useRef(false);
  const hasShownDisconnectAlertRef = React.useRef(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const textInputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        console.log('Permissions:', granted);
      }
    };
    
    checkPermissions();

    // Set up Voice event handlers
    Voice.onSpeechStart = () => {
      console.log('Speech started');
      setIsListening(true);
    };

    Voice.onSpeechEnd = async () => {
      console.log('Speech ended');
      // Don't stop immediately - let the timeout handle it
    };

    Voice.onSpeechResults = (event) => {
      console.log('Speech results:', event.value);
      if (event.value && event.value.length > 0) {
        setMessage(event.value[0]);
      }
      // Set timeout to stop listening after receiving results
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      speechTimeoutRef.current = setTimeout(async () => {
        try {
          await Voice.stop();
          setIsListening(false);
        } catch (error) {
          console.error('Error stopping voice:', error);
        }
      }, 1500); // Stop 1.5 seconds after last result
    };

    Voice.onSpeechPartialResults = (event) => {
      console.log('Partial results:', event.value);
      // Update message with partial results for live feedback
      if (event.value && event.value.length > 0) {
        setMessage(event.value[0]);
      }
      // Reset timeout on each partial result (user is still talking)
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      speechTimeoutRef.current = setTimeout(async () => {
        try {
          await Voice.stop();
          setIsListening(false);
        } catch (error) {
          console.error('Error stopping voice:', error);
        }
      }, 2000); // Stop 2 seconds after last partial result
    };

    Voice.onSpeechError = (event) => {
      setIsListening(false);
      // Don't show alerts for common non-critical errors:
      // 1101 = timeout/end signal
      // 1110 = no speech detected
      // recognition_fail with "No speech detected" message
      const errorCode = event.error?.code;
      const errorMessage = event.error?.message || '';
      const isNoSpeechError = errorCode === '1101' || 
                              errorCode === '1110' || 
                              errorCode === 'recognition_fail' ||
                              errorMessage.includes('No speech detected');
      
      if (isNoSpeechError) {
        // Log as info, not error - this is expected behavior
        console.log('Speech recognition ended:', errorMessage);
      } else {
        // Only log actual errors
        console.error('Speech error:', event.error);
        Alert.alert('Speech Recognition Error', errorMessage || 'Could not recognize speech');
      }
    };
    
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      bleManager.destroy();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [bleManager]);

  const startScan = async () => {
    setDevices([]);
    setIsScanning(true);

    // Check Bluetooth state
    const state = await bleManager.state();
    console.log('Bluetooth state:', state);
    
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for devices.');
      setIsScanning(false);
      return;
    }

    await bleManager.startDeviceScan(
      null, // Scan all devices
      null,
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          Alert.alert('Scan Error', error.message);
          setIsScanning(false);
          return;
        }

        if (!device) return;

        // Filter by service UUID if available in advertisement
        const services = device.serviceUUIDs || [];
        if (services.length > 0 && !services.includes(SERVICE_UUID)) {
          return; // Skip devices that advertise services but not ours
        }

        // Also filter by name as a fallback
        if (!device.name?.includes('CarDisplay')) {
          return;
        }

        console.log('Found Kachow device:', device.name, device.id, 'RSSI:', device.rssi, 'Services:', services);

        setDevices(prev => {
          const alreadySeen = prev.some(d => d.id === device.id);
          if (alreadySeen) return prev;
          return [...prev, device];
        });
      }
    );

    setTimeout(async () => {
      try {
        await bleManager.stopDeviceScan();
      } catch {}
      setIsScanning(false);
    }, 10000);
  };

  const handleDisconnect = async (isManual: boolean = false) => {
    
    try {
      if (isManual && connectedDevice) {
        isManualDisconnectRef.current = true;
        hasShownDisconnectAlertRef.current = false;
        await bleManager.cancelDeviceConnection(connectedDevice.id);
      }
      
      // Only show alert if: not manual, manual flag not set, and haven't already shown alert
      const shouldShowAlert = !isManual && !isManualDisconnectRef.current && !hasShownDisconnectAlertRef.current;
            
      setConnectedDevice(null);
      setBattery(null);
      
      if (shouldShowAlert) {
        hasShownDisconnectAlertRef.current = true;
        Alert.alert('Disconnected', 'Connection to device was lost.');
      }
      
      // Reset flags after a short delay
      setTimeout(() => {
        isManualDisconnectRef.current = false;
        hasShownDisconnectAlertRef.current = false;
      }, 1000);
    } catch (error) {
      console.error('Disconnect error:', error);
      setConnectedDevice(null);
      setBattery(null);
      isManualDisconnectRef.current = false;
      hasShownDisconnectAlertRef.current = false;
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      await bleManager.stopDeviceScan();

      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();

      // Monitor for disconnection
      bleManager.onDeviceDisconnected(discovered.id, (error, disconnectedDevice) => {
        console.log('Device disconnected:', disconnectedDevice?.name || disconnectedDevice?.id);
        if (error) {
          console.error('Disconnection error:', error);
        }
        handleDisconnect(false); // false = unexpected disconnect
      });

      setConnectedDevice(discovered);
      Alert.alert('Connected', `Connected to ${discovered.name ?? discovered.id}`);

      // Initial battery read
      try {
        const initial = await discovered.readCharacteristicForService(
          SERVICE_UUID,
          BATTERY_CHARACTERISTIC_UUID,
        );
        if (initial.value) {
          const parsed = JSON.parse(fromBase64(initial.value));
          setBattery({ voltage: Number(parsed.v), percent: Number(parsed.p) });
        }
      } catch (e) {
        console.log('Battery initial read failed:', e);
      }

      // Subscribe to battery notifications
      discovered.monitorCharacteristicForService(
        SERVICE_UUID,
        BATTERY_CHARACTERISTIC_UUID,
        (err, char) => {
          if (err) {
            console.log('Battery monitor error:', err.message);
            return;
          }
          if (!char?.value) return;
          try {
            const parsed = JSON.parse(fromBase64(char.value));
            setBattery({ voltage: Number(parsed.v), percent: Number(parsed.p) });
          } catch (e) {
            console.log('Battery parse error:', e);
          }
        },
      );
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection failed', 'Could not connect to device.');
    }
  };

  const startVoiceRecognition = async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
    } catch (error) {
      console.error('Voice start error:', error);
      Alert.alert('Error', 'Could not start voice recognition');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };

  const sendMessage = async () => {
    if (!connectedDevice) {
      Alert.alert('Not connected', 'Connect to the ESP32 first.');
      return;
    }

    const payload = JSON.stringify({
      text: message,
      repeat: 1,
      pause: 0,
      speed: 25,
    });

    try {
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        toBase64(payload)
      );
      Alert.alert('Sent', message);
    } catch (error) {
      console.error('Write error:', error);
      Alert.alert('Send failed', 'Could not write to characteristic.');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-blue-600 px-6 py-8 shadow-lg`}>
        <View style={tw`flex-row items-center justify-center mb-2`}>
          <Icon name="car-sport" size={32} color="white" style={tw`mr-2`} />
          <Text style={tw`text-3xl font-bold text-white`}>Kachow</Text>
        </View>
        <Text style={tw`text-sm text-blue-100 text-center`}>Bluetooth Control</Text>
      </View>

      {!connectedDevice && (
        <View style={tw`flex-1 px-4 pt-6`}>
          <TouchableOpacity
            style={tw`rounded-xl py-4 px-6 shadow-md mb-6 ${isScanning ? 'bg-gray-400' : 'bg-blue-600'}`}
            onPress={startScan}
            disabled={isScanning}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <Icon name={isScanning ? 'search' : 'bluetooth'} size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-lg font-semibold`}>
                {isScanning ? 'Scanning...' : 'Scan for display'}
              </Text>
            </View>
          </TouchableOpacity>

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const rssi = item.rssi || 0;
              const signalStrength = rssi > -60 ? 'Strong' : rssi > -80 ? 'Medium' : 'Weak';
              const signalIconName = rssi > -60 ? 'wifi' : rssi > -80 ? 'wifi-outline' : 'cellular-outline';
              const signalColor = rssi > -60 ? 'text-green-600' : rssi > -80 ? 'text-yellow-600' : 'text-red-600';
              
              return (
                <TouchableOpacity
                  style={tw`bg-white rounded-xl p-5 mb-3 shadow-sm border border-gray-100`}
                  onPress={() => connectToDevice(item)}
                >
                  <Text style={tw`text-lg font-semibold text-gray-900 mb-1`}>
                    {item.name || 'Unnamed device'}
                  </Text>
                  <Text style={tw`text-xs text-gray-500 mb-2`}>{item.id}</Text>
                  <View style={tw`flex-row items-center`}>
                    <Icon name={signalIconName} size={16} color={signalColor === 'text-green-600' ? '#16a34a' : signalColor === 'text-yellow-600' ? '#ca8a04' : '#dc2626'} style={tw`mr-1`} />
                    <Text style={tw`text-sm font-medium ${signalColor}`}>
                      {rssi} dBm ({signalStrength})
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={tw`items-center justify-center py-16 px-6`}>
                <Icon name={isScanning ? 'search' : 'phone-portrait-outline'} size={48} color="#9ca3af" style={tw`mb-4`} />
                <Text style={tw`text-gray-400 text-center text-base`}>
                  {isScanning ? 'Searching for Kachow devices...' : 'No devices found\n\nTap scan to search for Kachow'}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {connectedDevice && (
        <KeyboardAvoidingView 
          style={tw`flex-1`}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={tw`flex-1 px-4 pt-6`}
            contentContainerStyle={tw`pb-16`}
            keyboardShouldPersistTaps="handled"
          >
          <View style={tw`bg-green-50 rounded-2xl p-6 mb-6 border-2 border-green-200 shadow-sm`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Icon name="checkmark-circle" size={20} color="#15803d" style={tw`mr-1`} />
                <Text style={tw`text-sm font-medium text-green-700`}>Connected to</Text>
              </View>
              <Text style={tw`text-2xl font-bold text-green-900`}>
                {connectedDevice.name || connectedDevice.id}
              </Text>
              {battery && (
                <View style={tw`flex-row items-center mt-3`}>
                  <Icon
                    name={battery.percent >= 80 ? 'battery-full' : battery.percent >= 20 ? 'battery-half' : 'battery-dead'}
                    size={20}
                    color={battery.percent >= 80 ? '#16a34a' : battery.percent >= 20 ? '#ca8a04' : '#dc2626'}
                    style={tw`mr-2`}
                  />
                  <Text
                    style={tw`text-sm font-semibold ${battery.percent >= 80 ? 'text-green-700' : battery.percent >= 20 ? 'text-yellow-700' : 'text-red-700'}`}
                  >
                    {battery.percent}% ({battery.voltage.toFixed(2)}V)
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={tw`bg-red-500 rounded-xl py-3 px-6 shadow-md`}
              onPress={() => handleDisconnect(true)}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Icon name="close-circle-outline" size={20} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white font-semibold`}>Disconnect</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={tw`bg-white rounded-2xl p-6 shadow-lg border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <Icon name="chatbubble-ellipses-outline" size={24} color="#111827" style={tw`mr-2`} />
              <Text style={tw`text-lg font-semibold text-gray-900`}>Message</Text>
            </View>
            {isListening && (
              <View style={tw`bg-red-50 rounded-lg p-3 mb-3 border border-red-200`}>
                <View style={tw`flex-row items-center justify-center`}>
                  <Icon name="mic" size={20} color="#dc2626" style={tw`mr-2`} />
                  <Text style={tw`text-red-600 font-medium`}>Listening...</Text>
                </View>
              </View>
            )}
            <View style={tw`flex-row items-end mb-4`}>
              <TextInput
                ref={textInputRef}
                value={message}
                onChangeText={setMessage}
                placeholder="Enter message to display"
                multiline
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
                style={[
                  tw`flex-1 border border-gray-300 rounded-xl px-4 bg-gray-50 text-base text-gray-900 mr-2`,
                  { paddingTop: 12, paddingBottom: 12, maxHeight: 120 }
                ]}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="sentences"
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={tw`w-12 h-12 rounded-full items-center justify-center shadow-md ${isListening ? 'bg-red-500' : 'bg-blue-600'}`}
                onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
              >
                <Icon name={isListening ? 'stop' : 'mic'} size={24} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={tw`bg-blue-600 rounded-xl py-4 px-6 shadow-md`}
              onPress={sendMessage}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Icon name="send" size={20} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white text-lg font-semibold`}>Send to Display</Text>
              </View>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
