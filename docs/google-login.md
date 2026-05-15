# Google login setup

The app uses Google Identity Services in the browser. The browser receives a Google ID token and sends it to the BFF route at `/api/auth/google/login`, which forwards it to the backend for verification and session creation.

For this frontend, the required Google value is a Web OAuth client ID:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

No Google client secret is used by the frontend for the current sign-in button flow.

## Register the app in Google Cloud

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select the Google Cloud project for this environment.
3. Go to **APIs & Services** and configure the **OAuth consent screen** or **Google Auth Platform**.
4. Fill in the consent screen basics:
   - App name
   - User support email
   - Developer contact email
   - Audience, usually **External** unless the app is limited to a Google Workspace organization
5. Go to **APIs & Services** > **Credentials**.
6. Select **Create Credentials** > **OAuth client ID**.
7. Choose **Web application** as the application type.
8. Add authorized JavaScript origins for every frontend origin that should show the Google button:
   - Local development: `http://localhost:3000`
   - Deployed environments, for example `https://app.example.com`
9. Leave authorized redirect URIs empty unless a future implementation switches to a redirect-based OAuth flow.
10. Copy the generated client ID into `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

Restart the Next.js dev server after changing `.env.local`; public environment variables are read when the app starts.

## Local behavior

If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is missing, the Google button renders disabled. Once the value is set and the dev server is restarted, the button loads Google's `https://accounts.google.com/gsi/client` script and requests an ID token for the configured client ID.

The backend must also be configured to accept and validate ID tokens for the same Google client ID. If the frontend receives an ID token but login still fails, check the backend Google authentication settings and logs.
