define(['moment'], function (moment) {
    "use strict";

    let $this,
        Widget,
        _Widget,
        Library,
        Lang;

    function Config(data, WidgetObj, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;
        
        this.min_user_selected = Object.keys(Library.managers).length;
        this.has_stat = false;
        this.status = -2;
        this.status_to = '01.01.2020';
        this.is_free = false;
        this.is_fixed = false;
        this.price = _Widget.language == 'ru' ? 100 : 2;
        this.months = [6, 10];
        this.gifts = [0, 2];
        this.selected_period = this.months[0];
        this.user_count = this.min_user_selected < 5 ? 5 : this.min_user_selected;
        this.classname_widget = 'f5-dadata';
        this.triggers = [];
        this.dictionaries = [];
        this.attributes = {};

        $.each(data, function (key, val) {
            $this[key] = val;
        });

    };

    Config.prototype.statusTo = function () {
        return moment(new Date($this.status_to.replace(' ', 'T') + '+03:00'));
    };

    Config.prototype.calcStatusToFromMonths = function (months = 0) {
        let current_date = moment(new Date()),
            from_date = current_date;

        if ($this.statusTo().format('YYYY-MM-DD') > current_date.format('YYYY-MM-DD')) {
            from_date = $this.statusTo();
        }
        return from_date.add(months, 'months');
    };

    Config.prototype.getAttributes = function(suggest_type) {
        let plan = _Widget.get_settings().plan || 'default';
        let plans = ['default', 'extensive', 'all'];
        let list = $this.attributes[suggest_type] || false;
        let attributes = [];
        if(list) {
            let index = plans.indexOf(plan);
            let tmp_attributes = [];
            if(index >= 0 && list.hasOwnProperty('default')) {
                list.default.map(attr => tmp_attributes.push(attr));
            }
            if(index > 0 && index <= 2 && list.hasOwnProperty('extensive')) {
                list.extensive.map(attr => tmp_attributes.push(attr));
            }
            if(index > 1 && list.hasOwnProperty('all')) {
                list.all.map(attr => tmp_attributes.push(attr));
            } 

            $.each(tmp_attributes, function(key, field) {
                attributes.push({'id': field, 'value': Lang(suggest_type + '.' + field) });
            });

        } else if(suggest_type.match(/custom_[0-9]+/i)) {
            let dictionaryID = suggest_type.split('_').pop();
            let Dictionary = $this.dictionaries.find('id', dictionaryID).first();
            if(Dictionary) {
                $.each(Dictionary.fields, function(key, field) {
                    attributes.push({'id': key, 'value': field });
                });
            }
        } 

        return attributes;
    }

    return Config;
});