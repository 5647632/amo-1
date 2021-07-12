<?php


$link='https://amopartner.ru/integrator-amokit/send.php';
			$curl=curl_init();
			#curl_setopt($curl, CURLOPT_CONNECTTIMEOUT_MS, 300);
			curl_setopt($curl, CURLOPT_TIMEOUT, 1);
			curl_setopt($curl,CURLOPT_URL,$link);
			curl_setopt($curl,CURLOPT_POST,true);
			curl_setopt($curl,CURLOPT_POSTFIELDS,http_build_query($_REQUEST,null,'&',PHP_QUERY_RFC1738));
			curl_setopt($curl,CURLOPT_HEADER,false);

			$out=curl_exec($curl); #Инициируем запрос к API и сохраняем ответ в переменную
			$code=curl_getinfo($curl,CURLINFO_HTTP_CODE); #Получим HTTP-код ответа сервера
			curl_close($curl); #Заверашем сеанс cURL
			echo '<pre>';
			var_dump($out);
			var_dump($code);