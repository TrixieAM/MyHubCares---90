// web/src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Login from "./components/Login.jsx";
import PatientRegistration from "./components/Register.jsx";
import Dashboard from "./components/Dashboard.jsx";
import MainLayout from "./components/Main.jsx";
import Appointments from "./components/Appointment.jsx";
import ClinicalVisits from "./components/ClinicalVisit.jsx";

const socket = io("http://localhost:5000"); // global socket

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#4caf50',
    },
  },
});

export default function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🧠 Connected to Socket.IO:", socket.id);
    });

    socket.on("newNotification", (data) => {
      console.log("📩 Real-time notification:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login socket={socket} />} />
          <Route path="/register" element={<PatientRegistration socket={socket} />} />
          <Route 
            path="/dashboard" 
            element={
              <MainLayout>
                <Dashboard socket={socket} />
              </MainLayout>
            } 
          />
          <Route 
            path="/appointments" 
            element={
              <MainLayout>
                <Appointments socket={socket} />
              </MainLayout>
            } 
          />
          <Route 
            path="/clinical-visit" 
            element={
              <MainLayout>
                <ClinicalVisits socket={socket} />
              </MainLayout>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}