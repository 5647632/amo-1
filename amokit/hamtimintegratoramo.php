<?php

/*
IntegratorAmo с любыми сайтами от 11.03.2018
*/

if (!class_exists('HamtimIntegratorAmo')) {
	class HamtimIntegratorAmo{
		var $settings;
		var $subdomain;
		var $auth;
		var $lead_id;
		var $contact_id;
		var $company_id;
		var $requests;
		var $timezone;
		var $linked_leads_id;
		var $code;
		var $account;
		var $cf;
		var $contactsArray = array();
		var $nodesArray = array();
		var $leadsArray = array();
		var $tasksArray = array();
		var $companiesArray = array();
		var $unsorted = array('request'=>
			array('unsorted' =>
				array(
				  'category' => 'forms',
				  'add' => array (
					array(
					  'source' => '',
					  'source_uid' => NULL,
					  'pipeline_id' => NULL,
					  'data' => array(
						'leads' => array(),
						'contacts' => array(),
						'companies' => array(),
					  ),
					  'source_data' => array(),
					),
				  ),
				)
			)
		);
		var $host;
		var $ref;
		var $addr;
		var $similarContacts;

		function __construct($requests)
		{

			if(isset($_SERVER['HTTP_HOST'])) $this->host = $_SERVER['HTTP_HOST'];
			if(isset($_SERVER['HTTP_REFERER'])) $this->ref = $_SERVER['HTTP_REFERER'];
			if(isset($_SERVER['REMOTE_ADDR'])) $this->addr = $_SERVER['REMOTE_ADDR'];
			$this->requests = $requests;
			if(isset($requests['amokit_md5'])&&isset($requests['amokit_login'])&&isset($requests['amokit_domen']))
			{
				$this->admin();
			}else{
				$this->loadSettings($requests);
				$this->amocrm_auth();

				if($this->auth)
				{
					//получаем кастомные поля
					$this->account = $this->amocrm_query('/api/v2/account?with=custom_fields');
					$this->cf = $this->account->_embedded->custom_fields;

					//если динамические теги
					if($this->settings->amocrm->dinamyc_leads_tags)
					{
						if(isset($this->requests[$this->settings->amocrm->dinamyc_leads_tags]))
						{
							if($this->requests[$this->settings->amocrm->dinamyc_leads_tags])
							{
								$this->settings->amocrm->leads_tags = $this->requests[$this->settings->amocrm->dinamyc_leads_tags];
							}
						}
					}

					//если динамический отвественный
					if($this->settings->amocrm->dinamyc_responsible_user_id)
					{
						if(isset($this->requests[$this->settings->amocrm->dinamyc_responsible_user_id]))
						{
							if($this->requests[$this->settings->amocrm->dinamyc_responsible_user_id])
							{
								$this->settings->amocrm->responsible_user_id = $this->requests[$this->settings->amocrm->dinamyc_responsible_user_id];
							}
						}
					}

					//если динамический статус
					if($this->settings->amocrm->dinamyc_leads_statuses)
					{
						if(isset($this->requests[$this->settings->amocrm->dinamyc_leads_statuses]))
						{
							if($this->requests[$this->settings->amocrm->dinamyc_leads_statuses])
							{
								$this->settings->amocrm->leads_statuses = $this->requests[$this->settings->amocrm->dinamyc_leads_statuses];
							}
						}
					}

					//если динамическая страница спасибо
					if($this->settings->amocrm->dinamyc_redirect_url)
					{
						if(isset($this->requests[$this->settings->amocrm->dinamyc_redirect_url]))
						{
							$this->settings->amocrm->redirect_url = $this->requests[$this->settings->amocrm->dinamyc_redirect_url];
						}
					}

					//если динамическая воронка для неразобранного
					if($this->settings->amocrm->dinamyc_pipelines)
					{
						if(isset($this->requests[$this->settings->amocrm->dinamyc_pipelines]))
						{
							$this->settings->amocrm->pipelines = $this->requests[$this->settings->amocrm->dinamyc_pipelines];
						}
					}

					//создание массива сделки
					$this->createLead();
					$this->createContact();
					$this->createCompany();



					if($this->settings->amocrm->incoming_leads && !$this->settings->amocrm->not_create_leads_on_dublicate)
					{
						$this->unsorted['request']['unsorted']['add'][0]['pipeline_id'] = $this->settings->amocrm->pipelines;
						$this->unsorted['request']['unsorted']['add'][0]['source'] = $this->host;
						$this->unsorted['request']['unsorted']['add'][0]['source_data'] = array(
							'data' => array(),
							'form_id' => 1,
							'form_type' => 1,
							'origin' => array(
								'ip' => $this->addr,
								'datetime' => time(),
								'referer' => $this->ref,
							),
							'date' => time(),
							'from' => $this->host,
							'form_name' => $this->settings->amocrm->leads_name,
						);

						foreach($requests as $rname=>$rvalue)
						{
							$this->unsorted['request']['unsorted']['add'][0]['source_data']['data'][$rname] = array(
								'type' => 'text',
								'id' => $rname,
								'element_type' => '1',
								'name' => $rname,
								'value' => $rvalue,
							);
						}

						$result = $this->amocrm_query_without_cookie( '/api/unsorted/add/', $this->unsorted );
					}else{
						$create_task = false;
						$not_create_lead = false;
						$leads_is_open = false;

						#не создавать сделку (опция)
						if($this->settings->amocrm->not_create_leads){
							$not_create_lead = true;
						}

						#поиск или создание контакта
						if($this->contact_id = $this->isdouble())
						{
							#создать задачу (дубль)
							$create_task = true;

							#не создавать сделку, если дубль (опция)
							if($this->settings->amocrm->not_create_leads_on_dublicate){
								$not_create_lead = true;
							}

							#не создавать сделку, если дубль и есть открытые сделки (опция)
							if($this->settings->amocrm->not_create_leads_on_dublicate_and_open_leads){
								if( $this->is_open_leads($this->contact_id) )
								{
									$not_create_lead = true;
									$leads_is_open = true;

								}
							}
						}else{
							$this->createContactQuery();
							$create_task = false;
						}

						#создание сделки
						if($not_create_lead)
						{
							#примечание в контакт
							$this->notesArray['add'][0]['element_id'] = $this->contact_id;
							$this->notesArray['add'][0]['element_type'] = 1;
						}else{
							$this->leadsArray['add'][0]['contacts_id'] = $this->contact_id;

							$this->createLeadQuery();
							#примечание в сделку
							$this->notesArray['add'][0]['element_id'] = $this->lead_id;
						}

						#создание примечания с полями в сделке/контакте

						$this->createNotesQuery();

						#создание задачи в контакте, если не отключено в настройках
						if(!$this->settings->amocrm->not_create_tasks_on_dublicate)
						{
							if($create_task)
							{
								#подготовка задачи в контакте
								$this->createTask($leads_is_open);

								$this->createTaskQuery();
							}
						}
					}
				}

				#переадресация
				if($this->settings->amocrm->redirect_url)
				{
					header('Location: '.$this->settings->amocrm->redirect_url);
					die();
				}
			}
		}

		function admin()
		{
			$answer = new stdClass();
			$this->loadSettings();
			$answer->settings = $this->settings;

			if(!($this->settings->amocrm->api)) $this->settings->amocrm->api = $this->requests['amokit_md5'];
			if(!($this->settings->amocrm->subdomain)) $this->settings->amocrm->subdomain = $this->requests['amokit_domen'];
			if(!($this->settings->amocrm->login)) $this->settings->amocrm->login = $this->requests['amokit_login'];

			if($this->settings->amocrm->api != $this->requests['amokit_md5']) die();
			if($this->settings->amocrm->subdomain != $this->requests['amokit_domen']) die();
			if($this->settings->amocrm->login != $this->requests['amokit_login']) die();

			$this->amocrm_auth();
			$path = '/private/api/v2/json/accounts/current';

			if(isset($_POST['json'])){
				$json = $_POST['json'];
				#echo $json;
				#обновляем файл настроек
				file_put_contents(__DIR__ . '/settings.txt', $json);
			}else if(isset($_POST['login'])&&isset($_POST['api'])&&isset($_POST['subdomain'])){
				$this->settings->amocrm->subdomain = trim($_POST['subdomain']);
				$this->settings->amocrm->login = trim($_POST['login']);
				$this->settings->amocrm->api = trim($_POST['api']);
				#обновляем файл настроек
				file_put_contents(__DIR__ . '/settings.txt', json_encode($this->settings));
				#удаляем старые куки
				unlink(__DIR__ . '/cookie.txt');
			}else{
				$accountsAnswer = $this->amocrm_query($path, array());
				#$answer->accounts = $accountsAnswer;
				#echo '<pre>'.print_r($accountsAnswer,1).'</pre>';
				if(!isset($accountsAnswer->response->error))
				{
					$answer->account = $accountsAnswer->response->account;
					echo json_encode($answer);
				}else{
					$answer->account = new stdClass();
					$answer->account->error = $accountsAnswer->response->error;
					$answer->account->error_code = $accountsAnswer->response->error;
					echo json_encode($answer);
				}
			}
			die();
		}

		function createTask($leads_is_open = false)
		{
			#добавляем задачу
				$path  = '/api/v2/tasks';
				if($leads_is_open)
				{
					$text = 'Повторное обращение. Контакт https://'.$this->settings->amocrm->subdomain.'.amocrm.ru/contacts/detail/'.$this->contact_id;
				}else{
					$text = 'Проверьте контакт https://'.$this->settings->amocrm->subdomain.'.amocrm.ru/contacts/detail/'.$this->contact_id;
					if($this->lead_id)
					{
						$text .= '
	прикрепленный к сделке';
						$text .= '
	https://'.$this->settings->amocrm->subdomain.'.amocrm.ru/leads/detail/'.$this->lead_id;
					}
				}

			#поля
			foreach($this->requests as $k=>$r)
			{
				$show = false;

				#показываем отмеченные, если показывать отмеченные
				if($this->is_key_in_array($k, $this->settings->amocrm->showCheckedFields))
				{
					if($this->settings->amocrm->showCheckedFieldsSelect)
					{
						$show = true;
					}
				#показываем не отмеченные, если не показывать отмеченные
				}else{

					if(!$this->settings->amocrm->showCheckedFieldsSelect)
					{
						$show = true;
					}
				}

				if($show){
					$text .= '
'.$k.': '.$r;
				}
			}

				$fields['add']=array(
					array(
						"element_id"=>$this->contact_id,
						"element_type"=>1,#Тип привязываемого елемента (1 - контакт, 2- сделка, 3 - компания, 12 - покупатель)
						"task_type"=>1,
						"text"=>$text,
						"is_completed"=>false,
						"responsible_user_id"=>$this->settings->amocrm->responsible_user_id,
					)
				);
			$this->tasksArray = $fields;
		}

		function createCompany()
		{

			$fields['request']['contacts']['add']=array(
				array(
					"name"=>"",
					'responsible_user_id'=>$this->settings->amocrm->responsible_user_id,
					"linked_leads_id"=>array($this->lead_id)
				)
			);

			//добавляем поля из таблицы настроек
			foreach($this->settings->amocrm->companiesFields as $k=>$b)
			{
				if($b)
				{
					if(isset($this->requests[$k]))
					{
						if($b == 'name' OR $b == 'request_id')
						{
							$fields['request']['contacts']['add'][0][$b] = $this->requests[$k];
						}else{
							$values = explode('-', $b);
							if(count($values)==2)
							{
								$values_array = array(
									'id'=>$values[0],
									'values'=>array(
										array(
											'value'=>$this->requests[$k],
											'enum'=>$values[1]
										)
									)
								);
							}else{
								$values_array = array(
									'id'=>$b,
									'values'=>array(
										array(
											'value'=>$this->requests[$k]
										)
									)
								);
							}
							$fields['request']['contacts']['add'][0]['custom_fields'][] = $values_array;
						}
					}
				}
			}

			if($fields['request']['contacts']['add'][0]['name'])
			{
				$this->companiesArray = $fields;
			}
		}

		function createCompanyQuery()
		{
			$path = '/private/api/v2/json/contacts/set';

			//делаем запрос создания компании, если название не пустое
			if($this->companiesArray)
			{
				$companyAnswer = $this->amocrm_query($path, $fields);

				if($companyAnswer)
				{
					$this->company_id = $companyAnswer->response->contacts->add[0]->id;
				}
			}
		}

		function createContact()
		{
			//готовим запрос на создание контакта
			$fields['request']['contacts']['add']=array(
				array(
					"name" => "Клиент",
					'responsible_user_id'=>$this->settings->amocrm->responsible_user_id,
					"linked_leads_id"=>array()
				)
			);

			//добавляем поля из таблицы настроек
			foreach($this->settings->amocrm->contactsFields as $k=>$c)
			{
				if($c)
				{
					if(isset($this->requests[$k]))
					{
						if($c == 'name' OR $c == 'company_name' OR $c == 'request_id')
						{
							$fields['request']['contacts']['add'][0][$c] = $this->requests[$k];
						}else{
							$values = explode('-', $c);
							if(count($values)==2)
							{
								$values_array = array(
									'id'=>$values[0],
									'values'=>array(
										array(
											'value'=>$this->requests[$k],
											'enum'=>$values[1]
										)
									)
								);
							}else{
								$values_array = array(
									'id'=>$c,
									'values'=>array(
										array(
											'value'=>$this->requests[$k]
										)
									)
								);
							}
							$fields['request']['contacts']['add'][0]['custom_fields'][] = $values_array;
						}
					}
				}
			}

			$this->contactsArray = $fields;
			$custom_fields = array();
			if(isset($this->contactsArray['request']['contacts']['add'][0]['custom_fields'])) $custom_fields = $this->contactsArray['request']['contacts']['add'][0]['custom_fields'];
			$this->unsorted['request']['unsorted']['add'][0]['data']['contacts'] = array(
					array(
						'name' => $this->contactsArray['request']['contacts']['add'][0]['name'],
						'custom_fields' => $custom_fields,
						'responsible_user_id' => $this->contactsArray['request']['contacts']['add'][0]['responsible_user_id'],
						'tags' => '',
					)
				);


		}

		function createContactQuery()
		{
			$path = '/private/api/v2/json/contacts/set';

			//делаем запрос создания контакта
			$contactAnswer = $this->amocrm_query($path, $this->contactsArray);

			if($contactAnswer)
			{
				$this->contact_id = $contactAnswer->response->contacts->add[0]->id;
			}
		}

		function createLead()
		{
			//готовим значения полей
			$leads_name = $this->settings->amocrm->leads_name;
			$leads_statuses = $this->settings->amocrm->leads_statuses;
			$leads_tags = $this->settings->amocrm->leads_tags;

			if(!isset($this->settings->amocrm->responsible_user_id)) $this->settings->amocrm->responsible_user_id = '';

			//добавляем сделку
			$fields['add']=array(
				array(
					'name'=>$leads_name,
					'status_id'=>$leads_statuses,
					'sale' => '',
					'responsible_user_id'=>$this->settings->amocrm->responsible_user_id,
					'tags' => $leads_tags, #Теги
				)
			);

			if($this->settings->amocrm->leadsFields) $fields['add'][0]['custom_fields'] = array();

			//добавляем поля из таблицы настроек
			foreach($this->settings->amocrm->leadsFields as $k=>$f)
			{
				if($f)
				{
					if(isset($this->requests[$k]))
					{
						if($f == 'name' OR $f == 'sale')
						{
							$fields['add'][0][$f] = $this->requests[$k];
						}else{
							$values = explode('-', $f);
							if(count($values)==2)
							{
								$values_array = array(
									'id'=>$values[0],
									'values'=>array(
										array(
											'value'=>$this->requests[$k],
											'enum'=>$values[1]
										)
									)
								);
							}else{
								$values_array = array(
									'id'=>$f,
									'values'=>array(
										array(
											'value'=>$this->requests[$k]
										)
									)
								);
							}
							$fields['add'][0]['custom_fields'][] = $values_array;
						}
					}
				}
			}

			$this->leadsArray = $fields;

			//добавляем примечание
			$text = "";
			foreach($this->requests as $k=>$r)
			{
				$show = false;

				#показываем отмеченные, если показывать отмеченные
				if($this->is_key_in_array($k, $this->settings->amocrm->showCheckedFields))
				{
					if($this->settings->amocrm->showCheckedFieldsSelect)
					{
						$show = true;
					}
				#показываем не отмеченные, если не показывать отмеченные
				}else{

					if(!$this->settings->amocrm->showCheckedFieldsSelect)
					{
						$show = true;
					}
				}

				if($show){
					$text .= $k.': '.$r.'
';
				}
			}

				$text = 'Получено обращение
'.$text;
				unset($fields);
				$fields['add']=array(
					array(
						"element_id"=>$this->lead_id,
						"element_type"=>2,#Тип привязываемого елемента (1 - контакт, 2- сделка, 3 - компания, 12 - покупатель)
						"note_type"=>4,
						"text"=>$text,
						#"note_type"=>25,
						#"params"=>array( "text"=>$text),
						"responsible_user_id"=>$this->settings->amocrm->responsible_user_id,
					)
				);

				$this->notesArray = $fields;
				#$this->l($this->leadsArray['add'][0]);
				$this->unsorted['request']['unsorted']['add'][0]['data']['leads'] = array(
					array(
						'sale' => $this->leadsArray['add'][0]['sale'],
						'custom_fields' => $this->leadsArray['add'][0]['custom_fields'],
						'responsible_user_id' => $this->leadsArray['add'][0]['responsible_user_id'],
						'name' => $this->leadsArray['add'][0]['name'],
						'tags' => $this->leadsArray['add'][0]['tags'],
						'status_id' => $this->leadsArray['add'][0]['status_id'],
						'contacts_id' => '',

						'notes' => array(
						  array(
							'text' => $fields['add'][0]['text'],
							'note_type' => $fields['add'][0]['note_type'],
							'element_type' => $fields['add'][0]['element_type'],
							'responsible_user_id' => $fields['add'][0]['responsible_user_id'],
						  ),
						),
					)
				);
		}

		function createNotesQuery()
		{
			$path  = '/api/v2/notes';
			$addNote = $this->amocrm_query($path, $this->notesArray);
		}

		function createLeadQuery()
		{
			$path = '/api/v2/leads';
			//делаем запрос создания сделки
			$leadAnswer = $this->amocrm_query($path, $this->leadsArray);

			if($leadAnswer)
			{
				#$this->l($leadAnswer);
				$this->lead_id = $leadAnswer->_embedded->items[0]->id;
			}
		}

		function createTaskQuery()
		{
			$path = '/api/v2/tasks';
			//делаем запрос создания задачи
			$taskAnswer = $this->amocrm_query($path, $this->tasksArray);
			return $taskAnswer;
		}

		function amocrm_auth()
		{
			if(isset($this->settings->amocrm))
			{
				if($this->settings->amocrm->api&&$this->settings->amocrm->login&&$this->settings->amocrm->subdomain)
				{
					$subdomain = $this->settings->amocrm->subdomain;
					$this->subdomain = $subdomain;
					$user = array(
						'USER_LOGIN'=>$this->settings->amocrm->login,
						'USER_HASH'=>$this->settings->amocrm->api
					);
				}else{
					return 'Нет данных для авторизации';
				}
			}else{
				return 'Нет данных для авторизации';
			}

			$link='https://'.$subdomain.'.amocrm.ru/private/api/auth.php?type=json';
			$curl=curl_init(); #Сохраняем дескриптор сеанса cURL
			#Устанавливаем необходимые опции для сеанса cURL
			curl_setopt($curl,CURLOPT_RETURNTRANSFER,true);
			curl_setopt($curl,CURLOPT_USERAGENT,'integrator-amokit/2.0');
			curl_setopt($curl,CURLOPT_URL,$link);
			curl_setopt($curl,CURLOPT_POST,true);
			if (version_compare(PHP_VERSION, '5.5.0') >= 0) {
				$postfields = http_build_query($user,null,'&',PHP_QUERY_RFC1738);
			}else{
				$postfields = http_build_query($user);
			}
			if( $postfields ){
				curl_setopt($curl,CURLOPT_POSTFIELDS,$postfields);
			}
			curl_setopt($curl,CURLOPT_HEADER,false);
			curl_setopt($curl,CURLOPT_COOKIEFILE,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
			curl_setopt($curl,CURLOPT_COOKIEJAR,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
			curl_setopt($curl,CURLOPT_SSL_VERIFYPEER,0);
			curl_setopt($curl,CURLOPT_SSL_VERIFYHOST,0);

			$out=curl_exec($curl); #Инициируем запрос к API и сохраняем ответ в переменную
			$code=curl_getinfo($curl,CURLINFO_HTTP_CODE); #Получим HTTP-код ответа сервера
			curl_close($curl); #Заверашем сеанс cURL

			$auth = json_decode($out);
			if($code == 200)
			{
				$this->auth = $auth->response->auth;
			}else{
				if($this->settings->amocrm->login)
				{

					$email = $this->settings->amocrm->login;
					$text = 'Ошибка авторизации в API AmoCRM, проверьте настройки для скрипта по адресу http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'].'

Код ответа сервера: '.$code.'

Текст ответа сервера:
'.print_r($auth,1);
					mail($email, 'Ошибка в интеграции amoCRM',$text); die();
				}
			}

			return $out;
		}


		function amocrm_query_without_cookie($path, $fields)
		{
			$link='https://'.$this->settings->amocrm->subdomain.'.amocrm.ru'.$path.'?login='.$this->settings->amocrm->login.'&api_key='.$this->settings->amocrm->api;
			$curl=curl_init();
			curl_setopt($curl,CURLOPT_RETURNTRANSFER,true);
			curl_setopt($curl,CURLOPT_USERAGENT,'integrator-amokit/2.0');
			curl_setopt($curl,CURLOPT_HTTPHEADER,array('Accept: application/json'));
			curl_setopt($curl,CURLOPT_URL,$link);
			curl_setopt($curl,CURLOPT_HEADER,false);
			curl_setopt($curl,CURLOPT_POSTFIELDS, http_build_query($fields,null,'&',PHP_QUERY_RFC1738));
			curl_setopt($curl,CURLOPT_SSL_VERIFYPEER,0);
			curl_setopt($curl,CURLOPT_SSL_VERIFYHOST,0);
			$out=curl_exec($curl);
			$this->code = curl_getinfo($curl,CURLINFO_HTTP_CODE);
			curl_close($curl);

			return json_decode($out);
		}

		function amocrm_query($path, $fields=array())
		{
			if($this->code != 200) sleep(1);
      if($this->code == '403'){
				$email = $this->settings->amocrm->login;
				$text = 'Доступ к api AmoCRM запрещен для скрипта по адресу http://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'].'

Код ответа сервера: '.$code.'

Текст ответа сервера:
'.print_r($auth,1);
				mail($email, 'Доступ к api запрещен для интеграции amoCRM',$text); die();
			}
			$link='https://'.$this->subdomain.'.amocrm.ru'.$path;

			$curl=curl_init(); #Сохраняем дескриптор сеанса cURL
			#Устанавливаем необходимые опции для сеанса cURL
			curl_setopt($curl,CURLOPT_RETURNTRANSFER,true);
			curl_setopt($curl,CURLOPT_USERAGENT,'integrator-amokit/2.0');
			curl_setopt($curl,CURLOPT_HTTPHEADER, array('Accept: application/json'));
			curl_setopt($curl,CURLOPT_URL,$link);
			curl_setopt($curl,CURLOPT_HEADER,false);
			if (version_compare(PHP_VERSION, '5.5.0') >= 0) {
				$postfields = http_build_query($fields,null,'&',PHP_QUERY_RFC1738);
			}else{
				$postfields = http_build_query($fields);
			}
			if( $postfields ){
				curl_setopt($curl,CURLOPT_POSTFIELDS,$postfields);
			}
			curl_setopt($curl,CURLOPT_HEADER,false);
			curl_setopt($curl,CURLOPT_COOKIEFILE,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
			curl_setopt($curl,CURLOPT_COOKIEJAR,dirname(__FILE__).'/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
			curl_setopt($curl,CURLOPT_SSL_VERIFYPEER,0);
			curl_setopt($curl,CURLOPT_SSL_VERIFYHOST,0);

			$out=curl_exec($curl); #Инициируем запрос к API и сохраняем ответ в переменную
			$this->code=curl_getinfo($curl,CURLINFO_HTTP_CODE);

			return json_decode( $out );
		}

		function loadSettings($requests=false)
		{
			$this->settings = new stdClass();
			$this->settings->requests = array();
			$this->settings = json_decode(file_get_contents(__DIR__ . '/settings.txt'));
			if(!($this->settings)) $this->settings = new stdClass();
			if(!isset($this->settings->requests)) $this->settings->requests = array();
			if(!isset($this->settings->amocrm)) $this->settings->amocrm = new stdClass();
			if(!isset($this->settings->amocrm->api)) $this->settings->amocrm->api = null;
			if(!isset($this->settings->amocrm->subdomain)) $this->settings->amocrm->subdomain = null;
			if(!isset($this->settings->amocrm->login)) $this->settings->amocrm->login = null;
			if(!isset($this->settings->amocrm->leads_statuses)) $this->settings->amocrm->leads_statuses = null;
			if(!isset($this->settings->amocrm->leads_name)) $this->settings->amocrm->leads_name = 'Новая заявка';
			if(!isset($this->settings->amocrm->leads_tags)) $this->settings->amocrm->leads_tags = 'Заявка с сайта';
			if(!isset($this->settings->amocrm->pipelines)) $this->settings->amocrm->pipelines = null;
			if(!isset($this->settings->amocrm->responsible_user_id)) $this->settings->amocrm->responsible_user_id = null;
			if(!isset($this->settings->amocrm->redirect_url)) $this->settings->amocrm->redirect_url = null;
			if(!isset($this->settings->amocrm->contactsFields)) $this->settings->amocrm->contactsFields = array();
			if(!isset($this->settings->amocrm->leadsFields)) $this->settings->amocrm->leadsFields = array();
			if(!isset($this->settings->amocrm->companiesFields)) $this->settings->amocrm->companiesFields = array();
			if(!isset($this->settings->amocrm->checkFields)) $this->settings->amocrm->checkFields = array();
			if(!isset($this->settings->amocrm->dinamyc_redirect_url)) $this->settings->amocrm->dinamyc_redirect_url = null;
			if(!isset($this->settings->amocrm->dinamyc_responsible_user_id)) $this->settings->amocrm->dinamyc_responsible_user_id = null;
			if(!isset($this->settings->amocrm->dinamyc_leads_tags)) $this->settings->amocrm->dinamyc_leads_tags = null;
			if(!isset($this->settings->amocrm->dinamyc_leads_statuses)) $this->settings->amocrm->dinamyc_leads_statuses = null;
			if(!isset($this->settings->amocrm->incoming_leads)) $this->settings->amocrm->incoming_leads = null;
			if(!isset($this->settings->amocrm->dinamyc_pipelines)) $this->settings->amocrm->dinamyc_pipelines = null;
			if(!isset($this->settings->amocrm->not_create_tasks_on_dublicate)) $this->settings->amocrm->not_create_tasks_on_dublicate = false;
			if(!isset($this->settings->amocrm->auto_fields_off)) $this->settings->amocrm->auto_fields_off = false;
			if(!isset($this->settings->amocrm->hide_fields_from_notes)) $this->settings->amocrm->hide_fields_from_notes = false;
			if(!isset($this->settings->amocrm->hide_fields_from_tasks)) $this->settings->amocrm->hide_fields_from_tasks = false;
			if(!isset($this->settings->amocrm->showCheckedFieldsSelect)) $this->settings->amocrm->showCheckedFieldsSelect = false;
			if(!isset($this->settings->amocrm->showCheckedFields)) $this->settings->amocrm->showCheckedFields = array();
			if(!isset($this->settings->amocrm->not_create_leads)) $this->settings->amocrm->not_create_leads = false;
			if(!isset($this->settings->amocrm->not_create_leads_on_dublicate)) $this->settings->amocrm->not_create_leads_on_dublicate = false;
			if(!isset($this->settings->amocrm->not_create_leads_on_dublicate_and_open_leads)) $this->settings->amocrm->not_create_leads_on_dublicate_and_open_leads = false;

			#если есть запросы и не отключен автоматический сбор полей
			if($requests && !$this->settings->amocrm->auto_fields_off)
			{
				$requestsNames = array();

				//сохраняем названия в массив
				foreach($requests as $k=>$i)
				{
					$requestsNames[] = $k;
				}

				if(!isset($this->settings->requests)) $this->settings->requests = array();
				$diff = array_diff($requestsNames, $this->settings->requests);
				$this->settings->requests = array_merge($this->settings->requests, $diff);
			}

			$this->settings->lastrequests = $requests;

			if($requests && !$this->settings->amocrm->auto_fields_off)
			{
				//обновляем файл настроек
				file_put_contents(__DIR__ . '/settings.txt', json_encode($this->settings));
			}
		}

		function is_open_leads($contact_id)
		{
			foreach($this->similarContacts as $contact)
			{
				if($contact->id = $contact_id)
				{
					#если есть сделки
					if($contact->linked_leads_id)
					{
						#получаем последние 500 сделок контакта

						$leadsAnswer = $this->amocrm_query('/api/v2/leads?'.http_build_query(array('id'=>$contact->linked_leads_id),null,'&',PHP_QUERY_RFC1738), array());

						#если есть
						if($leadsAnswer)
						{
							foreach($leadsAnswer->_embedded->items as $lead)
							{
								#если не закрыта успешно или не реализовано, то есть открытые сделки
								if($lead->status_id != 142 && $lead->status_id != 143)
								{
									return true;
								}
							}
						}
					}
				}
			}
			return false;
		}

		function is_key_in_array($key, $array)
		{
			foreach($array as $array_key=>$array_value)
			{
				if($key == $array_key) return true;
			}
			return false;
		}

		function isdouble()
		{
			$isdouble = false;
			$results = array();
			foreach($this->settings->amocrm->checkFields as $checkFieldKey=>$checkFieldValue)
			{
				if(isset($this->requests[$checkFieldKey]))
				{
					$result = $this->checkDouble($checkFieldKey);
					if($result) return $result[0];
				}
			}
			return 0;
		}

		function checkDouble($checkFieldKey, $type='contact')
		{
			if(isset($this->requests[$checkFieldKey]))
			{
				$value = htmlspecialchars(trim($this->requests[$checkFieldKey]));
				$numbers = intval($value);
				if(strlen($numbers) == 10)
				{
					$value = $numbers;
				}else if(strlen($numbers) > 9 && strlen($numbers) < 13)
				{
					$value = substr($numbers, (strlen($numbers)-10), 10);
				}
			}else{
				return array();
			}
			if(!$value) return array();

			$field = $this->settings->amocrm->contactsFields->$checkFieldKey;
			if(!$field) return array();

			$path = '/private/api/v2/json/contacts/list?type='.$type.'&query='.$value;

			$fields = array();
			$queryAnswer = $this->amocrm_query($path, $fields);

			$arrayToReturn = array();

			if($queryAnswer)
			{
				$this->similarContacts = $queryAnswer->response->contacts;
				foreach($queryAnswer->response->contacts as $k=>$c)
				{
					$field_parts = explode('-', $field);
					if(count($field_parts)==2)
					{
						$not_unset = false;
						foreach($c->custom_fields as $customFiedKey=>$customFieldValue)
						{
							if($customFieldValue->id == $field_parts[0])
							{
								foreach($customFieldValue->values as $val)
								{
									if($val->value == $value)
									{
										$not_unset = true;
									}
									if($numbers)
									{
										$not_unset = true;
									}
								}
							}
						}
						if(!$not_unset)
						{
							unset($queryAnswer->response->contacts[$k]);
						}
					}else{
						if(trim($c->$field) != $value)
						{
							unset($queryAnswer->response->contacts[$k]);
						}
					}
				}

				foreach($queryAnswer->response->contacts as $contact)
				{
					$arrayToReturn[] = $contact->id;
				}
				return $arrayToReturn;
			}
			return array();
		}

		function l($l){ echo '<pre>'; var_dump($l); echo '</pre>'; }

		function log_it($msg)
		{
			if($this->log)
			{
				file_put_contents('log.txt', print_r( $msg,true).'
	', FILE_APPEND);
			}
		}
	}
}
