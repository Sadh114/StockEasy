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

## 🤖 AI Features Explained

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

## 🛠️ Problems Faced & Solutions

### 1. Authentication Cookie Issues in Production
**Problem**: Cookies not persisting across domains in production deployment on Render.
**Solution**: Modified cookie settings to use `sameSite: 'none'` and `secure: true` for cross-domain authentication. Added proper domain configuration and environment-specific cookie options.

### 2. Auth Controller Startup Crash
**Problem**: Top-level `res.cookie()` call in AuthController causing server startup failures.
**Solution**: Moved cookie operations inside route handlers where `res` object is available. Implemented proper error handling and validation.

### 3. AI Service Reliability
**Problem**: OpenAI API rate limits and potential failures affecting user experience.
**Solution**: Implemented caching with NodeCache (10-60 minute TTL) and fallback mechanisms. Added keyword-based sentiment analysis as backup when OpenAI fails.

### 4. Real-time Market Data Integration
**Problem**: Yahoo Finance API inconsistencies and rate limiting.
**Solution**: Implemented caching for market data, graceful error handling, and symbol normalization. Added fallback data structures for demo purposes.

### 5. Cross-Origin Resource Sharing (CORS)
**Problem**: Frontend and dashboard running on different ports causing CORS issues.
**Solution**: Configured CORS middleware with environment-specific allowed origins. Implemented proper preflight handling for all HTTP methods.

### 6. Concurrent Database Operations
**Problem**: Race conditions in trade execution and portfolio updates.
**Solution**: Used MongoDB transactions and atomic operations. Implemented proper locking mechanisms for balance and holdings updates.

### 7. AI Analysis Performance
**Problem**: Slow response times for AI-powered features.
**Solution**: Implemented multi-level caching, parallel API calls, and optimized data processing. Used streaming responses where possible.

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
