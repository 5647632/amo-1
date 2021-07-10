<?php
set_time_limit(0);

require_once __DIR__ . '/init.php';
require_once __DIR__ . '/wh.return.ok.php';

$orderId = genOrderId();
setNextOrder($orderId);

mainLog('Come data from AMO ' . $orderId);
mainLog(json_encode($_POST));

$retries = 30;
do {
  if ($retries < 0) {
    mainLog('Unset current order');
    unsetCurrentOrder();
  }

  mainLog('Waiting order ' . $orderId);
  sleep(1);

  if (!existsOrderId($orderId)) {
    mainLog('Strange, orderId not found, re-set ' . $orderId);
    setNextOrder($orderId);
  }
  
  if ($orderId === getNextNextOrder()) {
    $retries--;
  }  
} while ($orderId !== getNextOrder());

mainLog('Order start ' . $orderId);

require_once __DIR__ . '/get.token.php';

$companyId = (int) ($_POST['companies']['update'][0]['id'] ?? $_POST['contacts']['update'][0]['id'] ?? 0);

// пришел вебхук на изменение компании, актуализируем сап в покупателе
if ($companyId > 0) {
  // exit;
  $companyResponse = getCompany($accessToken, $companyId);
  $company = $companyResponse['data'] ?? [];
  $companyCFS = preparedCustomFields($company['custom_fields_values'] ?? [], 'field_id', true);
  $companyCFSUP = $companyCFS[AMO_COMPANY_SAP_FIELD_ID] ?? '';
  $customerId = (int) ($company['_embedded']['customers'][0]['id'] ?? 0);
//  usleep(AMO_DELAY);
  $customerResponse = getCustomer($accessToken, $customerId);
  $customer = $customerResponse['data'] ?? [];
  $customerCFS = preparedCustomFields($customer['custom_fields_values'] ?? [], 'field_id', true);
  $customerCFSUP = $customerCFS[AMO_CUSTOMER_SAP_FIELD_ID] ?? '';
  mainLog('customer');
  mainLog(json_encode($customer));
  mainLog('company');
  mainLog(json_encode($company));
  
  $customerUpdates = [];
  if ($customerCFSUP !== $companyCFSUP) {
    $customerUpdates[] = [
      'field_id' => AMO_CUSTOMER_SAP_FIELD_ID,
      'values' => [['value' => (string) $companyCFSUP]],
    ];
  }
  
  if (count($customerUpdates) > 0) {
    mainLog("Will be update customer {$customerId}");
    $data = [
      'id' => (int) $customerId,
      'custom_fields_values' => $customerUpdates,
    ];
    mainLog(json_encode($data));
//    usleep(AMO_DELAY);
    $customerUpdatesResponse = updateCustomer($accessToken, [$data]);
    mainLog(json_encode($customerUpdatesResponse));
  }

  mainLog("Done {$customerId}");
  mainLog("Unset order {$orderId}");
  unsetNextOrder($orderId);
  exit;
}

// пришел вебхук на события с покупателем

$isCustomerUpdate = isset($_POST['customers']['update']);
$isCustomerNote = isset($_POST['customers']['note']);
$isCustomerTask = isset($_POST['task']['update']);
$isCustomerTaskClosed = (int) ($_POST['task']['update'][0]['action_close'] ?? 0);
$typeCustomerNote = (int) ($_POST['customers']['note'][0]['note']['note_type'] ?? ''); // need 15
$elementType = (int) ($_POST['customers']['note'][0]['note']['element_type'] ?? $_POST['task']['update'][0]['element_type'] ?? ''); // need 12
$taskType = (int) ($_POST['task']['update'][0]['task_type'] ?? 0);

$customerId = (int) ($_POST['customers']['update'][0]['id'] ?? $_POST['customers']['note'][0]['note']['element_id'] ?? $_POST['task']['update'][0]['element_id'] ?? 0);

if (
  $customerId <= 0
  || (
    $isCustomerTask
    && (
      $elementType !== 12
      || !$isCustomerTaskClosed
    )
  )
  || ( // 11- call-out, 15- mail
    $isCustomerNote
    && !in_array($typeCustomerNote, [10, 11, 15])
  )
) {
  mainLog('Wrong payload. Exit...');
  mainLog("Unset order {$orderId}");
  unsetNextOrder($orderId);
  exit;
}

if ($isCustomerTask && !in_array($taskType, ALLOW_TASK_IDS)) {
  mainLog('Wrong task type. Exit...');
  mainLog("Unset order {$orderId}");
  unsetNextOrder($orderId);
  exit;
}

$eventTime = 0;
if ($isCustomerNote || $isCustomerTask) {
  $eventTime = (int) ($_POST['task']['update'][0]['created_at'] ?? $_POST['customers']['note'][0]['note']['created_at'] ?? 0);
}

$customerResponse = getCustomer($accessToken, $customerId);
$customer = $customerResponse['data'] ?? [];
$customerCFS = preparedCustomFields($customer['custom_fields_values'] ?? [], 'field_id', true);
$customerCFSUP = $customerCFS[AMO_CUSTOMER_SAP_FIELD_ID] ?? '';
$customerCFLA = (int) ($customerCFS[AMO_CUSTOMER_LAST_ACTIVITY_FIELD_ID] ?? 0);
$companyId = (int) ($customer['_embedded']['companies'][0]['id'] ?? 0);
// usleep(AMO_DELAY);
$companyResponse = getCompany($accessToken, $companyId);
$company = $companyResponse['data'] ?? [];
$companyCFS = preparedCustomFields($company['custom_fields_values'] ?? [], 'field_id', true);
$companyCFSUP = $companyCFS[AMO_COMPANY_SAP_FIELD_ID] ?? '';

mainLog('customer');
mainLog(json_encode($customer));
mainLog('company');
mainLog(json_encode($company));

$customerUpdates = [];
$companyUpdates = [];
if ($eventTime > $customerCFLA) {
  $customerUpdates[] = [
    'field_id' => AMO_CUSTOMER_LAST_ACTIVITY_FIELD_ID,
    'values' => [['value' => (int) $eventTime]],
  ];
}

if ($customerCFSUP === '' && $companyCFSUP !== '') {
  $customerUpdates[] = [
    'field_id' => AMO_CUSTOMER_SAP_FIELD_ID,
    'values' => [['value' => (string) $companyCFSUP]],
  ];
}

if ($customerCFSUP !== '' && $customerCFSUP !== $companyCFSUP) {
  $companyUpdates[] = [
    'field_id' => AMO_COMPANY_SAP_FIELD_ID,
    'values' => [['value' => (string) $customerCFSUP]],
  ];
}

if (count($customerUpdates) > 0) {
  mainLog("Will be update customer {$customerId}");
  $data = [
    'id' => (int) $customerId,
    'custom_fields_values' => $customerUpdates,
  ];
  mainLog(json_encode($data));
//  usleep(AMO_DELAY);
  $customerUpdatesResponse = updateCustomer($accessToken, [$data]);
  mainLog(json_encode($customerUpdatesResponse));
}
if (count($companyUpdates) > 0) {
  mainLog("Will be update company {$companyId}");
  $data = [
    'id' => (int) $companyId,
    'custom_fields_values' => $companyUpdates,
  ];
  mainLog(json_encode($data));
//  usleep(AMO_DELAY);
  $companyUpdatesResponse = updateCompany($accessToken, [$data]);
  mainLog(json_encode($companyUpdatesResponse));
}

mainLog("Done {$orderId}");
mainLog("Unset order {$orderId}");
unsetNextOrder($orderId);
