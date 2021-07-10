<?php
set_time_limit(0);

// пауза между запросами к амо, чтобы не превышать лимиты апи
define('AMO_DELAY', 250000); // msec = 1/1000000 sec
// разбиваем данные на указанное кол-во строк при записи в бд, чтобы не нагружать сервер
define('CHUNK_SIZE', 100);
// перестраховка, чтобы не ушло в бесконечный цикл
define('PAGES_LIMIT', 1000);
// задачи, сгружаются созданные не раньше указанной даты
define('TASKS_DO_NOT_DOWNLOAD_BEFORE', '01.01.1970');

require_once __DIR__ . '/init.php';

mainLog('Start cron job...');

if (isJobLocked()) {
  mainLog('Locked...exit');
  exit;
}

jobLock();

require_once __DIR__ . '/../amo_all_2_db/funcs/get.token.php';
require_once __DIR__ . '/../amo_all_2_db/funcs/amodb.php';



/**********************************************************************/

mainLog('Get events');
$page = 1;
do {
  mainLog('Get events, page - ' . $page);
  $eventsResponse = AmoClient::getEvents(['page' => $page, 'limit' => 100]); // max 100
  $events = $eventsResponse['data']['_embedded']['events'] ?? [];
  mainLog('Found ' . count($events) . ' entities');

  $chunks = array_chunk($events, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveEvent($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($events) > 0 && $page < PAGES_LIMIT * 100);

mainLog('events saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get notes');
$notesEntities = ['leads', 'contacts', 'customers', 'companies'];
foreach ($notesEntities as $ne) {
  mainLog('Get notes for ' . $ne);

  $page = 1;
  do {
    mainLog($ne . ' get notes, page - ' . $page);
    $notesResponse = AmoClient::getNotes($ne, ['page' => $page, 'limit' => 250]); // max 250
    $notes = $notesResponse['data']['_embedded']['notes'] ?? [];
    mainLog('Found ' . count($notes) . ' entities');

    $chunks = array_chunk($notes, CHUNK_SIZE);
    foreach ($chunks as $chunk) {
      foreach ($chunk as $entity) {

        // пропускаем записи, которые уже есть в базе, т.к. примечания неизменяемая сущность, обновления не требуются
        // обязательно 'order' => ['id' => 'desc'], от нового к старому, чтобы не запрашивать все старые примечания
        // if ($entity['id'] <= $noteLastId) {
        //   break 3;
        // }
        dbSaveNote($ne, $entity);
      }
    }

    mainLog('saved');
    usleep(AMO_DELAY);
    jobLock();

    $page ++;
  } while (count($notes) > 0 && $page < PAGES_LIMIT * 10); // примечаний может быть оочень много, поэтому увеличиваем лимит страниц

  mainLog($ne. ' notes saved');
}

usleep(AMO_DELAY);
jobLock();



DB::closeConnection();

jobUnlock();
mainLog('Free lock...Done job');
