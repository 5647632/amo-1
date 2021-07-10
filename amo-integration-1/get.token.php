<?php
require_once __DIR__ . '/init.php';

$accessToken = getToken();

if ($accessToken !== false && time() >= $accessToken['expires']) {
  $url = 'https://' . $accessToken['baseDomain'] . '/oauth2/access_token';
  $payload = [
    'client_id' => AMO_CLIENT_ID,
    'client_secret' => AMO_CLIENT_SECRET,
    'grant_type' => 'refresh_token',
    'refresh_token' => $accessToken['refreshToken'],
    'redirect_uri' => AMO_REDIRECT_URI,
  ];

  $response = makeRequest($url, $payload);
  tokenLog('makeRequest ' . var_export($response, true));

  $accessToken['accessToken'] = trim($response['data']['access_token'] ?? '');
  $accessToken['refreshToken'] = trim($response['data']['refresh_token'] ?? '');
  $accessToken['expires'] = time() + (int) ($response['data']['expires_in'] ?? 0);

  saveToken($accessToken);
}

if (!isset($accessToken['accessToken']) || trim($accessToken['accessToken']) === '') {
  tokenLog('Error with token ' . var_export($accessToken, true));
  exit;
}
