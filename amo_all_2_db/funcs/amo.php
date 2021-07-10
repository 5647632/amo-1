<?php

class AmoClient
{
  private static $accessToken;
  private static $accessTokenPath = '.token';

  public static function setAccessToken($accessToken)
  {
    static::$accessToken = $accessToken;
  }

  public static function setAccessTokenPath($accessTokenPath)
  {
    static::$accessTokenPath = $accessTokenPath;
  }

  public static function getAccount($params = [])
  {
    return static::amoV4Request('account?' . http_build_query($params), [], [], true);
  }
  
  public static function getTaskTypes()
  {
    return static::getAccount(['with' => 'task_types']);
  }
  public static function getLeadsPipelines()
  {
    return static::amoV4Request('leads/pipelines', [], [], true);
  }

  public static function getUsers($params = [])
  {
    return static::amoV4Request('users?' . http_build_query($params), [], [], true);
  }

  public static function getRoles($params = [])
  {
    return static::amoV4Request('roles?' . http_build_query($params), [], [], true);
  }

  public static function getContacts($params = [])
  {
    return static::amoV4Request('contacts?' . http_build_query($params), [], [], true);
  }

  public static function getCustomers($params = [])
  {
    return static::amoV4Request('customers?' . http_build_query($params), [], [], true);
  }

  public static function getCustomersTransactions($params = [])
  {
    return static::amoV4Request('customers/transactions?' . http_build_query($params), [], [], true);
  }

  public static function getCustomersSegments($params = [])
  {
    return static::amoV4Request('customers/segments?' . http_build_query($params), [], [], true);
  }

  public static function getCompanies($params = [])
  {
    return static::amoV4Request('companies?' . http_build_query($params), [], [], true);
  }

  public static function getLeads($params = [])
  {
    return static::amoV4Request('leads?' . http_build_query($params), [], [], true);
  }

  public static function getTasks($params = [])
  {
    return static::amoV4Request('tasks?' . http_build_query($params), [], [], true);
  }

  public static function getEvents($params = [])
  {
    return static::amoV4Request('events?' . http_build_query($params), [], [], true);
  }

  public static function getNotes($entityType, $params = [])
  {
    return static::amoV4Request($entityType . '/notes?' . http_build_query($params), [], [], true);
  }

  public static function getUnsorted($params = [])
  {
    return static::amoV4Request('leads/unsorted?' . http_build_query($params), [], [], true);
  }

  public static function getUnsortedSummary($params = [])
  {
    return static::amoV4Request('leads/unsorted/summary?' . http_build_query($params), [], [], true);
  }

  public static function amoV4Request($method, $payload, $headers = [], $is_get_request = false, $is_patch_request = false)
  {
    $domain = static::$accessToken['baseDomain'] ?? '';
    $token = static::$accessToken['accessToken'] ?? '';

    if ($domain === '' || $token === '') {
      return false;
    }

    $url = 'https://' . $domain . '/api/v4/' . $method;
    $headers[] = 'Authorization: Bearer ' . $token;

    $retryes = 0;
    do {
      $response = static::makeRequest($url, $payload, $headers, $is_get_request, $is_patch_request);

      $httpCode = (int) ($response['http_code'] ?? 0);
      if ($httpCode !== 200 && $httpCode !== 204) {
        mainLog('cURL error');
        mainLog($response);
        mainLog('Will be retry ' . ++$retryes);
        usleep(250000);
        continue;
      }
      
      break;

    } while($retryes < 5);

    return $response;
  }

  public static function makeRequest($url, $payload, $headers = [], $is_get_request = false, $is_patch_request = false)
  {
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_USERAGENT, 'amoCRM-oAuth-client/1.0');
    curl_setopt($curl, CURLOPT_URL, $url);
    $headers[] = 'Content-Type: application/json';
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($curl, CURLOPT_HEADER, false);
    if ($is_patch_request) {
      curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PATCH');
      curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
    } elseif (!$is_get_request) {
      curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
      curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
    }
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($curl, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);

    $content  = curl_exec($curl);
    $err      = curl_errno($curl);
    $errmsg   = curl_error($curl);
    $data     = curl_getinfo($curl);
    
    curl_close($curl);

    $data['errno']   = $err;
    $data['errmsg']  = $errmsg;
    $data['content'] = $content;
    $data['data'] = json_decode($content, true);

    return $data;
  }

  public static function saveToken($accessToken)
  {
    if (
        isset($accessToken)
        && isset($accessToken['accessToken'])
        && isset($accessToken['refreshToken'])
        && isset($accessToken['expires'])
        && isset($accessToken['baseDomain'])
    ) {
        $data = [
            'accessToken' => $accessToken['accessToken'],
            'expires' => $accessToken['expires'],
            'refreshToken' => $accessToken['refreshToken'],
            'baseDomain' => $accessToken['baseDomain'],
        ];

        static::setAccessToken($data);

        file_put_contents(static::$accessTokenPath, json_encode($data));
    } else {
      tokenLog('Invalid set access token ' . var_export($accessToken, true));
      exit('Invalid access token ' . var_export($accessToken, true));
    }
  }

  public static function getToken()
  {
    if (!file_exists(static::$accessTokenPath)) {
      return false;
    }

    $accessToken = json_decode(file_get_contents(static::$accessTokenPath), true);

    if (
        isset($accessToken)
        && isset($accessToken['accessToken'])
        && isset($accessToken['refreshToken'])
        && isset($accessToken['expires'])
        && isset($accessToken['baseDomain'])
    ) {
        static::setAccessToken($accessToken);
        return $accessToken;
    } else {
      tokenLog('Invalid get access token ' . var_export($accessToken, true));
      return false;
    }
  }
}
