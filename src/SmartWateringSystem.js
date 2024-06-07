import React, { useState, useEffect } from "react";
import client from "./mqttService";
import { database } from "./firebase";
import { ref, onValue } from "firebase/database";
import Typography from "@mui/joy/Typography";
import CircularProgress from "@mui/joy/CircularProgress";
import { Box } from "@mui/system";
import { LineChart } from "@mui/x-charts/LineChart";

const MQTT_TOPIC_MOISTURE = "smart/watering/moisture";
const MQTT_TOPIC_RELAY = "smart/watering/relay";

const SmartWateringSystem = () => {
  const [moisture, setMoisture] = useState(20);
  const [relayState, setRelayState] = useState("OFF");
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [highest, setHighest] = useState({ level: 0, datetime: "" });
  const [lowest, setLowest] = useState({ level: 0, datetime: "" });
  const [dateRange, setDateRange] = useState("");

  useEffect(() => {
    const handleMoistureData = (message) => {
      setMoisture(Number(message.toString()));
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

    return () => {
      client.removeListener("message", handleMoistureData);
      client.removeListener("message", handleRelayData);
    };
  }, []);

  const getMoistureData = () => {
    const moistureDataRef = ref(database, "moistureData");
    onValue(
      moistureDataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          const formattedData = Object.keys(snapshotData).map((key) => ({
            datetime: snapshotData[key].datetime,
            level: snapshotData[key].level,
          }));
          setData(formattedData);
        } else {
          console.log("No data available");
        }
      },
      (error) => {
        console.error("Error listening to Firebase:", error);
      }
    );
  };

  const calculateDailyAverages = (data) => {
    const groupedByDate = data.reduce((acc, item) => {
      const date = new Date(item.datetime).toISOString().split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(item.level);
      return acc;
    }, {});

    const dailyAverages = Object.keys(groupedByDate).map((date) => ({
      date,
      average:
        groupedByDate[date].reduce((sum, val) => sum + val, 0) /
        groupedByDate[date].length,
    }));

    dailyAverages.sort((a, b) => new Date(a.date) - new Date(b.date));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return dailyAverages.filter(
      (entry) =>
        new Date(entry.date) > oneWeekAgo && new Date(entry.date) <= yesterday
    );
  };

  useEffect(() => {
    getMoistureData();
  }, []);

  useEffect(() => {
    if (data) {
      const dailyAverages = calculateDailyAverages(data);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const oneWeekData = data.filter(
        (entry) =>
          new Date(entry.datetime) > oneWeekAgo &&
          new Date(entry.datetime) <= yesterday
      );
      var formattedDailyAverages = [];
      formattedDailyAverages = dailyAverages.map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-US", {
          timeZone: "Asia/Jakarta",
          month: "short",
          day: "numeric",
        }),
      }));
      const { highest, lowest } = findHighestAndLowest(oneWeekData);
      setLabels(formattedDailyAverages.map((d) => d.date));
      setChartData(formattedDailyAverages.map((d) => d.average));
      var earliestDate = "";
      var latestDate = "";
      if (formattedDailyAverages.length > 0) {
        earliestDate = formattedDailyAverages[0].date;
        latestDate = formattedDailyAverages[6].date;
      }
      setHighest(highest);
      setLowest(lowest);
      setDateRange(`${earliestDate} - ${latestDate}`);
    }
  }, [data]);

  const findHighestAndLowest = (data) => {
    let highest = { level: -Infinity, datetime: null };
    let lowest = { level: Infinity, datetime: null };

    data.forEach((item) => {
      if (item.level > highest.level) {
        highest = { level: item.level, datetime: item.datetime };
      }
      if (item.level < lowest.level) {
        lowest = { level: item.level, datetime: item.datetime };
      }
    });

    return { highest, lowest };
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: "20px",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "50px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="logo.png"
            alt="WaterWise Logo"
            style={{ width: "28px", paddingRight: "10px" }}
          />
          <Typography style={{ fontSize: "15px", fontWeight: "500" }}>
            WaterWise
          </Typography>
        </div>
        <div style={{ textAlign: "center" }}>
          <Typography
            style={{
              fontSize: "18px",
              fontWeight: "400",
              letterSpacing: "0.05em",
              marginBottom: "6px",
              marginTop: "10px",
            }}
          >
            Smart Watering System
          </Typography>
          <Typography
            style={{
              fontSize: "30px",
              fontWeight: "700",
              marginBottom: "-6px",
            }}
          >
            Check and Monitor your Plants'
          </Typography>
          <Typography
            style={{
              fontSize: "30px",
              fontWeight: "700",
              color: "#00B5AD",
            }}
          >
            Moisture Level Here
          </Typography>
        </div>
      </header>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: "35px",
          marginBottom: "20px",
        }}
      >
        <Box
          sx={{
            background: "#ffffff",
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
            width: "100%",
            maxWidth: { xs: "320px", sm: "500px" },
            height: "410px",
            textAlign: "center",
          }}
        >
          <Typography
            style={{
              fontSize: "22px",
              fontWeight: "700",
              marginBottom: "32px",
            }}
          >
            <span style={{ color: "#00B5AD" }}>Current </span>Moisture Level
          </Typography>
          <CircularProgress
            size="lg"
            sx={{
              "--CircularProgress-size": "190px",
              "--CircularProgress-trackThickness": "20px",
              "--CircularProgress-progressThickness": "20px",
              "--CircularProgress-progressColor":
                moisture < 20 ? "red" : moisture <= 30 ? "orange" : "#22B428",
              marginBottom: "15px",
            }}
            determinate
            value={moisture}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography
                style={{
                  fontSize: "34px",
                  fontWeight: "700",
                  color:
                    moisture < 20
                      ? "red"
                      : moisture <= 30
                      ? "orange"
                      : "#22B428",
                }}
              >
                {moisture}%
              </Typography>
              <Typography style={{ fontSize: "14px", color: "grey" }}>
                moisturized
              </Typography>
            </div>
          </CircularProgress>
          <Typography
            style={{ fontSize: "20px", marginTop: "10px", color: "black" }}
          >
            Water Pump Status :{" "}
            <span style={{ fontWeight: "700" }}>{relayState}</span>
          </Typography>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginTop: "30px",
            }}
          >
            <Typography
              style={{
                color: "#828282",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Low
            </Typography>
            <Typography
              style={{
                color: "#828282",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Medium
            </Typography>
            <Typography
              style={{
                color: "#828282",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              High
            </Typography>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginTop: "4px",
              marginBottom: "4px",
            }}
          >
            <Typography
              style={{ color: "red", fontSize: "20px", fontWeight: "700" }}
            >
              &lt; 20%
            </Typography>
            <Typography
              style={{ color: "orange", fontSize: "20px", fontWeight: "700" }}
            >
              20 - 30%
            </Typography>
            <Typography
              style={{
                color: "#22B428",
                fontSize: "20px",
                fontWeight: "700",
              }}
            >
              &gt; 30%
            </Typography>
          </div>
        </Box>

        <Box
          sx={{
            background: "#ffffff",
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
            width: "100%",
            maxWidth: { xs: "320px", sm: "500px" },
            height: { xs: "465px", sm: "410px" },
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginLeft: "10px",
              marginRight: "10px",
              marginBottom: "12px",
            }}
          >
            <Typography style={{ fontSize: "22px", fontWeight: "700" }}>
              <span style={{ color: "#00B5AD" }}>Weekly </span>History
            </Typography>
            <Typography
              style={{
                fontSize: "16px",
                fontWeight: "400",
                color: "#828282",
              }}
            >
              {dateRange}
            </Typography>
          </div>
          <LineChart
            xAxis={[{ scaleType: "point", data: labels, label: "Date" }]}
            series={[{ data: chartData, label: "Average Moisture Level" }]}
            height={300}
          />
          <div style={{ marginLeft: "20px", marginTop: "10px" }}>
            <Typography style={{ fontSize: "18px" }}>
              <span style={{ color: "#828282", fontWeight: "500" }}>
                Highest Level :
              </span>
              <span style={{ color: "#00B5AD", fontWeight: "700" }}>
                {" "}
                {highest.level}%{" "}
              </span>
              <span style={{ fontWeight: "600" }}>
                on{" "}
                {new Date(highest.datetime).toLocaleString("en-US", {
                  timeZone: "Asia/Jakarta",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </Typography>
            <Typography style={{ fontSize: "18px" }}>
              <span style={{ color: "#828282", fontWeight: "500" }}>
                Lowest Level :
              </span>
              <span style={{ color: "#00B5AD", fontWeight: "700" }}>
                {" "}
                {lowest.level}%{" "}
              </span>
              <span style={{ fontWeight: "600" }}>
                on{" "}
                {new Date(lowest.datetime).toLocaleString("en-US", {
                  timeZone: "Asia/Jakarta",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </Typography>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default SmartWateringSystem;
