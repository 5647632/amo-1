<?php

/*
IntegratorAmo с любыми сайтами от 28.03.2018
*/

//загружаем объект настройки
$settings = json_decode(file_get_contents('../settings.txt'));

if(!isset($settings))
{
	$old_settings = new stdClass();
}else{
	$old_settings = $settings;
}

if(!isset($settings)) $settings = new stdClass();
if(!isset($settings->requests)) $settings->requests = array();
if(!isset($settings->amocrm))
{
	$settings->amocrm = new stdClass();
	$settings->amocrm->api = '';
	$settings->amocrm->subdomain = '';
	$settings->amocrm->login = '';
	$settings->amocrm->leads_statuses = '';
	$settings->amocrm->leads_name = 'Новая заявка';
	$settings->amocrm->leads_tags = 'Заявка с сайта';
	$settings->amocrm->contactsFields = array();
	$settings->amocrm->leadsFields = array();
	$settings->amocrm->companiesFields = array();
	$settings->amocrm->checkFields = array();
	$settings->amocrm->pipelines = 0;
	$settings->amocrm->responsible_user_id = '';
	$settings->amocrm->redirect_url = '';
	$settings->amocrm->incoming_leads = false;
	$settings->lastrequests = array();
}
if(!isset($settings->lastrequests)) $settings->lastrequests = array();

if(isset($_GET['logout']))
{
	setcookie("auth","",time()-3600*24*30,"/");
	header( 'Location: login.php?rand='.rand() );
	die();
}

if(isset($_GET['password']))
{
	if(!isset($settings->password))
	{
		$settings->password = md5("");
		setcookie("auth",md5(""),time()+3600*24*30,"/");
	}
		
	if( md5($_GET['password']) == $settings->password )
	{
		setcookie("auth",md5($_GET['password']),time()+3600*24*30,"/");
		header( 'Location: admin.php?rand='.rand() ); die();
	}else{
		$settings->error_auth = time();
		file_put_contents('../settings.txt', json_encode($settings));
		setcookie("auth","",time()-3600*24*30,"/");
		header( 'Location: login.php?rand='.rand() );
		die();
	}
	die();
}else if(!isset($_COOKIE['auth']))
{
	setcookie("auth","",time()-3600*24*30,"/");
	header( 'Location: login.php?rand='.rand() ); die();
}else{
	if(!isset($settings->password))
	{
		$settings->password = md5("");
		setcookie("auth",md5(""),time()+3600*24*30,"/");
		$_COOKIE['auth'] = md5("");
	}
	
	if($_COOKIE['auth'] != $settings->password)
	{
		$settings->error_auth = time();
		file_put_contents('../settings.txt', json_encode($settings));
		setcookie("auth","",time()-3600*24*30,"/");
		header( 'Location: login.php?rand='.rand() );
		die();
	}
}

#значения чекбоксов и списков по умолчанию
if(!isset($settings->amocrm->not_create_leads)) $settings->amocrm->not_create_leads = false;
if(!isset($settings->amocrm->not_create_leads_on_dublicate)) $settings->amocrm->not_create_leads_on_dublicate = false;
if(!isset($settings->amocrm->not_create_tasks_on_dublicate)) $settings->amocrm->not_create_tasks_on_dublicate = false;
if(!isset($settings->amocrm->not_create_leads_on_dublicate_and_open_leads)) $settings->amocrm->not_create_leads_on_dublicate_and_open_leads = false;

if(!isset($settings->amocrm->incoming_leads)) $settings->amocrm->incoming_leads = false;
if(!isset($settings->amocrm->auto_fields_off)) $settings->amocrm->auto_fields_off = false;
if(!isset($settings->amocrm->hide_fields_from_notes)) $settings->amocrm->hide_fields_from_notes = false;
if(!isset($settings->amocrm->hide_fields_from_tasks)) $settings->amocrm->hide_fields_from_tasks = false; 

$update = false;

