import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import Account from './Account.jsx';
import '../style.css';
import './account.css';
const url = import.meta.env.VITE_CONVEX_URL;
createRoot(document.getElementById('app')).render(url ? <React.StrictMode><ConvexAuthProvider client={new ConvexReactClient(url)}><Account /></ConvexAuthProvider></React.StrictMode> : <main className="account-shell"><h1>Account setup is unavailable</h1><p>Please try again later.</p><a href="/">Back to Chauffeur</a></main>);
