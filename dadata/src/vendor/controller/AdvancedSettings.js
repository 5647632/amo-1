define(function () {
  "use strict";

  let $this,
    Widget,
    _Widget,
    Library,
    Lang,
    $WorkArea,
    $Top,
    $Contents,
    $TabInner;

  function AdvancedSettings(WidgetObj, _WidgetObj, LibraryObj, LangPack) {
    $this = this;
    Widget = WidgetObj;
    _Widget = _WidgetObj;
    Library = LibraryObj;
    Lang = LangPack;

    this.$Tabs = null;
    this.$Loader = null;

    $WorkArea = $('#work_area');
    $Top = $WorkArea.find('.content__top__preset');
    $Contents = $WorkArea.find('#work-area-' + _Widget.params.widget_code);

    this.active_tab = 'suggests';
    this.tabs = new Widget.classes['Collection']([
      {
        code: 'suggests',
        class_name: 'Suggests',
        title: Lang('advanced_settings.tab.suggests')
      }/*,
       {
        code: 'dictionaries',
        class_name: 'Dictionaries',
        title: Lang('advanced_settings.tab.dictionaries')
      } */
    ]);

    $this.open();
  }

  AdvancedSettings.prototype.open = function () {
    $WorkArea.addClass(Widget.config.classname_widget+'-advanced-settings-area');
    let params = Library.getQueryStringParams();
    if(params.hasOwnProperty('tab') && params.tab[0] != undefined) {
      $this.active_tab = params.tab[0];
    }

    Library.renderTemplate('advanced_settings/tabs', {
      'config': Widget.config,
      'local_config': _Widget.get_settings(),
      'active_tab': $this.active_tab,
      'tabs': $this.tabs.all(),
      'loader_classname': Widget.config.classname_widget + '-advanced-settings-tab-loader'
    }).then(function (output) {
      $Contents.html(output);
      $this.$Loader = $WorkArea.find('.'+ Widget.config.classname_widget +'-advanced-settings-tab-loader');
      $this.$Tabs = $Contents.find('#'+ Widget.config.classname_widget +'_advanced_settings_tabs');
      $TabInner = $Contents.find('#'+ Widget.config.classname_widget +'_advanced_settings_tab_contents_inner');
      $this.opened();
    });

    return true;
  }

  AdvancedSettings.prototype.opened = function () {
    $Contents.on('click', '.' + Widget.config.classname_widget + '-advanced-settings-tab-item:not(.active)', function() {
      $this.render($(this).data('tab'));
    });
    $this.render($this.active_tab);
  }

  AdvancedSettings.prototype.render = function (code) {
    let tab = this.tabs.find('code', code).first() || false;
		if (!tab) {
			return false;
    }
    this.$Loader.show();
		this.$Tabs.trigger('beforeRender', tab);
		$Contents.find('.'+Widget.config.classname_widget+'-advanced-settings-tab-item.active').removeClass('active');

		require([_Widget.script_url+'/controller/AdvancedSettings/'+tab.class_name+'.js'], function(SettingsClass) {
			$TabInner.removeClass('inner-tab-'+ $this.active_tab);
			$TabInner.addClass('inner-tab-'+code);
      $this.$Tabs.trigger('render', tab, new SettingsClass($this, tab, Widget, _Widget, Library, $TabInner, Lang));
      $this.active_tab = code;
		});
		$Contents.find('.'+Widget.config.classname_widget+'-advanced-settings-tab-item[data-tab="'+code+'"]').addClass('active');
  }


  return AdvancedSettings;
});