define(['underscore', 'moment'], function (_, moment) {
    "use strict";

    let $this,
        Widget,
        _Widget,
        Library,
        Lang;

    function Card(WidgetObj, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;
        
        this.data = null;
        this.disable = false;
        this.current_card = AMOCRM.data.current_card;
        this.Suggests = Widget.config.triggers;
        this.AccountCurrent = null;
        this.CardCurrent = null;
        this.list_selected = 0;
        this.show_card = false;
        this.parentWidth = null;
        this.entities = {1: 'contacts', 2: 'leads', 3: 'companies', 12: 'customers' };

        Library.requireAccountCurrent(function (AccountCurrent) {
            $this.AccountCurrent = AccountCurrent;
            $this.data = $this.getCurrentCardData();
            if(!$this.current_card.new_card) {
                Library.requireCardCurrent($this.entities[$this.current_card.element_type], $this.current_card.id, function(CardCurrent) {
                	$this.CardCurrent = CardCurrent;
                	$this.init();
                })
            } else {
                $this.init();
            }
        });
    }

    Card.prototype.init = function() {
        if($this.Suggests.count() == 0) return true;
        if(Widget.config.api_key.trim().length == 0) {
            Widget.error(Lang('errors.dadata.code.401'));
            return false;
        }

        $this.parentWidth = $('#card_fields').get(0).offsetWidth;
        let observer = new MutationObserver(mutationRecords => {
            $this.parentWidth = $('#card_fields').get(0).offsetWidth;
            let $suggest = $('.'+Widget.config.classname_widget+'_suggestion_dadata');
            let $parent = $suggest.parents('.'+Widget.config.classname_widget+'-field-top');
            if($parent.hasClass(Widget.config.classname_widget+ '_field-wrapper') || $parent.hasClass(Widget.config.classname_widget+ '_field-name')) {
                $suggest.css('width', $this.parentWidth - 68 + 'px');
            } else {
                $suggest.css('width', $parent.get(0).offsetWidth + 'px');
            }
          });
          
        observer.observe($('#card_fields').get(0), {
            childList: false,
            subtree: false,
            attributes: true,
            attributeFilter: ['style'],
            characterDataOldValue: false
        });


        $this.Suggests.each(function(suggest) {
            if((suggest.type == 'phone' || suggest.type == 'fio_standart') && Widget.config.standard_key.trim().length == 0) {
                return false;
            }
            let triggerField = $this.AccountCurrent.getCfByKey(suggest.entity, suggest.field);
            if(suggest.isActive() && suggest.canRun() && triggerField !== null) {
                $this.initSuggest(suggest, triggerField);
            }
        });
        return true;
    }

    Card.prototype.initSuggest = function(Suggest, triggerField) {
        let $inputs = [];
        if($this.current_card.element_type == Suggest.entity) {
            let target = $this.getInput($this.data.card.$el, triggerField);
            if(target) $inputs.push(target);
        } else {
            let links = $this.data.linked_forms[$this.entities[Suggest.entity]] || [];
            $.each(links, function(index, link) {
                if(link.is_editable) {
                    let target = $this.getInput(link.$el, triggerField);
                    if(target) $inputs.push(target);
                }
            });
        }

        $inputs.forEach(function($input, index) {

            $input.on('keydown', function(e) {
                if(e.which == 13 || e.which == 38 || e.which == 40) {
                    $this.selectList(e);
                    e.preventDefault();
                    return false;
                } else if(e.which == 27) {
                    $('.'+Widget.config.classname_widget+'_suggestion_dadata').toggleClass('minimize');
                    e.preventDefault();
                    return false;
                }
            });


            $input.on('keyup.f5-dadata, input.f5-dadata', function(e) {
                $input.addClass(Widget.config.classname_widget+'-input-full');
                if(e.which == 13 || e.which == 38 || e.which == 40 || e.which == 27) {
                    e.preventDefault();
                    return false;
                }
                
                $this.show_card = false;
                let length_have = Suggest.type == 'phone' ? 10 : 2;
                let length_current = Suggest.type == 'phone' ? $(this).val().replace(/[\D]+/g, '').length : $(this).val().length;
                if(length_current >= length_have) {
                    let suggestWidth = $('#card_fields').get(0).offsetWidth;
                    let $parent = null;
                    if($(this).parents('.card-fields__top-name-input-wrapper').get(0) != undefined) {
                        suggestWidth = suggestWidth - 68;
                        $parent = $(this).parents('.card-fields__top-name-input-wrapper').first();
                        $parent.addClass(Widget.config.classname_widget+'-field-top '+Widget.config.classname_widget+ '_field-wrapper');
                    } else if($(this).parents('.linked-form__field-name').get(0) != undefined) {
                        suggestWidth = suggestWidth - 68;
                        $parent = $(this).parents('.linked-form__field-name').first();
                        $parent.addClass(Widget.config.classname_widget+'-field-top '+Widget.config.classname_widget+ '_field-name');
                    } else if($(this).parents('.linked-form__field__value').get(0) != undefined) {
                        $parent = $(this).parents('.linked-form__field__value').first();
                        suggestWidth = $parent.get(0).offsetWidth;
                        $parent.addClass(Widget.config.classname_widget+'-field-top '+Widget.config.classname_widget+ '_field-value');
                    } else {
                        return false;
                    }

                    if($parent.find('.'+Widget.config.classname_widget+'_suggestion_dadata').length == 0) {
                        $parent.append('<div class="'+Widget.config.classname_widget+'_suggestion_dadata"></div>');
                    }

                    let $SuggestBody = $parent.find('.'+Widget.config.classname_widget+'_suggestion_dadata');
                    $SuggestBody.css('width', suggestWidth + 'px');

                    $this.getSuggest($(this).val(), Suggest.type).then(function(data) {
                        $this._suggestions = [...data.suggestions]
                    
                        $this.renderList($SuggestBody, Suggest, $this._suggestions, $(e.target));
                        $SuggestBody.off('click').on('click', '.'+Widget.config.classname_widget+'-suggest-item', function() {
                            var selected = $(this).data('id');
                            var data =  $this._suggestions[selected];
                            if(Suggest.type == 'party') {
                                $this.findParty({query: data.data.inn, branch_type: data.data.branch_type, type: data.data.type, kpp: data.data.kpp}, Suggest.type).then(function(dataRow) {
                                    if(dataRow.suggestions.length == 1) {
                                        var data = dataRow.suggestions[0];
                                    } else {
                                        var suggest = _.filter(dataRow.suggestions, (suggest, key) => suggest.value == $this._suggestions[selected].value)[0];
                                        if(suggest) {
                                            var data = suggest;
                                        } else {
                                            var data = Object.assign(dataRow.suggestions[0], $this._suggestions[selected]);
                                        }
                                    }
                                    if(Suggest.show_card) {
                                        $this.renderCard(Suggest, data, $input);
                                    } else {
                                        $this.accept(Suggest, data, $input);
                                        $('.'+Widget.config.classname_widget+'_suggestion_dadata').remove();
                                        $('.'+Widget.config.classname_widget+'-field-top').removeClass(Widget.config.classname_widget+'-field-top');
                                    }
                                });
                            } else if(Suggest.type == 'fio_standart') {
                                $this.findName(data.value, Suggest.type).then(function(dataRow) {
                                    var data = Object.assign(dataRow.suggestions[0], data);
                                    if(Suggest.show_card) {
                                        $this.renderCard(Suggest, data, $input);
                                    } else {
                                        $this.accept(Suggest, data, $input);
                                        $('.'+Widget.config.classname_widget+'_suggestion_dadata').remove();
                                        $('.'+Widget.config.classname_widget+'-field-top').removeClass(Widget.config.classname_widget+'-field-top');
                                    }
                                });
                            } else {
                                if(Suggest.show_card) {
                                    $this.renderCard(Suggest, data, $input);
                                } else {
                                    $this.accept(Suggest, data, $input);
                                    $('.'+Widget.config.classname_widget+'_suggestion_dadata').remove();
                                    $('.'+Widget.config.classname_widget+'-field-top').removeClass(Widget.config.classname_widget+'-field-top');
                                }
                            }
                        });

                        $(document).off('click.f5-dadata:suggestout').on('click.f5-dadata:suggestout', function(event) {
                            let container = $('.'+Widget.config.classname_widget+'_suggestion_dadata');
                            if(!container.is(event.target) && container.has(event.target).length === 0 && $this.show_card == false) {
                                $('.'+Widget.config.classname_widget+'-field-top').find('.'+Widget.config.classname_widget+'_suggestion_dadata').remove();
                                $('.'+Widget.config.classname_widget+'-field-top').removeClass(Widget.config.classname_widget+'-field-top');
                            }
                        });
                    }).catch(function(error) {
                        let error_count = $(e.target).attr('data-thortle');
                        $(e.target).attr('data-thortle', error_count++);
                        Widget.error(Lang(error) || error);
                        if(error_count > 2) {
                            $(e.target).off('keyup.f5-dadata');
                        }
                    });
                } else {
                    $('.'+Widget.config.classname_widget+'-field-top').find('.'+Widget.config.classname_widget+'_suggestion_dadata').remove();
                    $('.'+Widget.config.classname_widget+'-field-top').removeClass('.'+Widget.config.classname_widget+'-field-top');
                }
            })
        });
    }

    Card.prototype.accept = function(Suggest, data, $input) {
        return new Promise(function(resolve, reject) {
            if(Object.keys(Suggest.relations).length > 0) {
                $this.getPermission(Suggest, data, $input, function(access) {
                    $.each(Suggest.relations, function(key, relation) {
                        var field = $this.AccountCurrent.getCfByKey(relation.entity, relation.field);
                        if(field !== null) {
                            let $target = null;
                            if($this.current_card.element_type == relation.entity) {
                                $target = $this.getInput($this.data.card.$el, field);
                            } else if (Suggest.entity == relation.entity) {
                                let links = $this.data.linked_forms[$this.entities[relation.entity]] || [];
                                let access_entity = access.permission[$this.entities[relation.entity]];
                                let $inputs = [];
                                $.each(links, function(index, link) {
                                    if(!isNaN(access_entity)  && access_entity == link.id) {
                                        let target = $this.getInput(link.$el, field);
                                        if(target) $inputs.push(target);
                                    } else if (access_entity == 'new' && link.is_create_new) {
                                        let target = $this.getInput(link.$el, field);
                                        if(target) {
                                            if(!link.$el.find('.linked-forms__item_is-add').hasClass('expanded')) {
                                                link.$el.find('.linked-forms__item_is-add').trigger('click');
                                            }
                                            $inputs.push(target);
                                        }
                                    }
                                });
                                $target = $inputs[0] || false;
                            } else {
                                let links = $this.data.linked_forms[$this.entities[relation.entity]] || [];
                                let access_entity = access.permission[$this.entities[relation.entity]];
                                let $inputs = [];
                                $.each(links, function(index, link) {
                                    if(!isNaN(access_entity) && access_entity == link.id) {
                                        let target = $this.getInput(link.$el, field);
                                        if(target) $inputs.push(target);
                                    } else if (access_entity == 'new' && link.is_create_new) {
                                        let target = $this.getInput(link.$el, field);
                                        if(target) {
                                            if(!link.$el.find('.linked-forms__item_is-add').hasClass('expanded')) {
                                                link.$el.find('.linked-forms__item_is-add').trigger('click');
                                            }
                                            $inputs.push(target);
                                        }
                                    }
                                });
                                $target = $inputs[0] || false;
                            }

                            if($target) {
                                if(relation.custom) {
                                    var value = relation.value;
                                    let match = relation.value.match(/~{[^~]+}~/g);
                                    var matshes = match.map(function(item){ return item.replace('~{','{').replace('}~','}') });
                                    $.each(matshes, function(key, val) {
                                        var field = JSON.parse(val);
                                        var v = $this.getValue(data, field.key, Suggest.type);
                                        value = value.replace("{~"+val+"~}", Lang(Suggest.type +'.'+relation.value +'.'+v) || v);
                                    });
                                    if(relation.rewrite || $target.val().length == 0) {
                                        $this.setValue($target, value, field);
                                    }
                                } else {
                                    var val = $this.getValue(data, relation.value, Suggest.type);
                                    if(relation.rewrite || $target.val().length == 0) {
                                        val = Lang(Suggest.type +'.'+relation.value +'.'+val) || val;
                                        $this.setValue($target, val, field);
                                    }
                                }
                            }
                        }
                    });
                });
            } else {
                reject(Lang('errors.relations.empty'));
            }
        });
    }

    Card.prototype.renderCard = function(Suggest, data, $parentTarget) {
        return new Promise(function (resolve) {
            Library.modal({
                id: Widget.config.classname_widget + '_info_suggest',
                classname: Widget.config.classname_widget + '-info-suggest ' + Widget.config.classname_widget + '-info-' + Suggest.entity + '-suggest',
                width: 700,
                hide: true,
                disable_overlay_click: false,
                callback: function ($Body, Modal) {
                    $this.show_card = true;
                    $Body.trigger('click').focus();
                    require([_Widget.script_url + '/controller/Card/DisplayInfo.js'], function (DisplayInfo) {
                        new DisplayInfo(Suggest, data, $parentTarget, $this, $this.AccountCurrent,  $Body, Modal, resolve, Widget, _Widget, Library, Lang);
                    });
                },
                destroy: function() {
                    $this.show_card = false;
                    $parentTarget.focus();
                }
            })
        });
    }

    Card.prototype.setValue = function($input, value, field) {
        if(value == null || value == undefined) {
            return true;
        }
        var type = parseInt(field.type);

        if([1, 2, 8, 9, 7, 11, 15, 17].indexOf(type) > -1) {
            $input.val(value).trigger('controls:change');
        } else if(type == 3) {
            if($.type(value) == 'boolean' || (Library.tryParse(value) !== false && $.type(JSON.parse(value)) == 'boolean')) {
                if($input.prop('checked') && !JSON.parse(value)) {
                    $input.trigger('controls:change');
                } else if (!$input.prop('checked') && JSON.parse(value)) {
                    $input.trigger('controls:change');
                }
            } else {
                Widget.error('Нельзя установить "'+ value + '" для поля "' + field.name + '"');
            }
        } else if(type == 4) {
            var done = false;
            $.each(field.enums, function(id, val) {
                if(value == id || value == val) {
                    $input.val(id).trigger('controls:change');
                    done = true;
                } 
            });
            if(!done) {
                Widget.error('Нельзя установить "'+ value + '" для поля "' + field.name + '"');
            }
        } else if(type == 5) {
            var values = value.split(",");
            var current_value = [];
            let parent_elem = $input.parents('.linked-forms__item');
            if(parent_elem.get(0) != undefinded) {
                $.each(field.enums, function(id, val) {
                    var target = parent_elem.find('[name="CFV['+field.id+']['+id+']"]');
                    if(target.get(0) != undefined) {
                        if(values.includes(id.toString()) || values.includes(val)) {
                            if(!target.prop('checked')) {
                                $(target).trigger('controls:change');
                            } 
                        } else {
                            if(target.prop('checked')) {
                                $(target).trigger('controls:change');
                            }
                        }
                    }
                });
            }
        } else if (type == 10 && field.enums != null) {
            let parent_elem = $input.parents('.linked-forms__item'); 
            if(parent_elem.get(0) != undefined) {
                var done = false;
                $.each(field.enums, function(id, val) {
                    var elem = parent_elem.find('#cf_'+field.id+'_'+id+'_').first();
                    if(elem.get(0) != undefined) {
                        if(value == id || value == val) {
                            elem.trigger('controls:change');
                            done = true;
                        }
                    } 
                });
                if(!done) {
                    Widget.error('Нельзя установить "'+ value + '" для поля "' + field.name + '"');
                }
            }
        } else if(type == 13) {
            $input.val(value).trigger('controls:change');
        
        } else if ([6, 14].indexOf(type) > -1) {
            if($.type(value) == 'number') {
                Widget.error('Нельзя установить "'+ value + '" для поля "' + field.name + '"');
                return false;
            } 
            $input.val(value).trigger('controls:change');
        } else {
            Widget.error("Не подерживаемый тип "+ field.type +" у поля " + field.name);
        }
    }

    Card.prototype.getPermission = function(Suggest, data, $input, callback = null) {
    	let relations = Suggest.relations;
    	let element_type = $this.current_card.element_type;
    	let need_access = [];
    	$.each(relations, function(i, relation) {
    		if(!need_access.includes(relation.entity) && element_type != relation.entity) {
    			need_access.push(relation.entity);
    		}
    	});
        let access = {'free': false, 'permission': []};
        if(need_access.length == 0) {
            access.free = true;
            callback(access);
        } else if (need_access.length == 1 && need_access[0] == Suggest.entity) {
            access.free = false;
            let parent = $input.parents('.linked-forms__item');
            let perm_entity = $this.entities[parent.find('[name="ELEMENT_TYPE"]').val()];
            if(parent.hasClass('linked-forms__item_is-add')) {
                access.permission[perm_entity] = 'new';
            } else {
                access.permission[perm_entity] = parent.find('[name="ID"]').val();
            }
            callback(access);
        } else {
            Library.renderTemplate('card/permission', {
                'config': Widget.config,
                'current_card': $this.CardCurrent,
                'linked_forms': $this.data.linked_forms,
                'need_access': need_access
            }).then(function(output) {
                Library.modal({
                    id: Widget.config.classname_widget + '_info_suggest',
                    classname: Widget.config.classname_widget + '-permission-suggest ' + Widget.config.classname_widget + '-permission-' + Suggest.entity + '-suggest',
                    width: 500,
                    html: output,
                    callback: function ($Body, Modal) {
                        $Body.on('click', '.js-modal-accept', function() {
                            let form = Library.form($('.'+Widget.config.classname_widget+'-permission-form'));
                            if(Object.keys(form) == 0) {
                                Library.showErrorModal(Lang('errors.nothings.choosen'));
                                return false;
                            }
                            if(form.hasOwnProperty('leads')) {
                                $this.updateLead(Suggest, data, form.leads);
                            }
                            Modal.destroy();
                            access.permission = form;
                            callback(access);
                        })
                    }
                })
            });
        }
    }

    Card.prototype.updateLead = function(Suggest, data, lead_id) {
        return Widget.updateLead(Suggest.id, data, lead_id);
    } 

    Card.prototype.getSuggest = function(value, type) {
        return Widget.DadataRequest.query(value, type);
    }

    Card.prototype.findParty = function(options, type) {
    	return Widget.DadataRequest.query(options, 'party_find');
    }

    Card.prototype.findName = function(value, type) {
        return Widget.DadataRequest.query(value, 'fio_clean');
    }


    Card.prototype.renderList = function ($Body, Suggest, data, $input) {
        let type = null;
        let dictionary = null;
        if( Suggest.type.match(/custom_[0-9]+/i)) {
            type = 'custom';
            let id = Suggest.type.split("_")[1];
            dictionary = Widget.config.dictionaries.find('id', id).first();
        } else {
            type = Suggest.type;
        }
        Library.renderTemplate('card/suggest', {
            'config': Widget.config,
            'local_config': _Widget.get_settings(),
            'type': type,
            'is_custom': type == 'custom',
            'dictionary': dictionary,
            'suggests': data
        }).then(function (output) {
            $Body.html(output);
            $Body.focus();
            $this.list_selected = 0;
            if(data.length > 0) {
                $Body.find('.f5-dadata-suggest-item').first().addClass('selected');
            }
            $('.f5-dadata-minimize').on('click', function() {
                $('.'+Widget.config.classname_widget+'_suggestion_dadata').toggleClass('minimize');
            });
        });
    }

    Card.prototype.selectList = function(event) {
        if($this.show_card == false) {
            let $Body = $('.'+Widget.config.classname_widget+'_suggestion_dadata');
            let $List = $Body.find('.'+Widget.config.classname_widget+'_suggestions-list');
            if(event.key == 'ArrowDown' || event.which == 40) {
                $Body.find('.f5-dadata-suggest-item').removeClass('selected');
                $this.list_selected = $this._suggestions.length - 1 > $this.list_selected ? $this.list_selected + 1 : 0;
                $Body.find('.f5-dadata-suggest-item[data-id="'+$this.list_selected+'"]').addClass('selected');

                $List.scrollTop($List.scrollTop() + $List.find('.f5-dadata-suggest-item.selected').position().top
                - $Body.height()/2 + $List.find('.f5-dadata-suggest-item.selected').height()/2 - 20);
            } else if(event.key == 'ArrowUp' || event.which == 38) {
                $Body.find('.f5-dadata-suggest-item').removeClass('selected');
                $this.list_selected = $this.list_selected != 0 ? $this.list_selected - 1 : $this._suggestions.length - 1;
                $Body.find('.f5-dadata-suggest-item[data-id="'+$this.list_selected+'"]').addClass('selected');
                $List.scrollTop($List.scrollTop() + $List.find('.f5-dadata-suggest-item.selected').position().top
                - $List.height()/2 + $List.find('.f5-dadata-suggest-item.selected').height()/2);
            } else if(event.key == 'Enter' || event.which == 13) {
                $Body.find('.f5-dadata-suggest-item.selected').trigger('click');
                event.preventDefault();
            }
        }
    }

    Card.prototype.getValueArrayKeys = function(value, keys, suggest_type = null, full_key = null) {
        keys.forEach(function(key, index, array) {
            if(_.isObject(value) && value.hasOwnProperty(key)) {
                value = _.propertyOf(value)(key);
            } else if(_.isArray(value)) {
                let next_keys = keys.slice(index, array.length);
                value = _.map(value, (item) => {
                    let val = $this.getValueArrayKeys(item, next_keys);
                    return val != null && val.length > 0 ? (Lang(suggest_type + '.' + full_key + '.' + val) || val): null;
                }).filter((val) => val).join(", ");
            } else if(_.isNumber(value) || _.isString(value)) {
                value = value;
            } else {
                value = null;
            }

            if(value != null && ['ogrn_date', 'actuality_date', 'registration_date', 'issue_date'].includes(key)) {
                value = moment(value).format("DD.MM.YYYY");
            }
        });

        return value;
    }

    Card.prototype.getValue = function(data, key, suggest_type = null) {
        let keys = key.split(".");
        return $this.getValueArrayKeys(data, keys, suggest_type, key);
    }

    Card.prototype.getInput = function($parent,  field) {
        let $target = null;
        if(typeof field.class == 'object' ) {
            var classname = [];
            field.class.forEach(function(value) {
                classname.push('[name="' + value + '"]');
            });
            $target = $parent.find(classname.join(", "));
        } else {
            $target = $parent.find('[name="' + field.class + '"]');
        }

        if($target.get(0) == undefined) {
            var classname = $this.getSpecifyTarget(field);
            if(classname) {
                $target = $parent.find(classname);
            } else {
                return false;
            }
        }

        return $target;
    }

    Card.prototype.getSpecifyTarget = function(field) {
        var predefined_cf = AMOCRM.constant('account').predefined_cf;
        var classname = null;
        $.each(predefined_cf, function(key, f) {
            if(field.id == f.ID) {
                if(f.CODE == 'PHONE') {
                    classname =  ".control-phone input.control-phone__formatted";
                } else if (f.CODE == 'EMAIL') {
                    classname = '.linked-form__cf[data-type="email"]';
                }
            }
        });
        return classname;
    }

    Card.prototype.getCurrentCardData = function() {
        let data = {'card': {},'linked_forms': {}};

        data.card.model = $this.current_card.model.attributes;
        data.card.$el = $this.current_card.form.$el;

        let linked_forms = $this.current_card.linked_forms;
        let forms = linked_forms.form_views;

        $.each(forms, function(index, form) {
            let key = form._data.entity;
            if(key == undefined) {
                let element_type = parseInt(form.model.attributes.ELEMENT_TYPE);
                key = $this.entities[element_type];
            }

            if(data.linked_forms[key] === undefined) {
                data.linked_forms[key] = [];
            }

            let attributes = form.model.attributes;
            data.linked_forms[key].push({
                'id': !attributes.hasOwnProperty('ID') ? null : attributes.ID,
                'model': attributes,
                '$el': form.$el,
                'is_editable': form.$el.is(":visible"),
                'is_create_new': !attributes.hasOwnProperty('ID')
            })
        });

        return data;
    }

    return Card;
});