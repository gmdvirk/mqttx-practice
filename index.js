const mqtt = require('mqtt');

// Connect to the MQTT broker (VerneMQ or any MQTT broker)
const brokerUrl = 'mqtt://localhost';  // Change to your broker's address if necessary
const clientId = 'mqttx-node-app-client';  // Unique client ID

// --- 1. Retained Messages ---
const retainedTopic = 'test/retained';
const retainedMessage = 'This is a retained message.';

// Connect to the broker
const client = mqtt.connect(brokerUrl, {
  clientId: clientId,
  clean: true, // Clean session
  connectTimeout: 4000, // Timeout for connection
  reconnectPeriod: 1000, // Reconnect period
});

client.on('connect', () => {
  console.log('Connected to the broker at mqtt://localhost');

  // Publish a retained message
  client.publish(retainedTopic, retainedMessage, { retain: true }, () => {
    console.log('Retained message published to test/retained');
  });

  // --- 2. Subscribe to a Topic ---
  const topic = 'home/temperature';
  client.subscribe(topic, () => {
    console.log(`Subscribed to topic: ${topic}`);

    // Listen for messages
    client.on('message', (topic, message) => {
      console.log(`Received message from ${topic}: ${message.toString()}`);
    });
  });

  // --- 3. Wildcards (Single-level and Multi-level) ---
  // Single-level wildcard subscription
  client.subscribe('home/+/temperature', () => {
    console.log('Subscribed to home/+/temperature');

    // Listen for messages on wildcard topic
    client.on('message', (topic, message) => {
      console.log(`Received message from ${topic} (wildcard): ${message.toString()}`);
    });
  });

  // Multi-level wildcard subscription
  client.subscribe('home/#', () => {
    console.log('Subscribed to home/#');

    // Listen for messages on wildcard topic
    client.on('message', (topic, message) => {
      console.log(`Received message from ${topic} (multi-level wildcard): ${message.toString()}`);
    });
  });

  // --- 4. QoS Levels ---
  // Publish with QoS 0
  client.publish('test/qos0', 'QoS 0 message', { qos: 0 }, () => {
    console.log('QoS 0 message published');
  });

  // Publish with QoS 1
  client.publish('test/qos1', 'QoS 1 message', { qos: 1 }, () => {
    console.log('QoS 1 message published');
  });

  // Publish with QoS 2
  client.publish('test/qos2', 'QoS 2 message', { qos: 2 }, () => {
    console.log('QoS 2 message published');
  });

  // --- 5. Clean Session and Persistent Session ---
  // Test Clean Session (disconnect and see message loss)
  const cleanClient = mqtt.connect(brokerUrl, { clientId: 'mqtt-clean-session', clean: true });
  cleanClient.on('connect', () => {
    console.log('Connected with clean session');
    cleanClient.subscribe('test/clean-session', () => {
      console.log('Subscribed to test/clean-session');
    });
  });

  // Test Persistent Session (messages will persist across reconnects)
  const persistentClient = mqtt.connect(brokerUrl, { clientId: 'mqtt-persistent-session', clean: false });
  persistentClient.on('connect', () => {
    console.log('Connected with persistent session');
    persistentClient.subscribe('test/persistent-session', () => {
      console.log('Subscribed to test/persistent-session');
    });
  });

  // --- 6. Last Will and Testament (LWT) ---
  const options = {
    will: {
      topic: 'test/lwt',
      payload: 'Client disconnected unexpectedly',
      qos: 1,
      retain: true,
    },
  };

  const lwtClient = mqtt.connect(brokerUrl, options);

  lwtClient.on('connect', () => {
    console.log('Connected to broker with LWT');

    // Subscribe to LWT topic
    lwtClient.subscribe('test/lwt', () => {
      console.log('Subscribed to test/lwt');
    });

    // Simulate client disconnecting unexpectedly
    setTimeout(() => {
      lwtClient.end();
    }, 5000);
  });

  // --- 7. Clean Up: Close the client connection after testing ---
  setTimeout(() => {
    client.end(); // Close the connection
    cleanClient.end(); // Close the clean session connection
    persistentClient.end(); // Close the persistent session connection
    lwtClient.end(); // Close the LWT connection
  }, 10000); // Allow 10 seconds for testing before closing
});

client.on('error', (err) => {
  console.log('Connection error:', err);
  client.end();
});

process.on('SIGINT', () => {
  console.log('Closing connection...');
  client.end();
});
