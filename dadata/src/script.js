define(['jquery'], function ($) {
	var CustomWidget = function () {
		var self = this,
			system = self.system(),
			account = AMOCRM.constant('account');

		self.name = 'Dadata';
		self.version = 1;
		self.host = 'foobar.host/dadata/';
		self.url = 'https://' + self.host;
		self.language = account.language = 'ru';

		this.callbacks = {
			render: function () {
				self.script_url = self.params.path + '/vendor';
				return true;
			},
			init: function () {
				require([self.script_url + '/lib/library.js', self.script_url + '/Widget.js', self.script_url + '/lang/' + self.language + '.js'],
					function (Library, Widget, LangPack) {
						self[self.name] = new Widget(self, new Library(self), LangPack);
					}
				);
				return true;

			},
			bind_actions: function () {
				return true;
			},
			settings: function ($modal_body) {
				$('.' + self.params.widget_code + ' .modal-body').hide();
				$modal_body.parent().addClass(self.params.widget_code + '_settings');
				let loading_interval = setInterval(function () {
					if (self[self.name] !== undefined && self[self.name].loaded) {
						clearInterval(loading_interval);
						self[self.name].initConfig();
					}
				});
			},
			onSave: function (settings) {
				return self[self.name].Config.save(settings);
			},
			dpSettings: function () {
				$('.digital-pipeline__edit-process-container').addClass(self.params.widget_code + '_dp-settings');
				$('.' + self.params.widget_code + '_dp-settings').hide();
				let loading_interval = setInterval(function () {
					if (self[self.name] !== undefined && self[self.name].loaded) {
						clearInterval(loading_interval);
						self[self.name].initDpSettings();
					}
				});
			},
			advancedSettings: function () {
				let loading_interval = setInterval(function () {
					if (self[self.name] !== undefined && self[self.name].loaded) {
						clearInterval(loading_interval);
						self[self.name].initAdvancedSettings();
					}
				});
			},
			destroy: function () {
			},
		};

		return this;
	};
	return CustomWidget;
});
