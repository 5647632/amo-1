define(['underscore'], function (_) {
    "use strict";

    let $this,
        _Widget,
        Library,
        Lang;

    function Widget(CustomWidgetObj, LibraryObj, LangPack) {
        $this = this;
        _Widget = CustomWidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        Library.setLangPack(Lang);

        this.id = _Widget.get_settings().widget_id;
        this.token = _Widget.get_settings().token;
        this._Widget = _Widget;
        this.Library = Library;
        this.list_areas = ['lcard', 'addlcard', 'addcucard', 'culist', 'cucard', 'ccard', 'addccard', 'comcard', 'addcomcard'];
        this.classes = {};
        this.config = null;
        this.loaded = false;
        this.init_error = null;

        this.init();
    }

    Widget.prototype.init = function () {

        require([
            _Widget.script_url+'/support/Collection.js',
            _Widget.script_url + '/model/Config.js',
            _Widget.script_url + '/model/Trigger.js',
            _Widget.script_url + '/model/Dictionary.js',
            _Widget.script_url+'/support/Attributes.js',
        ], function (Collection, Config, Trigger, Dictionary, Attributes) {
            $this.classes['Collection'] = Collection;
            $this.classes['Config'] = Config;
            $this.classes['Trigger'] = Trigger;
            $this.classes['Dictionary'] = Dictionary;
            $this.config = new Config([], $this, _Widget, Library, Lang);
            if ($this.id == undefined && $this.token == undefined || _Widget.get_install_status() == 'not_configured') {
                $this.loaded = true;
            } else {

                $this.boot().then(function () {
                    $this.loaded = true;
                    $this.config.attributes = Attributes;

                    if(typeof $this.config.triggers == 'object') {
                        let triggers  = new Collection();
                        $.each($this.config.triggers, function(key, trigger) {
                            triggers.push(new Trigger(trigger, _Widget, Library, Lang));
                        });
                        $this.config.triggers = triggers;
                    }

                    if(typeof $this.config.dictionaries == 'object') {
                        let dictionaries  = new Collection();
                        $.each($this.config.dictionaries, function(key, dictionary) {
                            dictionaries.push(new Dictionary(dictionary, _Widget, Library, Lang));
                        });
                        $this.config.dictionaries = dictionaries;
                    }

                    let user = _.find($this.config.users, function(item) { return item.id == Library.user.id });
                    if($this.config.active && !$this.config.status_expired && user.is_active) {
                        if (Library.inArea($this.list_areas)) {
                            return $this.initCard();
                        }
                    }
                    
                });
            }

            window[_Widget.name] = function () {
                return $this;
            };
        })
    }

    Widget.prototype.boot = function () {
        return new Promise(function (resolve, reject) {
            $this.load(function (data) {
                $this.config = new ($this.classes['Config'])(data, $this, _Widget, Library, Lang);
                resolve($this.config);
            });
        })
    }

    Widget.prototype.load = function (callback) {
        $this.get('/load').done(function (response) {
            if (response.status !== true && !response.response) {
                if (response.error && response.error.message) {
                    $this.error(Lang(response.error.message) || response.error.message);
                } else  {
                    $this.error(Lang('errors.init.error'));
                }
                $this.init_error = Lang('errors.init.error');
                return callback([]);
            }
            $this.init_error == null;
            callback(response.response);
        }).fail(function (xhr, error) {
            $this.init_error = Lang('errors.response.config.error');
            $this.error(Lang('errors.init.error'));
            callback([]);
        });
    }

    Widget.prototype.saveConfig = function(settings) {
        return new Promise(function(resolve, reject) {
            $.post($this.configUrl() + 'save.php', Object.assign(settings, Library.getSaveData())).done(function (response) {
                if (response.status !== true || !response.response) {
                    if (response.error && response.error.message) {
                        reject(Lang(response.error.message) || response.error.message);
                    }
                    reject(Lang('errors.error.save.2'));
                }
                let data = response.response;
                if (data.widget_id !== undefined && data.token != undefined) {
                    resolve(data);
                } else {
                    reject(Lang('errors.error.save.1') + " " + Lang('errors.error.save.2'));
                }
            }).error(function (xhr, error) {
                reject(xhr.status + ": " + Lang('errors.save.error'));
            });
        });
    } 

    Widget.prototype.initConfig = function () {
        require([_Widget.script_url + '/controller/Config.js'], function (Config) {
            $this.Config = new Config($this, _Widget, Library, Lang);
        });
    }

    Widget.prototype.initAdvancedSettings = function () {
        require([_Widget.script_url + '/controller/AdvancedSettings.js'], function (AdvancedSettings) {
            $this.AdvancedSettings = new AdvancedSettings($this, _Widget, Library, Lang);
        });
    }

    Widget.prototype.initDpSettings = function () {
        require([_Widget.script_url + '/controller/DpSettings.js'], function (DpSettings) {
            $this.DpSettings = new DpSettings($this, _Widget, Library, Lang);
        });
    }

    Widget.prototype.initCard = function () {
        require([_Widget.script_url + '/controller/Card.js', _Widget.script_url + '/controller/Card/DadataRequest.js'], function (Card, DadataRequest) {
            $this.DadataRequest =  new DadataRequest($this, _Widget, Library, Lang);
            $this.Card = new Card($this, _Widget, Library, Lang);
        });
    }

    Widget.prototype.actionUrl = function (action) {
        return _Widget.url + 'action.php'
    };

    Widget.prototype.configUrl = function (action) {
        return 'https://' + _Widget.host;
    };

    Widget.prototype.get = function (action, args = {}, custom_options = {}) {
        return $this.action('GET', action, args, custom_options);
    };

    Widget.prototype.post = function (action, args = {}, custom_options = {}) {
        return $this.action('POST', action, args, custom_options);
    };

    Widget.prototype.action = function (method, action, args = {}, custom_options = {}) {
		args.user_id = Library.user.id;
		args.library_id = Library.id;
		args.token = $this.token;
		args.account_id = AMOCRM.constant('account').id;
		args.action = action;
        let options = {
            method: method,
            url: $this.actionUrl(),
            dataType: 'json',
            data: args
        };
        return $.ajax(Object.assign(options, custom_options));
    };

    Widget.prototype.notify = function (header, text) {
        if (arguments.length === 1) {
            return Library.notify(Lang('widget.name'), header);
        }
        Library.notify(Lang('widget.name') + ' - ' + header, text);
    };

    Widget.prototype.error = function (header, text) {
        if (arguments.length === 1) {
            return Library.error(Lang('widget.name') + ' - ' + Lang('errors.error'), header);
        }
        Library.error(Lang('widget.name') + ' - ' + header, text);
    };


    Widget.prototype.standard = function(type, options) {
        return new Promise(function(resolve, reject) {
            options.type = type;
            $this.post('/standard', options)
            .done(function (response) {
                if (response.status !== true || !response.response) {
                    if (response.error && response.error.message) {
                        reject(Lang(response.error.message) || response.error.message);
                    }
                    reject(Lang('errors.response.error'));
                }
                resolve(response.response);
            }).fail(function (xhr, error) {
                reject(Lang('errors.response.error'));
            });
        });
    }

    Widget.prototype.custom = function(type, options) {
        return new Promise(function(resolve, reject) {
            options.type = type;
            $this.post('/custom', options)
            .done(function (response) {
                if (response.status !== true || !response.response) {
                    if (response.error && response.error.message) {
                        reject(Lang(response.error.message) || response.error.message);
                    }
                    reject(Lang('errors.response.error'));
                }
                resolve(response.response);
            }).fail(function (xhr, error) {
                reject(Lang('errors.response.error'));
            });
        });
    }


    Widget.prototype.suggest = function(type, options) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/' + type,
                type: "POST",
                dataType: "json",
                data: JSON.stringify(options),
                headers: {"Authorization": "Token "+ $this.config.api_key},
                contentType:"application/json; charset=utf-8",
                dataType: 'json'
            }).done(function(response) {
                resolve(response);
            }).fail(function(xhr, error) {
                reject(Lang('errors.dadata.code.' + xhr.status))
            })
        });
    }

    Widget.prototype.updateLead = function(suggest, data, lead_id) {
        return new Promise(function(resolve, reject) {
            $this.post('/suggest/updateLead', {'suggest_id': suggest, 'data': data, 'id': lead_id})
            .done(function (response) {
                if (response.status !== true || !response.response) {
                    if (response.error && response.error.message) {
                        reject(Lang(response.error.message) || response.error.message);
                    }
                    reject(Lang('errors.response.error'));
                }
                resolve(response.response);
            }).fail(function (xhr, error) {
                reject(Lang('errors.response.error'));
            });
        });
    }

    Widget.prototype.findParty = function(options) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party',
                type: "POST",
                dataType: "json",
                data: JSON.stringify(options),
                headers: {"Authorization": "Token "+ $this.config.api_key},
                contentType:"application/json; charset=utf-8",
                dataType: 'json'
            }).done(function(response) {
                resolve(response);
            }).fail(function(xhr, error) {
                reject(Lang('errors.dadata.code.' + xhr.status))
            })
        });
    }

    return Widget;

});