# 📊 Dustbill

A modern freelancer invoicing and contract management platform built with React, Vite, Supabase, and Tailwind CSS.

## ✨ Features

- **🔐 Authentication** - Secure email/password authentication with Supabase Auth
- **👥 Client Management** - Add, edit, and organize client information
- **📄 Invoice Management** - Create professional invoices with multiple status tracking (draft, pending, approved, paid)
- **📝 Contract System** - Generate and manage client contracts
- **📧 Email Notifications** - Automated email sending via Supabase Edge Functions
- **📊 Dashboard Analytics** - Track revenue, clients, and invoices with interactive charts
- **🌓 Dark Mode** - Built-in theme support
- **🔗 Shareable Links** - Generate shareable invoice links for clients

## 🚀 Tech Stack

- **Frontend:** React 19, React Router, Vite
- **Styling:** Tailwind CSS 4, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Handling:** date-fns

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Resend account (for email functionality)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dustbill
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   
   - Create a new Supabase project
   - Run the schema from `supabase/schema.sql`
   - Deploy the Edge Function from `supabase/functions/send-email/`
   - Configure Resend API key in Supabase secrets

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- [Quick Start Guide](docs/QUICK_START.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Email Setup](docs/PRODUCTION_EMAIL_SETUP.md)
- [Email Testing Guide](docs/EMAIL_TEST_CHECKLIST.md)

## 🏗️ Project Structure

```
dustbill/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── lib/            # Utilities and services
│   ├── store/          # Zustand state management
│   └── assets/         # Static assets
├── supabase/
│   ├── schema.sql      # Database schema
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge Functions
├── docs/               # Documentation
└── public/             # Public assets
```

## 🎯 Key Features Explained

### Invoice Management
- Create invoices with multiple line items
- Track invoice status (draft → pending → approved → paid)
- Generate shareable links for client access
- Support for multiple currencies (USD, EUR, INR, GBP)
- Automatic overdue tracking

### Contract System
- Professional contract templates
- Link contracts to clients
- Track contract status and dates
- Automatic email delivery

### Dashboard
- Revenue analytics with charts
- Client statistics
- Recent invoices overview
- Quick action buttons

## 🧪 Testing

Test scripts are available for various features:

```bash
# Test client functionality
node check-client.js

# Test contract functionality
node check-contracts.js

# Test email logging
node check-logs.js
node check-logs-admin.js

# Test email sending
node test-email.js
```

## 🚀 Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Preview production build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   - Frontend: Deploy to Vercel, Netlify, or your preferred host
   - Supabase: Already hosted, just configure production environment variables

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for all sensitive operations
- Environment variables for sensitive data
- Secure token-based invoice sharing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and proprietary.

## 🐛 Troubleshooting

If you encounter issues:

1. Ensure all environment variables are set correctly
2. Check Supabase connection and RLS policies
3. Verify Edge Function deployment
4. Review browser console for errors

For more help, check the documentation in the `/docs` folder.

## 📞 Support

For questions or issues, please refer to the documentation or create an issue in the repository.
