<?php

/*
/local/php_interface/init.php:49 инклюд файла
/ добавлена папка integrator-amokit в корень сайта
/local/templates/santehnika/header.php:15 добавлена строка подключения utm_cookie.min.js библиотеки сохраняющей утм метки в куки
*/

AddEventHandler("sale", "OnOrderSave", "OnOrderSaveAddAmocrmIntegrationHandler");

function OnOrderSaveAddAmocrmIntegrationHandler($orderId, $fields, $orderFields, $isNew) {
  if(isset($_REQUEST['action'])) return true;
    $_REQUEST['order_id'] = $orderId;
    $_REQUEST['lead_name'] = 'Заказ №'.$orderId;
    //mail('timach-ufa@ya.ru','log', print_r([$orderId, $fields, $orderFields, $isNew],1));
    if(isset($orderFields['PRICE'])) $_REQUEST['PRICE'] = $orderFields['PRICE'];
    if(isset($orderFields['COMMENTS'])) $_REQUEST['COMMENTS'] = $orderFields['COMMENTS'];
    $_REQUEST['BASKET'] = '';

    if(isset($orderFields['BASKET_ITEMS'])){
      foreach($orderFields['BASKET_ITEMS'] as $item){
        $_REQUEST['BASKET'] .= ' '.$item['NAME'].' '.$item['QUANTITY'].' * '.$item['PRICE'].'
';
      }
    }

    if(isset($orderFields['ORDER_PROP'])){
      foreach($orderFields['ORDER_PROP'] as $key=>$prop){
        //$_REQUEST['BASKET'] .= ' '.$item['NAME'].' '.$item['QUANTITY'].' * '.$item['PRICE'].'';
        switch($key){
          case 1:
            $_REQUEST['name'] = $prop;
            break;
          case 2:
            $_REQUEST['email'] = $prop;
            break;
          case 3:
            $_REQUEST['phone'] = $prop;
            break;
          case 5:
            $_REQUEST['city'] = $prop;
            break;
          case 7:
            $_REQUEST['address'] = $prop;
            break;
          case 20:
            $_REQUEST['up'] = $prop;
            break;
          case 21:
            $_REQUEST['install'] = $prop;
            break;
        }
      }
    }

    if(isset($_REQUEST['ORDER']['step_2']['delivery'])){
      $deliveryArray = explode('|', $_REQUEST['ORDER']['step_2']['delivery']);
      if(isset($deliveryArray[1])) $_REQUEST['delivery'] = $deliveryArray[1];
    }

    if(isset($_REQUEST['ORDER']['step_4']['payment'])){
      $paymentArray = explode('|', $_REQUEST['ORDER']['step_4']['payment']);
      if(isset($paymentArray[1])) $_REQUEST['payment'] = $paymentArray[1];
    }

    //mail('timach-ufa@ya.ru','log1',print_r($_REQUEST,1));
    include_once ('/home/a/atmosvnr/atmo-suvenir.atmosvnr.beget.tech/public_html/integrator-amokit/send.php');
    return true;
}

AddEventHandler('form', 'onAfterResultAdd', 'onAfterResultAddAmocrmIntegrationHandler');

function onAfterResultAddAmocrmIntegrationHandler($WEB_FORM_ID, $RESULT_ID)
{
  CForm::GetResultAnswerArray($WEB_FORM_ID, $arrColumns, $arrAnswers, $arrAnswersVarname, array("RESULT_ID" => $RESULT_ID));
  if(is_array($arrAnswersVarname)){
    foreach($arrAnswersVarname as $form){
      foreach($form as $key=>$var){
        if(isset($var[0]['USER_TEXT']) && isset($var[0]['TITLE'])){
          $requestName = $var[0]['TITLE'];
          $_REQUEST[$requestName] = $var[0]['USER_TEXT'];
        }
      }
    }
  }

  //mail('timach-ufa@ya.ru','log',print_r([$WEB_FORM_ID, $arrColumns, $arrAnswers, $arrAnswersVarname],1));
  include_once ('/home/a/atmosvnr/atmo-suvenir.atmosvnr.beget.tech/public_html/integrator-amokit/send.php');
  return true;
}
