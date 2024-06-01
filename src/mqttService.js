import mqtt from "mqtt";

const MQTT_BROKER_URL =
  "wss://5b441a4530cd42d19fd8887048d1dd55.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_TOPIC_MOISTURE = "smart/watering/moisture";
const MQTT_TOPIC_RELAY = "smart/watering/relay";

const options = {
  username: "smart-watering-system",
  password: "Smart123",
  reconnectPeriod: 1000,
  protocol: "wss",
  rejectUnauthorized: false,
};

const client = mqtt.connect(MQTT_BROKER_URL, options);

client.on("connect", () => {
  console.log("Connected to MQTT Broker");
  client.subscribe(MQTT_TOPIC_MOISTURE, (err) => {
    if (err) {
      console.error(`Failed to subscribe: ${err.message}`);
    } else {
      console.log(`Subscribed to topic: ${MQTT_TOPIC_MOISTURE}`);
    }
  });
  client.subscribe(MQTT_TOPIC_RELAY, (err) => {
    if (err) {
      console.error(`Failed to subscribe: ${err.message}`);
    } else {
      console.log(`Subscribed to topic: ${MQTT_TOPIC_RELAY}`);
    }
  });
});

client.on("error", (err) => {
  console.error("Connection error: ", err);
});

client.on("reconnect", () => {
  console.log("Reconnecting...");
});

client.on("disconnect", (packet) => {
  console.log("Client disconnected", packet);
});

client.on("offline", () => {
  console.log("Client went offline");
});

client.on("close", () => {
  console.log("Connection closed");
});
export const publishMessage = (topic, message) => {
  client.publish(topic, message, (err) => {
    if (err) {
      console.error(`Failed to publish message: ${err.message}`);
    }
  });
};

export default client;
