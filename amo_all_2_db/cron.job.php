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

require_once __DIR__ . '/funcs/get.token.php';
require_once __DIR__ . '/funcs/amodb.php';



/**********************************************************************/

mainLog('Get taskTypes');
$taskTypesResponse = AmoClient::getTaskTypes();
$taskTypes = $taskTypesResponse['data']['_embedded']['task_types'] ?? [];
mainLog('Found ' . count($taskTypes) . ' entities');

$chunks = array_chunk($taskTypes, CHUNK_SIZE);
foreach ($chunks as $chunk) {
  foreach ($chunk as $entity) {
    dbSaveTaskType($entity);
  }
}
mainLog('taskTypes saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get pipelines');
$pipelinesResponse = AmoClient::getLeadsPipelines();
$pipelines = $pipelinesResponse['data']['_embedded']['pipelines'] ?? [];
mainLog('Found ' . count($pipelines) . ' entities');

$chunks = array_chunk($pipelines, CHUNK_SIZE);
foreach ($chunks as $chunk) {
  foreach ($chunk as $entity) {
    dbSavePipeline($entity);

    $statuses = $entity['_embedded']['statuses'] ?? [];
    mainLog('Found ' . count($statuses) . ' statuses in pipeline ' . $entity['id']);
    foreach ($statuses as $status) {
      dbSavePipelineStatus($status);
    }
  }
}
mainLog('pipelines and statuses saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get users');
$page = 1;
do {
  mainLog('Get users, page - ' . $page);
  $usersResponse = AmoClient::getUsers(['page' => $page, 'limit' => 250, 'with' => 'role,group']);
  $users = $usersResponse['data']['_embedded']['users'] ?? [];
  mainLog('Found ' . count($users) . ' entities');

  $chunks = array_chunk($users, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveUser($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($users) > 0 && $page < PAGES_LIMIT);

mainLog('users saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get roles');
$rolesResponse = AmoClient::getRoles(['with' => 'users', 'page' => 1, 'limit' => 250]);
$roles = $rolesResponse['data']['_embedded']['roles'] ?? [];
mainLog('Found ' . count($roles) . ' entities');

$chunks = array_chunk($roles, CHUNK_SIZE);
foreach ($chunks as $chunk) {
  foreach ($chunk as $entity) {
    dbSaveRole($entity);
  }
}
mainLog('roles saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get companies');
$page = 1;
do {
  mainLog('Get companies, page - ' . $page);
  $companiesResponse = AmoClient::getCompanies(['page' => $page, 'limit' => 250]);
  $companies = $companiesResponse['data']['_embedded']['companies'] ?? [];
  mainLog('Found ' . count($companies) . ' entities');

  $chunks = array_chunk($companies, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveCompany($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($companies) > 0 && $page < PAGES_LIMIT);

mainLog('companies saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get contacts');
$page = 1;
do {
  mainLog('Get contacts, page - ' . $page);
  $contactsResponse = AmoClient::getContacts(['page' => $page, 'limit' => 250, 'with' => 'leads,customers']);
  $contacts = $contactsResponse['data']['_embedded']['contacts'] ?? [];
  mainLog('Found ' . count($contacts) . ' entities');

  $chunks = array_chunk($contacts, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveContact($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($contacts) > 0 && $page < PAGES_LIMIT);

mainLog('contacts saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get customers');
$page = 1;
do {
  mainLog('Get customers, page - ' . $page);
  $customersResponse = AmoClient::getCustomers(['page' => $page, 'limit' => 250, 'with' => 'contacts,companies']);
  $customers = $customersResponse['data']['_embedded']['customers'] ?? [];
  mainLog('Found ' . count($customers) . ' entities');

  $chunks = array_chunk($customers, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveCustomer($entity);

      $customerContacts = $entity['_embedded']['contacts'] ?? [];
      mainLog('Found ' . count($customerContacts) . ' contacts in customer ' . $entity['id']);
      foreach ($customerContacts as $cc) {
        dbSaveCustomerContact($entity['id'], $cc['id']);
      }
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($customers) > 0 && $page < PAGES_LIMIT);

mainLog('customers saved');

usleep(AMO_DELAY);
jobLock();


/**********************************************************************/

mainLog('Get customersTransactions');
$page = 1;
do {
  mainLog('Get customersTransactions, page - ' . $page);
  $customersTransactionsResponse = AmoClient::getCustomersTransactions(['page' => $page, 'limit' => 250]);
  $customersTransactions = $customersTransactionsResponse['data']['_embedded']['transactions'] ?? [];
  mainLog('Found ' . count($customersTransactions) . ' entities');

  $chunks = array_chunk($customersTransactions, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveCustomersTransaction($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($customersTransactions) > 0 && $page < PAGES_LIMIT);

mainLog('customersTransactions saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get customersSegments');
$page = 1;
do {
  mainLog('Get customersSegments, page - ' . $page);
  $customersSegmentsResponse = AmoClient::getCustomersSegments(['page' => $page, 'limit' => 50]);
  $customersSegments = $customersSegmentsResponse['data']['_embedded']['segments'] ?? [];
  mainLog('Found ' . count($customersSegments) . ' entities');

  $chunks = array_chunk($customersSegments, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveCustomersSegment($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($customersSegments) > 0 && $page < PAGES_LIMIT);

mainLog('customersSegments saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get unsorted');
$page = 1;
do {
  mainLog('Get unsorted, page - ' . $page);
  $unsortedResponse = AmoClient::getUnsorted(['page' => $page, 'limit' => 250]);
  $unsorted = $unsortedResponse['data']['_embedded']['unsorted'] ?? [];
  mainLog('Found ' . count($unsorted) . ' entities');

  $chunks = array_chunk($unsorted, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveUnsorted($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($unsorted) > 0 && $page < PAGES_LIMIT);

mainLog('unsorted saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get unsortedSummary');
$unsortedSummaryResponse = AmoClient::getUnsortedSummary();
$unsortedSummary = $unsortedSummaryResponse['data'] ?? [];
mainLog('Found ' . count($unsortedSummary) . ' entities');

dbSaveUnsortedSummary($entity);

mainLog('unsortedSummary saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get leads');
$page = 1;
do {
  mainLog('Get leads, page - ' . $page);
  $leadsResponse = AmoClient::getLeads(['page' => $page, 'limit' => 250, 'with' => 'contacts']);
  $leads = $leadsResponse['data']['_embedded']['leads'] ?? [];
  mainLog('Found ' . count($leads) . ' entities');

  $chunks = array_chunk($leads, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {
      dbSaveLead($entity);

      $leadContacts = $entity['_embedded']['contacts'] ?? [];
      mainLog('Found ' . count($leadContacts) . ' contacts in lead ' . $entity['id']);
      foreach ($leadContacts as $lc) {
        dbSaveLeadContact($entity['id'], $lc['id']);
      }
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($leads) > 0 && $page < PAGES_LIMIT);

mainLog('leads saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get tasks');
$tasksDoNotDownloadBefore = strtotime(TASKS_DO_NOT_DOWNLOAD_BEFORE);
$page = 1;
do {
  mainLog('Get tasks, page - ' . $page);
  $tasksResponse = AmoClient::getTasks(['page' => $page, 'limit' => 250, 'order' => ['id' => 'desc']]);
  $tasks = $tasksResponse['data']['_embedded']['tasks'] ?? [];
  mainLog('Found ' . count($tasks) . ' entities');

  $chunks = array_chunk($tasks, CHUNK_SIZE);
  foreach ($chunks as $chunk) {
    foreach ($chunk as $entity) {

      if ($entity['created_at'] < $tasksDoNotDownloadBefore) {
        mainLog(date('d/m/Y H:i', $entity['created_at']));
        mainLog('Old tasks...break');
        break 3;
      }

      dbSaveTask($entity);
    }
  }

  mainLog('saved');
  usleep(AMO_DELAY);
  jobLock();

  $page ++;
} while (count($tasks) > 0 && $page < PAGES_LIMIT);

mainLog('tasks saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get events');
$eventLastCreatedAt = dbSelectEventLastCreatedAt();
mainLog('Last event createdAt: ' . $eventLastCreatedAt);
$page = 1;
do {
  mainLog('Get events, page - ' . $page);
  $eventsResponse = AmoClient::getEvents(['page' => $page, 'limit' => 100, 'filter' => ['created_at' => $eventLastCreatedAt]]); // max 100
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
} while (count($events) > 0 && $page < PAGES_LIMIT * 10);

mainLog('events saved');

usleep(AMO_DELAY);
jobLock();

/**********************************************************************/

mainLog('Get notes');
$notesEntities = ['leads', 'contacts', 'customers', 'companies'];
$noteLastId = dbSelectNoteLastId();
mainLog('Last note id: ' . $noteLastId);
foreach ($notesEntities as $ne) {
  mainLog('Get notes for ' . $ne);

  $page = 1;
  do {
    mainLog($ne . ' get notes, page - ' . $page);
    $notesResponse = AmoClient::getNotes($ne, ['page' => $page, 'limit' => 250, 'order' => ['id' => 'desc']]); // max 250
    $notes = $notesResponse['data']['_embedded']['notes'] ?? [];
    mainLog('Found ' . count($notes) . ' entities');

    $chunks = array_chunk($notes, CHUNK_SIZE);
    foreach ($chunks as $chunk) {
      foreach ($chunk as $entity) {

        // пропускаем записи, которые уже есть в базе, т.к. примечания неизменяемая сущность, обновления не требуются
        // обязательно 'order' => ['id' => 'desc'], от нового к старому, чтобы не запрашивать все старые примечания
        if ($entity['id'] <= $noteLastId) {
          break 3;
        }
        dbSaveNote($ne, $entity);
      }
    }

    mainLog('saved');
    usleep(AMO_DELAY);
    jobLock();

    $page ++;
  } while (count($notes) > 0 && $page < PAGES_LIMIT * 3); // примечаний может быть оочень много, поэтому увеличиваем лимит страниц

  mainLog($ne. ' notes saved');
}

usleep(AMO_DELAY);
jobLock();



DB::closeConnection();

jobUnlock();
mainLog('Free lock...Done job');
