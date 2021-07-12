<?php

if(1){
	#распределение заявок
	$responsible_users_settings = json_decode(file_get_contents('responsible_user_id.txt'));
	if($responsible_users_settings)
	{
		if($responsible_users_settings->users)
		{
			if(is_array($responsible_users_settings->users))
			{
				if(count($responsible_users_settings->users))
				{
					if(isset($responsible_users_settings->last))
					{
						$responsible_users_settings->last = $responsible_users_settings->last+1;
						if(count($responsible_users_settings->users) > $responsible_users_settings->last)
						{
							$_REQUEST['ia_responsible_user_id'] = $responsible_users_settings->users[$responsible_users_settings->last];
						}else{
							$responsible_users_settings->last = 0;
							$_REQUEST['ia_responsible_user_id'] = $responsible_users_settings->users[0];
						}
					}else{
						$responsible_users_settings->last = 0;
						$_REQUEST['ia_responsible_user_id'] = $responsible_users_settings->users[0];
					}
				}
			}
			file_put_contents('responsible_user_id.txt', json_encode($responsible_users_settings));
		}
	}
	#die(print_r($_REQUEST['ia_responsible_user_id']));
}