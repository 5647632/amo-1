<?php
/**********************************
 * загружаете файлы на хостинг
 * в амо создаете интеграцию (Настройки - Интеграции - Создать интеграцию)
 * в поле ссылка для перенаправления указываете полный урл до файла set.token.php на вашем хостинге
 * выставляете галочку Предоставить доступ Все
 * Название - любое, Описание - любое
 * нажимаете Сохранить
 * Переходите во вкладку Ключи и доступы и в соотв-ии с данными заполняете константы ниже
 */
// ID интеграции
define('AMO_CLIENT_ID', '53606783-8ec8-4fa8-8352-0ab957c67060');
// Секретный ключ
define('AMO_CLIENT_SECRET', 'wnIBozp4Ol1YaQzc4sMOOSxiiZprYMfH2IkSC7QyzhebN7m0iry8b8seir9p3njx');
// полный урл до файла set.token.php на вашем хостинге, какой указывали при настройке интеграции в амо
define('AMO_REDIRECT_URI', 'https://496089-analytics3.tmweb.ru/amo-integration-1/set.token.php');
define('AMO_TOKEN_FILE', __DIR__ . '/.token');

// Идентификаторы полей в амо
define('AMO_CUSTOMER_LAST_ACTIVITY_FIELD_ID', 666131); // Последняя активность
define('AMO_CUSTOMER_SAP_FIELD_ID', 666129); // группа САП у покупателя
define('AMO_COMPANY_SAP_FIELD_ID', 595517); // группа САП у компании

// Идентификаторы типов задач, по которым обновляем активность
define('ALLOW_TASK_IDS', [2, 2159557]);

define('AMO_DELAY', 250000); // 1/4 sec

/**
 * На этом шаге с настройками закончили, сохраняете файл и выгружаете на хостинг
 * затем переходите в браузере по урлу до файла set.token.php, перенаправит на амо с окном, в котором нужно выбрать свой аккаунт для предоставления прав скрипту, после чего перенаправит обратно на set.token.php - если будет пустое окно без текста, значит интеграция успешна
 * 
 * теперь идем в амо Настройки - Интеграции - WebHooks - Добавить хук
 * в урл пишем урл до файла wh.php
 * в списке справа выбираем Покупатель изменен, Задача изменена, Компания изменена, Примечание доб в покупателя
 * Нажимаем сохранить
 * 
 * Интеграция окончена
 */

define('LOGS_DIR', __DIR__ . '/logs');

// БОЛЬШЕ НИЧЕГО НИГДЕ МЕНЯТЬ НЕ НУЖНО

require_once __DIR__ . '/vendor/autoload.php';

use Monolog\Logger;
use Monolog\Handler\RotatingFileHandler;

function mainLog($message)
{
  $log = new Logger('mainLog');
  $log->pushHandler(new RotatingFileHandler(LOGS_DIR . '/main.log', 3, Logger::DEBUG));
  $log->debug($message);
}

function tokenLog($message)
{
  $log = new Logger('tokenLog');
  $log->pushHandler(new RotatingFileHandler(LOGS_DIR . '/token.log', 7, Logger::DEBUG));
  $log->debug($message);
}

function genOrderId()
{
  return uniqid();
}

function getOrder()
{
  $orderFileName = __DIR__ . '/.order';
  if (!file_exists($orderFileName)) {
    return [];
  }
  return array_values(array_filter(array_map(function ($item) { return trim($item); }, file($orderFileName)), function ($item) { return $item !== ''; }));
}

function isOrderEmpty()
{
  return count(getOrder()) <= 0;
}

function existsOrderId($id)
{
  $order = getOrder();
  return in_array($id, $order);
}

function getNextOrder()
{
  $order = getOrder();
  return $order[0] ?? false;
}

function getNextNextOrder()
{
  $order = getOrder();
  return $order[1] ?? false;
}

function setNextOrder($id)
{
  $orderFileName = __DIR__ . '/.order';
  
  $order = getOrder();
  $order[] = $id;
  file_put_contents($orderFileName, implode("\n", $order));
}

