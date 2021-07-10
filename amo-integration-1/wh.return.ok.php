<?php
// возвращаем ответ амо, т.к. они ждут ответа от хука не более 2сек
ob_start();
// do initial processing here
// echo $response; // send the response
header('Connection: close');
header('Content-Length: '.ob_get_length());
ob_end_flush();
ob_flush();
flush();
// // возвращаем ответ амо, т.к. они ждут ответа от хука не более 2сек
