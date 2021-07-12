<?php 
$settings = json_decode(file_get_contents('../settings.txt'));
?><!DOCTYPE html>
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
<h1>Вход</h1>
<p><a href="https://amokit.ru">Страница продукта</a> | Поддержка: <a href="mailto:support@amokit.ru">support@amokit.ru</a><p>
<?php 
if(isset($settings->error_auth))
{
	if($settings->error_auth > (time()-600))
	{
		echo '<h1>Ошибка входа, подождите 10 минут, прежде, чем попробовать снова.</h1>';
		$not_show_form = 1;
	}
}

if(!isset($not_show_form)){ ?>
<form method="get" action="admin.php">
<table>
<tr>
	<th style="width: 33%;">Пароль</th>
</tr>
<tr>
	<td><input type="password" name="password"></td>
</tr>
<tr>
	<td colspan="3"><button type="submit">Войти</button></td>
</tr>
</table>
</form>
<?php } ?>
</body>
</html>