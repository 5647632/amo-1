define(function () {
    "use strict";

    let $this,
        Widget,
        _Widget,
        Library,
        Lang;

    function DadataRequest(WidgetObj, _WidgetObj, LibraryObj, LangPack) {

        $this = this;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;
        
        this.count =  10;
        this.error = null;
        this._suggestions = [];
    }


    DadataRequest.prototype.getSuggestions = function() {
        return this._suggestions;
    }

    DadataRequest.prototype.getError = function() {
        return this.error;
    }

    DadataRequest.prototype.query = function(query, type) {
        $this.error = null;
        $this.clearCache();

        switch(type) {
            case 'party':
                return $this.suggest(type, query, $this.count);
                break;
            case 'party_find':
                return $this.findParty(query, 20);
                break;
            case 'bank':
                return $this.suggest(type, query, $this.count);
                break;
            case 'address':
                return $this.suggest(type, query, $this.count, {"locations": [{ "country": "*" }]});
                break;
            case 'fio':
                return $this.suggest(type, query, $this.count);
                break;
            case 'fio_standart':
                return $this.suggest('fio', query, $this.count);
                break;
             case 'fio_clean':
                return $this.standard(type, query, $this.count);
                break;
            case 'email':
                return $this.suggest(type, query, $this.count);
                break;
            case 'phone':
                return $this.standard(type, query, $this.count);
                break;
            case 'fms_unit':
                return $this.suggest(type, query, $this.count);
                break;
            case 'fns_unit':
                return $this.suggest(type, query, $this.count);
                break;
            case 'postal_office':
                return $this.suggest(type, query, $this.count);
                break;
            case 'region_court':
                return $this.suggest(type, query, $this.count);
                break;
            case 'country':
                return $this.suggest(type, query, $this.count);
                break;
            case 'currency':
                return $this.suggest(type, query, $this.count);
                break;
            case 'okved2':
                return $this.suggest(type, query, $this.count);
                break;
            case 'okpd2':
                return $this.suggest(type, query, $this.count);
                break;
            default: {
                if(type.match(/custom_[0-9]+/i)) {
                    return $this.custom(type, query, $this.count);
                } else {
                    Widget.error(Lang('errors.service.undefined'));
                    return false;
                }
                
            } 
            return true;
        }
    }

    DadataRequest.prototype.findParty = function(query, count, options = {}) {
        var count = arguments[2] || null;
        var options = arguments[3] || {};
        return Widget.findParty({ ...query, count, ...options});
    }

    DadataRequest.prototype.suggest =  function (type, query, count, options = {}) {
        
        var count = arguments[2] || null;
        var options = arguments[3] || {};
        return Widget.suggest(type, { query, count, ...options})            
    }

    DadataRequest.prototype.standard = function (type, query, count) {
        var count = arguments[2] || null;
        var options = arguments[3] || {};
        return Widget.standard(type, { query, count, ...options})
    }

    DadataRequest.prototype.custom = function (type, query, count) {
        var count = arguments[2] || null;
        var options = arguments[3] || {};
        return Widget.custom(type, { query, count})
    }

    DadataRequest.prototype.clearCache =  function() {
        const temp = [...this._suggestions];
        this._suggestions.splice(0);
        return temp;
    }
    

    return DadataRequest;
});