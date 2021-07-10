define([Dadata()._Widget.script_url+'/lib/tagify.js', 'underscore'], function (Tagify, _) {
    "use strict";

    let $this,
        Suggest,
        Suggests,
        $Row,
        $Body,
        $Form,
        Modal,
        Account,
        resolve,
        Widget,
        _Widget,
        Library,
        Lang;

    function SuggestEdit(SuggestObj, SuggestsObj, $rowElem, $BodyElem, ModalObj, resolver, AccountObj, WidgetObj, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        Suggest = SuggestObj;
        Suggests = SuggestsObj;
        $Row = $rowElem;
        $Body = $BodyElem;
        Modal = ModalObj;
        Account = AccountObj;
        resolve = resolver;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        this.$SaveBtn = null;
        this.suggest_types = Suggests.suggest_types;
        this.is_custom = Suggest.type.match(/custom_[0-9]+/i);
        this.entity = Suggest.entity;
        this.type = Suggest.type;
        $this.open();
    };

    SuggestEdit.prototype.open = function () {
        Library.renderTemplate('advanced_settings/suggest/edit', {
            'config': Widget.config,
            'local_config': _Widget.get_settings(),
            'suggest_types': $this.suggest_types.all(),
            'current_account': Account,
            'suggest': Suggest,
            'is_custom': $this.is_custom,
            'suggest_entity': $this.entity,
            'suggest_type': $this.type
        }).then(function (output) {
            $Body.append(output);
            $Body.parents('.'+Widget.config.classname_widget+'_modal').find('.f5-modal-loader').hide();
		    $Body.show().trigger('modal:centrify');
            $Form = $Body.find('form');
            $this.opened();
        });
        resolve($this)
    }

    SuggestEdit.prototype.opened = function()
    {   
        let formState = Library.form($Form);
        $this.$SaveBtn = $Body.find('.'+Widget.config.classname_widget+'-suggest-save');
        $this.$SaveBtn.trigger('button:disable');

        $Form.on('change', function() {
            if(!_.isEqual(formState, Library.form($Form))) {
                $this.$SaveBtn.trigger('button:save:enable');
            } else {
                $this.$SaveBtn.trigger('button:save:disable');
            }
        });

        $Form.find('.'+Widget.config.classname_widget+'-tagify').each(function() {
            let $input = document.querySelector('[name="'+$(this).attr('name')+'"]');
            let tagify = new Tagify($input, $this.getTagifyOption());
            tagify.on('input', function(e){
                $Form.trigger('change');
                if(e.detail.prefix != undefined &&  e.detail.prefix.length > 0 ) {
                    tagify.dropdown.show.call(tagify, e.detail.value);
                }
            });
        });

        $Form.on('click', '.'+Widget.config.classname_widget+'-relations-delete', function() {
            $(this).parents('.'+Widget.config.classname_widget+'-relations-item').remove();
            $Form.trigger('change');
        });

        $Body.on('click', '.'+Widget.config.classname_widget+'-suggest-save:not(.button-input-disabled)', function() {
            let data = Library.form($Form);
            $this.$SaveBtn.trigger('button:load:start');
            Suggests.update(data).then(function(Suggest) {
                $this.$SaveBtn.trigger('button:load:stop').trigger('button:save:disable');
            }).catch(function(error) {
                $this.$SaveBtn.trigger('button:load:stop').trigger('button:load:error');
                Library.showErrorModal(error || Lang('errors.remove.error'));
            });
        });

        $Body.on('click', '.'+Widget.config.classname_widget+'-suggest-delete', function(e) {
            $(this).trigger('button:load:start');
            Suggests.remove([Suggest.id]).then(function() {
                $(e.target).trigger('button:load:stop');
                Modal.destroy();
                Library.showSuccessModal(Lang('success.remove'));
            }).catch(function() {
                $(e.target).trigger('button:load:stop').trigger('button:load:error');
                Library.showErrorModal(Lang('errors.remove.error'))
            });
        });

        $Form.on('click', '.control--suggest--list--item', function() {
            setTimeout(function() {$Form.trigger('change')}, 1000);
        });

        $Form.on('change', 'input[name="type"]', function() {
            $this.type = $(this).val();
            $Form.find('.'+Widget.config.classname_widget+'-relations-list').empty();
        });

        $Form.on('change', 'input[name="entity"]', function() {
            $this.entity = $(this).val();
        });


        $Form.on('change input', '.select-entity input', function(e) {
            let index = $(this).attr('name') !== 'entity' ? $(this).parents('.'+Widget.config.classname_widget+'-relations-item').data('index') : null;
            Library.renderTemplate('advanced_settings/suggest/field', {
                'config': Widget.config,
                'local_config': _Widget.get_settings(),
                'current_account': Account,
                'entity_selected': $(this).val(),
                'name': index !== null ? 'relations[' + index + '][field]' : 'field',
                'selected': Account.getCfByEntity($(this).val(), 'name').key,
            }).then(function (output) {
                $(e.target).parents('.'+Widget.config.classname_widget+'-row').find('.select-field').html(output);
            });
        });


        $Body.on('click', '.'+Widget.config.classname_widget+'-suggest-relation-add', function(event) {
            let $relations = $Form.find('.'+Widget.config.classname_widget+'-relations-item');
            let nextIndex = $relations.length > 0 ? $relations.last().data('index') + 1 : 0;
            let isCustom = $(this).hasClass('custom');
            Library.renderTemplate('advanced_settings/suggest/relation', {
                'config': Widget.config,
                'local_config': _Widget.get_settings(),
                'current_account': Account,
                'is_custom': $this.is_custom,
                'suggest_entity': $this.entity,
                'suggest_type': $this.type,
                'relation': {
                    'entity': $this.entity,
                    'field': '',
                    'value': '',
                    'custom': isCustom,
                    'rewrite': "on",
                },
                'index': nextIndex,
            }).then(function (output) {
                $Form.find('.'+Widget.config.classname_widget+'-relations-list').append(output);
                if(isCustom) {
                    let $input = document.querySelector('.'+Widget.config.classname_widget+'-relations-item[data-index="'+nextIndex+'"] textarea');
                    let tagify = new Tagify($input, $this.getTagifyOption());
                    tagify.on('input', function(e){ 
                        $Form.trigger('change');
                        if(e.detail.prefix != undefined &&  e.detail.prefix.length > 0 ) {
                            tagify.dropdown.show.call(tagify, e.detail.value);
                        }
                    });
                }
                $Form.trigger('change');
            });
        });
    }

    SuggestEdit.prototype.getWhitelist = function()
    {   
        let whitelist = [];
        $.each(Widget.config.getAttributes($this.type), function(key, attribute) {
            whitelist.push({'value': Lang($this.type +'.' + attribute.id), 'key': attribute.id})}
        );
        return whitelist;
    }

    SuggestEdit.prototype.getTagifyOption = function()
    {
        return {
            whitelist : $this.getWhitelist(),
            mode: 'mix',
            pattern: /%|#/,
            enforceWhitelist: true,
            mixTagsInterpolator: ['{~', '~}'],
            placeholder: 'для вставки значения, введите # или %',
            dropdown: {
                enabled : 0,
                closeOnSelect: true,
                fuzzySearch: true,
                maxItems: 200
            }
        };
    }


    return SuggestEdit;
});