#обновляем доступы
if(isset($_POST['update_access']))
{
	#хэш ключ апи
	if(isset($_POST['api'])) $settings->amocrm->api = $_POST['api'];

	#логин апи
	if(isset($_POST['login'])) $settings->amocrm->login = $_POST['login'];

	#субдомен апи
	if(isset($_POST['subdomain'])) $settings->amocrm->subdomain = $_POST['subdomain'];
	
	#изменить пароль на админку
	if(isset($_POST['setpassword']))
	{
		if( strlen($_POST['setpassword']) > 0 )
		{
			$settings->password = md5( $_POST['setpassword'] );
			setcookie("auth",md5($_POST['setpassword']),time()+3600*24*30,"/");
		}
	}
	
	//обновляем файл настроек
	file_put_contents('../settings.txt', json_encode($settings));
	header( 'Location: '.basename($_SERVER['SCRIPT_NAME']).'?rand='.rand() ); die();
}

#обновляем настройки, если форма отправлена
if(isset($_POST['update_settings']))
{
	
	#добавления поля
	if(isset($_POST['add_field']))
	{
		if($_POST['add_field'])
		{
			$settings->requests[] = $_POST['add_field'];
		}
	}
	
	#удаление полей
	if(isset($_POST['deleteFields']))
	{
		$newFieldsArray = array();
		foreach($settings->requests as $key=>$value)
		{
			if(!isset($_POST['deleteFields'][$value]))
			{
				$newFieldsArray[] = $settings->requests[$key];
			}
		}
		$settings->requests = $newFieldsArray;
	}
	
	#отвественный
	if(isset($_POST['responsible_user_id'])) $settings->amocrm->responsible_user_id = $_POST['responsible_user_id'];
	
	#воронка
	if(isset($_POST['pipelines']))	$settings->amocrm->pipelines = $_POST['pipelines'];

	#статус
	if(isset($_POST['leads_statuses'])) $settings->amocrm->leads_statuses = $_POST['leads_statuses'];

	#название сделки
	if(isset($_POST['leads_name'])) $settings->amocrm->leads_name = $_POST['leads_name'];

	#тэг сделки
	if(isset($_POST['leads_tags'])) $settings->amocrm->leads_tags = $_POST['leads_tags'];

	#поля контакта
	if(isset($_POST['contactsFields'])) $settings->amocrm->contactsFields = $_POST['contactsFields'];

	#отмеченные на проверку на дубли
	if(isset($_POST['checkFields']))
	{
		$settings->amocrm->checkFields = $_POST['checkFields'];
	}else{
		$settings->amocrm->checkFields = array();
	}

	#поля сделки
	if(isset($_POST['leadsFields'])) $settings->amocrm->leadsFields = $_POST['leadsFields'];

	#поля компании
	if(isset($_POST['companiesFields'])) $settings->amocrm->companiesFields = $_POST['companiesFields'];

	#адрес для переадресации
	if(isset($_POST['redirect_url'])) $settings->amocrm->redirect_url = $_POST['redirect_url'];


	#изменяемый id статуса в поле
	if(isset($_POST['dinamyc_leads_statuses'])) $settings->amocrm->dinamyc_leads_statuses = $_POST['dinamyc_leads_statuses'];

	#изменяеый id тег в поле
	if(isset($_POST['dinamyc_leads_tags'])) $settings->amocrm->dinamyc_leads_tags = $_POST['dinamyc_leads_tags'];

	#изменяеый id отвественного в поле
	if(isset($_POST['dinamyc_responsible_user_id'])) $settings->amocrm->dinamyc_responsible_user_id = $_POST['dinamyc_responsible_user_id'];
	
	#изменяемая страница переадресации в поле
	if(isset($_POST['dinamyc_redirect_url'])) $settings->amocrm->dinamyc_redirect_url = $_POST['dinamyc_redirect_url'];

	#выбор показывать отмеченные поля или нет
	if(isset($_POST['showCheckedFieldsSelect']))
	{
		if($_POST['showCheckedFieldsSelect'])
		{
			$settings->amocrm->showCheckedFieldsSelect = true;
		}else{
			$settings->amocrm->showCheckedFieldsSelect = false;
		}
	}else{
		$settings->amocrm->showCheckedFieldsSelect = false;
	}

	#изменяемые id воронки для неразобранного
	if(isset($_POST['dinamyc_pipelines'])) $settings->amocrm->dinamyc_pipelines = $_POST['dinamyc_pipelines'];

	#неразобранное
	if(isset($_POST['incoming_leads']))
	{
		if(!$settings->amocrm->incoming_leads)
		{
			$settings->amocrm->incoming_leads = true;
		}
	}else{
		if($settings->amocrm->incoming_leads)
		{
			$settings->amocrm->incoming_leads = false;
		}
	}
	
	#отключение автосбора полей
	if(isset($_POST['auto_fields_off']))
	{
		if(!$settings->amocrm->auto_fields_off)
		{
			$settings->amocrm->auto_fields_off = true;
		}
	}else{
		if($settings->amocrm->auto_fields_off)
		{
			$settings->amocrm->auto_fields_off = false;
		}
	}
	
	#не создавать задачи, если дубль
	if(isset($_POST['not_create_tasks_on_dublicate']))
	{
		if(!$settings->amocrm->not_create_tasks_on_dublicate)
		{
			$settings->amocrm->not_create_tasks_on_dublicate = true;
		}
	}else{
		if($settings->amocrm->not_create_tasks_on_dublicate)
		{
			$settings->amocrm->not_create_tasks_on_dublicate = false;
		}
	}
	
	#не создавать сделки, если дубль и открытые сделки
	if(isset($_POST['not_create_leads_on_dublicate_and_open_leads']))
	{
		if(!$settings->amocrm->not_create_leads_on_dublicate_and_open_leads)
		{
			$settings->amocrm->not_create_leads_on_dublicate_and_open_leads = true;
		}
	}else{
		if($settings->amocrm->not_create_leads_on_dublicate_and_open_leads)
		{
			$settings->amocrm->not_create_leads_on_dublicate_and_open_leads = false;
		}
	}
	
	#не создавать сделки, если дубль
	if(isset($_POST['not_create_leads_on_dublicate']))
	{
		if(!$settings->amocrm->not_create_leads_on_dublicate)
		{
			$settings->amocrm->not_create_leads_on_dublicate = true;
		}
	}else{
		if($settings->amocrm->not_create_leads_on_dublicate)
		{
			$settings->amocrm->not_create_leads_on_dublicate = false;
		}
	}
	
	#не создавать сделки
	if(isset($_POST['not_create_leads']))
	{
		if(!$settings->amocrm->not_create_leads)
		{
			$settings->amocrm->not_create_leads = true;
		}
	}else{
		if($settings->amocrm->not_create_leads)
		{
			$settings->amocrm->not_create_leads = false;
		}
	}
	
	#скрыть поля из примечания
	if(isset($_POST['hide_fields_from_notes']))
	{
		if(!$settings->amocrm->hide_fields_from_notes)
		{
			$settings->amocrm->hide_fields_from_notes = true;
		}
	}else{
		if($settings->amocrm->hide_fields_from_notes)
		{
			$settings->amocrm->hide_fields_from_notes = false;
		}
	}
	
	#скрыть поля из задачи
	if(isset($_POST['hide_fields_from_tasks']))
	{
		if(!$settings->amocrm->hide_fields_from_tasks)
		{
			$settings->amocrm->hide_fields_from_tasks = true;
		}
	}else{
		if($settings->amocrm->hide_fields_from_tasks)
		{
			$settings->amocrm->hide_fields_from_tasks = false;
		}
	}
	
	#позазывать/не показывать отмеченные поля
	if(!$settings->amocrm->showCheckedFields)
	{
		$settings->amocrm->showCheckedFields = array();
	}
	if(isset($_POST['showCheckedFields']))
	{
		$settings->amocrm->showCheckedFields = $_POST['showCheckedFields'];
	}else{
		$settings->amocrm->showCheckedFields = array();
	}
	
	//обновляем файл настроек
	file_put_contents('../settings.txt', json_encode($settings));
	header( 'Location: '.basename($_SERVER['SCRIPT_NAME']).'?rand='.rand() ); die();
}


