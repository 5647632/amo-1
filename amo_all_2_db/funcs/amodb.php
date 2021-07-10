<?php
function dbSaveTaskType($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `taskTypes`(`id`, `name`, `entityJson`) VALUES(:id, :name, :entityJson)');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveTaskType: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSavePipeline($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `pipelines`(`id`, `name`, `entityJson`) VALUES(:id, :name, :entityJson)');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSavePipeline: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSavePipelineStatus($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $pipelineId = (int) ($entity['pipeline_id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0 || $pipelineId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `statuses`(`id`, `pipeline_id`, `name`, `entityJson`) VALUES(:id, :pipelineId, :name, :entityJson)');
    $insert->execute([
      'id' => $entityId,
      'pipelineId' => $pipelineId,
      'name' => $name,
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSavePipelineStatus: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveUser($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';
  $email = $entity['email'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `users`(`id`, `name`, `email`, `entityJson`) VALUES(:id, :name, :email, :entityJson)');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'email' => $email,
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveUser: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveRole($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `roles`(`id`, `name`, `rights`, `entityJson`) VALUES(:id, :name, :rights, :entityJson)');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'rights' => json_encode($entity['rights'] ?? []),
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveRole: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveCompany($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `companies`(`id`, `name`, `responsibleUserId`, `customFieldsValuesJson`, `entityJson`, `createdAt`, `updatedFromScript`) VALUES(:id, :name, :responsibleUserId, :customFieldsValuesJson, :entityJson, :createdAt, NOW())');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'responsibleUserId' => (int) ($entity['responsible_user_id'] ?? 0),
      'customFieldsValuesJson' => json_encode($entity['custom_fields_values'] ?? []),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveCompany: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveContact($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `contacts`(`id`, `name`, `firstName`, `lastName`, `responsibleUserId`, `customFieldsValuesJson`, `entityJson`, `createdAt`, `companyId`, `updatedFromScript`) VALUES(:id, :name, :firstName, :lastName, :responsibleUserId, :customFieldsValuesJson, :entityJson, :createdAt, :companyId, NOW())');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'firstName' => $entity['first_name'] ?? '',
      'lastName' => $entity['last_name'] ?? '',
      'responsibleUserId' => (int) ($entity['responsible_user_id'] ?? 0),
      'customFieldsValuesJson' => json_encode($entity['custom_fields_values'] ?? []),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
      'companyId' => (int) ($entity['_embedded']['companies'][0]['id'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveContact: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveCustomer($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `customers`(`id`, `name`, `responsibleUserId`, `customFieldsValuesJson`, `entityJson`, `createdAt`, `companyId`, `updatedFromScript`) VALUES(:id, :name, :responsibleUserId, :customFieldsValuesJson, :entityJson, :createdAt, :companyId, NOW())');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'responsibleUserId' => (int) ($entity['responsible_user_id'] ?? 0),
      'customFieldsValuesJson' => json_encode($entity['custom_fields_values'] ?? []),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
      'companyId' => (int) ($entity['_embedded']['companies'][0]['id'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveCustomer: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveCustomersTransaction($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `customersTransactions`(`id`, `customerId`, `price`, `comment`, `entityJson`, `createdAt`, `completedAt`, `updatedFromScript`) VALUES(:id, :customerId, :price, :comment, :entityJson, :createdAt, :completedAt, NOW())');
    $insert->execute([
      'id' => $entityId,
      'customerId' => (int) ($entity['customer_id'] ?? 0),
      'price' => (int) ($entity['price'] ?? 0),
      'comment' => $entity['comment'] ?? '',
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
      'completedAt' => (int) ($entity['completed_at'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveCustomersTransaction: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveCustomersSegment($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `customersSegments`(`id`, `name`, `customersCount`, `customFieldsValuesJson`, `entityJson`, `createdAt`) VALUES(:id, :name, :customersCount, :customFieldsValuesJson, :entityJson, :createdAt)');
    $insert->execute([
      'id' => $entityId,
      'name' => $entity['name'] ?? '',
      'customersCount' => (int) ($entity['customers_count'] ?? 0),
      'customFieldsValuesJson' => json_encode($entity['custom_fields_values'] ?? []),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveCustomersSegment: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveCustomerContact($customerId, $contactId)
{
  $pdo = DB::getPdo();

  if ($customerId <= 0 || $contactId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('INSERT IGNORE INTO `customerContacts`(`customerId`, `contactId`) VALUES(:customerId, :contactId)');
    $insert->execute([
      'customerId' => $customerId,
      'contactId' => $contactId,
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveCustomerContact: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveLead($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);
  $name = $entity['name'] ?? '';

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `leads`(`id`, `name`, `price`, `responsibleUserId`, `customFieldsValuesJson`, `entityJson`, `createdAt`, `companyId`, `statusId`, `pipelineId`, `updatedFromScript`) VALUES(:id, :name, :price, :responsibleUserId, :customFieldsValuesJson, :entityJson, :createdAt, :companyId, :statusId, :pipelineId, NOW())');
    $insert->execute([
      'id' => $entityId,
      'name' => $name,
      'price' => (int) ($entity['price'] ?? 0),
      'responsibleUserId' => (int) ($entity['responsible_user_id'] ?? 0),
      'customFieldsValuesJson' => json_encode($entity['custom_fields_values'] ?? []),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
      'companyId' => (int) ($entity['_embedded']['companies'][0]['id'] ?? 0),
      'statusId' => (int) ($entity['status_id'] ?? 0),
      'pipelineId' => (int) ($entity['pipeline_id'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveLead: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveLeadContact($leadId, $contactId)
{
  $pdo = DB::getPdo();

  if ($leadId <= 0 || $contactId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('INSERT IGNORE INTO `leadContacts`(`leadId`, `contactId`) VALUES(:leadId, :contactId)');
    $insert->execute([
      'leadId' => $leadId,
      'contactId' => $contactId,
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveLeadContact: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveTask($entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `tasks`(`id`, `responsibleUserId`, `entityId`, `entityType`, `taskTypeId`, `text`, `isCompleted`, `entityJson`, `createdAt`, `updatedFromScript`) VALUES(:id, :responsibleUserId, :entityId, :entityType, :taskTypeId, :text, :isCompleted, :entityJson, :createdAt, NOW())');
    $insert->execute([
      'id' => $entityId,
      'responsibleUserId' => (int) ($entity['responsible_user_id'] ?? 0),
      'entityId' => (int) ($entity['entity_id'] ?? 0),
      'entityType' => $entity['entity_type'] ?? '',
      'taskTypeId' => (int) ($entity['task_type_id'] ?? 0),
      'text' => $entity['text'] ?? '',
      'isCompleted' => (int) ($entity['is_completed'] ?? 0),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveTask: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveUnsorted($entity)
{
  $pdo = DB::getPdo();

  $entityId = $entity['uid'] ?? '';

  if ($entityId === '') {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `unsorted`(`uid`, `sourceUid`, `sourceName`, `category`, `pipelineId`, `createdAt`, `metadata`, `contactId`, `companyId`, `leadId`, `entityJson`) VALUES(:uid, :sourceUid, :sourceName, :category, :pipelineId, :createdAt, :metadata, :contactId, :companyId, :leadId, :entityJson)');
    $insert->execute([
      'uid' => $entityId,
      'sourceUid' => $entity['source_uid'] ?? '',
      'sourceName' => $entity['source_name'] ?? '',
      'category' => $entity['category'] ?? '',
      'pipelineId' => (int) ($entity['pipeline_id'] ?? 0),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
      'metadata' => json_encode($entity['metadata'] ?? []),
      'contactId' => (int) ($entity['_embedded']['contacts'][0]['id'] ?? 0),
      'companyId' => (int) ($entity['_embedded']['companies'][0]['id'] ?? 0),
      'leadId' => (int) ($entity['_embedded']['leads'][0]['id'] ?? 0),
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveUnsorted: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveUnsortedSummary($entity)
{
  $pdo = DB::getPdo();

  $entityId = 1;

  if ($entityId <= 0) {
    return false;
  }

  try {
    $insert = $pdo->prepare('REPLACE INTO `unsortedSummary`(`id`, `total`, `accepted`, `declined`, `averageSortTime`, `categories`, `entityJson`) VALUES(:id, :total, :accepted, :declined, :averageSortTime, :categories, :entityJson)');
    $insert->execute([
      'id' => $entityId,
      'total' => (int) ($entity['total'] ?? 0),
      'accepted' => (int) ($entity['accepted'] ?? 0),
      'declined' => (int) ($entity['declined'] ?? 0),
      'averageSortTime' => (int) ($entity['average_sort_time'] ?? 0),
      'categories' => json_encode($entity['categories'] ?? []),
      'entityJson' => json_encode($entity),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveUnsortedSummary: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveEvent($entity)
{
  $pdo = DB::getPdo();

  $entityId = $entity['id'] ?? '';

  if ($entityId === '') {
    return false;
  }

  try {
    $insert = $pdo->prepare('INSERT IGNORE INTO `events`(`id`, `type`, `entityId`, `entityType`, `entityJson`, `createdAt`, `updatedFromScript`) VALUES(:id, :type, :entityId, :entityType, :entityJson, :createdAt, NOW())');
    $insert->execute([
      'id' => $entityId,
      'type' => $entity['type'] ?? '',
      'entityId' => (int) ($entity['entity_id'] ?? 0),
      'entityType' => $entity['entity_type'] ?? '',
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveEvent: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSaveNote($entityType, $entity)
{
  $pdo = DB::getPdo();

  $entityId = (int) ($entity['id'] ?? 0);

  if ($entityId <= 0 || $entityType === '') {
    return false;
  }

  try {
    $insert = $pdo->prepare('INSERT IGNORE INTO `notes`(`id`, `noteType`, `entityId`, `entityType`, `responsibleUserId`, `entityJson`, `createdAt`, `paramsJson`) VALUES(:id, :noteType, :entityId, :entityType, :responsibleUserId, :entityJson, :createdAt, :paramsJson)');
    $insert->execute([
      'id' => $entityId,
      'noteType' => $entity['note_type'] ?? '',
      'entityId' => (int) ($entity['entity_id'] ?? 0),
      'entityType' => $entityType,
      'responsibleUserId' => (int) ($entity['responsible_user_id'] ?? 0),
      'entityJson' => json_encode($entity),
      'createdAt' => (int) ($entity['created_at'] ?? 0),
      'paramsJson' => json_encode($entity['params'] ?? []),
    ]);
  } catch (\PDOException $e) {
    mainLog('Error dbSaveNote: ' . $e->getMessage());
    return false;
  }
  return true;
}

function dbSelectNoteLastId()
{
  $pdo = DB::getPdo();

  try {
    $select = $pdo->prepare('SELECT `id` FROM `notes` ORDER BY `id` DESC LIMIT 1');
    $select->execute();

    $row = $select->fetch();
    return $row['id'] ?? 0;
  } catch (\PDOException $e) {
    mainLog('Error dbSelectNoteLastId: ' . $e->getMessage());
  }
}


function dbSelectEventLastCreatedAt()
{
  $pdo = DB::getPdo();

  try {
    $select = $pdo->prepare('SELECT `createdAt` FROM `events` ORDER BY `createdAt` DESC LIMIT 1');
    $select->execute();

    $row = $select->fetch();
    return $row['createdAt'] ?? 0;
  } catch (\PDOException $e) {
    mainLog('Error dbSelectEventLastCreatedAt: ' . $e->getMessage());
  }
}
