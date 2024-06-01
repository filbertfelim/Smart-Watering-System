import React, { useState, useEffect } from "react";
import client, { publishMessage } from "./mqttService";
import { database } from "./firebase";
import { push, ref, set } from "firebase/database";

const MQTT_TOPIC_MOISTURE = "smart/watering/moisture";
const MQTT_TOPIC_CONTROL = "smart/watering";
const MQTT_TOPIC_RELAY = "smart/watering/relay";

const SmartWateringSystem = () => {
  const [moisture, setMoisture] = useState(null);
  const [relayState, setRelayState] = useState("OFF");
  const [postData, setPostData] = useState(false);

  useEffect(() => {
    const handleMoistureData = (message) => {
      setMoisture(message.toString());
    };

    const handleRelayData = (message) => {
      setRelayState(message.toString());
    };
    client.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC_MOISTURE) {
        handleMoistureData(message);
      } else if (topic === MQTT_TOPIC_RELAY) {
        handleRelayData(message);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      postMoistureToFirebase(moisture);
      setPostData(!postData);
    }, 2700000); // Send data every 45 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postData]);

  const handlePumpToggle = () => {
    publishMessage(MQTT_TOPIC_CONTROL, "TOGGLE");
  };

  const postMoistureToFirebase = (moisture) => {
    if (moisture === null) {
      return;
    }
    const timestamp = new Date().toString();

    const dataRef = ref(database, "moistureData");
    const newDataRef = push(dataRef);
    set(newDataRef, {
      datetime: timestamp,
      level: moisture,
    })
      .then(() => {
        console.log("Posted moisture data to Firebase:", {
          datetime: timestamp,
          level: moisture,
        });
      })
      .catch((error) => {
        console.error("Error posting to Firebase:", error);
      });
  };

  return (
    <div>
      <h1>Smart Watering System</h1>
      <p>Moisture Level: {moisture}%</p>
      <p>Relay State: {relayState}</p>
      <button onClick={handlePumpToggle}>Toggle Pump</button>
    </div>
  );
};

export default SmartWateringSystem;
