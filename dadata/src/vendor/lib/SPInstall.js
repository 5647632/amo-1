define([
	'underscore',
	'lib/interface/account/development/integration_model',
	'FileAPI',
	'twigjs',
	'lib/components/base/modal'
], function(
	_,
	IntegrationModel,
	FileAPI,
	Twig,
	Modal
) {
	"use strict";

	let $this;

	function SPInstall($el) {

		$this = this;
		this.$el = $el;

		this.sp_widget_url = 'https://widgets.comf5.ru/widget/ServicePanel/widget.zip';
		this.redirect_uri = "https://servicepanel.ru/oauth/redirect";
		this.scopes = [
			'crm',
			'notifications'
		];
		this.names = {
			ru: 'ServicePanel',
			en: 'ServicePanel'
		};
		this.descriptions = {
			ru: 'ServicePanel',
			en: 'ServicePanel'
		};

		this.model = new IntegrationModel();

		this.model.set('redirect_uri', this.redirect_uri);
		this.model.set('scopes[]', this.scopes);
		this.model.set('names', this.names);
		this.model.set('descriptions', this.descriptions);
	};

	SPInstall.prototype.render = function() {
		$this.getWidgetList().then(data => {
			let widgets = _.findWhere(data.widgets, { name: 'ServicePanel' });
			if (typeof widgets !== 'undefined') {
				return false;
			}
			$this.$el.find('#widget_settings__fields_wrapper').before(Twig({
				data: `<div class="f5-dadata-sp_install_wraper">
						    <div class="f5-dadata-sp_install_wraper-install">
						        {{ include_control('button', {
						            class_name: 'button-input_blue f5-dadata-sp-install-widget__button js-widget-sp-install',
						            text: 'Установить сейчас'
						        }) }}
						    </div>
						    <div class="f5-dadata-sp_install_wraper-privacy_policy">
						        <label class="control-checkbox widget-settings__checkbox-privacy-policy control-checkbox_small ">
						            <div class="control-checkbox__text element__text " title="При установке виджета Согласен на передачу персональных данных из amoCRM в ServicePanel">
						                <span>При установке виджета вы соглашаетесь с <a href="https://servicepanel.ru/agreement.pdf" target="_blank">условиями</a> использования платформы ServicePanel</span>
						            </div>
						        </label>
						    </div>
						</div>`
			}).render());
			$this.rendered();
		});
	};

	SPInstall.prototype.rendered = function() {
		this.$el.on('click', '.js-widget-sp-install', function() {
			let btn = $(this)
			if (typeof SP !== 'undefined') {
				$this.showErrorModal('Виджет ServicePanel уже установлен в системе');
				return false;
			}
			btn.trigger('button:load:start');
			$this.getWidgetList().then(data => {
					let find = _.findWhere(data.widgets, { name: 'ServicePanel' });
					if (typeof find !== 'undefined') {
						$this.showErrorModal('Виджет ServicePanel уже установлен в системе');
						btn.trigger('button:load:stop');
						return false;
					}
					return fetch($this.sp_widget_url);
				})
				.then(response => response.blob())
				.then(data => {
					// добавляем widget в модель 
					$this.model.set('archive_file', new File([data], "widget.zip", {
						type: "application/x-zip-compressed"
					}));
					// сохраняем модель
					$this.model.save({
						success: _.bind(function(response) {

							let client_id = $this.model.id;
							let client_secret;
							let temp_code;

							let widget_id;
							let widget_code = $this.model.attributes.code;

							let user_pass = Math.random().toString(36).substring(7);
							let user_phone = AMOCRM.constant('user').personal_mobile || '123456';
							let promo = 'comf5';

							$this.getWidgetInfo(client_id).then(data => {
								client_secret = data.secret;
								temp_code = data.auth_code;
							}).then(data => {
								let params = {};
								params.account_id = AMOCRM.constant('account').id;
								params.domain = AMOCRM.constant('account').subdomain;
								params.timezone = AMOCRM.constant('account').timezone;
								params.language = AMOCRM.lang_id;
								params.zone = location.host.split('.').pop();
								params.user_id = AMOCRM.constant('user').id;
								params.user_name = AMOCRM.constant('user').name;
								params.user_login = AMOCRM.constant('user').login;
								params.user_pass = user_pass;
								params.user_phone = user_phone;
								params.resp_id = parseInt('4') || 0;
								params.active = 1;
								params.solo = 1;
								params.promo = promo;
								params.client_secret = client_secret;
								params.client_id = client_id;
								params.temp_code = temp_code;
								params.utm_source = 'docsgen';
								return $this.sendToSP(params);
							}).then(data => {
								return $this.getWidgetList();
							}).then(data => {
								widget_id = (((data || false).widgets || false)[widget_code] || false).id;
								if (widget_id) {
									return $this.getWidgetEdit({
										action: 'edit',
										id: widget_id,
										code: widget_code,
										widget_active: 'Y',
										settings: {
											server: 'servicepanel.ru',
											phone: user_phone,
											pass: user_pass,
											promo: promo
										}
									});
								}
							}).then(data => {
								btn.trigger('button:load:stop');
							}).catch(error => {
								this.showErrorModal(error);
							}).finally(() => {
								$(document).trigger("list:reload")
							});
						}, this),
						error: _.bind(function(response) {
							this.showErrorModal(response);
						}, this)
					});
				});
		});
	};

	SPInstall.prototype.showErrorModal = function(string) {
		return new Modal()._showError(string.toString(), false);
	}

	SPInstall.prototype.sendToSP = function(params) {
		return new Promise(function(resolve, reject) {
			$.post(`https://servicepanel.ru/partners/widget/save`, params)
				.done(function(data) {
					resolve(data);
				})
				.fail(function(data, textStatus, errorThrown) {
					reject(errorThrown);
				});
		});
	};

	SPInstall.prototype.getWidgetEdit = function(params) {
		return $this.post(`/ajax/widgets/edit`, params);
	};

	SPInstall.prototype.getWidgetList = function() {
		return $this.post(`/ajax/widgets/list`, {
			area: 'widgetsSettings'
		});
	};

	SPInstall.prototype.getWidgetInfo = function(client_id) {
		return $this.get(`/v3/clients/${client_id}`);
	};

	SPInstall.prototype.get = function(action, args = {}, custom_options = {}) {
		return this.action('GET', action, args, custom_options);
	};

	SPInstall.prototype.post = function(action, args = {}, custom_options = {}) {
		return this.action('POST', action, args, custom_options);
	};

	SPInstall.prototype.patch = function(action, args = {}, custom_options = {}) {
		return this.action('PATCH', action, args, custom_options);
	};

	SPInstall.prototype.actionUrl = function(action) {
		return `https://${AMOCRM.widgets.system.domain}` + action;
	};

	SPInstall.prototype.action = function(method, action, args = {}, custom_options = {}) {
		let options = {
			method: method,
			url: this.actionUrl(action),
			dataType: 'json',
			data: args
		};
		return new Promise(function(resolve, reject) {
			$.ajax(_.extend(options, custom_options))
				.done(function(data) {
					resolve(data);
				})
				.fail(function(data, textStatus, errorThrown) {
					reject(errorThrown);
				});
		});
	};

	return SPInstall;
});