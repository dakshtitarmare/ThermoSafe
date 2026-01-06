// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Activity,
//   Thermometer,
//   Cloud,
//   Droplets,
//   TrendingUp,
//   TrendingDown,
//   Minus,
//   AlertTriangle,
//   CheckCircle,
//   AlertCircle
// } from 'lucide-react';
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   ReferenceLine
// } from 'recharts';
// import { initializeApp } from '../config/firebase';
// import { getDatabase, ref, onValue, off } from 'firebase/database';

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   databaseURL: "https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app/",
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const database = getDatabase(app);

// const ThermoSafeDashboard = () => {
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [sensorData, setSensorData] = useState({
//     internalTemp: 0,
//     externalTemp: 0,
//     humidity: 0,
//     status: 'LOADING',
//     internalTrend: 'steady',
//     externalTrend: 'steady',
//     humidityTrend: 'steady'
//   });
//   const [aiPrediction, setAiPrediction] = useState({
//     riskLevel: 'Low',
//     timeToBreach: null,
//     recommendation: 'No action required. Container temperature stable.'
//   });
//   const [alerts, setAlerts] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(null);
//   const [chartData, setChartData] = useState([]);

//   // Helper: determine status based on internal temp
//   const getTempStatus = (temp) => {
//     if (temp < 2 || temp > 8) return 'CRITICAL';
//     if (temp < 3 || temp > 7) return 'WARNING';
//     return 'SAFE';
//   };

//   // Function to process incoming data
//   const processSensorData = useCallback((data) => {
//     if (!data) return;

//     console.log('Firebase data received:', data); // Debug log

//     const temperature = data.temperature || data.internalTemp || 0;
//     const humidity = data.humidity || 0;

//     const newDataPoint = {
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       internal: temperature,
//       external: 28.4 // Default external temp or you can add external sensor later
//     };

//     // Update chart data (keep last 20 points)
//     setChartData(prev => {
//       const newChartData = [...prev, newDataPoint];
//       return newChartData.length > 20 ? newChartData.slice(-20) : newChartData;
//     });

//     // Update sensor data
//     setSensorData(prev => {
//       const status = temperature !== undefined ? getTempStatus(temperature) : prev.status;

//       // Determine trend based on previous temperature
//       let internalTrend = 'steady';
//       if (prev.internalTemp !== undefined && temperature !== undefined) {
//         if (temperature > prev.internalTemp + 0.1) internalTrend = 'up';
//         else if (temperature < prev.internalTemp - 0.1) internalTrend = 'down';
//       }

//       return {
//         internalTemp: temperature,
//         externalTemp: 28.4, // Default or add external sensor data later
//         humidity: humidity,
//         status,
//         internalTrend,
//         externalTrend: prev.externalTrend,
//         humidityTrend: prev.humidityTrend
//       };
//     });

//     // Update AI predictions
//     if (temperature !== undefined) {
//       let riskLevel = 'Low';
//       let timeToBreach = null;
//       let recommendation = 'No action required. Container temperature stable.';

//       if (temperature < 2 || temperature > 8) {
//         riskLevel = 'High';
//         recommendation = 'Immediate action required! Temperature out of safe range.';
//       } else if (temperature < 3 || temperature > 7) {
//         riskLevel = 'Medium';
//         timeToBreach = '~2 hours';
//         recommendation = 'Monitor closely. Temperature approaching limits.';
//       }

//       setAiPrediction({ riskLevel, timeToBreach, recommendation });
//     }

//     setLastUpdate(new Date());
//   }, []);

//   // Setup Firebase real-time listener
//   useEffect(() => {
//     // Updated to read from root level 'sensor' node
//     const sensorRef = ref(database, 'sensor');

//     const callback = (snapshot) => {
//       const data = snapshot.val();
//       if (data) {
//         console.log('Raw sensor data:', data); // Debug log
//         processSensorData(data);
//         setIsConnected(true);

//         const temperature = data.temperature || 0;
        
//         // Check for alerts
//         if (temperature < 2 || temperature > 8) {
//           const newAlert = {
//             id: Date.now(),
//             message: `Temperature critical: ${temperature.toFixed(1)}°C`,
//             type: 'CRITICAL',
//             timestamp: new Date().toISOString()
//           };
//           setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
//         }
//       }
//     };

//     const errorCallback = (error) => {
//       console.error('Firebase connection error:', error);
//       setIsConnected(false);
//       setSensorData(prev => ({ ...prev, status: 'ERROR' }));
//     };

//     onValue(sensorRef, callback, errorCallback);

//     return () => off(sensorRef, 'value', callback); // Proper cleanup
//   }, [processSensorData]);

//   // Simulate data updates for offline/demo mode
//   useEffect(() => {
//     if (!isConnected) {
//       const interval = setInterval(() => {
//         const simulatedData = {
//           temperature: 5.2 + (Math.random() - 0.5) * 0.5,
//           humidity: 45 + (Math.random() - 0.5) * 10,
//         };
//         processSensorData(simulatedData);
//       }, 5000);

//       return () => clearInterval(interval);
//     }
//   }, [isConnected, processSensorData]);

//   // Update current time
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // === Helper functions for UI ===
//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'SAFE': return '#2ECC71';
//       case 'WARNING': return '#F1C40F';
//       case 'CRITICAL': return '#E74C3C';
//       case 'LOADING': return '#95A5A6';
//       case 'ERROR': return '#E74C3C';
//       default: return '#2ECC71';
//     }
//   };

//   const getStatusDescription = (status) => {
//     switch (status) {
//       case 'SAFE': return 'Container stable';
//       case 'WARNING': return 'Rising trend detected';
//       case 'CRITICAL': return 'Action needed';
//       case 'LOADING': return 'Connecting to sensors...';
//       case 'ERROR': return 'Connection error';
//       default: return 'Container stable';
//     }
//   };

//   const getTrendIcon = (trend) => {
//     switch (trend) {
//       case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
//       case 'down': return <TrendingDown className="w-4 h-4 text-blue-500" />;
//       default: return <Minus className="w-4 h-4 text-gray-500" />;
//     }
//   };

//   const getRiskColor = (risk) => {
//     switch (risk) {
//       case 'Low': return 'bg-green-100 text-green-800 border-green-300';
//       case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
//       case 'High': return 'bg-red-100 text-red-800 border-red-300';
//       default: return 'bg-green-100 text-green-800 border-green-300';
//     }
//   };

//   const getHumidityColor = (humidity) => {
//     if (humidity >= 30 && humidity <= 60) return '#2ECC71';
//     if (humidity > 60 && humidity <= 70) return '#F1C40F';
//     return '#E74C3C';
//   };

//   // === Render ===
//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="sticky top-0 bg-white shadow-sm z-10 px-6 py-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">ThermoSafe Logistics</h1>
//             <p className="text-sm text-gray-600">Container ID: TS-2024-00142</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <div 
//                 className={`w-3 h-3 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
//                 style={{ backgroundColor: isConnected ? getStatusColor(sensorData.status) : '#E74C3C' }}
//               />
//               <span className="text-sm font-medium text-gray-700">
//                 {isConnected ? 'Live' : 'Offline'}
//               </span>
//             </div>
//             <div className="text-right">
//               <p className="text-xs text-gray-500">Last Update</p>
//               <p className="text-sm font-medium text-gray-700">
//                 {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
//               </p>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Alert Banner */}
//       {alerts.length > 0 && (
//         <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
//           <div className="flex items-center">
//             <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
//             <div>
//               <p className="font-semibold text-red-800">Active Alert</p>
//               <p className="text-sm text-red-700">{alerts[0].message}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-6 py-8">
//         {/* Primary Status Panel */}
//         <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
//           <div className="mb-4">
//             <div className="text-6xl font-bold text-gray-900 mb-2">
//               {sensorData.internalTemp ? sensorData.internalTemp.toFixed(1) : '--'}°C
//             </div>
//             <div className="text-sm text-gray-600 mb-4">Current Internal Temperature</div>
//           </div>
//           <div
//             className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold"
//             style={{
//               backgroundColor: getStatusColor(sensorData.status) + '20',
//               color: getStatusColor(sensorData.status),
//               border: `2px solid ${getStatusColor(sensorData.status)}`
//             }}
//           >
//             {sensorData.status === 'SAFE' && <CheckCircle className="w-6 h-6" />}
//             {sensorData.status === 'WARNING' && <AlertTriangle className="w-6 h-6" />}
//             {sensorData.status === 'CRITICAL' && <AlertCircle className="w-6 h-6" />}
//             {sensorData.status === 'LOADING' && (
//               <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
//             )}
//             {sensorData.status}
//           </div>
//           <p className="mt-4 text-gray-600">{getStatusDescription(sensorData.status)}</p>
//         </div>

//         {/* Sensor Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//           {/* Internal Temp */}
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2">
//                 <Thermometer className="w-5 h-5 text-green-600" />
//                 <h3 className="text-sm font-semibold text-gray-700">Internal Temp</h3>
//               </div>
//               {getTrendIcon(sensorData.internalTrend)}
//             </div>
//             <div className="text-3xl font-bold text-gray-900">
//               {sensorData.internalTemp ? sensorData.internalTemp.toFixed(1) : '--'}°C
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Target: 2-8°C</p>
//             <p className="text-xs text-gray-400 mt-1">
//               From Firebase: {sensorData.internalTemp ? sensorData.internalTemp.toFixed(1) : '--'}°C
//             </p>
//           </div>

//           {/* External Temp */}
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2">
//                 <Cloud className="w-5 h-5 text-orange-600" />
//                 <h3 className="text-sm font-semibold text-gray-700">External Temp</h3>
//               </div>
//               {getTrendIcon(sensorData.externalTrend)}
//             </div>
//             <div className="text-3xl font-bold text-gray-900">
//               {sensorData.externalTemp ? sensorData.externalTemp.toFixed(1) : '--'}°C
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Ambient conditions</p>
//           </div>

//           {/* Humidity */}
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2">
//                 <Droplets className="w-5 h-5 text-blue-600" />
//                 <h3 className="text-sm font-semibold text-gray-700">Humidity</h3>
//               </div>
//               {getTrendIcon(sensorData.humidityTrend)}
//             </div>
//             <div className="text-3xl font-bold text-gray-900">
//               {sensorData.humidity ? sensorData.humidity.toFixed(0) : '--'}%
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
//               <div
//                 className="h-2 rounded-full transition-all"
//                 style={{
//                   width: `${sensorData.humidity || 0}%`,
//                   backgroundColor: getHumidityColor(sensorData.humidity)
//                 }}
//               />
//             </div>
//             <p className="text-xs text-gray-400 mt-1">
//               From Firebase: {sensorData.humidity ? sensorData.humidity.toFixed(0) : '--'}%
//             </p>
//           </div>
//         </div>

//         {/* Temperature Stability Chart */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <h2 className="text-xl font-bold text-gray-900 mb-4">Temperature Stability</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={chartData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="time" />
//               <YAxis domain={[0, 35]} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
//               <Tooltip />
//               <ReferenceLine y={2} stroke="#E74C3C" strokeDasharray="3 3" label="Min Safe" />
//               <ReferenceLine y={8} stroke="#E74C3C" strokeDasharray="3 3" label="Max Safe" />
//               <Line type="monotone" dataKey="internal" stroke="#2ECC71" strokeWidth={3} name="Internal Temp" />
//               <Line type="monotone" dataKey="external" stroke="#95A5A6" strokeWidth={2} strokeDasharray="5 5" name="External Temp" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         {/* AI Insights */}
//         <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-200 mb-6">
//           <div className="flex items-center gap-2 mb-4">
//             <Activity className="w-6 h-6 text-indigo-600" />
//             <h2 className="text-xl font-bold text-gray-900">AI Insights & Predictions</h2>
//           </div>
//           <div className="grid md:grid-cols-3 gap-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Predicted Risk Level</p>
//               <span className={`inline-block px-4 py-2 rounded-lg font-semibold border-2 ${getRiskColor(aiPrediction.riskLevel)}`}>
//                 {aiPrediction.riskLevel}
//               </span>
//             </div>
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Time to Breach</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {aiPrediction.timeToBreach || 'N/A'}
//               </p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Recommendation</p>
//               <p className="text-sm font-medium text-gray-800">{aiPrediction.recommendation}</p>
//             </div>
//           </div>
//         </div>

//         {/* Connection Status Panel */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <h2 className="text-xl font-bold text-gray-900 mb-4">Firebase Connection</h2>
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Database URL</p>
//               <p className="text-sm font-medium text-gray-800 truncate">
//                 https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app/
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <div 
//                 className={`w-3 h-3 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
//                 style={{ backgroundColor: isConnected ? '#2ECC71' : '#E74C3C' }}
//               />
//               <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
//                 {isConnected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <footer className="text-center text-sm text-gray-500 mt-8">
//           <p>Data Source: ESP32 Sensors → Firebase Realtime Database → AI Predictions (Gemini)</p>
//           <p className="mt-1">Real-time updates via WebSocket</p>
//           <p className="mt-1">
//             Connection Status: 
//             <span className={`ml-2 font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
//               {isConnected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
//             </span>
//           </p>
//         </footer>
//       </main>
//     </div>
//   );
// };

// export default ThermoSafeDashboard;


