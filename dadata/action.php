<?php
ini_set('error_reporting', E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
include './functions.php';
cors();

$action = ltrim($_REQUEST['action'], '/');
$account_id = intval($_REQUEST['account_id']);
$token = $_REQUEST['token'];
if($action == 'suggest/save')
{
	$id = intval($_REQUEST['id']);
}



header('Content-type: application/json');
switch($action)
{
	case 'load':
		
/* 
https://391869-analytics3.tmweb.ru/amo/index.php
{"status":true,"response":{"active":true,"status":0,"status_to":"2021-03-11 00:00:00","status_expired":false,"price":100,"phone":"79691983653","api_key":"0f4accc986099a025a5a25b8a586c226c02d72cb","standard_key":"","balance":null,"months":[6,10],"gifts":[0,2],"user_count":11,"users":[{"id":6636472,"is_active":0},{"id":6556576,"is_active":0},{"id":6314362,"is_active":0},{"id":2397772,"is_active":0},{"id":1360129,"is_active":1},{"id":1805110,"is_active":0},{"id":6586963,"is_active":0},{"id":6390142,"is_active":0},{"id":2557357,"is_active":0},{"id":6204676,"is_active":0},{"id":1777039,"is_active":1}],"triggers":[{"id":2076,"field":"company.cf524179","entity":3,"type":"party","show_card":1,"active":1,"relations":[{"rewrite":true,"custom":false,"entity":"3","field":"company.name","value":"value"},{"rewrite":true,"custom":false,"entity":"3","field":"company.cf524179","value":"data.inn"},{"rewrite":true,"custom":false,"entity":"3","field":"company.cf595523","value":"data.kpp"}],"updated_by":1360129,"modified_at":"2021-03-07 23:31:35"}],"dictionaries":[]}}
*/		
		$data = getSettings($account_id);
		echo json_encode([
			'status' => true,
			'response' => $data,
		]);
		exit;
	break;
	case 'suggest/create':
		$data = createSuggest($account_id);
		echo json_encode([
			'status' => true,
			'response' => $data,
		]);
	break;
	case 'suggest/save':
		$data = saveSuggest($id);
		echo json_encode([
			'status' => true,
			'response' => $data,
		]);
	break;
	case 'suggest/remove':
		removeSuggest($account_id);
		echo json_encode([
			'status' => true,
			'response' => true
		]);
	break;
	case 'suggest/status':
		changeStatus($account_id);
		echo json_encode([
			'status' => true,
			'response' => true
		]);		
	break;
}
