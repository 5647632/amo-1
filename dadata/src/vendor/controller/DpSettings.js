define(['moment'], function(moment) {
    "use strict";

    let $this,
        Widget,
        _Widget,
        Library,
        Lang,
        $modal,
        $SelectedInput,
        $Body,
        $Form,
        $Content;
    
    function DpSettings(WidgetObj, _WidgetObj, LibraryObj, LangPack)
	{
        $this = this;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;
        
        $modal = $('.' + _Widget.params.widget_code + '_dp-settings');

        this.AccountCurrent = null;
        this.Suggests = Widget.config.triggers;
		this.Dictionaries = Widget.config.dictionaries;

		this.suggest_types = new (Widget.classes['Collection'])([
			{ id: 'party', option: Lang('type.party') },
			{ id: 'bank', option: Lang('type.bank') },
			{ id: 'address', option: Lang('type.address') },
			{ id: 'fio', option: Lang('type.fio') },
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
    }

    DpSettings.prototype.open = function() {
        $Body = $('#widget_settings__fields_wrapper');
        $Body.addClass(Widget.config.classname_widget + '-dp-settings');

        if ($Body.find('.' + Widget.config.classname_widget + '-dp-settings-contents').get(0) === undefined) {
            $Body.append('<div class="' + Widget.config.classname_widget + '-dp-settings-contents"></div>');
        }

        $SelectedInput =  $Body.find('input[name="suggests"]');
        $Content = $Body.find('.' + Widget.config.classname_widget + '-dp-settings-contents');

        Library.renderTemplate('dp/settings', {
            'config': Widget.config,
            'selected_suggests': $SelectedInput.val(),
            'suggests': $this.Suggests.all(),
            'current_account': $this.AccountCurrent,
            'get_suggest_type_name': $this.getSuggestTypeName
        }).then(function (output) {
            $Content.html(output);
            $Form = $('.digital-pipeline__edit-forms');
            $this.opened();
        }).catch(function(error) {
            Widget.error(Lang('error.template.render'));
        });

        return true;
    }

    DpSettings.prototype.opened = function() {   	

    	$Form.on('change', function() {
    		let formState = Library.form($(this));
    		if(formState.hasOwnProperty("suggests[]")) {
    			let suggests = formState["suggests[]"];
    			$SelectedInput.val(typeof suggests == 'object' ? suggests.join(',') : suggests);
    		} else {
    			$SelectedInput.val('');
    		}
    	});

    	$Form.on('click', '.js-trigger-save', function() {
    		if($SelectedInput.val().length == 0) {
    			Library.showErrorModal('Не выбрано ни одной подсказки');
    			return false;
    		}
        });
        
        $modal.show(0).trigger('modal:centrify');
    }

    DpSettings.prototype.getSuggestTypeName = function(type) {
		let SuggestType =$this.suggest_types.find('id', type).first();
		if(SuggestType) {
			return SuggestType.option;
		}
		return Lang('type.undefined');
	}


    return DpSettings;
});