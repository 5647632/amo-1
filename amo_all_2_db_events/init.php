<?php
// ID интеграции
define('AMO_CLIENT_ID', '824b75c6-9eca-468b-8457-2a46530ff8f1');
// Секретный ключ
define('AMO_CLIENT_SECRET', 'qZLSN2cigG0BhrgFtQITPnvaOCQypsJCMoxs0PDfeUUd4Q7kU9JFoIACCwP97iUv');
// полный урл до файла set.token.php на вашем хостинге, какой указывали при настройке интеграции в амо
define('AMO_REDIRECT_URI', 'https://496089-analytics3.tmweb.ru/amo_all_2_db_events/set.token.php');

define('DB_HOST', '127.0.0.1'); // хост сервера базы данных, обычно localhost или 127.0.0.1
define('DB_USER', 'remote'); // логин БД
define('DB_PASSWORD', '6m7zajw8wqqy5i'); // пароль БД
define('DB_NAME', 'amo_omnicomm'); // имя созданной БД

// БОЛЬШЕ НИЧЕГО НИГДЕ МЕНЯТЬ НЕ НУЖНО

define('DOC_ROOT', __DIR__);
define('LOGS_DIR', DOC_ROOT . '/logs');

define('AMO_TOKEN_FILE', DOC_ROOT . '/.amo.token');

require_once DOC_ROOT . '/../amo_all_2_db/vendor/autoload.php';

use Monolog\Logger;
use Monolog\Handler\RotatingFileHandler;

function mainLog($message)
{
  $log = new Logger('mainLog');
  $log->pushHandler(new RotatingFileHandler(LOGS_DIR . '/main.log', 7, Logger::DEBUG));
  if (!is_string($message)) {
    $message = json_encode($message);
  }
  $log->debug($message);
}

function tokenLog($message)
{
  $log = new Logger('tokenLog');
  $log->pushHandler(new RotatingFileHandler(LOGS_DIR . '/token.log', 7, Logger::DEBUG));
  if (!is_string($message)) {
    $message = json_encode($message);
  }
  $log->debug($message);
}

function jobLock()
{
  file_put_contents(__DIR__ . '/.job.lock', time());
}

function jobUnlock()
{
  @unlink(__DIR__ . '/.job.lock');
}

function isJobLocked()
{
  $lockFile = __DIR__ . '/.job.lock';
  if (!file_exists($lockFile)) {
    return false;
  }
  $lockedAt = (int) trim(file_get_contents(__DIR__ . '/.job.lock'));

  // если обновляли лок файл менее 10 мин назад, то предполоагаем что скрипт еще работает
  if (($lockedAt + (60 * 10)) > time()) {
    return true;
  }
  return false;
}

require_once __DIR__ . '/../amo_all_2_db/funcs/db.php';

try {
  DB::doConnect(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
  DB::getPdo()->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  DB::getPdo()->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  mainLog("PDO success connected");
} catch (\PDOException $e) {
  mainLog("PDO error: " . $e->getMessage());
  exit;
}

require_once __DIR__ . '/../amo_all_2_db/funcs/amo.php';
AmoClient::setAccessTokenPath(AMO_TOKEN_FILE);
