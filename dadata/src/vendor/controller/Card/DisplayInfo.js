define([Dadata()._Widget.script_url+'/lib/tagify.js', 'underscore', 'moment'], function (Tagify, _, moment) {
    "use strict";

    let $this,
        Suggest,
        Data,
        Card,
        $parentTarget,
        AccountCurrent,
        $Body,
        $Form,
        Modal,
        resolve,
        Widget,
        _Widget,
        Library,
        Lang;

    function DisplayInfo(SuggestObj, DataObj, $parentTargetElem, CardObj, AccountCurrentObj, $BodyElem, ModalObj, resolver, WidgetObj, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        Suggest = SuggestObj;
        Data = DataObj;
        Card = CardObj;
        $parentTarget = $parentTargetElem;
        AccountCurrent = AccountCurrentObj;
        $Body = $BodyElem;
        Modal = ModalObj;
        resolve = resolver;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        $this.open();
    };

    DisplayInfo.prototype.open = function () {
        Library.renderTemplate('card/info', {
            'config': Widget.config,
            'local_config': _Widget.get_settings(),
            'data': Data,
            'getValue': $this.getValue,
            'attributes': $this.groupedAttributes(Widget.config.getAttributes(Suggest.type)),
            'account_current': AccountCurrent,
            'suggest': Suggest
        }).then(function (output) {
            $Body.append(output);
            $Body.parents('.'+Widget.config.classname_widget+'_modal').find('.f5-modal-loader').hide();
            $Body.show().trigger('modal:centrify');
            resolve($this)
            $this.opened();
        });
    }

    DisplayInfo.prototype.groupedAttributes = function(attributes) {
        
        let grouped = {'general': []};
        $.each(attributes, function(i, attr) {
            let keys = attr.id.split(".");
            let group = 'general';
            if(keys.indexOf('data') != -1 && keys.indexOf('data') + 2 != keys.length) {
                group = keys[keys.indexOf('data') + 1];
            }
            if(grouped[group] == undefined) {
                grouped[group] = [];
            }
            grouped[group].push(attr);
        });
        return grouped;

    }

    DisplayInfo.prototype.opened = function() {

        $('body').on('keyup', function(e) {
            if(e.keyCode == 13) {
                $('.'+Widget.config.classname_widget+'-suggest-accept').trigger('click');
            } else if(e.which == 27){
                Modal.destroy();
            }
        });

        $Body.find('.'+Widget.config.classname_widget+'_accardeon-body').each(function() {
            let html = $(this).html().trim();
            if(html.length == 0) {
                $(this).parents('.'+Widget.config.classname_widget+'_accardeon-item').remove();
            }
        });

        $Body.on('click', '.'+Widget.config.classname_widget+'-suggest-accept', function() {
            Card.accept(Suggest, Data, $parentTarget);
            Modal.destroy();
        });

        $Body.on('click', '.'+Widget.config.classname_widget+'_accardeon-label', function() {
            $Body.find('.'+Widget.config.classname_widget+'_accardeon-body[data-code="' + $(this).data('label') + '"]').toggle();
        })

        $Body.find('.'+Widget.config.classname_widget+'-modal-body').focus();
    }

    DisplayInfo.prototype.getValueArrayKeys = function(value, keys, suggest_type = null, full_key = null) {
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

    DisplayInfo.prototype.getValue = function(key, suggest_type = null) {
        key = key.id;
        let keys = key.split(".");
        return $this.getValueArrayKeys(Data, keys, suggest_type, key);
    }

    return DisplayInfo;
});
