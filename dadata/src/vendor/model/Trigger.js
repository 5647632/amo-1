define(function () {
    "use strict";

    let $this,
        _Widget,
        Library,
        Lang;

    function Trigger(data, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        this.id = null;
        this.type = 'party';
        this.entity = 3;
        this.field = null;
        this.show_card = 0;
        this.relations = [];
        this.data = null;

        $.each(data, function (key, val) {
            $this[key] = val;
        });

        if (this.relations == null) {
            this.relations = [];
        }
    };

    Trigger.prototype.isActive = function() {
        return this.active == 1;
    }

    Trigger.prototype.canRun = function () {
        let area = Library.getArea();
		console.log('ag-dadata entity: '+this.entity+' ag-dadata area: '+area);
        if ((this.entity == 3 || this.entity == 1 || this.entity == 12) && ['lcard', 'cucard', 'ccard', 'comcard', 'addlcard', 'addccard', 'addcomcard', 'addcucard'].includes(area)) return true;
        else if (this.entity == 2 && ['lcard', 'addlcard'].includes(area)) return true;
        else return false;
    }

    Trigger.prototype.getNameSelector = function (entity) {
        let area = Library.getArea();
        if ((entity == 3 || entity == 2) && ['comcard', 'ccard', 'addccard', 'addcomcard'].includes(area)) {
            return '#person_name[name="contact[NAME]"]';
        } else if ((entity == 3 || entity == 12) && ['lcard', 'cucard', 'ccard', 'addlcard', 'addccard'].includes(area)) {
            return '.linked-form__field__value-name_company input[name="contact[NAME]"]';
        } else if (entity == 2 && ['comcard', 'addcomcard'].includes(area)) {

        }
    }

    return Trigger;
});