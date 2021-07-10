define(['jquery'], function ($) {
    "use strict";

    var $this,
        Widget,
        _Widget,
        Library,
        Lang,
        $Body,
        $fieldWrap,
        $Content,
        saved;

    function Config(WidgetObj, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        Widget = WidgetObj;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;
        saved = false;

        $Body = $('.' + _Widget.params.widget_code + ' .modal-body');
        $fieldWrap = $Body.find('#widget_settings__fields_wrapper');

        this.active_tab = _Widget.get_install_status() == 'not_configured' ? 'setup' : 'roles';
        this.tabs = new Widget.classes['Collection']([
            {
                code: 'setup',
                class_name: 'Settings',
                title: Lang('settings.tab.settings'),
                visible_status: ['not_configured', 'installed'],
            }, {
                code: 'roles',
                class_name: 'Roles',
                title: Lang('settings.tab.roles'),
                visible_status: ['not_configured', 'installed'],
                managers: Library.managers,
                local_roles: {
                    active_users: Library.tryParse(_Widget.get_settings().active_users) ? JSON.parse(_Widget.get_settings().active_users) : null,
                    admin_users: Library.tryParse(_Widget.get_settings().admin_users) ? JSON.parse(_Widget.get_settings().admin_users) : null,
                },
                need_admin: _Widget.get_settings().hasOwnProperty('admin_users'),
            }
        ]);
        
        $this.open();
    }

    Config.prototype.open = function () {

        $Body.find('.' + _Widget.params.widget_code + '_settings').addClass(Widget.config.classname_widget+'-settings-settings');
        if ($Body.find('.' + _Widget.params.widget_code + '_settings .' + Widget.config.classname_widget + '-widget-descr__footer').get(0) === undefined) {
            Library.renderTemplate('config/settings_footer', {
                'config': Widget.config,
            }).then(function (output) {
                $Body.find('.' + _Widget.params.widget_code + '_settings .widget-settings__desc-space').after(output);
            }).catch(function(error) {
                Widget.error(Lang('error.template.render'));
            });
        }

        if ($Body.find('.' + Widget.config.classname_widget + '-settings-contents').get(0) === undefined) {
            $Body.find('.widget_settings_block__item_field').last().after('<div class="' + Widget.config.classname_widget + '-settings-contents"></div>');
        }

        $Content = $Body.find('.' + Widget.config.classname_widget + '-settings-contents');

        if (AMOCRM.getV3WidgetsArea() == "dp.settings") {
            $this.opened();
        } else {
            Library.renderTemplate('config/settings', {
                'config': Widget.config,
                'local_config': _Widget.get_settings(),
                'status': _Widget.get_install_status(),
                'active_tab': $this.active_tab,
                'tabs': $this.tabs.all(),
                'plan_items': [
                    {
                        'id': 'default',
                        'option': Lang('settings.setup.plan.default'),
                    },
                    {
                        'id': 'extensive',
                        'option': Lang('settings.setup.plan.extensive'),
                    },
                    {
                        'id': 'all',
                        'option': Lang('settings.setup.plan.all'),
                    }
                ],
            }).then(function (output) {
                $Content.html(output);
                $this.opened();
                if(Widget.init_error !== null && _Widget.get_install_status() == 'installed') {
                    Library.showErrorModal(Widget.init_error);
                }
            }).catch(function(error) {
                Widget.error(Lang('error.template.render'));
            });
        }

    }

    Config.prototype.opened = function () {
        
        $Body.find('.' + Widget.config.classname_widget + '-settings-setup input').on('input change controls:change', function () {
            $Body.find('input[name=token]').val(Library.genStr(11)).trigger('controls:change');
            let key = null;
            $(this).parents('.' + Widget.config.classname_widget + '-settings-input').removeClass('has-error');
            if ($(this).hasClass('control--suggest--input')) {
                key = $(this).data('local-key');
                $fieldWrap.find('input[name=' + key + ']').val($(this).attr('data-value-id')).trigger('controls:change');
                return true;
            } else if ($(this).hasClass('text-input')) {
                key = $(this).data('local-key');
            } else if ($(this).hasClass('control--select--input')) {
                key = $(this).parents('.control--select').data('local-key');
            } else if ($(this).hasClass('checkbox-input')) {
                key = $(this).data('local-key');
                let val = $(this).prop('checked') ? 1 : 0;
                $(this).val(val);
            } else {
                return false;
            }

            $fieldWrap.find('input[name=' + key + ']').val($(this).val()).trigger('controls:change');
        });

        if (['not_configured', 'install'].includes(_Widget.get_install_status()) || Widget.init_error != null || $fieldWrap.find('input[name=token]').val() == "") {
            $fieldWrap.find('input[name=token]').val(Library.genStr(11)).trigger('controls:change');
            $Body.find('.' + Widget.config.classname_widget + '-settings-setup input[required]').trigger('change');
        }


        $Body.find('ul.' + Widget.config.classname_widget + '_tabs li').click(function () {
            var tab = $(this).attr('data-tab');
            $('ul.' + Widget.config.classname_widget + '_tabs li').removeClass(Widget.config.classname_widget+'-current');
            $('.'+Widget.config.classname_widget+'-tab-content').removeClass(Widget.config.classname_widget+'-current');
            $(this).addClass(Widget.config.classname_widget+'-current');
            $this.active_tab = tab;
            $Body.find("#" + tab).addClass(Widget.config.classname_widget+'-current');
            $Body.find('.' + Widget.config.classname_widget + '-telegron_send-block').hide();
            $Body.find('#telegron_login').show();
            if (tab == 'payment' || tab == 'connect') {
                $Body.find('.widget_settings_block__controls').hide();
            } else {
                $Body.find('.widget_settings_block__controls').show();
            }
        })

        $('.custom_active_users, .custom_admin_users').off('click').on('click', function (e) {
            let $input = $(e.target);
            let $target = $fieldWrap.find('input[name="' + $input.data('name') + '"]').first();
            let value = +$input.prop('checked');
            $target.val(value).trigger('change');
            $input.val(value).trigger('change');
        });

        /* if (Widget.config.is_free != true) {
            $this.openedPayment();
        } */

        $('.button-input.js-widget-save').attr('data-onsave-destroy-modal', false);

        $fieldWrap.off('click').on('click', '.button-input.js-widget-save', function () {
            $Body.find('.' + Widget.config.classname_widget + '-settings-setup input').each(function () {
                if ($(this).is('[data-required]') && $(this).attr('data-required') == "true" && $(this).val().trim().length == 0) {
                    $(this).parents('.' + Widget.config.classname_widget + '-settings-input').addClass('has-error');
                }
                if ($(this).is('[data-pattern]') && $(this).val().trim().length != 0) {
                    if (new RegExp($(this).attr('data-pattern')).test($(this).val().trim()) === false) {
                        $(this).parents('.' + Widget.config.classname_widget + '-settings-input').addClass('has-error');
                    }
                }
            });

            if ($Body.find('.' + Widget.config.classname_widget + '-settings-input.has-error').length > 0) {
                $(this).trigger('button:save:error');
                return false;
            }
        });

        $Body.show(0).trigger('modal:centrify');
        return true;
    }

    /* Config.prototype.openedPayment = function () {
        let $payForm = $Body.find('#'+Widget.config.classname_widget+'_payment_form');
        let $paySum = $payForm.find('#'+Widget.config.classname_widget+'_payment_sum'),
            $payPeriod = $payForm.find('#'+Widget.config.classname_widget+'_payment_period'),
            $payMonthsInput = $payForm.find('input[name="pay_months"]'),
            $paySumInput = $payForm.find('input[name="pay_sum"]');

        $payForm.on('click', '.'+Widget.config.classname_widget+'-payment-choise', function() {
            let months = $(this).data('months'),
                gift = $(this).data('gift'),
                sum = months*Widget.config.price*Widget.config.user_count,
                mon_with_gift = months+gift;

            Widget.config.selected_period = months;
            if(Widget.config.status != -2) {
                $payPeriod.html(Widget.config.calcStatusToFromMonths(mon_with_gift).format('DD.MM.YYYY'));
                $payMonthsInput.val(months);
                $paySum.html(parseInt(sum).toLocaleString()+' '+Lang('payment.valut')+'.');
                $paySumInput.val(sum);
            }

            $('.'+Widget.config.classname_widget+'-payment-choise.active').removeClass('active');
            $(this).addClass('active');
        });

        $payForm.find('.'+Widget.config.classname_widget+'-payment-choise').last().click();

        $('#'+Widget.config.classname_widget+'_payment_button').on('click', function(e) {
            $(e.target).trigger('button:load:start');
            $this.purchase().then(function(url) {
                $(e.target).trigger('button:load:stop');
                location.href = url;
            }).catch(function(error) {
                $(e.target).trigger('button:load:stop').trigger('button:load:error');
                Library.showErrorModal(error || Lang('errors.response.error'));
            });
        });
    } */

/*     Config.prototype.purchase = function()
	{   
        return new Promise(function(resolve, reject) {
            let $payForm = $Body.find('#'+Widget.config.classname_widget+'_payment_form');
            $.post(Widget.configUrl()+'/'+Widget.id+'/payment/purchase?token='+Widget.token, Library.form($payForm))
             .done(function(response) {
                if (response.status !== true) {
                    if(response.error && response.error.message) {
                        return reject(Lang(response.error.message) || response.error.message);
                    }
                    return Widget.error(Lang('errors.response.error'));
                }
                resolve(response.response.payment_url);
            }).fail(function(xhr, error) {
                return reject(Lang('errors.response.error'));
            });
        });
	} */

    Config.prototype.save = function (settings) {
        return new Promise((resolve, reject) => {
            $.post(Widget.configUrl() + 'save.php', Object.assign(settings, Library.getSaveData()))
                .done(function (data) {
                    if (data.status !== true) {
                        if (data.error && data.error.message) {
                            return reject(Lang(data.error.message) || data.error.message);
                        }
                        return reject(Lang('errors.error.save.2'));
                    }
                    settings.fields.widget_id = data.response.widget_id;
                    $fieldWrap.find('input[name="widget_id"]').val(data.response.widget_id).trigger('change');

                    Widget.id = data.response.widget_id;
                    Widget.token = data.response.token;
                    _Widget.set_settings({ widget_id: Widget.id, token: Widget.token });
                    resolve(settings);

                    Library.clearWidgetStorage();
                    Library.showSuccessModal(Lang('success.save'));

                    if (Widget.id !== undefined && Widget.token != undefined && settings.active == 'Y') {
                        _Widget.set_status('installed');
                        Widget.init_error = null;
                        Widget.boot().then(() => $this.open());
                    }
                })
                .error(function () {
                    Library.showErrorModal(Lang('errors.save.error'));
                    reject(Lang('errors.save.error'));
                });
        });
    }


    return Config;
});