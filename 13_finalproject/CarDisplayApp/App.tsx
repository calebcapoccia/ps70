import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Voice from '@react-native-voice/voice';
import { styles } from './styles';

const SERVICE_UUID = '6da6814e-13a5-4144-96a0-6db8d3b343c9';
const CHARACTERISTIC_UUID = '82b3bdc2-ccf2-4063-b820-9a66322f8234';

function toBase64(input: string): string {
  // @ts-ignore - btoa is available in React Native
  return btoa(unescape(encodeURIComponent(input)));
}

export default function App() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState('Hi there');
  const [isListening, setIsListening] = useState(false);
  const speechTimeoutRef = React.useRef<number | null>(null);

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
      console.error('Speech error:', event.error);
      setIsListening(false);
      // Only show alert for non-1101 errors (1101 is just a timeout/end signal)
      if (event.error?.code !== '1101') {
        Alert.alert('Speech Recognition Error', event.error?.message || 'Could not recognize speech');
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
      null, // Scan for all devices to debug
      null,
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          Alert.alert('Scan Error', error.message);
          setIsScanning(false);
          return;
        }

        if (!device) return;

        console.log('Found device:', device.name, device.id);

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
    }, 10000); // Increased to 10 seconds
  };

  const handleDisconnect = async (isManual: boolean = false) => {
    if (!connectedDevice) return;
    
    try {
      if (isManual) {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
      }
      setConnectedDevice(null);
      
      // Show alert only for unexpected disconnects
      if (!isManual) {
        Alert.alert('Disconnected', 'Connection to device was lost.');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      // If already disconnected, just clear state
      if (error instanceof Error && error.message.includes('disconnected')) {
        setConnectedDevice(null);
      }
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
      Alert.alert('Sent', payload);
    } catch (error) {
      console.error('Write error:', error);
      Alert.alert('Send failed', 'Could not write to characteristic.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Car Display BLE</Text>

      {!connectedDevice && (
        <>
          <View style={styles.section}>
            <Button
              title={isScanning ? 'Scanning...' : 'Scan for CarDisplay'}
              onPress={startScan}
              disabled={isScanning}
            />
          </View>

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.deviceRow} onPress={() => connectToDevice(item)}>
                <Text style={styles.deviceName}>{item.name || 'Unnamed device'}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isScanning ? 'Searching for devices...' : 'No devices found. Tap scan to search.'}
              </Text>
            }
          />
        </>
      )}

      {connectedDevice && (
        <>
          <View style={styles.connectedSection}>
            <Text style={styles.connectedLabel}>✓ Connected to</Text>
            <Text style={styles.connectedDevice}>{connectedDevice.name || connectedDevice.id}</Text>
            <Button title="Disconnect" onPress={() => handleDisconnect(true)} color="#ff3b30" />
          </View>

          <View style={styles.messageSection}>
            <Text style={styles.label}>Message</Text>
            {isListening && (
              <Text style={styles.listeningText}>🎤 Listening...</Text>
            )}
            <View style={styles.inputRow}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Enter message to display"
                style={styles.inputWithMic}
                autoCapitalize="sentences"
              />
              <TouchableOpacity
                style={[styles.micButton, isListening && styles.micButtonActive]}
                onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
              >
                <Text style={{ fontSize: 24 }}>{isListening ? '⏹' : '🎤'}</Text>
              </TouchableOpacity>
            </View>
            <Button title="Send to Display" onPress={sendMessage} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