function unsetNextOrder($id)
{
  $orderFileName = __DIR__ . '/.order';
  
  $order = getOrder();
  $order = array_values(array_filter($order, function($item) use ($id) { return $id !== $item; }));
  file_put_contents($orderFileName, implode("\n", $order));
}

function unsetCurrentOrder()
{
  $order = getNextOrder();
  unsetNextOrder($order);
}

function preparedCustomFields($customFields, $idIndexName = 'id', $onlyValues = false)
{
  $preparedCF = [];
  foreach ($customFields as $cf) {
    if ($onlyValues) {
      $preparedCF[(int) $cf[$idIndexName]] = $cf['values'][0]['value'] ?? '';
    } else {
      $preparedCF[(int) $cf[$idIndexName]] = $cf;
    }
  }
  return $preparedCF;
}

function preparedCustomFieldsAssoc($customFields, $idIndexName = 'id', $onlyValues = false)
{
  $preparedCF = [];
  foreach ($customFields as $cf) {
    if ($onlyValues) {
      $preparedCF[$cf[$idIndexName]] = $cf['values'][0]['value'] ?? '';
    } else {
      $preparedCF[$cf[$idIndexName]] = $cf;
    }
  }
  return $preparedCF;
}

function getEvents($token, $params = [])
{
  $url = 'https://' . $token['baseDomain'] . '/api/v4/events?' . http_build_query($params);
  $response = makeRequest($url, [], ['Authorization: Bearer ' . $token['accessToken']], true);
  return $response;
}

function getNotes($token, $enityType, $params = [])
{
  $url = 'https://' . $token['baseDomain'] . '/api/v4/' . $enityType . '/notes?' . http_build_query($params);
  $response = makeRequest($url, [], ['Authorization: Bearer ' . $token['accessToken']], true);
  return $response;
}

function getCustomer($token, $id)
{
  $url = 'https://' . $token['baseDomain'] . '/api/v4/customers/' . $id . '?with=companies,contacts';
  $response = makeRequest($url, [], ['Authorization: Bearer ' . $token['accessToken']], true);
  return $response;
}

function updateCustomer($token, $payload)
{
  if (!is_array($payload) || empty($payload)) {
    return false;
  }

  $url = 'https://' . $token['baseDomain'] . '/api/v4/customers';
  $response = makeRequest($url, $payload, ['Authorization: Bearer ' . $token['accessToken']], false, true);
  return $response;
}

function getCompany($token, $id)
{
  $url = 'https://' . $token['baseDomain'] . '/api/v4/companies/' . $id . '?with=customers,contacts';
  $response = makeRequest($url, [], ['Authorization: Bearer ' . $token['accessToken']], true);
  return $response;
}

function updateCompany($token, $payload)
{
  if (!is_array($payload) || empty($payload)) {
    return false;
  }

  $url = 'https://' . $token['baseDomain'] . '/api/v4/companies';
  $response = makeRequest($url, $payload, ['Authorization: Bearer ' . $token['accessToken']], false, true);
  return $response;
}

function makeRequest($url, $payload, $headers = [], $is_get_request = false, $is_patch_request = false)
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

function saveToken($accessToken)
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

      file_put_contents(AMO_TOKEN_FILE, json_encode($data));
  } else {
    tokenLog('Invalid set access token ' . var_export($accessToken, true));
    exit('Invalid access token ' . var_export($accessToken, true));
  }
}

function getToken()
{
  if (!file_exists(AMO_TOKEN_FILE)) {
    return false;
  }

  $accessToken = json_decode(file_get_contents(AMO_TOKEN_FILE), true);

  if (
      isset($accessToken)
      && isset($accessToken['accessToken'])
      && isset($accessToken['refreshToken'])
      && isset($accessToken['expires'])
      && isset($accessToken['baseDomain'])
  ) {
      return $accessToken;
  } else {
    tokenLog('Invalid get access token ' . var_export($accessToken, true));
    return false;
  }
}
