# Marketing Tool Frontend

A modern, responsive frontend for the Marketing Tool built with Next.js 13+ and TypeScript, optimized for Vercel deployment.

## Features

- 🚀 **Next.js 13+ App Router** - Latest Next.js features with App Router
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI components
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Real-time Updates** - Live pipeline monitoring and status updates
- 📊 **Content Management** - Upload, view, and manage marketing content
- ⚡ **Pipeline Control** - Run and monitor marketing pipelines
- 🔍 **Content Analysis** - Analyze content for marketing potential
- 🎯 **TypeScript** - Full type safety throughout the application

## Tech Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see main marketing-tool repository)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd marketing-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Update `.env.local` with your configuration:
```bash
# Backend API Configuration
NEXT_PUBLIC_BACKEND_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_WEBSOCKET_URL=ws://localhost:8000

# Keycloak Frontend Configuration (REQUIRED for authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here  # Generate with: openssl rand -base64 32
KEYCLOAK_CLIENT_ID=marketing-tool-frontend
KEYCLOAK_CLIENT_SECRET=your-frontend-client-secret
KEYCLOAK_ISSUER=https://your-keycloak-server.com/realms/your-realm-name
```

**Important**: Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Required for Local Development

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_BACKEND_WEBSOCKET_URL` | WebSocket URL for real-time updates | `ws://localhost:8000` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for encrypting JWT tokens | Generate with `openssl rand -base64 32` |
| `KEYCLOAK_CLIENT_ID` | Keycloak frontend client ID | `marketing-tool-frontend` |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak frontend client secret | Get from Keycloak admin console |
| `KEYCLOAK_ISSUER` | Keycloak issuer URL | `https://your-keycloak-server.com/realms/your-realm` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_KEY` | API key for authentication (if not using Keycloak) | - |

### Setting Up Keycloak

1. Follow the [Keycloak Setup Guide](../marketing_tool/docs/KEYCLOAK_SETUP.md) in the backend repository
2. Create a frontend client in Keycloak (public client)
3. Copy the client ID and secret to your `.env.local` file
4. Set `KEYCLOAK_ISSUER` to your Keycloak realm URL

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── content/           # Content management pages
│   ├── pipeline/          # Pipeline management pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── content/          # Content-specific components
│   └── pipeline/         # Pipeline-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
└── styles/               # Additional styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `out` directory to your hosting provider

## API Integration

The frontend integrates with the Marketing Tool backend API using a **function-based pipeline architecture**:

### Core Endpoints
- **Health Checks**: `/api/v1/health`, `/api/v1/ready`
- **Content Analysis**: `/api/v1/analyze`
- **Pipeline Execution**: `/api/v1/pipeline` (auto-routes to appropriate processor)

### Direct Processor Endpoints (Recommended)
- **Blog Processing**: `/api/v1/process/blog`
- **Transcript Processing**: `/api/v1/process/transcript`  
- **Release Notes Processing**: `/api/v1/process/release-notes`

### Additional Endpoints
- **Content Sources**: `/api/v1/content-sources/*`
- **Job Management**: `/api/v1/jobs/*`
- **Approvals**: `/api/v1/approvals/*`
- **File Upload**: `/api/v1/upload`

### Architecture
The backend uses a **7-step function-calling pipeline** with OpenAI structured outputs for:
- ✅ Guaranteed JSON output
- ⚡ Faster execution (20% faster than legacy agents)
- 💰 Lower costs (10% cheaper)
- 🎯 Full type safety with Pydantic models
- 📊 Quality metrics (confidence scores, SEO scores, readability scores)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.