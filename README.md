# StockEasy - AI-Powered Stock Trading Platform

StockEasy is a comprehensive stock trading platform that combines real-time market data, AI-driven insights, and an intuitive user interface to provide traders with powerful tools for informed decision-making. The platform offers seamless trading capabilities, portfolio management, and advanced analytics powered by artificial intelligence.

## 🚀 Features

### Core Trading Features
- **Real-time Market Data**: Live stock prices and market information using Yahoo Finance API
- **Portfolio Management**: Track holdings, P&L, and investment performance
- **Order Management**: Place buy/sell orders with instant execution
- **Watchlist**: Monitor favorite stocks with customizable lists
- **Funds Management**: Add funds via UPI or Net Banking (simulated gateway)

### AI-Powered Analytics
- **Stock Recommendations**: AI-driven buy/sell/hold recommendations based on technical indicators and news sentiment
- **Sentiment Analysis**: Real-time news sentiment analysis using OpenAI GPT models
- **Fundamental Analysis**: Company health scoring based on financial metrics (P/E ratio, EPS, ROE, debt-to-equity)
- **Technical Indicators**: RSI, SMA calculations for trend analysis

### User Experience
- **Responsive Design**: Modern, mobile-friendly interface built with React
- **Multi-Platform Access**: Web application with separate landing page and trading dashboard
- **Secure Authentication**: JWT-based authentication with secure cookie management
- **Real-time Updates**: Live market data and portfolio updates

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js with Bootstrap for landing pages
- **Dashboard**: React.js with Material-UI for trading interface
- **AI Services**: OpenAI GPT-3.5, NewsAPI integration
- **Market Data**: Yahoo Finance API
- **Authentication**: JWT tokens with secure cookies

### Project Structure
```
stock/
├── backend/                 # Node.js API server
│   ├── controllers/         # Business logic controllers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API route definitions
│   ├── ai/                 # AI analysis services
│   └── util/               # Utility functions
├── frontend/               # Landing page React app
│   ├── src/
│   │   ├── landing_page/   # Marketing pages
│   │   └── trading/        # Trading interface
├── dashboard/              # Trading dashboard React app
│   └── src/components/     # Dashboard components
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- OpenAI API key
- NewsAPI key

### Backend Setup
```bash
cd backend
npm install
# Create .env file with required variables (see .env.example)
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Dashboard Setup
```bash
cd dashboard
npm install
npm start
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
MONGO_URL=your_mongodb_connection_string
TOKEN_KEY=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
NEWS_API_KEY=your_newsapi_key
NODE_ENV=development
PORT=3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📊 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Trading
- `GET /api/dashboard` - Dashboard summary
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add stock to watchlist
- `GET /api/portfolio` - Get portfolio holdings
- `GET /api/orders` - Get order history
- `POST /api/trade` - Execute buy/sell orders
- `POST /api/funds` - Add funds to account

### Market Data
- `GET /api/market/:symbol` - Get stock market data
- `GET /api/market/symbols` - Get available symbols

### AI Analytics
- `GET /api/ai/recommendation/:symbol` - Get AI stock recommendation
- `GET /api/ai/sentiment/:symbol` - Get market sentiment analysis
- `GET /api/ai/fundamentals/:symbol` - Get fundamental analysis

## 🤖 AI Features 

### Stock Recommendations
Combines technical analysis (RSI, SMA, trend detection) with news sentiment to provide buy/sell/hold recommendations with confidence scores.

### Sentiment Analysis
Uses OpenAI GPT models to analyze news headlines, with fallback to keyword-based analysis for reliability.

### Fundamental Analysis
Evaluates company financial health based on:
- Profitability metrics (ROE, net income)
- Financial stability (debt-to-equity ratio)
- Growth indicators (revenue, EPS)
- Valuation metrics (P/E ratio)


## Real-World Problems This Project Solves

Retail investors often face these practical issues:

1. **Information overload**  
   Users must check many sources to track company news, market moves, and stock signals.

2. **Delayed decision-making**  
   By the time investors read and interpret news, market opportunities may be gone.

3. **No structured analysis for beginners**  
   Many users don’t know how to combine technical signals, sentiment, and fundamentals.

4. **Fragmented trading workflow**  
   Watchlist, portfolio, orders, funds, and analysis are usually spread across multiple apps.

5. **Risky trading actions without guardrails**  
   Beginners can place invalid or high-risk orders without proper validation.

---

## How This Project Solves Them

This project provides a unified platform that combines trading operations with AI-powered analysis.

- **Latest company news integration**  
  Fetches recent headlines for selected stocks (via News API integration) and uses them in analysis.

- **AI sentiment analysis**  
  Classifies market sentiment (`Positive`, `Neutral`, `Negative`) with confidence and summary.

- **AI stock recommendation engine**  
  Generates `BUY / HOLD / SELL` suggestions using:
  - technical indicators (SMA, RSI, trend),
  - news sentiment,
  - confidence scoring + reasoning output.

- **Fundamental health analysis**  
  Evaluates company financial strength using metrics like market cap, P/E, EPS, revenue, net income, debt-to-equity, and ROE, then produces:
  - health score (0–100),
  - rating (`Weak` to `Excellent`),
  - key insights.

- **End-to-end trading module**  
  Includes authentication, watchlist, portfolio, orders, trade execution, and fund deposit simulation in one connected workflow.

- **Safety checks before trade execution**  
  Prevents invalid order types, invalid symbols, insufficient balance, and insufficient holdings.

---


## Business Impact

By combining **live market context + AI interpretation + trading actions** in one platform, this project helps users:

- make faster decisions,
- reduce manual research effort,
- trade with better confidence,
- and learn market analysis through explainable outputs.


## 🚀 Deployment

The application is configured for deployment on Render with:
- Backend API server
- Frontend static hosting
- Dashboard static hosting
- MongoDB Atlas database
- Environment variable management

## 📈 Future Enhancements

- Real-time WebSocket connections for live price updates
- Advanced charting with technical indicators
- Social trading features
- Portfolio optimization algorithms
- Mobile application development
- Integration with more data providers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

