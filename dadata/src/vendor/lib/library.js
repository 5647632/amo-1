define(['underscore', 'lib/components/base/modal', 'moment'], function (underscore, Modal, moment) {
    'use strict'

    let $this, _Widget, Lang

    function Library(_WidgetObj) {
        $this = this
        _Widget = _WidgetObj
        $this.managers = $this.getManagers()
        $this.account = $this.getAccount()
        $this.system = $this.getSystem()
        $this.user = $this.getUser()
        $this.area = $this.getArea()

        $this.w_code = _Widget.get_settings().widget_code
        $this.w_version = _Widget.get_version()
        $this.w_class_name = 'f5-dadata';
        $this.tpl_format = '.twig';
        $this._libs = {}
        $this._tpls = {}
        $this.modals = {}
        $this._modals = {}

        $this.run()
    }

    Library.prototype.run = function () {
        $this.linkCSS('widget', _Widget.script_url + '/lib/style.css');
        $this._libs['_'] = underscore;
    }

    Library.prototype.getSaveData = function () {
        return {
            user: {
                id: $this.user.id,
                login: $this.user.login,
            },
            account: {
                id: $this.account.id,
                subdomain: $this.account.subdomain,
                language: AMOCRM.lang_id,
                timezone: $this.account.timezone,
                zone: location.host.split('.').pop(),
            },
        }
    }

    Library.prototype.setLangPack = function (LangPack) {
        return (Lang = LangPack)
    }

    Library.prototype.requireLib = function (src, key) {
        if ($this._libs[key] === undefined) {
            require([src], function (lib) {
                $this._libs[key] = lib
            })
        }
        return true
    }

    Library.prototype.getLib = function (key) {
        if ($this._libs[key] !== undefined) {
            return $this._libs[key]
        }
        return null
    }

    Library.prototype.getTemplateHelpers = function () {
        return {
            'tpl_format': $this.tpl_format,
            'translate': $this.translate,
            'pluralize': $this.pluralize,
            '_': underscore,
            'moment': moment
        }
    }

    Library.prototype.getTemplate = function (template, params, callback) {
        params = typeof params == 'object' ? params : {}
        template = template || ''

        return _Widget.render({
            href: template + $this.tpl_format,
            base_path: _Widget.script_url + '/templates/',
            load: callback,
        },
            params,
        )
    }

    Library.prototype.renderTemplate = function (template, params) {
        let key_tpl = template.replace('/', '_')
        params = Object.assign(params, $this.getTemplateHelpers());
        return new Promise(function (resolve, reject) {
            try {
                if ($this._tpls[key_tpl] === undefined) {
                    $this.getTemplate(template, {}, function (tpl) {
                        $this._tpls[key_tpl] = tpl
                        resolve(tpl.render(params));
                    })
                } else {
                    resolve($this._tpls[key_tpl].render(params))
                }
            } catch (e) {
                reject(e)
            }
        })
    }

    Library.prototype.showErrorModal = function (string) {
        return new Modal()._showError(string, false);
    }

    Library.prototype.showSuccessModal = function (string) {
        return new Modal()._showSuccess(string);
    }

    Library.prototype.modal = function (arg) {
        var $Modal,
            arg = arg || {},
            load_cheker_id = 'f5_modal_load_cheker_' + (arg.id || 'f5_' + Date.now()),
            param = {
                id: arg.id || 'f5',
                classname: arg.classname || '',
                width: arg.width || 500,
                minheight: arg.minheight || false,
                header: arg.header || '',
                html: (arg.html || '') + '<div id="' + load_cheker_id + '"></div>',
                noclose: arg.noclose || false,
                close_confirm: arg.close_confirm || false,
                close_confirm_text: arg.close_confirm_text || Lang('close.confirm'),
                callback: arg.callback || false,
                hide: arg.hide || false,
                destroy: arg.destroy || false,
                disable_overlay_click: arg.disable_overlay_click || true,
            }
        require(['lib/components/base/modal'], function (Modal) {
            new Modal({
                custom_id: param.id,
                class_name: $this.w_class_name+'_modal ' + param.classname,
                close_confirm: param.close_confirm,
                disable_overlay_click: param.disable_overlay_click,
                init: function (modal_window) {
                    $Modal = modal_window.parents('.'+$this.w_class_name+'_modal')
                    $Modal.find('.modal-overlay__spinner').replaceWith(`
						<div class="f5-modal-loader ${$this.w_class_name}-modal-loader">
							<div class="f5-modal-loader-spinner ${$this.w_class_name}-modal-loader-spinner">
								<div class="bubble-1"></div>
								<div class="bubble-2"></div>
							 </div>
						</div>`)
                    modal_window
                        .attr({
                            id: 'modal_' + param.id,
                        })
                        .css('width', param.width + 'px')
                        .html(param.html)
                        .trigger('modal:centrify')

                    if (arg.hide) {
                        modal_window.css('display', 'none')
                    }
                    if (param.minheight) {
                        modal_window.css('min-height', param.minheight + 'px')
                    }
                    if (!param.noclose) {
                        modal_window.append(
                            '<span id="modal_closer_' +
                            param.id +
                            '" class="modal-body__close"><span class="icon icon-modal-close"></span></span>',
                        )
                    }
                    if (param.header) {
                        modal_window.prepend(
                            '<div class="f5-modal-header">' + param.header + '</div>',
                        )
                    }
                    $this._modals[param.id] = this
                    $this.modals[param.id] = modal_window
                    setTimeout(
                        function (modal_window, arg) {
                            $this.modals[param.id].trigger('modal:centrify')
                            if (arg.hide) {
                                modal_window.css('display', 'none')
                            }
                        },
                        100,
                        modal_window,
                        arg,
                    )
                },
                destroy: function () {
                    if (param.destroy) {
                        if (typeof param.destroy == 'object') {
                            return param.destroy.object[param.destroy.method](this)
                        }
                        return param.destroy(this)
                    }
                    return true;
                },
            })
            var modal_rendered = setInterval(function () {
                if ($('#' + load_cheker_id).get(0)) {
                    clearInterval(modal_rendered)
                    $('#' + load_cheker_id).remove()
                    if (!arg.hide) {
                        $Modal.find('.f5-modal-loader').hide()
                    }
                    if (param.callback) {
                        if (typeof param.callback == 'object') {
                            return param.callback.object[param.callback.method](
                                $this.modals[param.id],
                                $this._modals[param.id],
                            )
                        }
                        return param.callback(
                            $this.modals[param.id],
                            $this._modals[param.id],
                        )
                    }
                }
            }, 101)
        })
    }

    Library.prototype.pluralize = function (num, text_forms) {
        text_forms = typeof text_forms == 'string' ? text_forms.split(",") : text_forms;
        let n = Math.abs(num) % 100;
        var n1 = n % 10;
        if (n > 10 && n < 20) { return num + " " + text_forms[2]; }
        if (n1 > 1 && n1 < 5) { return num + " " + text_forms[1]; }
        if (n1 == 1) { return num + " " + text_forms[0]; }
        return num + " " + text_forms[2];
    }

    Library.prototype.translate = function (key, replace = {}) {
        let text = Lang(key);
        if (text !== false) {
            text = text.replace(/{{([^}]+)}}/g, function (s, key) {
                if (replace.hasOwnProperty(key)) {
                    return '' + replace[key];
                } else {
                    if (Lang(key) !== false) {
                        return $this.translate(Lang(key), replace);
                    }
                    return s;
                }
            });
        }
        return text;
    }


    Library.prototype.keepOf = function (opts = {}, callback, failback) {
        var callback = callback || function () { },
            failback = failback || function () { }
        let options = this.merge({
            keep_text: Lang('keep.text'),
            submit_text: Lang('btn.continue'),
        },
            opts,
        )
        let modal_params = {
            width: 550,
            html: '<form class="modal-body_inner-keep-form"><p class="modal-body_innner_message-keep">' +
                options.keep_text +
                '</p><div class="modal-body_innner_answer-keep"><input type="text" class="answer-keep-value" required><button type="submit" class="button-input answer-keep-submit"><span class="button-input-inner"><span class="button-input-inner__text">' +
                options.submit_text +
                '</span></span></button></div></form>',
            callback: function ($Body, Modal) {
                Modal.options.destroy = function (test) {
                    failback()
                    return true
                }
                $Body.find('.modal-body_inner-keep-form').submit(function () {
                    let result = callback({
                        value: $('.answer-keep-value').val(),
                    })
                    if (result) {
                        Modal.options.destroy = function () { }
                        Modal.destroy()
                    }
                    return false
                })
                $Body.find('.answer-keep-value').focus()
            },
        }
        return this.modal(modal_params)
    }

    Library.prototype.confirm = function (opts = {}, callback, failback) {
        var callback = callback || function () { },
            failback = failback || function () { };

        $this.renderTemplate('controls/confirm', {
            'classname': $this.w_class_name,
            'header': opts.header || '',
            'confirm_text_1': opts.confirm_text_1 || "",
            'confirm_text_2': opts.confirm_text_2 || "",
            'accept_text': opts.accept_text || Lang('action.accept'),
            'cancel_text': opts.cancel_text || Lang('action.cancel')
        }).then(function(output) {
            let modal_params = {
                width: 500,
                html: output,
                callback: function ($Body, Modal) {
                    $Body.html(output);
                    $Body.on('click', '.js-modal-accept', function () {
                        callback()
                        Modal.options.destroy = function () { }
                        Modal.destroy()
                        return false
                    }).on('click', '.button-cancel', function() {
                        Modal.destroy()
                    });
                    Modal.options.destroy = function (test) {
                        failback()
                        return true
                    }
                    
                },
            }
            return $this.modal(modal_params)
        });
    }

    Library.prototype.linkCSS = function (id, link, cache) {
        if (!$('#' + $this.w_code + '_style_link_' + id).get(0)) {
            $('body').append(
                '<link id="' +
                $this.w_code +
                '_style_link_' +
                id +
                '" rel="stylesheet" href="' +
                link +
                '?v=' +
                $this.w_version +
                (!cache ? '&_=' + Date.now() : '') +
                '">',
            )
        }
    }

    Library.prototype.insertCSS = function (id, styles) {
        if (!$('#' + $this.w_code + '_style_css_' + id).get(0)) {
            $('body').append(
                '<style id="' +
                $this.w_code +
                '_style_css_' +
                id +
                '">' +
                styles +
                '</style>',
            )
        }
    }

    Library.prototype.removeCSS = function (id) {
        $('#' + $this.w_code + '_style_css_' + id).remove()
    }

    Library.prototype.linkJS = function (id, link, cache) {
        if (!$('#' + $this.w_code + '_js_link_' + id).get(0)) {
            $('body').append(
                '<script id="f5_js_link_' +
                id +
                '" src="' +
                link +
                '?v=' +
                $this.w_version +
                (!cache ? '?_=' + Date.now() : '') +
                '"></script>',
            )
        }
    }

    Library.prototype.removeJS = function (id) {
        $('#' + $this.w_code + '_js_link_' + id).remove()
    }

    Library.prototype.in_array = function (val, arr) {
        if (typeof val == 'object') {
            let in_arr = true
            $.each(val, function (i, item) {
                if (!$this.in_array(item, arr)) {
                    in_arr = false
                }
            })
            return in_arr
        }
        return arr.indexOf(val) > -1
    }

    Library.prototype.genStr = function (length = 5) {
        let possible =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
            arr = []
        for (let i = 0; i < length; i++) {
            arr.push(possible.charAt(Math.floor(Math.random() * possible.length)))
        }
        return arr.join('')
    }

    Library.prototype.getQueryStringParams = function () {
        var qd = {}
        if (location.search)
            location.search
                .substr(1)
                .split('&')
                .forEach(function (item) {
                    var s = item.split('='),
                        k = s[0],
                        v = s[1] && decodeURIComponent(s[1]);
                    (qd[k] = qd[k] || []).push(v)
                })
        return qd
    }

    Library.prototype.clearWidgetStorage = function () {
        for (var key in localStorage) {
            if (key.indexOf('widgets_') === 0) {
                localStorage.removeItem(key)
            }
        }
    }

    Library.prototype.notify = function (header, message) {
        AMOCRM.inbox.showNotification({
		    body: {
		        icon: {
		            robot: "info",
                    value: "/frontend/images/interface/inbox/mesage_bot_avatar.png"
		        },
		        title: header || Lang('widget'),
		        rows: [{
		            style: $this.w_class_name + "-notification",
		            text: message,
		        }]
		    },
		    updated_at: Math.ceil(+new Date / 1e3)
		})
    }

    Library.prototype.error = function (header, message) {
        AMOCRM.inbox.showNotification({
		    body: {
		        icon: {
		            robot: "error",
		            value: "/frontend/images/interface/inbox/error_mesage_bot_avatar.png"
		        },
		        title: header || Lang('errors.error'),
		        rows: [{
		            style: $this.w_class_name + "-notification",
		            text: message,
		        }]
		    },
		    updated_at: Math.ceil(+new Date / 1e3)
		})
    }

    Library.prototype.getSalesbots = function (callback) {
        if (this._sales_bots) {
            return callback(this._sales_bots)
        }
        require([Widget.script_url + '/support/Collection.js'], function (
            Collection,
        ) {
            $this.rest('GET', '/api/v1/salesbot/').done(function (data) {
                $this._sales_bots = new Collection(data._embedded.items)
                callback($this._sales_bots)
            })
        })
    }

    Library.prototype.requireAccountCurrent = function (callback) {
        if (this._account_current) {
            return callback(this._account_current)
        }
        require([
            _Widget.script_url + '/model/AccountCurrent.js',
            _Widget.script_url + '/support/Collection.js',
        ], function (AccountCurrent, Collection) {
            $this.rest(
                'GET',
                '/api/v2/account?with=pipelines,custom_fields,note_types,task_types',
            )
            .done(function (data) {
                $this._account_current = new AccountCurrent(data, _Widget, $this, Lang, Collection)
                callback($this._account_current)
            })
        })
    }

    Library.prototype.requireCardCurrent = function (entity, id, callback) {
        if(this._card_current) {
            return callback(this._card_current);
        }
        require([
            _Widget.script_url + '/model/CardCurrent.js',
            _Widget.script_url + '/support/Collection.js',
        ], function (CardCurrent, Collection) {

            $this.rest(
                'GET',
                '/v3/'+entity+'/'+id+'/timeline?page=1&limit=10',
            ).done(function (data) {
                $this._card_current = new CardCurrent(data, _Widget, $this, Lang, Collection);
                callback($this._card_current)
            });
        })
    }

    Library.prototype.rest = function (method, url, data) {
        return $.ajax({
            type: method,
            url: url,
            data: {
                'request': data
            },
            dataType: 'json'
        });
    };

    Library.prototype.form = function ($form) {
        let k = {},
            c = $form.serializeArray()
        $.each(c, function () {
            void 0 !== k[this.name] ?
                (k[this.name].push || (k[this.name] = [k[this.name]]),
                    k[this.name].push(this.value || '')) :
                (k[this.name] = this.value || '')
        });

        $form.find('[type="checkbox"]:not(.js-item-checkbox)').each(function() {
            k[$(this).attr('name')] = $(this).prop('checked');
        });

        $.each(k, function(key, value) {
            let $input = $form.find('[name="'+key+'"]');
            if($input.hasClass('control--suggest--input')) {
                k[key] = $input.attr('data-value-id');
            }
        })

        return k;
    }

    Library.prototype.tryParse = function(raw) {
        try {
            return JSON.parse(raw);
        } catch (err) {
            return false;
        }
    }

    Library.prototype.getAccount = function () {
        return AMOCRM.constant('account')
    }

    Library.prototype.getManagers = function () {
        return AMOCRM.constant('managers')
    }

    Library.prototype.getSystem = function () {
        return AMOCRM.widgets.system
    }

    Library.prototype.getUser = function () {
        return AMOCRM.constant('user')
    }

    Library.prototype.getUserRights = function () {
        return AMOCRM.constant('user_rights')
    }

    Library.prototype.inArea = function (vals) {
        return $this.in_array($this.getArea(), vals)
    }

    Library.prototype.hasArea = function (val) {
        return $this.getArea() === val
    }

    Library.prototype.getArea = function () {
        var area = $this.getSystem().area || false
        if (!area || area == 'outer_space') {
			
//-----------
            if (location.href.indexOf($this.system.domain + '/customers/add') > 0) {
                area = 'addcucard'
            }

            if (location.href.indexOf($this.system.domain + '/customers/list') > 0) {
                area = 'culist'
            }

            if (location.href.indexOf($this.system.domain + '/customers/detail') > 0) {
                area = 'cucard'
            }
//----------

            if (location.href.indexOf($this.system.domain + '/leads/add') > 0) {
                area = 'addlcard'
            }

            if (location.href.indexOf($this.system.domain + '/leads/pipeline') > 0) {
                area = 'pipeline'
            }

            if (location.href.indexOf($this.system.domain + '/leads/list') > 0) {
                area = 'llist'
            }

            if (location.href.indexOf($this.system.domain + '/leads/detail') > 0) {
                area = 'lcard'
            }

            if (
                location.href.indexOf($this.system.domain + '/leads/list/unsorted') > 0
            ) {
                area = 'unsorted_list'
            }

            if (location.href.indexOf($this.system.domain + '/todo/list') > 0) {
                area = 'tlist'
            }

            if (location.href.indexOf($this.system.domain + '/todo/line') > 0) {
                area = 'todoline'
            }

            if (location.href.indexOf($this.system.domain + '/todo/calendar') > 0) {
                area = 'calendar'
            }

            if (location.href.indexOf($this.system.domain + '/stats/') > 0) {
                area = 'analityc'

                if (
                    location.href.indexOf($this.system.domain + '/stats/pipeline') > 0
                ) {
                    area = 'analityc'
                }

                if (location.href.indexOf($this.system.domain + '/stats/goals') > 0) {
                    area = 'analitycgoals'
                }

                if (location.href.indexOf($this.system.domain + '/stats/calls') > 0) {
                    area = 'analityccalls'
                }

                if (
                    location.href.indexOf($this.system.domain + '/stats/by_activities') >
                    0
                ) {
                    area = 'analitycactivities'
                }

                if (
                    location.href.indexOf($this.system.domain + '/stats/consolidated') > 0
                ) {
                    area = 'analitycconsolidated'
                }
            }
            if (location.href.indexOf($this.system.domain + '/events/list') > 0) {
                area = 'analitycevents'
            }
            if (location.href.indexOf($this.system.domain + '/mail/') > 0) {
                area = 'mail'
                if (location.href.indexOf($this.system.domain + '/mail/inbox') > 0) {
                    area = 'mailinbox'
                }
                if (location.href.indexOf($this.system.domain + '/mail/sent') > 0) {
                    area = 'mailsent'
                }
                if (location.href.indexOf($this.system.domain + '/mail/thread') > 0) {
                    area = 'mailthread'
                }
                if (location.href.indexOf($this.system.domain + '/mail/sent') > 0) {
                    area = 'maildeleted'
                }
            }
            if (location.href.indexOf($this.system.domain + '/settings/') > 0) {
                area = 'settings'
                if (
                    location.href.indexOf($this.system.domain + '/settings/profile') > 0
                ) {
                    area = 'profile'
                }
                if (location.href.indexOf($this.system.domain + '/settings/pay') > 0) {
                    area = 'settings_pay'
                }
            }
        } else {
            if (
                area == 'clist' &&
                location.href.indexOf($this.system.domain + '/contacts/list') > 0
            ) {
                area = 'clistall'
                if (
                    location.href.indexOf(
                        $this.system.domain + '/contacts/list/contacts',
                    ) > 0
                ) {
                    area = 'clist'
                }
                if (location.href.indexOf($this.system.domain + '/contacts/list/companies') > 0) {
                    area = 'comlist'
                }
                if (
                    location.href.indexOf($this.system.domain + '/customers/list/') > 0
                ) {
                    area = 'culist'
                }
            }
            if (
                area == 'lcard' &&
                location.href.indexOf($this.system.domain + '/leads/add') > 0
            ) {
                area = 'addlcard'
            }
            if (
                area == 'ccard' &&
                location.href.indexOf($this.system.domain + '/contacts/add') > 0
            ) {
                area = 'addccard'
            }
            if (
                area == 'comcard' &&
                location.href.indexOf($this.system.domain + '/companies/add') > 0
            ) {
                area = 'addcomcard'
            }
        }
        return (this.area = area)
    }

    return Library
})