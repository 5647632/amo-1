define(function () {
	"use strict";

	let $this,
		Settings,
		Widget,
		_Widget,
		Library,
		$Contents,
		$DictionaryList,
		$CreateForm,
		$Loader,
		Lang,
		_interval;

	function Dictionaries(SettingsObj, tab, WidgetObj, _WidgetObj, LibraryObj, $ContentsElem, LangPack) {
		$this = this;
		Settings = SettingsObj;
		Widget = WidgetObj;
		_Widget = _WidgetObj;
		Library = LibraryObj;
		$Contents = $ContentsElem;
		Lang = LangPack;

		this.tab = tab;
		this.sort_column = 'id'
		this.sort_order = 'DESC';
		this.selected = [];
		this.Dictionaries = Widget.config.dictionaries;

		if(typeof this.Dictionaries.each == 'function') {
			$this.open();
		} else {
			Widget.error(Lang('errors.need.save'));
			Settings.$Loader.hide();
		}
	};

	Dictionaries.prototype.open = function () {
		Library.renderTemplate('advanced_settings/dictionary/dictionaries', {
			'config': Widget.config,
			'local_config': _Widget.get_settings(),
			'loader_classname': Widget.config.classname_widget + '-advanced-settings-widgets-loader',
			'managers': Library.managers,
			'dictionaries': $this.Dictionaries.sortBy($this.sort_column, $this.sort_order).all(),
			'current_account': $this.AccountCurrent,
			'sort_column': $this.sort_column,
			'sort_order': $this.sort_order,
		}).then(function (output) {
			$Contents.html(output);
			$DictionaryList = $Contents.find('.' + Widget.config.classname_widget + '-section-wrapper.list-dictionaries');
			$Loader = $Contents.find('.' + Widget.config.classname_widget + '-advanced-settings-widgets-loader');
			Settings.$Loader.hide();
			$this.opened();
		});
	}

	Dictionaries.prototype.opened = function () {

		let multi_click = false;
		$DictionaryList.on('click', '.list-row-head .list-row__cell-id .control-checkbox', function() {
			if($(this).find('input').prop('checked')) {
				multi_click = true;
				$DictionaryList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox:not(is-checked)').trigger('click');
			}
		});

		$DictionaryList.on('click', '.list-multiple-actions .control-checkbox', function() {
			multi_click = true;
			$DictionaryList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked').trigger('click');
		});

		$DictionaryList.on('mouseenter', '.list-row__cell-id .control-checkbox input:not([id="list_all_checker"])', function(e) {
			if(e.shiftKey && e.which == 1) {
				$(e.target).trigger('click');
			}
		});

		$DictionaryList.on('click', '.list_multiple_actions .multiple-actions__top-checkbox', function() {
			$DictionaryList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox:not(.is-checked)').trigger('click');
		});

		$DictionaryList.on('change', '.js-list-row:not(.list-row_adding) .list-row__cell-id .control-checkbox input:not([id="list_all_checker"])', function(e) {
			let all_checker = $DictionaryList.find('input[id="list_all_checker"]');
			let actions_checker = $DictionaryList.find('input[id="multiple_actions_checkbox"]');
			if((actions_checker.prop('checked') || actions_checker.parents('label').hasClass('control-checkbox-dash')) && multi_click ) {
				if($('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked').length > 0) {
					return false;
				}
			} else if(all_checker.prop('checked') && multi_click) {
				if($(e.target).closest($('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox input:not([id="list_all_checker"])').last()).length != 1) {
					return false;
				} 
			} 
			multi_click = false;
			let selected = $DictionaryList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked');
			if(all_checker.prop('checked') && selected.length != $this.Dictionaries.count()) {
				all_checker.trigger('click');
			}
			$('.list-multiple-actions').remove();
			if(selected.length) {
				let suggest = null; 
				if(selected.length == 1) {
					let id = $(selected.get(0)).parents('.js-list-row').attr('data-id');
					if(!isNaN(id)) {
						suggest = $this.Dictionaries.find('id', id).first();
					}
				}

				Library.renderTemplate('advanced_settings/suggest/multi_actions', {
					'multi': ($this.Dictionaries.count() == selected.length || selected.length > 1),
					'items_count': $this.Dictionaries.count(),
					'selected_count': selected.length,
					'item_show': suggest != null && suggest.active ? 'disable' : 'unable'
				}).then(function(output) {		
					if(!($this.Dictionaries.count() == selected.length || selected.length > 1)) {
						$DictionaryList.find('.list-row__cell-id .control-checkbox.is-checked').after(output);
					} else {
						$DictionaryList.find('#list_table').append(output);
					}
				});
			}
		});

		$DictionaryList.on('click', '#list_multiple_actions .js-list-multiple-actions__item', function() {
			let action = $(this).attr('data-type');
			let $selected = $DictionaryList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked');
			let selected = [];
			$selected.each(function(k, el) {
				let id = $(el).parents('.js-list-row').attr('data-id');
				if(!isNaN(id)) {
					selected.push(id);
				}
			});

			if(action == 'edit') {
				$this.edit(selected[0]);
			} else if (action == 'disable') {
				$this.updateStatus({'id': selected, 'active': 0}).then(function() {
                	Library.showSuccessModal(Lang('success.disable'));
            	}).catch(function() {
            		Library.showErrorModal(Lang('errors.change_status.error'));
            	});
            } else if(action == 'unable') {
            	$this.updateStatus({'id': selected, 'active': 1}).then(function() {
	                Library.showSuccessModal(Lang('success.unable'));
	            }).catch(function(error) {
	                Library.showErrorModal(Lang('errors.change_status.error'));
	            });
            } else if(action == 'delete') {
            	Library.confirm({
            		'header': 'Удалить элементы',
            		'confirm_text_1': 'Вы действительно хотите удалить выбранные элементы?',
            		'confirm_text_2': 'Все данные, как-либо связанные с выбранными элементами, будут удалены. Восстановить удалённые данные будет невозможно.'
            	}, function() {
            		$this.remove(selected).then(function() {
	                	Library.showSuccessModal(Lang('success.remove'));
	            	}).catch(function(error) {
	                	Library.showErrorModal(error || Lang('errors.remove.error'));
	            	});
            	});
            }
		});

		$DictionaryList.on('click', '.js-cell-head_sortable', function() {
			let column_sort = $(this).attr('data-field-code');
			if($this.sort_column == column_sort) {
				$this.sort_order = $this.sort_order == 'ASC' ? 'DESC': 'ASC';
			} else {
				$this.sort_column = column_sort;
				$this.sort_order = 'DESC';
			}
			$this.open();
		});

		$DictionaryList.on('click', '.list-row__template-name__table-wrapper__name-link', function (e) {
			e.preventDefault();
			e.stopPropagation();
			$this.edit($(this).parents('.js-list-row').data('id'));
		});

		$DictionaryList.on('click', '.list-row_adding', function (e) {
			$this.createForm();
		});

	}

	Dictionaries.prototype.createForm = function() {
		return new Promise(function (resolve) {
			Library.renderTemplate('advanced_settings/dictionary/create', {
            	'config': Widget.config,
            	'local_config': _Widget.get_settings(),
            	'header': "Создание справочника"
        	}).then(function(output) {
        		Library.modal({
					id: Widget.config.classname_widget + '_create_dictionary',
					classname: Widget.config.classname_widget + '-create-dictionary',
					width: 500,
					hide: true,
					html: output,
					callback: function ($Body, Modal) {
						$Body.parents('.'+Widget.config.classname_widget+'_modal').find('.f5-modal-loader').hide();
		    			$Body.show().trigger('modal:centrify');

		    			$Body.on('change', '#dictionary_file', function() {
							var regex = /^([a-zA-ZА-Яa-я0-9\s_\\.\-\(\):])+(.csv|.txt)$/;
				            if (!regex.test($(this).val().toLowerCase())) {
				            	$(this).val("");
				            	Library.showErrorModal('Пожалуйста, загрузите валидный CSV файл.');
				            }
						});

		    			$Body.on('click', '.create-dictionary', function (e) {
							if($('#dictionary_name').val().length == 0) {
								Library.showErrorModal('Не указано название справочника');
								return false;
							}

							if($('#dictionary_file').val().length == 0) {
								Library.showErrorModal('Не выбран файл справочника');
								return false;
							}

							let form = new FormData(document.querySelector('#f5-dadata_form-create-dictionary'));
							form.append('file', $('#dictionary_file').get(0).files[0]);
							form.append('name', $('#dictionary_name').val());
							$(this).trigger('button:load:start');
							$this.create(form).then(function() {
								$(e.target).trigger('button:load:stop');
								Modal.destroy();
							}).catch(function(error) {
								$(e.target).trigger('button:load:stop').trigger('button:load:error');
								Library.showErrorModal(error);
							});
							
						});
					}
				});
        	})
		});
	}

	Dictionaries.prototype.edit = function (dictionary_id) {
		let Dictionary = this.Dictionaries.find('id', dictionary_id).first() || false,
			$row = $('.' + Widget.config.classname_widget + '_list-row[data-id="' + dictionary_id + '"]')

		if (!Dictionary) {
			return false;
		}

		return new Promise(function (resolve) {
			Library.modal({
				id: Widget.config.classname_widget + '_edit_dictionary',
				classname: Widget.config.classname_widget + '-edit-dictionary',
				width: 700,
				hide: true,
				callback: function ($Body, Modal) {
					require([_Widget.script_url + '/controller/AdvancedSettings/DictionaryEdit.js'], function (DictionaryEdit) {
						new DictionaryEdit(Dictionary, $this, $row, $Body, Modal, resolve, Widget, _Widget, Library, Lang);
					})
				}
			})
		});
	}

	Dictionaries.prototype.create = function(data) {
		return new Promise(function(resolve, reject) {
			Widget.post('/dictionary/create', data,  {
				contentType: false, 
                processData: false, 
			}).done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    reject(Lang(response.error.message) || response.error.message);
	                } 
	                reject(Lang('errors.create.error'));
				}
				let Dictionary = new Widget.classes['Dictionary'](response.response, _Widget, Library, Lang);
				Widget.config.dictionaries.push(Dictionary);
				$this.open();
				$this.edit(Dictionary.id);
				resolve();
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Dictionaries.prototype.update = function(data) {
		return new Promise(function(resolve, reject) {
			Widget.post('/dictionary/save', data)
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    return reject(Lang(response.error.message) || response.error.message);
	                } 
	                return reject(Lang('errors.save.error'));
				}
				let Item = Widget.config.dictionaries.find('id', response.response.id).first();
				let Dictionary = new Widget.classes['Trigger'](response.response, _Widget, Library, Lang);
				if(Dictionary != null) {
					Widget.config.dictionaries.remove(Item);
					Widget.config.dictionaries.push(Dictionary);
				}
				$this.open();
				resolve(Dictionary);
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Dictionaries.prototype.remove = function(dictionary_id) {
		return new Promise(function(resolve, reject) {
			Widget.get('/dictionary/remove', {'id': dictionary_id})
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    reject(Lang(response.error.message) || response.error.message);
	                } 
					return reject(Lang('errors.remove.error'));
				}

				Widget.config.triggers.each(function(trigger) {
					if(trigger.type == 'custom_'+dictionary_id) {
						Widget.config.triggers.remove(trigger);
					}
				});

				let Dictionary = Widget.config.dictionaries.find('id', dictionary_id).first();
				if(Dictionary != null) {
					Widget.config.dictionaries.remove(Dictionary);
				}
				$this.open();
				resolve();
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	return Dictionaries;
});
