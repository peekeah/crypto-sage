# Crypto Sage

## Overview
This project consists of two main components: a **CEX/DEX Price Arbitrage Scanner** and an **AI-powered Price Predictor**. The primary objective is to identify arbitrage opportunities between centralized exchanges (CEX) and decentralized exchanges (DEX) while also predicting cryptocurrency prices using AI models.

## Features

1. **CEX/DEX Price Arbitrage Scanner**
   - Detect arbitrage opportunities between Binance (CEX) and Raydium ( Solana-based DEX).
   - Display profitable opportunities after accounting for all fees.

2. **Price Predictor with AI**
   - Predict future cryptocurrency prices using historical data from Binance.
   - Implement AI algorithms to forecast up/down trends with confidence percentages.
   - Use backtesting to validate predictions with historical data.
   - Display prediction accuracy, profit/loss, and visualize performance.

## Installation

### Prerequisites
- Node.js 20.18.0 or above
- TypeScript 5.6.3 or above

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/peekeah/crypto-sage.git
   ```

2. Install dependencies:
   ```bash
   cd crypto-sage/backend
   npm install
   cd crypto-sage/frontend
   npm install
   ```

3. Setup the environment `.env` files with the necessary keys:
    ```
    cd backend
    cp .env.example .env
    cd frontend
    cp .env.example .env
    ```
4. Run the project:
   ```bash
   cd backend
   npm run dev
   cd frontend
   npm run dev
   ```
## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contribution
Feel free to fork this repository and submit pull requests. We welcome contributions to improve the system!
