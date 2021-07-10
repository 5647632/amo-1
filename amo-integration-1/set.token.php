<?php
require_once __DIR__ . '/init.php';

session_start();

tokenLog('Refresh token ' . var_export($_GET, true));

if (!isset($_GET['state']) || $_GET['state'] !== 'istruestate') {
  header('Location: https://www.amocrm.ru/oauth?client_id=' . AMO_CLIENT_ID . '&state=istruestate&mode=popup');
}

if (isset($_GET['code'])) {
  $url = 'https://' . trim($_GET['referer']) . '/oauth2/access_token';
  $payload = [
    'client_id' => AMO_CLIENT_ID,
    'client_secret' => AMO_CLIENT_SECRET,
    'grant_type' => 'authorization_code',
    'code' => trim($_GET['code']),
    'redirect_uri' => AMO_REDIRECT_URI,
  ];

  $response = makeRequest($url, $payload);
  tokenLog('makeRequest ' . var_export($response, true));

  $data = [
    'accessToken' => $response['data']['access_token'],
    'expires' => time() + $response['data']['expires_in'],
    'refreshToken' => $response['data']['refresh_token'],
    'baseDomain' => $_GET['referer'],
  ];

  saveToken($data);
}
