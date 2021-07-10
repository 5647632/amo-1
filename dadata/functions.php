<?php
$db = new SQLite3(__DIR__.'/data/sqlite3.db');
define('WIDGET_ID', 1);

function cors()
{
	// Allow from any origin
	if (isset($_SERVER['HTTP_ORIGIN'])) {
		// Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
		// you want to allow, and if so:
		header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
		header('Access-Control-Allow-Credentials: true');
		header('Access-Control-Max-Age: 86400');    // cache for 1 day
	}

	// Access-Control headers are received during OPTIONS requests
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

		if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
			// may also be using PUT, PATCH, HEAD etc
			header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

		if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
			header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

		exit(0);
	}
}

function getArgType($arg)
{
    switch (gettype($arg))
    {
        case 'double': return SQLITE3_FLOAT;
        case 'integer': return SQLITE3_INTEGER;
        case 'boolean': return SQLITE3_INTEGER;
        case 'NULL': return SQLITE3_NULL;
        case 'string': return SQLITE3_TEXT;
        case 'array': return SQLITE3_TEXT;
    }
}

function getSettings($account_id)
{
	global $db;
	$stmt = $db->prepare('SELECT * FROM settings WHERE account_id = :account_id');
	$stmt->bindParam(':account_id', $account_id, getArgType($account_id));
	$result = $stmt->execute();
	$data = $result->fetchArray(SQLITE3_ASSOC);
	$stmt->close();

	$data['active'] = true;
	$data['status_expired'] = false;
	$data['status_to'] ='2025-03-11 00:00:00';
	$data['status'] = 0;
	$data['triggers'] = getTriggers($account_id);

	$users = [];
	$active_users = json_decode($data['active_users'], true);
	foreach($active_users as $user_id)
	{
		array_push($users, ['id' => $user_id, 'is_active' => 1]);
	}
	$data['users'] = $users;
	unset($data['active_users']);

	return fixBoolArray($data);
}

function saveSettings($post)
{
	global $db;
	$data = [];
	$data['account_id'] = filterInt($post['account']['id']);
	$active_users = [];
	foreach($post['fields']['active_users'] as $user_id => $active)
	{
		if($active == 1)
		{
			array_push($active_users, $user_id);
		}
	}
	$post['fields']['api_key'] = $post['fields']['api_token'];
	$post['fields']['standard_key'] = $post['fields']['standard_token'];
	unset($post['fields']['active_users'], $post['fields']['api_token'], $post['fields']['standard_token']);
	$data = array_merge($data, $post['fields']);
	$data['active_users'] = json_encode($active_users);
	$stmt = $db->prepare('REPLACE INTO settings '.getInsertKeys($data).' VALUES '.getInsertValues($data));
	$stmt->execute();
	$stmt->close();
}

function createSuggest($account_id)
{
	global $db;
	$data = [];
	$data['created_at'] = date('Y-m-d H:i:s');
	$data['modified_at'] = date('Y-m-d H:i:s');
	$data['widget_id'] = WIDGET_ID;
	$data['entity'] = 3;
	$data['type'] = 'party';
	$data['show_card'] = 1;
	$data['active'] = 1;
	$data['updated_by'] = filterInt($_POST['user_id']);
 	$stmt = $db->prepare('INSERT INTO suggest '.getInsertKeys($data).' VALUES '.getInsertValues($data));
	$stmt->execute();
	$stmt->close();
	$data['id'] = $db->lastInsertRowID();
	return $data;
}

function saveSuggest($id)
{
	global $db;

	$data = [];
	$data['updated_by'] = (int) $_POST['user_id'];
	$data['modified_at'] = date('Y-m-d H:i:s');
	$data['entity'] = $_POST['entity'];
	$data['type'] = $_POST['type'];
	$data['field'] = $_POST['field'];
	$suggest = getSuggest($id);
	$data['active'] = $suggest['active'];
	if($_POST['show_card'])
	{
		$data['show_card'] = 1;//(int) $_POST['show_card'];
	}
	
	$data['account_id'] = (int) $_POST['account_id'];

	$stmt = $db->prepare('UPDATE suggest SET '.getUpdateSet($data).' WHERE id = '.intval($id));

	$data['relations'] = saveRelations($id);
	$stmt->execute();
	$stmt->close();
	$data['id'] = $id;

	return fixBoolArray($data);
}

