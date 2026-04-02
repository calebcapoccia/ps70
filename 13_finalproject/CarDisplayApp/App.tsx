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

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        console.log('Permissions:', granted);
      }
    };
    
    checkPermissions();
    
    return () => {
      bleManager.destroy();
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

  const connectToDevice = async (device: Device) => {
    try {
      await bleManager.stopDeviceScan();

      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(discovered);
      Alert.alert('Connected', `Connected to ${discovered.name ?? discovered.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection failed', 'Could not connect to device.');
    }
  };

  const disconnect = async () => {
    if (!connectedDevice) return;
    try {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    } catch (error) {
      console.error('Disconnect error:', error);
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
            <Button title="Disconnect" onPress={disconnect} color="#ff3b30" />
          </View>

          <View style={styles.messageSection}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Enter message to display"
              style={styles.input}
              autoCapitalize="sentences"
            />
            <Button title="Send to Display" onPress={sendMessage} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
