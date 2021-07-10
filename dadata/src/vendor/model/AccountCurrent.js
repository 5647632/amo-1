define(function () {
    "use strict";

    let _Widget,
        Library,
        Lang;

    function AccountCurrent(data, _WidgetObj, LibraryObj, LangPack, Collection) {
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        let $this = this;
        this.leadCfields = new Collection();
        this.contactCfields = new Collection();
        this.companyCfields = new Collection();
		this.customerCfields = new Collection();

        $this.createFieldsCollection(data._embedded.custom_fields.leads, $this.leadCfields, 2, 'lead');
        $this.leadCfields.push({
            id: 'name',
            name: 'Заголовок',
            element_type: 2,
            type: 2,
            enums: null,
            sort: 1,
            multiple: false,
            key: 'lead.name',
            class: 'lead[NAME]'
        });
        
        $this.leadCfields.sortBy('sort', 'asc');

        $this.createFieldsCollection(data._embedded.custom_fields.contacts, $this.contactCfields, 1, 'contact');
        $this.contactCfields.push({
            id: 'name',
            name: 'Имя',
            element_type: 1,
            type: 2,
            enums: null,
            sort: 1,
            multiple: true,
            key: 'contact.name',
            class: ['contact[N]', 'contact[FN]']
        });

        $this.contactCfields.sortBy('sort', 'asc');

        $this.createFieldsCollection(data._embedded.custom_fields.companies, $this.companyCfields, 3, 'company');
        $this.companyCfields.push({
            id: 'name',
            name: 'Название',
            element_type: 3,
            type: 2,
            enums: null,
            sort: 1,
            multiple: true,
            key: 'company.name',
            class: ['contact[NAME]', 'company[NAME]']
        });

        $this.companyCfields.sortBy('sort', 'asc');

        $this.createFieldsCollection(data._embedded.custom_fields.customers, $this.customerCfields, 12, 'customer');
        $this.customerCfields.push({
            id: 'name',
            name: 'Имя',
            element_type: 12,
            type: 2,
            enums: null,
            sort: 1,
            multiple: true,
            key: 'customer.name',
            class: ['contact[NAME]', 'company[NAME]']
        });

        $this.customerCfields.sortBy('sort', 'asc');		
    };

    AccountCurrent.prototype.createFieldsCollection = function (fields, collection, element_type, entity) {
        let smart_adress_fields = ['address_line_1', 'address_line_2', 'city', 'state', 'zip', 'country'];
        let orgnization_fields = ['name', 'external_uid', 'line1', 'line2', 'city', 'state', 'zip', 'country'];
        let company_field = ['name', 'vat_id', 'kpp', 'tax_registration_reason_code', 'entity_type', 'address', 'external_id'];
        let unique_fields_types = { 13: smart_adress_fields, 15: company_field, 17: orgnization_fields };

        $.each(fields, function (cf_id, field) {
            if (field.field_type == 16  || field.name.match(/[-]{2,3}.*?[-]{2,3}/iu)) {
                return true;
            }
            let enums = null;
            if (field.enums) {
                enums = {};
                $.each(field.enums, function (enum_id, enum_val) {
                    enums[enum_id] = enum_val;
                });
            }
            var key = entity +'.cf' + field.id;
            if (unique_fields_types.hasOwnProperty(field.field_type)) {
                $.each(unique_fields_types[field.field_type], function (index, legal_key) {
                    collection.push({
                        id: field.id,
                        name: field.name + ': ' + Lang('field.unique.'+legal_key),
                        element_type: element_type,
                        type: field.field_type,
                        enums: enums,
                        sort: field.sort,
                        multiple: field.is_multiple,
                        key: key + '.' + legal_key,
                        class: field.field_type == 13 ? 'CFV[' + field.id + '][' + legal_key + '][VALUE]' : 'CFV[' + field.id + '][VALUE][' + legal_key + ']'
                    });
                });
            } else {
                collection.push({
                    id: field.id,
                    name: field.name,
                    element_type: element_type,
                    type: field.field_type,
                    enums: enums,
                    sort: field.sort,
                    multiple: field.is_multiple,
                    key: key,
                    class: 'CFV[' + field.id + ']'
                });
            }
        });
    }

    AccountCurrent.prototype.getCfByEntity = function (type, id) {
        if($.isNumeric(type)) {
            type = this.getEntityById(parseInt(type));
        }
        return this[type + 'Cfields'].find('id', id).first();
    };

    AccountCurrent.prototype.getCfByKey = function(type, key) {
        if($.isNumeric(type)) {
            type = this.getEntityById(parseInt(type));
        }
        return this[type + 'Cfields'].find('key', key).first();
    }

    AccountCurrent.prototype.getEntityById = function(element_type) {
        let element_types = {1: 'contact', 2: 'lead', 3: 'company', 12: 'customer'};
        return element_types[element_type];
    }

    return AccountCurrent;
});