function getSuggest($id)
{
	global $db;
	$result = $db->query('SELECT * FROM suggest WHERE id = "'.intval($id).'"');
	return $result->fetchArray(SQLITE3_ASSOC);
}

function getTriggers($account_id)
{
	global $db;
	$triggers = [];
	$result = $db->query('SELECT * FROM suggest WHERE account_id = "'.intval($account_id).'"');
	while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
		
		$row['relations'] = getRelations($row['id']);
		array_push($triggers, $row);
	}
	//$triggers = modifyTriggers($triggers);
	return $triggers;
}

function modifyTriggers($triggers)
{
	$result = [];
	foreach($triggers as $trigger)
	{
		array_push($result, $trigger);
		if(intval($trigger['entity']) == 3)
		{
			$newTrigger = $trigger;
			$newTrigger['id'] = uniqid();
			$newTrigger['entity'] = 12;
			array_push($result, $newTrigger);
		}
	}
	return $result;
}


function getRelations($id)
{
	global $db;
	$relations = [];
	$result = $db->query('SELECT * FROM triggers WHERE suggest_id = '.intval($id));
	while ($row = $result->fetchArray(SQLITE3_ASSOC)) {

		$row['entity'] = (string) $row['entity'];
		array_push($relations, $row);
	}
	return $relations;
}

function saveRelations($id)
{
	global $db;
	if(!isset($_POST['relations']) || empty($_POST['relations'])) return false;

	$stmt = $db->prepare('DELETE FROM triggers WHERE suggest_id = :suggest_id');
	$stmt->bindValue(':suggest_id', $id, getArgType($id));
	$stmt->execute();

	$data = [];
	foreach($_POST['relations'] as $relation)
	{
		$relation['suggest_id'] = $id;
		$stmt = $db->prepare('INSERT INTO triggers '.getInsertKeys($relation).' VALUES '.getInsertValues($relation));
		$stmt->execute();
		unset($relation['suggest_id']);
		$relation['entity'] = (string) $relation['entity'];
		array_push($data, $relation);
	}

	$stmt->close();
	return $data;


}

function fixBool($arg)
{
	if($arg == 'true') return true;
	if($arg == 'false') return false;
	return $arg;
}

function fixBoolArray($arg)
{
	if(is_array($arg))
	{
		foreach($arg as $k => $v)
		{
			if(is_array($v)) $arg[$k] = fixBoolArray($v);
			else $arg[$k] = fixBool($v);
		}
	}
	return $arg;
}



function getUpdateSet(Array $data)
{
	$set = [];
	foreach($data as $k => $v)
	{
		if(is_bool($v)) $v = intval($v);
		if($k != 'relations') $v = '"'.$v.'"';
		array_push($set, '`'.$k.'` = '.$v);
	}
	return implode(', ' ,$set);
}

function getInsertKeys(Array $array)
{
	return '(`'.implode('`, `', array_keys($array)).'`)';
}

function getInsertValues(Array $array)
{
	return '("'.implode('", "', array_values($array)).'")';
}

function removeSuggest($account_id)
{
	global $db;
	$ids = filterInt($_GET['id']);
	$stmt = $db->prepare('DELETE FROM suggest WHERE id IN ('.  implode(',', $ids).')');
	$stmt->execute();
}

function changeStatus($account_id)
{
	global $db;
	$active = (bool) $_POST['active'];
	$ids = filterInt($_POST['id']);
	$stmt = $db->prepare('UPDATE suggest set active = :active WHERE id IN ('.  implode(',',  $ids).')');
	$stmt->bindValue(':active', $active, getArgType($active));
	$stmt->execute();
}

function filterInt($arg)
{
	if(is_array($arg))
	{
		foreach($arg as $k => $v)
		{
			$arg[$k] = (int) filter_var($v, FILTER_SANITIZE_NUMBER_INT);
		}
	} else {
		$arg = (int) filter_var($arg, FILTER_SANITIZE_NUMBER_INT);
	}
	return $arg;
}