$auth = false;

#пробуем авторизоваться в api amocrm
if($settings->amocrm->api&&$settings->amocrm->login&&$settings->amocrm->subdomain)
{
	$auth = amocrm_auth(
	$settings->amocrm->subdomain, $user=array(
	'USER_LOGIN'=>$settings->amocrm->login,
	'USER_HASH'=>$settings->amocrm->api)
	);
	$auth = json_decode($auth);
	//echo '<pre>'.print_r($auth,1).'</pre>';
	$auth = $auth->response->auth;
}
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>Настройка интеграции</title>
	<style>
	body, html {
		font: 15px 'PT Sans',Arial,sans-serif;
		color: #2e3640;
	}
	body{
		padding: 10px;
		background-color: #f5f5f5;
		text-align: center;
	}
	form{
		margin: 0;
	}
	input, select{
		width: 100%;
		border: 1px solid #dbdedf;
		border-radius: 3px;
		font-size: 15px;
		height: 36px;
		padding: 8px 9px 7px;
		box-sizing: border-box;
		color: #313942;
		background: #fff;
	}
	table{
		/*display: inline-block;*/
		margin-top: 30px;
		padding: 10px;
		background-color: #ffffff;
		width: 100%;
		border-radius: 3px;
		/*max-width: 1000px;*/
	}
	tr{
		width: 100%;
	}
	td{
		margin: 2px;
		padding: 2px;
	}
	h1, h2, h3{
		text-align: center;
	}
	button{
		border: 1px solid #4077d6;
		background: #4c8bf7;
		color: #fff;
		max-height: 38px;
		padding: 10px;
		border-radius: 3px;
		vertical-align: middle;
		font-size: 14px;
		line-height: 14px;
		cursor: pointer;
		outline: none;
		white-space: nowrap;
	}
	.center{
		text-align: center;
	}
	pre {
		max-width: 300px;
		overflow-x: auto;
	}
	</style>
