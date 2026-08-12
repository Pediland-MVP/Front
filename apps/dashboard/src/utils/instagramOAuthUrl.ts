const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

/**
 * The Instagram OAuth handshake URL. Shared so every surface that can start a connect
 * (the /connect button, SetupInstagramDialog's "continue with this plan") stays identical —
 * a drifted scope or redirect_uri here fails only after the user has already left the app.
 */
export const IG_OAUTH_URL = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`;
