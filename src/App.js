import React, { useState, useEffect } from "react";
import "./App.css";
import { database } from "./firebase";
import { push, ref, set } from "firebase/database";

function App() {
  const [moisture, setMoisture] = useState(0);
  const [relayState, setRelayState] = useState("OFF");

  useEffect(() => {
    fetchMoisture();
    const intervalFetchMoisture = setInterval(fetchMoisture, 1000);
    const intervalPosttoDB = setInterval(() => {
      postMoistureToFirebase(moisture);
    }, 10000);
    controlPump(moisture);
    return () => {
      clearInterval(intervalFetchMoisture);
      clearInterval(intervalPosttoDB);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moisture]);

  const controlPump = async (moisture) => {
    if (moisture < 20 && relayState === "OFF") {
      await toggleRelay();
    } else if (moisture > 30 && relayState === "ON") {
      await toggleRelay();
    }
  };

  const fetchMoisture = async () => {
    try {
      const response = await fetch("/moisture");
      const data = await response.json();
      setMoisture(data);
    } catch (error) {
      console.error("Error fetching moisture data:", error);
    }
  };

  const toggleRelay = async () => {
    try {
      const response = await fetch("/toggle");
      const data = await response.text();
      console.log("Toggled relay state:", data);
      setRelayState(data);
    } catch (error) {
      console.error("Error toggling relay:", error);
    }
  };

  const postMoistureToFirebase = (moisture) => {
    if (typeof moisture !== "number") {
      console.error("Invalid moisture value:", moisture);
      return;
    }

    const options = {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    const formatter = new Intl.DateTimeFormat([], options);
    const formattedDateParts = formatter.formatToParts(new Date());
    const timestamp = formattedDateParts
      .map(({ type, value }) => {
        switch (type) {
          case "day":
          case "month":
            return value.padStart(2, "0"); // Ensure day and month are always two digits
          case "year":
            return value;
          case "hour":
          case "minute":
          case "second":
            return value.padStart(2, "0"); // Ensure hour, minute, and second are always two digits
          case "literal":
            return value.replace(/[:\s]/g, "_"); // Replace any literal characters (e.g., ':') with '_'
          default:
            return value;
        }
      })
      .join("");

    const dataRef = ref(database, "data");
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
    <div className="App">
      <header className="App-header">
        <h1>Smart Watering System</h1>
        <div className="moisture-display">
          <p>Moisture Level: {moisture}%</p>
        </div>
        <button
          className={`toggle-button ${relayState.toLowerCase()}`}
          onClick={toggleRelay}
        >
          {relayState === "ON" ? "Turn Off Water Pump" : "Turn On Water Pump"}
        </button>
      </header>
    </div>
  );
}

export default App;