</head>
<body>
<div style="display: inline-block;">
<h1>Интегратор любых сайтов на php с AmoCRM</h1>
<p><a href="https://amokit.ru">Страница продукта</a> | Поддержка: <a href="mailto:support@amokit.ru">support@amokit.ru</a> | <a href="?logout=1">Выход</a><p>
<form method="post">
<input type="hidden" name="update_access" value="1">
<table>
<tr>
	<th style="width: 25%;">Субдомен адреса аккаунта</th>
	<th style="width: 25%;">Ваш логин (электронная почта)</th>
	<th style="width: 25%;">Хэш для доступа к API (смотрите в профиле пользователя)</th>
	<th style="width: 25%;">Новый пароль для входа в админ-панель</th>
</tr>
<tr>
	<td><input type="text" name="subdomain" value="<?=$settings->amocrm->subdomain?>"></td>
	<td><input type="text" name="login" value="<?=$settings->amocrm->login?>"></td>
	<td><input type="text" name="api" value="<?=$settings->amocrm->api?>"></td>
	<td><input type="text" name="setpassword"></td>
</tr>
<tr>
	<td colspan="4"><button type="submit">Сохранить</button></td>
</tr>
</table>
</form>
<?php
if($auth){
	$path = '/private/api/v2/json/accounts/current';
	$fields = array();
	$accountsAnswer = amocrm_query($path, $fields,$settings->amocrm->subdomain);
	$account = $accountsAnswer->response->account;
	//echo '<pre>'.print_r($account,1).'</pre>';
?>
</table>

<script>
var pipelines = <?php echo json_encode($account->pipelines); ?>;
function print_leads_statuses(id)
{
	var options = '';
	
	for(var index in pipelines[id].statuses) { 
		var attr = pipelines[id].statuses[index]; 
		options += '<option value="'+attr.id+'" style="background-color: '+attr.color+'">'+attr.name+'</option>';
	}
	//console.log(pipelines[id].statuses);//id name color
	var select = document.getElementById('leads_statuses');
	select.innerHTML = options;
}
</script>

<form method="post">
<input type="hidden" name="update_settings" value="1">
<table>
<tr>
	<th style="width: 16%;">Воронка для новых сделок</th>
	<th style="width: 16%;">Статус для новых сделок с сайта</th>
	<th style="width: 16%;">Название сделки</th>
	<th style="width: 16%;">Теги сделки (через запятую)</th>
	<th style="width: 16%;">Отвественный</th>
	<th style="width: 16%;">Страница спасибо (url-адрес полностью)</th>
</tr>
<tr>
<td>
<select name="pipelines" onchange="print_leads_statuses(this.options[this.selectedIndex].value)">
<?php
	$main_pipeline = 0;
	foreach($account->pipelines as $s)
	{
		$selected = null;
		if($s->id == $settings->amocrm->pipelines) $selected = ' selected="selected"'; 
		echo '<option value="'.$s->id.'" '.$selected.'>'.$s->label.' ['.$s->id.']</option>';
		if($s->is_main) $main_pipeline = $s->id;
	}
	//echo '<pre>'.print_r($account->pipelines->$main_pipeline->statuses,1).'</pre>';
?>
</select>
</td>
	<td>
<select name="leads_statuses" id="leads_statuses">
<?php
	$pipeline_id = $main_pipeline;
	if($settings->amocrm->pipelines) $pipeline_id = $settings->amocrm->pipelines;
	foreach($account->pipelines->$pipeline_id->statuses as $s)
	{
		$selected = null;
		if($s->id == $settings->amocrm->leads_statuses) $selected = ' selected="selected"'; 
		echo '<option value="'.$s->id.'" style="background-color: '.$s->color.'"'.$selected.'>'.$s->name.' ['.$s->id.']</option>';
	}
?>
</select>
</td>
<td>
<input type="text" name="leads_name" value="<?=$settings->amocrm->leads_name?>">
</td>
<td>
<input type="text" name="leads_tags" value="<?=$settings->amocrm->leads_tags?>">
</td>
<td>
<select name="responsible_user_id" id="responsible_user_id">
<option></option>
<?php
	foreach($account->users as $u)
	{
		$selected = null;
		if($u->id == $settings->amocrm->responsible_user_id) $selected = ' selected="selected"'; 
		echo '<option value="'.$u->id.'"'.$selected.'>'.$u->name.'</option>';
	}
?>
</select>
</td>
<td>
<input type="text" name="redirect_url" value="<?=$settings->amocrm->redirect_url?>">
</td>
</tr>
<tr>
<td></td>
<td>
<p>получать id статуса для новой сделки из поля:</p>
<select name="dinamyc_leads_statuses">
<option></option>
<?php 
foreach($settings->requests as $n=>$r)
{
	$selected = '';
	if($r == $settings->amocrm->dinamyc_leads_statuses) $selected = ' selected="selected"';
	echo '<option value="'.$r.'" '.$selected.'>'.$r.'</option>';
}
?>
</select>
</td>
<td></td>
<td>
<p>получать теги из поля <br/>(через запятую):</p>
<select name="dinamyc_leads_tags">
<option></option>
<?php 
foreach($settings->requests as $n=>$r)
{
	$selected = '';
	if($r == $settings->amocrm->dinamyc_leads_tags) $selected = ' selected="selected"';
	echo '<option value="'.$r.'" '.$selected.'>'.$r.'</option>';
}
?>
</select>
</td>
<td>
<p>получать id ответственного из поля:</p>
<select name="dinamyc_responsible_user_id">
<option></option>
<?php 
foreach($settings->requests as $n=>$r)
{
	$selected = '';
	if($r == $settings->amocrm->dinamyc_responsible_user_id) $selected = ' selected="selected"';
	echo '<option value="'.$r.'" '.$selected.'>'.$r.'</option>';
}
?>
</select>
</td>
<td>
<p>получать url страницы спасибо из поля:</p>
<select name="dinamyc_redirect_url">
<option></option>
<?php 
foreach($settings->requests as $n=>$r)
{
	$selected = '';
	if($r == $settings->amocrm->dinamyc_redirect_url) $selected = ' selected="selected"';
	echo '<option value="'.$r.'" '.$selected.'>'.$r.'</option>';
}
?>
</select>
</td>
</tr>
</table>

<table>

<tr>
<th colspan="4">Создание сделок (выберите одну опцию)</th>
</tr>

<tr>
<td><p>Не создавать сделки
<input type="checkbox" name="not_create_leads" <?php  if($settings->amocrm->not_create_leads){ echo 'checked="checked"'; } ?>></td>
<td><p>Не создавать сделку, если контакт существует (дубль)
<input type="checkbox" name="not_create_leads_on_dublicate" <?php  if($settings->amocrm->not_create_leads_on_dublicate){ echo 'checked="checked"'; } ?>></td>
<td><p>Не создавать сделку, если контакт существует (дубль) и есть открытая сделка
<input type="checkbox" name="not_create_leads_on_dublicate_and_open_leads" <?php  if($settings->amocrm->not_create_leads_on_dublicate_and_open_leads){ echo 'checked="checked"'; } ?>></td>
<td>
<p>Отправлять обращения в неразобранное (проверка на дубли не поддерживается)
<input type="checkbox" name="incoming_leads" <?php  if($settings->amocrm->incoming_leads){ echo 'checked="checked"'; } ?>>
</p><p>
</td>
</tr>

<tr>
<td colspan="4"></td>
</tr>

<tr>
<th colspan="4">Дополнительные опции</th>
</tr>

<tr>
<td><p>Не создавать задачи
<input type="checkbox" name="not_create_tasks_on_dublicate" <?php  if($settings->amocrm->not_create_tasks_on_dublicate){ echo 'checked="checked"'; } ?>></td>
<td><p>Отключить сбор полей
<input type="checkbox" name="auto_fields_off" <?php  if($settings->amocrm->auto_fields_off){ echo 'checked="checked"'; } ?>></td>
<td></td>
<td>
Получать ID воронки неразобранного из поля 
<select name="dinamyc_pipelines" style="max-width: 100px;">
<option></option>
<?php 
foreach($settings->requests as $n=>$r)
{
	$selected = '';
	if($r == $settings->amocrm->dinamyc_pipelines) $selected = ' selected="selected"';
	echo '<option value="'.$r.'" '.$selected.'>'.$r.'</option>';
}
?>
</select>
</p>
</td></table>
<br/>
<table style="margin-top: 0" class="table table-striped">
<tr>
	<th style="width: 5%;">Уда<br/>-лить
	<th style="width: 20%;">
		<select name="showCheckedFieldsSelect">
			<option value="0" <?php if(!$settings->amocrm->showCheckedFieldsSelect) echo 'selected="selected"'; ?>>Не показывать</option>
			<option value="1" <?php if($settings->amocrm->showCheckedFieldsSelect) echo 'selected="selected"'; ?>>Показывать только</option>
		</select>
		 отмеченные поля в примечании и задачах
	</th>
	<th style="width: 20%;">Поле в Формах на Сайте</th>
	<th style="width: 5%;">Проверка контакта на дубль по полям</th>
	<th style="width: 25%;">Поле в Контактах AmoCRM</th>
	<th style="width: 25%;">Поле в Сделках AmoCRM</th>
	<th style="width: 20%;">Поле в Компаниях AmoCRM</th>
</tr>
<?php 
foreach($settings->requests as $n=>$r)
{
	$checked = '';
	if(is_checked($settings->amocrm->checkFields,$r))
	{
		$checked = ' checked="checked" ';
	}
	$showChecked = '';
	if(is_checked($settings->amocrm->showCheckedFields,$r))
	{
		$showChecked = ' checked="checked" ';
	}
	?>
	<tr>
		<td><input type="checkbox" name="deleteFields[<?=$r?>]"></td>
		<td><input type="checkbox" name="showCheckedFields[<?=$r?>]" <?=$showChecked?>></td>
		<td style="text-align: left;">
			<p style="margin:0"><?=$r?></p>
			<?php 
				if(isset($settings->lastrequests->$r))
				{
					echo '<pre style="margin:0; color: gray;">'.htmlspecialchars($settings->lastrequests->$r).'</pre>';
				}
			?>
		</td>
		<td><input type="checkbox" name="checkFields[<?=$r?>]" <?=$checked?>></td>
		<td><?=print_select($r, 'contactsFields',$account->custom_fields->contacts,$settings->amocrm->contactsFields)?></td>
		<td><?=print_select($r, 'leadsFields',$account->custom_fields->leads,$settings->amocrm->leadsFields)?></td>
		<td><?=print_select($r, 'companiesFields',$account->custom_fields->companies,$settings->amocrm->companiesFields)?></td>
	</tr>
	<?php
}
?>
<tr>
	<td colspan="4" style="text-align: right;">Добавить поле по идентификатору (атрибут name) вручную: </td><td colspan="2"><input type="text" name="add_field"></td>
</tr>
<tr>
	<td colspan="6"><button type="submit" name="update">Сохранить</button></td>
</tr>
</table></form><?php 
}else{
	echo 'Введите верные параметры подключения к api AmoCRM';
	echo '<pre>'; print_r($auth); echo '</pre>';
	if(count($settings->requests)){
		echo '<br/>Определены поля в формах: <br/>';
		foreach($settings->requests as $k=>$r)
		{
			echo $r;
			if($k < (count($settings->requests)-1)) echo ', ';
		}
	}else{
		echo '<br/>Поля в формах не определены';
	}
}

