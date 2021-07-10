define(['jquery', 'lib/components/base/modal', 'https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@9.0.0/dist/js/autoComplete.min.js'], function ($, Modal, autoComplete) {
  
  var CustomWidget = function () {
    var self = this;
  
    this.widgetName = 'isAffiliatesCompanies';

    // this.customFieldCodes = {
    //   leads: {
    //     affiliateCompanyName: { type: 'text', code: 'IS_AFFILIATE_NAME', name: 'Юр. лицо' , is_api_only: false },
    //     affiliateCompanyId: { type: 'numeric', code: 'IS_AFFILIATE_ID', name: 'Юр. лицо ID' , is_api_only: true }
    //   },
    //   contacts: {
    //     affiliateCompanyName: { type: 'text', code: 'IS_AFFILIATE_NAME', name: 'Юр. лицо' , is_api_only: false },
    //     affiliateCompanyId: { type: 'numeric', code: 'IS_AFFILIATE_ID', name: 'Юр. лицо ID' , is_api_only: true }
    //   },
    //   companies: {
    //     affiliatesCount: { type: 'numeric', code: 'IS_AFFILIATES_COUNT', name: 'Аффилированных компаний' , is_api_only: true },
    //     affiliates: { type: 'text', code: 'IS_AFFILIATES', name: 'Юр. лица' , is_api_only: true }
    //   },
    //   customers: {
    //     affiliateCompanyName: { type: 'text', code: 'IS_AFFILIATE_NAME', name: 'Юр. лицо' , is_api_only: false },
    //     affiliateCompanyId: { type: 'numeric', code: 'IS_AFFILIATE_ID', name: 'Юр. лицо ID' , is_api_only: true }
    //   }
    // };

    this.customFieldCodes = {
      leads: {
        affiliateCompanyName: { type: 'text', code: 'IS_AFFILIATE_NAME', name: 'Юр. лицо' , is_api_only: false }
      },
      contacts: {
        affiliateCompanyName: { type: 'text', code: 'IS_AFFILIATE_NAME', name: 'Юр. лицо' , is_api_only: false }
      },
      companies: {
        affiliatesCount: { type: 'numeric', code: 'IS_AFFILIATES_COUNT', name: 'Аффилированных компаний' , is_api_only: true },
        affiliates: { type: 'text', code: 'IS_AFFILIATES', name: 'Юр. лица' , is_api_only: true }
      },
      customers: {
        affiliateCompanyName: { type: 'text', code: 'IS_AFFILIATE_NAME', name: 'Юр. лицо' , is_api_only: false }
      }
    };

    this.selectedAffiliatesCompany = {};

    // Показ уведомлений
    this.openAlert = function (text, type) {
      if (!type) type = 'success';
  
      if (type == 'success') {
          return new Modal()._showSuccess(text, false, 3000);
        } else if (type == 'error') {
          return new Modal()._showError(text, false);
      } else if (type == 'info') {
        return new Modal({
          class_name: 'is-modal-window',
          init: function ($modal_body) {
              var $this = $(this);
              $modal_body
                  .trigger('modal:loaded') // запускает отображение модального окна
                  .html(text)
                  .trigger('modal:centrify')  // настраивает модальное окно
                  .append('');
          },
          destroy: function () {
          }
        });
      } else {
        return false;
      }
    };
  
    this.add_notify = function (title, text, error) {
      var error = error || false;
      let n_data = {
          header: `${self.widgetName}: ${title}`,
          text: text,
      };
      if (error) {
        AMOCRM.notifications.add_error(n_data);
      } else {
        AMOCRM.notifications.show_message(n_data);
      }
    };
  
    this.consoleLog = function(data) {
      console.log(data);
    };

    this.getMyId = function() {
      return self.system()['amouser_id']
    };
  
    this.getApiUrl = function() {
      return "https://496089-analytics3.tmweb.ru/amo_widget_affiliates";
    };

    this.loadCSS = function() {
      var settings = self.get_settings();
      if ($('link[href="https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@9.0.0/dist/css/autoComplete.min.css?v=' + settings.version +'"').length < 1) {
        //  Подключаем файл style.css передавая в качестве параметра версию виджета
        $("head").append('<link href="https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@9.0.0/dist/css/autoComplete.min.css?v=' + settings.version + '" type="text/css" rel="stylesheet">');
      }
      //   Проверяем подключен ли наш файл css
      if ($('link[href="' + self.getApiUrl() + '/widget.css?v=' + Math.random() +'"').length < 1) {
        //  Подключаем файл style.css передавая в качестве параметра версию виджета
        $("head").append('<link href="' + self.getApiUrl() + '/widget.css?v=' + Math.random() +'" type="text/css" rel="stylesheet">');
      }
    };

    // this.getSettings = async function() {
    //   try {
    //     const source = await fetch(self.getApiUrl() + '/widget.wh.php?action=get_settings&__=' + self.getAmoId());
    //     const data = await source.json();
    //     return data;
    //   } catch (err) {
    //     console.error([self.widgetName, err]);
    //   }
    //   return {};
    // };

    this.getCustomFields = async function(entityType) {
      if (entityType === '') {
        return [];
      }
      const response = await fetch(`/api/v4/${entityType}/custom_fields`);
      const json = await response.json();
      const customFields = json._embedded.custom_fields || [];
      return customFields;
    };

    this.getCustomFieldByIdOrCode = function(customFields, idOrCode, idIndex = 'id', codeIndex = 'code') {
      const found = customFields.filter(function (item) {
        const id = item[idIndex] || 0;
        const code = item[codeIndex] || '';
        return id === idOrCode || code === idOrCode;
      });
      return found[0] || null;
    };

    this.getCustomFieldValueByIdOrCode = function(customFields, idOrCode, idIndex = 'id', codeIndex = 'code') {
      try {
        const cf = self.getCustomFieldByIdOrCode(customFields, idOrCode, idIndex, codeIndex);
        const value = cf['values'][0]['value'] || '';
        return value;
      } catch (e) {
        self.consoleLog(e);
      }
      return '';
    };
    
    this.createCustomFields = async function() {
      for (let entityType in self.customFieldCodes) {
        self.consoleLog(self.customFieldCodes[entityType]);
        for (let code in self.customFieldCodes[entityType]) {
          self.consoleLog(self.customFieldCodes[entityType][code]);
          const fetchOptions = {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(self.customFieldCodes[entityType][code])
          };
          try {
            const response = await fetch(`/api/v4/${entityType}/custom_fields`, fetchOptions);
            const json = await response.json();
            self.consoleLog(json);
          } catch (e) {
            self.consoleLog(e);
          }
        }
      }
    };

    this.getAmoEntity = async function(entityType, entityId) {
      try {
        const response = await fetch(`/api/v4/${entityType}/${entityId}`);
        const json = await response.json();
        const data = json;
        return data;
      } catch (e) {
        self.consoleLog(e);
      }
      return {}
    };
    this.getAmoCompany = async function(companyId) {
      const result = await self.getAmoEntity('companies', companyId);
      return result;
    }

    this.updateAmoEntity = async function(entityType, entityId, data) {
      self.consoleLog('updateAmoEntity');
      try {
        const response = await fetch(`/api/v4/${entityType}/${entityId}`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        const json = await response.json();
        return json;
      } catch (e) {
        self.consoleLog(e);
      }
      return {}
    };
    this.updateAmoCompany = async function(companyId, data) {
      const result = await self.updateAmoEntity('companies', companyId, data);
      return result;
    };

    this.renderSettings = async function(modalBody) {
    };

    this.renderCompaniesTab = function() {
      // создаем таб с Юр.лицами, после Основного
      const $affiliatesTab = $('<div class="card-tabs__item js-card-tab" data-id="company_affiliates"><span class="card-tabs__item-inner" title="Юр. лица">Юр. лица</span></div>');
      $('.card-tabs__item[data-id=default]').after($affiliatesTab);

      // добавляем активную рабочую область таба
      $('.card-entity-form__fields').append(`<div class="linked-forms__group-wrapper linked-forms__group-wrapper_main js-cf-group-wrapper is-company-affiliates-list-wrapper" data-id="company_affiliates" style="display: none;">
        <div class="is-company-affiliates-list-header">
          <div class="is-company-affiliates-list-title">Список юридических лиц</div>
          <div class="is-company-affiliates-list-actions"><button id="isCompanyAffiliatesAddButton">&plus;</button></div>
        </div>
        <div class="is-company-affiliates-list-input-wrapper" style="display: none;">
          <div><input autocomplete="off" id="isCompanyAffiliatesAddInput" type="text" placeholder="Начните вводить наименование компании здесь"></div>
          <button id="isCompanyAffiliatesSaveButton" title="Добавить">&crarr;</button>
          <button id="isCompanyAffiliatesCancelButton" title="Отмена">&Cross;</button>
        </div>
        <div class="is-company-affiliates-list-items"></div>
      </div>`);

      // при клике на табах, убираем активность с нашего таба, т.к. он не отслеживается амо
      $('.js-card-tab').each(function() {
        $(this).on('click', function() {
          $affiliatesTab.removeClass('selected');
        });
      });

      // при клике на наш таб, показываем нашу раб область, остальные скрываем, также добавлем бордюр
      $affiliatesTab.on('click', async function() {
        $('.card-tabs__item').removeClass('selected');
        $('.card-tabs__item').removeClass('card-tabs__item_preload');
        $('.card-tabs-slider').css('left', $(this).position().left + 'px');
        $('.card-tabs-slider').css('width', $(this).outerWidth() + 'px');
        $(this).addClass('selected');

        $('.js-card-main-fields').hide();
        $('.js-linked_elements_wrapper > div').hide();
        $('.js-cf-group-wrapper[data-id]').hide();
        $('[data-id="company_affiliates"]').show();

        await self.updateCompanyAffiliates();
      });

      // показать/скрыть окно ввода компании
      $('#isCompanyAffiliatesAddButton').on('click', function(event) {
        event.preventDefault();
        
        $('.is-company-affiliates-list-input-wrapper').toggle();

        return false;
      });

      // скрыть окно ввода компании
      $('#isCompanyAffiliatesCancelButton').on('click', function(event) {
        event.preventDefault();
        
        self.selectedAffiliatesCompany = {};
        $('#isCompanyAffiliatesAddInput').val('');
        $('.is-company-affiliates-list-input-wrapper').hide();

        return false;
      });

      // подтверждаем добавление
      $('#isCompanyAffiliatesSaveButton').on('click', async function(event) {
        event.preventDefault();
        
        self.consoleLog('#isCompanyAffiliatesSaveButton click');
        self.consoleLog(self.selectedAffiliatesCompany);
        self.renderCompaniesTabAffiliatesListLoader();
        try {
          await self.addCompanyAffiliate(self.selectedAffiliatesCompany);
          await self.updateCompanyAffiliates();
        } catch (e) {
          self.consoleLog(e);
        }

        self.selectedAffiliatesCompany = {};
        $('#isCompanyAffiliatesAddInput').val('');
        $('.is-company-affiliates-list-input-wrapper').hide();

        return false;
      });

      new autoComplete({
        selector: '#isCompanyAffiliatesAddInput',
        data: {
          src: async function () {
            const query = $('#isCompanyAffiliatesAddInput').val();
            const companies = await self.suggestCompanies(query, 15);
            return companies;
          },
          key: ['name'],
          cache: false
        },
        threshold: 3,
        debounce: 300,
        resultsList: {
            maxResults: 15,
            noResults: (list, query) => {
                // Create "No Results" message list element
                const message = document.createElement("li");
                message.setAttribute("class", "no_result");
                // Add message text content
                message.innerHTML = `<span>По запросу "${query}" ничего не найдено</span>`;
                // Add message list element to the list
                list.appendChild(message);
            },
        },
        resultItem: {
            highlight: {
                render: true
            }
        },
        onSelection: function (feedback) {
          self.consoleLog(feedback);
          $('#isCompanyAffiliatesAddInput').val(feedback.selection.value.name);

          self.selectedAffiliatesCompany = {
            id: feedback.selection.value.id,
            name: feedback.selection.value.name
          };
        }
      });
    };

    this.suggestCompanies = async function (query, limit = 10) {
      if (query.length < 3) {
        return [];
      }
      try {
        const source = await fetch(`/api/v4/companies?limit=${limit}&query=${query}`);
        const data = await source.json();
        const companies = data._embedded.companies || [];
        return companies;
      } catch (e) {
        self.consoleLog(e);
      }
      return [];
    };

    this.uniqueArrayOfJsonFields = function(arr, uniqueBy = 'id') {
      let tmp = {};
      arr.map((item)=> tmp[item[uniqueBy]] = item);
      return Object.values(tmp);
    };

    this.addCompanyAffiliate = async function(affiliate) {
      self.consoleLog('addCompanyAffiliate');

      const companyId = AMOCRM.data.current_card.id || 0;
      const affiliateId = affiliate.id || 0;

      if (companyId <= 0 || affiliateId <= 0 || companyId === affiliateId) {
        return false;
      }

      const result = await self.addCompanyAffiliateToCompany(affiliate, companyId);

      self.consoleLog(result);

      const companyIdA = result.id || 0;
      const companyNameA = result.name || '';

      if (companyIdA > 0) {
        const resultA = await self.addCompanyAffiliateToCompany({ id: companyIdA, name: companyNameA }, affiliateId);
      }
      return true;
    };

    this.addCompanyAffiliateToCompany = async function (affiliate, toCompanyId = 0) {
      self.consoleLog('addCompanyAffiliateToCompany');

      let companyId = toCompanyId || 0;
      // if (companyId <= 0) {
      //   companyId = AMOCRM.data.current_card.id || 0;
      // }

      const affiliateId = affiliate.id || 0;
      if (companyId <= 0 || affiliateId <= 0 || companyId === affiliateId) {
        return false;
      }
      const company = await self.getAmoCompany(companyId);
      const companyName = company.name || '';
      self.consoleLog(companyName);
      const companyAffiliates = self.getCustomFieldValueByIdOrCode(company.custom_fields_values || [], self.customFieldCodes.companies.affiliates.code, 'field_id', 'field_code');
      let companyAffiliatesJson = [];
      try {
        companyAffiliatesJson = JSON.parse(companyAffiliates);
      } catch (e) {
      }
      if (!Array.isArray(companyAffiliatesJson)) {
        companyAffiliatesJson = [];
      }
      companyAffiliatesJson.push(affiliate);
      const companyAffiliatesUnique = [...self.uniqueArrayOfJsonFields(companyAffiliatesJson)];
      self.consoleLog(companyAffiliatesUnique);
      const data = {
        id: companyId,
        custom_fields_values: [
          {
            field_code: self.customFieldCodes.companies.affiliates.code,
            values: [{ value: JSON.stringify(companyAffiliatesUnique) }]
          },
          {
            field_code: self.customFieldCodes.companies.affiliatesCount.code,
            values: [{ value: companyAffiliatesUnique.length }]
          }
        ]
      };
      self.consoleLog(data);
      const result = await self.updateAmoCompany(companyId, data);
      return company;
    };

    this.unlinkAffiliate = async function(fromId, affiliateId) {
      self.consoleLog('unlinkAffiliate');

      fromId = fromId || 0;
      affiliateId = affiliateId || 0;

      if (fromId <= 0 || affiliateId <= 0) {
        return false;
      }

      const company = await self.getAmoCompany(fromId);
      const companyAffiliates = self.getCustomFieldValueByIdOrCode(company.custom_fields_values || [], self.customFieldCodes.companies.affiliates.code, 'field_id', 'field_code');
      let companyAffiliatesJson = [];
      try {
        companyAffiliatesJson = JSON.parse(companyAffiliates);
      } catch (e) {
      }
      if (!Array.isArray(companyAffiliatesJson)) {
        companyAffiliatesJson = [];
      }
      const companyAffiliatesJsonNew = companyAffiliatesJson.filter((v) => v.id !== affiliateId);
      const companyAffiliatesUnique = [...self.uniqueArrayOfJsonFields(companyAffiliatesJsonNew)];
      const data = {
        id: fromId,
        custom_fields_values: [
          {
            field_code: self.customFieldCodes.companies.affiliates.code,
            values: [{ value: JSON.stringify(companyAffiliatesUnique) }]
          },
          {
            field_code: self.customFieldCodes.companies.affiliatesCount.code,
            values: [{ value: companyAffiliatesUnique.length }]
          }
        ]
      };
      self.consoleLog(data);
      const result = await self.updateAmoCompany(fromId, data);
      return result;
    };

    this.updateCompanyAffiliates = async function() {
      self.renderCompaniesTabAffiliatesListLoader();
      await self.renderCompaniesTabAffiliatesList();
    };

    this.renderCompaniesTabAffiliatesListLoader = function() {
      $('.is-company-affiliates-list-items').html(`<div class="is-company-affiliates-list-items-loader"></div>`);
    };

    this.renderCompaniesTabAffiliatesList = async function() {
      self.consoleLog('renderCompaniesTabAffiliatesList');

      const companyId = AMOCRM.data.current_card.id || 0;
      if (companyId <= 0) {
        $('.is-company-affiliates-list-items').html('');
        return;
      }

      const company = await self.getAmoCompany(companyId);
      self.consoleLog(company);
      self.consoleLog(company.custom_fields_values);
      self.consoleLog(self.customFieldCodes.companies.affiliates.code);
      const companyAffiliates = self.getCustomFieldValueByIdOrCode(company.custom_fields_values || [], self.customFieldCodes.companies.affiliates.code, 'field_id', 'field_code');
      self.consoleLog(companyAffiliates);
      let companyAffiliatesJson = [];
      try {
        companyAffiliatesJson = JSON.parse(companyAffiliates);
      } catch (e) {
        self.consoleLog(e);
      }
      if (!Array.isArray(companyAffiliatesJson)) {
        companyAffiliatesJson = [];
      }
      self.consoleLog(companyAffiliatesJson);

      $('.is-company-affiliates-list-items').html('');
      companyAffiliatesJson.forEach(function(item) {
        $('.is-company-affiliates-list-items').append(`<div class="is-company-affiliates-list-items-row">
          <div class="is-company-affiliates-list-items-row-name"><a title="Перейти в карточку компании" href="/companies/detail/${item.id}">${item.name}</a></div>
          <div class="is-company-affiliates-list-items-row-actions"><button data-id="${item.id}" class="is-company-affiliates-action-minus">&minus;</button></div>
        </div>`);
      });
    };

    this.callbacks = {
      render: async function () {
        self.consoleLog(`render ${self.widgetName} - ${self.system().area}`);
        self.consoleLog(AMOCRM);

        const currentCardId = AMOCRM.data.current_card.id || 0;
        if (currentCardId <= 0) {
          return false;
        } // не рендерить на contacts/add || leads/add

        const area = self.system().area || '';
        const areaEntityType = AMOCRM.data.current_entity || '';
        // if (area === 'cucard') {
        //   areaEntityType = 'customers';
        // } else if (area === 'ccard') {
        //   areaEntityType = 'contacts';
        // } else if (area === 'lcard') {
        //   areaEntityType = 'leads';
        // }

        self.consoleLog(areaEntityType);

        try {
          switch (area) {

            case 'comcard':
                self.renderCompaniesTab();
                // self.updateCompanyAffiliates();
              break;

            case 'cucard':
            case 'lcard':
            case 'ccard':
              const entityCustomFields = await self.getCustomFields(areaEntityType);
              const entityCFAffiliateNameField = self.getCustomFieldByIdOrCode(entityCustomFields, self.customFieldCodes[areaEntityType].affiliateCompanyName.code);
              // const entityCFAffiliateIdField = self.getCustomFieldByIdOrCode(entityCustomFields, self.customFieldCodes[areaEntityType].affiliateCompanyId.code);
              const entityCFAffiliateNameFieldId = entityCFAffiliateNameField.id || 0;
              // const entityCFAffiliateIdFieldId = entityCFAffiliateIdField.id || 0;
              // self.consoleLog([entityCFAffiliateNameFieldId, entityCFAffiliateIdFieldId]);

              // получаем ид привязанной компании из интерфейса, чтобы не делать лишних запросов к апи
              const entityCompanyId = $('#companies_list input[name="ID"]').val();

              // self.consoleLog([entityCFAffiliateNameFieldId, entityCFAffiliateIdFieldId, entityCompanyId]);

              // if (typeof entityCompanyId === 'undefined' || entityCFAffiliateNameFieldId <= 0 || entityCFAffiliateIdFieldId <= 0) {
              if (typeof entityCompanyId === 'undefined' || entityCFAffiliateNameFieldId <= 0) {
                  break;
              }

              // $('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').val('catched');
              // $('input[name="CFV[' + entityCFAffiliateIdFieldId + ']"]').val(8);

              const entityCompany = await self.getAmoCompany(entityCompanyId);
              const entityAffiliates = self.getCustomFieldValueByIdOrCode(entityCompany.custom_fields_values || [], self.customFieldCodes.companies.affiliates.code, 'field_id', 'field_code');
              self.consoleLog(entityAffiliates);

              let entityAffiliatesJson = [];
              try {
                entityAffiliatesJson = JSON.parse(entityAffiliates);
              } catch (e) {
                self.consoleLog(e);
              }
              if (!Array.isArray(entityAffiliatesJson)) {
                entityAffiliatesJson = [];
                break;
              }
              self.consoleLog(entityAffiliatesJson);

              // const entityAffiliatesList = self.render({ ref: '/tmpl/controls/suggest.twig' }, {
              //   name: 'entityAffiliatesList',
              //   items: entityAffiliatesJson.map(({id, name}) => ({ id, value: name })),
              //   class_name: 'my-custom-suggest'
              // });

              // $('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').after(entityAffiliatesList);

              self.consoleLog(entityCFAffiliateNameFieldId);
              
              new autoComplete({
                selector: 'input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]',
                data: {
                  src: entityAffiliatesJson,
                  key: ['name'],
                  cache: false
                },
                threshold: 1,
                debounce: 300,
                resultsList: {
                    maxResults: 15,
                    noResults: (list, query) => {
                        // Create "No Results" message list element
                        const message = document.createElement("li");
                        message.setAttribute("class", "no_result");
                        // Add message text content
                        message.innerHTML = `<span>По запросу "${query}" ничего не найдено</span>`;
                        // Add message list element to the list
                        list.appendChild(message);
                    },
                },
                resultItem: {
                    highlight: {
                        render: true
                    }
                },
                onSelection: function (feedback) {
                  self.consoleLog(feedback);
                  self.consoleLog(entityCFAffiliateNameFieldId);
                  self.consoleLog($('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').val());
                  
                  $('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').val(feedback.selection.value.name);
                  self.consoleLog($('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').val());
                  $('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').trigger('change');
                  self.consoleLog($('input[name="CFV[' + entityCFAffiliateNameFieldId + ']"]').val());
                }
              });

              break;

            default:
              self.consoleLog('wrong area');
          }
        } catch (e) {
          self.consoleLog(e);
        }

        return true;
      },
      init: async function () {
        self.consoleLog(`init ${self.widgetName}`);
        // self.consoleLog(self.system());
        // self.consoleLog(AMOCRM.constant('account'));

        self.loadCSS();
  
        // const customersCustomFields = await self.getCustomFields('contacts');
        // self.consoleLog(customersCustomFields);
        // self.consoleLog(self.getCustomFieldByIdOrCode(customersCustomFields, 'PHONE'));
        // self.consoleLog(self.getCustomFieldByIdOrCode(customersCustomFields, 939679));
        // self.consoleLog(self.getCustomFieldByIdOrCode(customersCustomFields, '939679'));

        // создаем необходимые нам кастомные поля, без проверки на существование, т.к. амо все-равно не создаст если уже создано
        await self.createCustomFields();

        return true;
      },
      bind_actions: function () {
        self.consoleLog(`bind_actions ${self.widgetName}`);

        // обработчик нажатия отвязки аффилиата от компании
        $(document).on('click', '.is-company-affiliates-action-minus', async function(event) {
          event.preventDefault();

          self.consoleLog($(this).data('id'));
          const fromId = AMOCRM.data.current_card.id || 0;
          const affiliateId = parseInt($(this).data('id'));
          self.renderCompaniesTabAffiliatesListLoader();
          await self.unlinkAffiliate(fromId, affiliateId);
          await self.unlinkAffiliate(affiliateId, fromId);
          await self.updateCompanyAffiliates();

          return false;
        });

        return true;
      },
      settings: function ($modal_body) {
        self.renderSettings($modal_body);

        return true;
      },
      advancedSettings: function () {
        self.consoleLog(`advancedSettings ${self.widgetName}`);
  
        return true;
      },
      onSave: async function () {
        self.consoleLog(`onSave ${self.widgetName}`);

        // await self.createCustomFields();
        
        return true;
      },
      destroy: function () {
  
      }
    };
    return this;
  };

  return CustomWidget;
});
