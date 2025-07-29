# 🏎️ F1 Stats Dashboard

A comprehensive Formula 1 data visualization and analytics platform built with Next.js, featuring real-time race telemetry, position tracking, and broadcast-style visualizations.

## ✨ Features

### 📊 Position Chart Analysis
- **Broadcast-Style Position Chart**: Professional F1 position visualization with Plotly.js
- **2025 Season Data**: Updated driver roster and team colors for the current season
- **Interactive Analysis**: Hover details, zoom, and pan functionality
- **Historical Race Data**: Access to multiple race sessions and detailed position tracking
- **Team Color Coding**: Authentic team liveries and driver identification

### 🏁 Live Dashboard
- **Real-Time Leaderboard**: Live position tracking with gap analysis
- **Speed Telemetry**: Interactive speed charts with driver comparisons
- **Track Conditions**: Weather data including temperature, humidity, and rainfall status
- **Auto-Refresh**: Automatic data updates every 10 seconds during race sessions
- **Driver Statistics**: Comprehensive driver and team information
- **2025 Season Calendar**: Complete F1 2025 season schedule with all sessions (Practice, Qualifying, Sprint, Race)
- **Session Status Tracking**: Visual indicators for scheduled, live, and completed sessions

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Navigation Bar**: Seamless switching between analysis tools
- **Dark Theme**: F1-inspired dark interface with team accent colors
- **Session Selection**: Easy switching between different race weekends

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://reactjs.org/)** - UI library with hooks and modern features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

### Data Visualization
- **[Plotly.js](https://plotly.com/javascript/)** - Interactive charting library
- **Custom PlotWrapper** - Next.js SSR-compatible Plotly integration

### Data Source
- **[OpenF1 API](https://openf1.org/)** - Real-time and historical F1 data
  - Position tracking
  - Car telemetry (speed, throttle, brake, gear)
  - Weather conditions
  - Driver and session information
  - Race intervals and gaps

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Geist Font](https://vercel.com/font)** - Modern typography

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd f1-stats-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
f1-stats-app/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Live Dashboard page
│   │   ├── layout.tsx            # Root layout with navigation
│   │   ├── page.tsx              # Home page with position chart
│   │   └── globals.css           # Global styles
│   └── components/
│       ├── F1PositionChart.tsx   # Main position visualization
│       ├── PlotWrapper.tsx       # Plotly.js wrapper component
│       └── Navigation.tsx        # Navigation bar component
├── public/                       # Static assets
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables
The application uses the public OpenF1 API and doesn't require API keys for basic functionality. For real-time data access, you may need to configure additional authentication.

### Customization
- **Team Colors**: Update `F1_TEAM_COLORS` in components for custom team liveries
- **Driver Mapping**: Modify `DRIVER_MAP` for accurate 2025 season driver numbers
- **Refresh Rate**: Adjust auto-refresh intervals in the dashboard component

## 📊 Data Endpoints Used

- **Sessions**: Race weekend information and scheduling
- **Drivers**: Driver profiles, teams, and numbers
- **Position**: Real-time position tracking throughout races
- **Intervals**: Gap times and interval data between drivers
- **Car Data**: Telemetry including speed, throttle, brake, and gear data
- **Weather**: Track conditions and meteorological data

## 🛣️ Roadmap

### Planned Features
- **Pit Stop Analysis**: Visual pit stop timing and strategy analysis
- **Tire Strategy Visualization**: Compound usage and degradation tracking
- **Race Control Events**: Flag status and safety car period tracking
- **Sector Time Analysis**: Detailed sector-by-sector performance
- **Weather Impact Analysis**: Correlation between conditions and performance
- **Historical Comparisons**: Season-over-season and driver comparisons

### Technical Improvements
- **WebSocket Integration**: Real-time data streaming
- **Progressive Web App**: Offline capability and mobile app experience
- **Data Caching**: Improved performance with local data storage
- **Export Functionality**: Save charts and data for analysis


## 📄 License

This project is open source.

## 📞 Support

If you have any questions or run into issues, please:
1. Check the [OpenF1 API documentation](https://openf1.org/)
2. Review the [Next.js documentation](https://nextjs.org/docs)
3. Open an issue in this repository

---

**Built with ❤️ for Formula 1 fans and data enthusiasts**
