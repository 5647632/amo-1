define(function () {
    "use strict";

    let $this,
        _Widget,
        Library,
        Lang;

    function Dictionary(data, _WidgetObj, LibraryObj, LangPack) {
        $this = this;
        _Widget = _WidgetObj;
        Library = LibraryObj;
        Lang = LangPack;

        this.id = null;
        this.name = null;
        this.row_total = 0;
        this.column_total = 0;
        this.fields = [];
        this.search_fields = [];
        this.display_fields = [];
        this.active = 1;

        $.each(data, function (key, val) {
            $this[key] = val;
        });
    };

    Dictionary.prototype.isActive = function() {
        return this.active == 1;
    }


    return Dictionary;
});