function is_checked($array,$string)
{
	foreach($array as $k=>$a)
	{
		if($k == $string)
		{
			return true;
		}
	}
	return false;
}

function print_select($postname, $selectName,$fields,$settings)
{
	if($selectName == 'contactsFields')
	{
		$i1 = new stdClass();
		$i1->id = 'name';
		$i1->name = 'Имя';

		$i2 = new stdClass();
		$i2->id = 'company_name';
		$i2->name = 'Имя компании';

		$i3 = new stdClass();
		$i3->id = 'request_id';
		$i3->name = 'Уникальный идентификатор записи в клиентской программе';
		array_unshift($fields,$i1,$i2,$i3);
	}else if($selectName == 'leadsFields')
	{
		$e1 = new stdClass();
		$e1->id = 'name';
		$e1->name = 'Имя';

		$e2 = new stdClass();
		$e2->id = 'sale';
		$e2->name = 'Бюджет сделки';
		
		array_unshift($fields,$e1,$e2);
	}else if($selectName == 'companiesFields')
	{
		$c1 = new stdClass();
		$c1->id = 'name';
		$c1->name = 'Имя';

		$c2 = new stdClass();
		$c2->id = 'request_id';
		$c2->name = 'Уникальный идентификатор записи в клиентской программе';
		array_unshift($fields,$c1,$c2);
	}
	$html = '<select name="'.$selectName.'['.$postname.']">';
	$html .= '<option value="">Не использовать</option>';
	foreach($fields as $f)
	{
		$selected = '';
		$enum_val = '';
		$enum_text = '';
		if(isset($f->enums))
		{
			foreach($f->enums as $enum)
			{
				$selected = '';
				$enum_val = '-'.$enum;
				$enum_text = ' ('.$enum.') ';
				
				if(isset($settings->$postname))
				{
					if($f->id.''.$enum_val == $settings->$postname) $selected = ' selected="selected"';
				}
				
				$html .= '<option '.$selected.' value="'.$f->id.$enum_val.'">'.$f->name.' '.$enum_text.'</option>';
			}
		}
		
		if(isset($settings->$postname))
		{
			if($f->id == $settings->$postname) $selected = ' selected="selected"';
		}
		
		$html .= '<option '.$selected.' value="'.$f->id.'">'.$f->name.'</option>';
		
	}
	$html .= '</select>';
	return $html;
}

