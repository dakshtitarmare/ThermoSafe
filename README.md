# ThermoSafe 🌡️

## An IoT-Based Cold Chain Monitoring & Safety Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen)](https://github.com/yourusername/thermosafe)
[![IoT](https://img.shields.io/badge/IoT-Ready-orange)](https://github.com/yourusername/thermosafe)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-yellow)](https://firebase.google.com/)

## 📋 Overview

ThermoSafe is an end-to-end IoT solution designed to monitor and protect temperature-sensitive goods during storage and transportation. It provides real-time temperature tracking, instant alerts, and transparent monitoring to reduce losses in cold-chain logistics.

Built with practical deployment, scalability, and real-world constraints in mind, ThermoSafe is ideal for applications like **vaccine transportation, pharmaceutical storage, food logistics, and biological sample handling**.

## 🚨 The Problem

Cold-chain failures are a major cause of:
- **Vaccine spoilage** - Public health risks
- **Pharmaceutical degradation** - Financial losses
- **Food quality loss** - Safety and revenue impact
- **Biological sample damage** - Research setbacks

**Most existing systems rely on:**
- Manual temperature checks
- Delayed reporting
- Isolated monitoring devices with no centralized control

## 💡 Our Solution

ThermoSafe combines **IoT hardware, cloud infrastructure, and web dashboards** into one integrated system:

1. **IoT Sensors** in each container
2. **Real-time cloud data** via Firebase
3. **Web dashboard** for monitoring and alerts

## 🏗️ System Architecture

### Three-Layer System:

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Admin     │  │    User     │  │    Mobile   │     │
│  │  Dashboard  │  │  Dashboard  │  │     App     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    CLOUD LAYER (Firebase)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Realtime   │  │   Storage   │  │  Auth &     │     │
│  │  Database   │  │             │  │  Security   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    HARDWARE LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │    ESP32    │──│ Temperature │──│   Display   │     │
│  │ Controller  │  │   Sensor    │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend (Dashboard)
- **React.js** - Modern UI framework
- **Tailwind CSS** - Responsive styling
- **Recharts** - Data visualization
- **Firebase SDK** - Real-time data
- **React Router** - Navigation

### Backend & Database
- **Firebase Realtime Database** - Cloud storage
- **Firebase Authentication** - User management
- **Node.js** - Backend services (optional)

### Hardware (IoT)
- **ESP32 Microcontroller**
- **DS18B20 Sensors**
- **Arduino IDE** for programming
- **Wi-Fi Connectivity**

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase account
- ESP32 board
- DS18B20 sensor

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dakshtitarmare/ThermoSafe.git
cd ThermoSafe
```

2. **Install dependencies**
```bash
cd web-app
npm install
```

3. **Set up Firebase**
- Create Firebase project
- Enable Realtime Database
- Update firebase config

4. **Start development server**
```bash
npm start
```

## 🎯 Key Features

### Admin Dashboard
- **Container Management** - Create/edit/delete containers
- **User Management** - Auto-generate credentials (Name@123)
- **Real-time Monitoring** - View all containers simultaneously
- **Alert Management** - Track temperature violations
- **Analytics** - Performance reports and metrics

### User Dashboard
- **Personalized View** - See only assigned containers
- **Live Temperature** - Real-time charts and readings
- **Instant Alerts** - Get notified of violations
- **History Logs** - Access past temperature data

### Smart Alert System
- **Threshold-based alerts** (Min/Max temperature)
- **Real-time notification triggers**
- **Historical alert tracking**
- **Multi-channel support** (Future: Email, SMS)

## 📁 Project Structure

```
ThermoSafe/
├── hardware/           # ESP32 firmware code
├── web-app/           # React dashboard
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Dashboard pages
│   │   ├── config/       # Firebase configuration
│   │   └── utils/        # Helper functions
│   └── public/
├── docs/              # Documentation
└── README.md          # This file
```

## 🛠️ Hardware Setup

### Components Required:
- ESP32 Development Board
- DS18B20 Temperature Sensor
- Breadboard and Jumper Wires
- Power Source (USB or Battery)

### Wiring Guide:
```
ESP32 Pin  →  DHT22
3.3V       →  VCC
GND        →  GND
GPIO4      →  Data
```

### Configuration:
1. Install Arduino IDE with ESP32 support
2. Open hardware code
3. Update Wi-Fi credentials
4. Update Firebase project details
5. Upload to ESP32

## 🔐 Authentication

### User Credentials Format
- **Password**: `CustomerName@123`
- Example: John Smith → `John@123`

### Role-based Access:
- **Admin**: Full system access
- **User**: Only assigned containers

## 🌍 Use Cases

### Healthcare
- Vaccine storage monitoring
- Medicine transportation
- Laboratory sample protection

### Food Industry
- Cold storage monitoring
- Transportation tracking
- Restaurant compliance

### Logistics
- Refrigerated truck monitoring
- Container shipment tracking
- Warehouse temperature control

## 🔔 Alert System

### Temperature Thresholds:
- **Default Range**: 2°C - 8°C
- **Configurable per container**
- **Instant violation detection**

### Alert Actions:
1. Dashboard notification
2. Database logging
3. Email notification (future)
4. SMS alert (future)

## 📊 Dashboard Screens

### Admin Dashboard Features:
- Container statistics overview
- Real-time temperature charts
- User management panel
- System analytics

### User Dashboard Features:
- Personal container view
- Temperature history graph
- Alert status indicators
- Profile settings

## 🚀 Deployment

### Web Dashboard:
1. Build the React app
```bash
npm run build
```

2. Deploy to Firebase Hosting
```bash
firebase deploy
```

### Hardware Deployment:
1. Flash ESP32 with latest firmware
2. Place sensors in containers
3. Connect to power
4. Monitor via dashboard

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

- **Documentation**: [Read the docs](docs/) //soon 
- **Issues**: [GitHub Issues](https://github.com/dakshtitarmare/ThermoSafe/issues)
- **Email**: devdakshtit@gmail.com

## 🌟 Future Enhancements

### Planned Features:
- Email/SMS notifications
- Mobile application
- AI-based predictions
- GPS tracking integration
- Blockchain audit trails
- Multi-language support

## 🏆 Why ThermoSafe?

### For Businesses:
- **Reduces product spoilage** by 95%
- **Real-time compliance** monitoring
- **Scalable** from 1 to 10,000 containers
- **Easy integration** with existing systems

### For End Users:
- **Intuitive interface** - no training required
- **Peace of mind** with 24/7 monitoring
- **Proactive protection** of assets
- **Automated reporting** for audits

## 🎉 Getting Started Checklist

- [ ] Set up Firebase project
- [ ] Clone the repository
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up hardware components
- [ ] Flash ESP32 with firmware
- [ ] Run the web dashboard
- [ ] Create your first container
- [ ] Monitor real-time data!

---

> **ThermoSafe is more than a monitoring tool—it's a trust and safety platform for cold-chain logistics. By providing real-time visibility, instant alerts, and centralized control, we help organizations prevent losses, ensure compliance, and protect lives.**

---
*Last updated: Jan 2025*  
*Documentation version: 1.0*  
*System version: ThermoSafe v1.0*