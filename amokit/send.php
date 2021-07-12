<?php

/*
IntegratorAmo с любыми сайтами от 11.03.2018
*/

require_once('hamtimintegratoramo.php');

#if(0) include_once('responsible_user_id.php');

//определяем страницу откуда запрос
$_REQUEST['HTTP_REFERER'] = ''; if(isset($_SERVER['HTTP_REFERER'])) $_REQUEST['ia_url'] = $_SERVER['HTTP_REFERER'];
$_REQUEST['HTTP_HOST'] = ''; if(isset($_SERVER['HTTP_HOST']))  $_REQUEST['HTTP_HOST'] =  $_SERVER['HTTP_HOST'];

$_REQUEST = array_merge($_REQUEST, $_COOKIE);
$hamtimIntegratorAmo = new HamtimIntegratorAmo($_REQUEST);
