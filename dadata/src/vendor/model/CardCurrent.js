define(function () {
    "use strict";

    let _Widget,
        Library,
        Lang;

    function CardCurrent(data, _WidgetObj, LibraryObj, LangPack, Collection) {
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        let $this = this;
        this.leads = new Collection();
        this.contacts = new Collection();
        this.companies = new Collection();
		this.customers = new Collection();

         $.each(data._embedded.contacts, function(id, contact) {
            $this.contacts.push({
                'id': contact.id,
                'name': contact.name,
            });
        });

        $.each(data._embedded.leads, function(id, lead) {
            $this.leads.push({
                'id': lead.id,
                'name': lead.name,
                'status_id': lead.status_id,
                'pipeline_id': lead.pipeline_id,
                'is_closed': lead.closed_at != null
            });
        });

        $.each(data._embedded.companies, function(id, company) {
            $this.companies.push({
                'id': company.id,
                'name': company.name,
            });
        });

        $.each(data._embedded.customers, function(id, customer) {
            $this.customers.push({
                'id': customer.id,
                'name': customer.name,
            });
        });
    };

    CardCurrent.prototype.getByEntity = function (type) {
        if($.isNumeric(type)) {
            type = this.getEntityById(parseInt(type));
        }
        return this[type];
    };

    CardCurrent.prototype.getById = function(entity, id) {
        let entityCollection =  this.getByEntity(entity);
        return entityCollection.find('id', id).first();
    }


    CardCurrent.prototype.getEntityById = function(element_type) {
        let element_types = {1: 'contacts', 2: 'leads', 3: 'companies', 12: 'customers'} ;
        return element_types[element_type];
    }

    return CardCurrent;
});