function amocrm_auth(
	$subdomain = '', $user=array(
	'USER_LOGIN'=>'',
	'USER_HASH'=>''
	)
){			
	$link='https://'.$subdomain.'.amocrm.ru/private/api/auth.php?type=json';
	$curl=curl_init(); #Сохраняем дескриптор сеанса cURL
	#Устанавливаем необходимые опции для сеанса cURL
	curl_setopt($curl,CURLOPT_RETURNTRANSFER,true);
	curl_setopt($curl,CURLOPT_USERAGENT,'amoCRM-API-client/1.0');
	curl_setopt($curl,CURLOPT_URL,$link);
	curl_setopt($curl,CURLOPT_POST,true);
	if (version_compare(PHP_VERSION, '5.5.0') >= 0) {
		$postfields = http_build_query($user,null,'&',PHP_QUERY_RFC1738);
	}else{
		$postfields = http_build_query($user);
	}
	curl_setopt($curl,CURLOPT_POSTFIELDS,$postfields);
	curl_setopt($curl,CURLOPT_HEADER,false);
	curl_setopt($curl,CURLOPT_COOKIEFILE,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
	curl_setopt($curl,CURLOPT_COOKIEJAR,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
	curl_setopt($curl,CURLOPT_SSL_VERIFYPEER,0);
	curl_setopt($curl,CURLOPT_SSL_VERIFYHOST,0);

	$out=curl_exec($curl); #Инициируем запрос к API и сохраняем ответ в переменную
	$code=curl_getinfo($curl,CURLINFO_HTTP_CODE); #Получим HTTP-код ответа сервера
	curl_close($curl); #Заверашем сеанс cURL
	return $out;
}

function amocrm_query($path, $fields, $subdomain = '')
{
	$link='https://'.$subdomain.'.amocrm.ru'.$path;

	$curl=curl_init(); #Сохраняем дескриптор сеанса cURL
	#Устанавливаем необходимые опции для сеанса cURL
	curl_setopt($curl,CURLOPT_RETURNTRANSFER,true);
	curl_setopt($curl,CURLOPT_USERAGENT,'amoCRM-API-client/1.0');
	curl_setopt($curl,CURLOPT_URL,$link);
	if (version_compare(PHP_VERSION, '5.5.0') >= 0) {
		$postfields = http_build_query($fields,null,'&',PHP_QUERY_RFC1738);
	}else{
		$postfields = http_build_query($fields);
	}
	if( count($fields) ){
		curl_setopt($curl,CURLOPT_CUSTOMREQUEST,'POST');
		curl_setopt($curl,CURLOPT_POSTFIELDS,$postfields);
		curl_setopt($curl,CURLOPT_HTTPHEADER,array('Content-Type: application/json'));
	}
	curl_setopt($curl,CURLOPT_HEADER,false);
	curl_setopt($curl,CURLOPT_COOKIEFILE,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
	curl_setopt($curl,CURLOPT_COOKIEJAR,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
	curl_setopt($curl,CURLOPT_SSL_VERIFYPEER,0);
	curl_setopt($curl,CURLOPT_SSL_VERIFYHOST,0);
	 
	$out=curl_exec($curl); #Инициируем запрос к API и сохраняем ответ в переменную
	$code=curl_getinfo($curl,CURLINFO_HTTP_CODE);
	
	return json_decode( $out );
}
?>
</div>
</body>
</html>