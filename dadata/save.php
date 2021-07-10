<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
include __DIR__.'/functions.php';
cors();

saveSettings($_POST);

header('Content-type: application/json');

echo json_encode([
	'status' => true,
	'response' => [
		'widget_id' => WIDGET_ID, 
		'token' => $_POST['fields']['token'],
		'active' => 1,
	]
 ]);