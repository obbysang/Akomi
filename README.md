# Akomi - Private Conditional Subscription Renewal Agent

Akomi is a production-ready subscription renewal agent that uses SKALE's BITE Protocol (Blockchain Integrated Threshold Encryption) for privacy-preserving conditional transactions.

## Documentation

- **SKALE BITE Protocol**: https://docs.skale.space/developers/bite-protocol/typescript-sdk
- **x402 Payment Protocol**: https://docs.skale.space/get-started/agentic-builders/start-with-x402
- **Hackathon Info**: https://docs.skale.space/get-started/hackathon/info

## Architecture

Akomi implements a complete agentic commerce workflow:

1. **User** creates a renewal policy with SLA conditions
2. **Akomi Agent** encrypts the intent using BITE v2
3. **Condition Checker** fetches real SLA metrics from providers
4. **Threshold Encryption** only allows decryption when conditions are met
5. **Payment Executor** processes payment via x402 protocol
6. **Receipt Generator** creates auditable execution records

## Production Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### 1. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cd backend
cp .env.example .env
```

#### Required Credentials

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SKALE_NETWORK_ID` | SKALE network identifier | SKALE Dashboard |
| `SKALE_RPC_URL` | SKALE RPC endpoint | SKALE Dashboard |
| `WALLET_PRIVATE_KEY` | Wallet for transactions | Generated wallet |
| `MERCHANT_ADDRESS` | Address for subscription payments | Your merchant wallet |
| `BITE_CONTRACT_ADDRESS` | BITE contract on SKALE | SKALE documentation |
| `SLA_API_KEY` | SLA provider API key | Datadog/New Relic |
| `SLA_PROVIDER` | Provider type | `datadog`, `newrelic`, or `custom` |

#### Optional: CDP Wallet

| Variable | Description |
|----------|-------------|
| `CDP_API_KEY` | Coinbase Developer Platform API key |
| `CDP_API_SECRET` | CDP API secret |

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### 3. Start the Backend

```bash
cd backend
npm run dev
```

### 4. Start the Frontend

```bash
npm run dev
```

## Environment Variables Reference

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# SKALE BITE Protocol
SKALE_NETWORK_ID=skale-mainnet
BITE_CONTRACT_ADDRESS=0x...
BITE_THRESHOLD=2
BITE_VALIDATORS=3
SKALE_RPC_URL=https://mainnet.skalenodes.com/v1/...

# Wallet
WALLET_PRIVATE_KEY=0x...
MERCHANT_ADDRESS=0x...

# x402 Payment Protocol
USE_X402=true
PAYMENT_TOKEN=USDC

# SLA Provider
SLA_PROVIDER=datadog
SLA_API_ENDPOINT=https://api.datadoghq.com/api/v1
SLA_API_KEY=your-api-key
USE_MOCK_SLA=false

# Authentication
JWT_SECRET=your-production-secret-min-32-chars
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

## Key Features

### BITE v2 Encryption

The system uses threshold encryption to keep subscription details private:
- Price is encrypted until SLA conditions are verified
- Vendor information stays hidden until execution
- Only when conditions are met does decryption occur

### x402 Payments

Integrates with the x402 protocol for HTTP 402 payment flows:
- Automatic payment challenge handling
- CDP Wallet integration for fund custody
- On-chain transaction verification

### Real SLA Integration

Supports multiple SLA providers:
- Datadog
- New Relic
- Custom REST endpoints
- Direct vendor APIs

### Guardrails

Built-in safety features:
- Spend caps
- Vendor allowlists
- Execution limits
- Timeout handling

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Policies
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy
- `GET /api/policies/:id` - Get policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

### Intents
- `GET /api/intents` - List intents
- `POST /api/intents` - Create encrypted intent
- `GET /api/intents/:id` - Get intent

### Execution
- `POST /api/execute/trigger` - Trigger condition check
- `POST /api/execute/:intentId` - Execute workflow

### Encryption (BITE v2)
- `POST /api/encrypt` - Encrypt intent
- `POST /api/decrypt` - Decrypt intent

### Payments (x402)
- `POST /api/payment/execute` - Execute payment
- `GET /api/payment/balance` - Check balance
- `GET /api/payment/status/:txHash` - Get payment status

### SLA
- `GET /api/sla/:vendor` - Get vendor SLA metrics

## Security Notes

1. **Never commit private keys** to version control
2. Use environment variables for all secrets
3. In production, use a secrets manager (AWS Secrets Manager, HashiCorp Vault)
4. Enable 2FA on your wallet/exchange accounts
5. Monitor wallet balances regularly

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| SLA Metrics | Mock data | Real API calls |
| Encryption | Local AES | BITE Protocol |
| Payments | Simulation | Real x402 |
| Wallet | Testnet | SKALE Mainnet |

Set `USE_MOCK_SLA=false` in production to use real SLA data.

## License

MIT
