// Client IDs from Google Cloud always end like this; anything else (empty,
// "placeholder-change-me") would make Google answer "invalid_client".
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const googleSignInEnabled = googleClientId.endsWith('.apps.googleusercontent.com');
