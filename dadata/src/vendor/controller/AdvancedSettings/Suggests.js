define(function () {
	"use strict";

	let $this,
		Settings,
		Widget,
		_Widget,
		Library,
		$Contents,
		$SuggestList,
		$ContentsActions,
		$CreateForm,
		$Loader,
		Lang,
		_interval;

	function Suggests(SettingsObj, tab, WidgetObj, _WidgetObj, LibraryObj, $ContentsElem, LangPack) {
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
		this.AccountCurrent = null;
		this.Suggests = Widget.config.triggers;
		this.Dictionaries = Widget.config.dictionaries;

		this.suggest_types = new (Widget.classes['Collection'])([
			{ id: 'party', option: Lang('type.party') },
			{ id: 'bank', option: Lang('type.bank') },
			{ id: 'address', option: Lang('type.address') },
			{ id: 'fio', option: Lang('type.fio') },
			{ id: 'fio_standart', option: Lang('type.fio_standart') },
			{ id: 'email', option: Lang('type.email') },
			{ id: 'phone', option: Lang('type.phone') },
			{ id: 'fms_unit', option: Lang('type.fms_unit') },
			{ id: 'fns_unit', option: Lang('type.fns_unit') },
			{ id: 'postal_office', option: Lang('type.postal_office') },
			{ id: 'region_court', option: Lang('type.region_court') },
			{ id: 'country', option: Lang('type.country') },
			{ id: 'currency', option: Lang('type.currency') },
			{ id: 'okved2', option: Lang('type.okved2') },
			{ id: 'okpd2', option: Lang('type.okpd2') },
		]);

		if(typeof this.Dictionaries.each == 'function' && typeof this.Suggests.each == 'function') {
			this.Dictionaries.each(function(Dictionary) {
				$this.suggest_types.push({
					id: 'custom_' + Dictionary.id,
					option: Dictionary.name
				});
			});

			Library.requireAccountCurrent(function (AccountCurrent) {
				$this.AccountCurrent = AccountCurrent;
				$this.open();
			});
		} else {
			Widget.error(Lang('errors.need.save'));
			Settings.$Loader.hide();
		}
	};

	Suggests.prototype.open = function () {
		Library.renderTemplate('advanced_settings/suggest/suggests', {
			'config': Widget.config,
			'local_config': _Widget.get_settings(),
			'loader_classname': Widget.config.classname_widget + '-advanced-settings-widgets-loader',
			'managers': Library.managers,
			'suggests': $this.Suggests.sortBy($this.sort_column, $this.sort_order).all(),
			'suggest_types': $this.suggest_types.all(),
			'current_account': $this.AccountCurrent,
			'sort_column': $this.sort_column,
			'sort_order': $this.sort_order,
			'get_suggest_type_name': $this.getSuggestTypeName
		}).then(function (output) {
			$Contents.html(output);
			$SuggestList = $Contents.find('.' + Widget.config.classname_widget + '-section-wrapper.list-suggests');
			$Loader = $Contents.find('.' + Widget.config.classname_widget + '-advanced-settings-widgets-loader');
			Settings.$Loader.hide();
			$this.opened();
		});
	}

	Suggests.prototype.opened = function () {

		let multi_click = false;
		$SuggestList.on('click', '.list-row-head .list-row__cell-id .control-checkbox', function() {
			if($(this).find('input').prop('checked')) {
				multi_click = true;
				$SuggestList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox:not(is-checked)').trigger('click');
			}
		});

		$SuggestList.on('click', '.list-multiple-actions .control-checkbox', function() {
			multi_click = true;
			$SuggestList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked').trigger('click');
		});

		$SuggestList.on('mouseenter', '.list-row__cell-id .control-checkbox input:not([id="list_all_checker"])', function(e) {
			if(e.shiftKey && e.which == 1) {
				$(e.target).trigger('click');
			}
		});

		$SuggestList.on('click', '.list_multiple_actions .multiple-actions__top-checkbox', function() {
			$SuggestList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox:not(.is-checked)').trigger('click');
		});

		$SuggestList.on('change', '.js-list-row:not(.list-row_adding) .list-row__cell-id .control-checkbox input:not([id="list_all_checker"])', function(e) {
			let all_checker = $SuggestList.find('input[id="list_all_checker"]');
			let actions_checker = $SuggestList.find('input[id="multiple_actions_checkbox"]');
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
			let selected = $SuggestList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked');
			if(all_checker.prop('checked') && selected.length != $this.Suggests.count()) {
				all_checker.trigger('click');
			}
			$('.list-multiple-actions').remove();
			if(selected.length) {
				let suggest = null; 
				if(selected.length == 1) {
					let id = $(selected.get(0)).parents('.js-list-row').attr('data-id');
					if(!isNaN(id)) {
						suggest = $this.Suggests.find('id', id).first();
					}
				}

				Library.renderTemplate('advanced_settings/suggest/multi_actions', {
					'multi': ($this.Suggests.count() == selected.length || selected.length > 1),
					'items_count': $this.Suggests.count(),
					'selected_count': selected.length,
					'item_show': suggest != null && suggest.active ? 'disable' : 'unable'
				}).then(function(output) {		
					if(!($this.Suggests.count() == selected.length || selected.length > 1)) {
						$SuggestList.find('.list-row__cell-id .control-checkbox.is-checked').after(output);
					} else {
						$SuggestList.find('#list_table').append(output);
					}
				});
			}
		});

		$SuggestList.on('click', '#list_multiple_actions .js-list-multiple-actions__item', function() {
			let action = $(this).attr('data-type');
			let $selected = $SuggestList.find('.js-list-row:not(.list-row_adding, .js-list-row-head) .list-row__cell-id .control-checkbox.is-checked');
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
			} else if(action == 'clone') {
            	$this.clone({'id': selected[0]}).then(function() {
	                Library.showSuccessModal(Lang('success.clone'));
	            }).catch(function(error) {
	                Library.showErrorModal(Lang('errors.clone.error'));
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

		$SuggestList.on('click', '.js-cell-head_sortable', function() {
			let column_sort = $(this).attr('data-field-code');
			if($this.sort_column == column_sort) {
				$this.sort_order = $this.sort_order == 'ASC' ? 'DESC': 'ASC';
			} else {
				$this.sort_column = column_sort;
				$this.sort_order = 'DESC';
			}
			$this.open();
		});

		$SuggestList.on('click', '.list-row__template-name__table-wrapper__name-link', function (e) {
			e.preventDefault();
			e.stopPropagation();
			$this.edit($(this).parents('.js-list-row').data('id'));
		});

		$SuggestList.on('click', '.list-row_adding', function (e) {
			$this.create(Library.form($('#'+Widget.config.classname_widget+'_form-create-suggest'))).then(function() {
			}).catch(function(error) {
	            Library.showErrorModal(error || Lang('errors.create.error'));
			});
		});

	}

	Suggests.prototype.edit = function (suggest_id) {
		let Suggest = this.Suggests.find('id', suggest_id).first() || false,
			$row = $('.' + Widget.config.classname_widget + '_list-row[data-id="' + suggest_id + '"]')

		if (!Suggest) {
			return false;
		}

		return new Promise(function (resolve) {
			Library.modal({
				id: Widget.config.classname_widget + '_edit_suggest',
				classname: Widget.config.classname_widget + '-edit-rule ' + Widget.config.classname_widget + '-edit-' + Suggest.entity + '-suggest',
				width: 700,
				hide: true,
				callback: function ($Body, Modal) {
					require([_Widget.script_url + '/controller/AdvancedSettings/SuggestEdit.js'], function (SuggestEdit) {
						new SuggestEdit(Suggest, $this, $row, $Body, Modal, resolve, $this.AccountCurrent, Widget, _Widget, Library, Lang);
					})
				}
			})
		});
	}

	Suggests.prototype.create = function(data) {
		return new Promise(function(resolve, reject) {
			Widget.post('/suggest/create', data)
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    reject(Lang(response.error.message) || response.error.message);
	                } 
	                reject(Lang('errors.create.error'));
				}
				let Suggest = new Widget.classes['Trigger'](response.response, _Widget, Library, Lang);
				Widget.config.triggers.push(Suggest);
				$this.open();
				$this.edit(Suggest.id);
				resolve();
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Suggests.prototype.clone = function(data) {
		return new Promise(function(resolve, reject) {
			Widget.post('/suggest/clone', data)
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    reject(Lang(response.error.message) || response.error.message);
	                } 
	                reject(Lang('errors.clone.error'));
				}
				let Suggest = new Widget.classes['Trigger'](response.response, _Widget, Library, Lang);
				Widget.config.triggers.push(Suggest);
				$this.open();
				$this.edit(Suggest.id);
				resolve();
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Suggests.prototype.updateStatus = function(data) {
		return new Promise(function(resolve, reject) {
			Widget.post('/suggest/status', data)
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    return reject(Lang(response.error.message) || response.error.message);
	                } 
	                return reject(Lang('errors.save.error'));
				}

				$.each(data.id, function(k, id) {
					let Suggest = $this.Suggests.find('id', id).first();
					if(Suggest) {
						Suggest.active = data.active;
					}
				})
				
				$this.open();
				resolve();
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Suggests.prototype.update = function(data) {
		return new Promise(function(resolve, reject) {
			Widget.post('/suggest/save', data)
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    return reject(Lang(response.error.message) || response.error.message);
	                } 
	                return reject(Lang('errors.save.error'));
				}

				let Item = Widget.config.triggers.find('id', response.response.id).first();
				let Suggest = new Widget.classes['Trigger'](response.response, _Widget, Library, Lang);
				if(Suggest != null) {
					Widget.config.triggers.remove(Item);
					Widget.config.triggers.push(Suggest);
				}
				$this.open();
				resolve(Suggest);
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Suggests.prototype.remove = function(suggest_ids) {
		return new Promise(function(resolve, reject) {
			Widget.get('/suggest/remove', {'id': suggest_ids})
			.done(function(response) {
				if (response.status !== true) {
					if (response.error && response.error.message) {
	                    reject(Lang(response.error.message) || response.error.message);
	                } 
	                reject(Lang('errors.remove.error'));
				}
				
				$.each(suggest_ids, function(k, id) {
					let Suggest = Widget.config.triggers.find('id', id).first();
					if(Suggest != null) {
						Widget.config.triggers.remove(Suggest);
					}
				})
				$this.open();
				resolve();
			}).fail(function(xhr, error) {
				reject(Lang('errors.response.error'));
			});
		});
	}

	Suggests.prototype.getSuggestTypeName = function(type) {
		let SuggestType =$this.suggest_types.find('id', type).first();
		if(SuggestType) {
			return SuggestType.option;
		}
		return Lang('type.undefined');
	}

	return Suggests;
});
