/**
 * Fonction exportée pour vérifier le token Cloudflare
 * Utilisable depuis n'importe où dans l'application pour debug
 */
export async function verifyCloudflareToken(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token || token.trim() === '') {
    return {
      success: false,
      message: 'CLOUDFLARE_API_TOKEN is missing or empty',
      details: {
        tokenPresent: Boolean(token),
        tokenLength: token?.length || 0,
      }
    };
  }

  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return {
      success: data.success || false,
      message: data.success ? 'Token is valid' : 'Token verification failed',
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error },
    };
  }
}
