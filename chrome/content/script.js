var TitleURL = {};


window.addEventListener("load", function _() {
	window.removeEventListener("load", _, false);
	
	TitleURL = {
		
		/* XUL nodes */
		node:     document.getElementById("TitleURL"),
		current:  document.getElementById("TitleURL-current"),
		preview:  document.getElementById("TitleURL-preview"),
		icon:     document.getElementById("TitleURL-icon"),
		/* identity box: the box in the urlbar containing the icon of the
		   current tab (to hide its content when a tab is previewed, and
		   show the preview icon instead) */
		idbox:    document.getElementById("identity-box"),
		/* the tab being hovered and previewed (null if no tab is hovered) */
		tabprev:  null,
		
		/* CSS rules (used to handle the user preferences) */
		css:      null,
		rule1:    null,
		rule2:    null,
		
		/* Preferences handler */
		prefs:    Components.classes["@mozilla.org/preferences-service;1"]
		            .getService(Components.interfaces.nsIPrefService)
		            .getBranch("extensions.TitleURL."),
		/* Preferences observer */
		prefsObserver: {
			register: function() {
				this.branch = TitleURL.prefs;
				this.branch.addObserver("", this, false);
			},
			unregister: function() {
				this.branch.removeObserver("", this);
			},
			observe: function() {
				TitleURL.updatePrefs();
			}
		},
		
		
		
		/* Init the TitleURL.css member (search for the stylesheet applied to
		   the XUL document which comes from this addon). */
		initCss:        function() {
			/* Search for the stylesheet applied to the XUL document which comes
			   from this addon. */
			for(i = 0;  !TitleURL.css && i < document.styleSheets.length;  i++)
				if( document.styleSheets[i].href.toLowerCase()
				    == "chrome://titleurl/skin/aspect.css" )
					TitleURL.css = document.styleSheets[i]
			
			/* Get or create the targeted rules. */
			var rules = TitleURL.css.cssRules;
			var sel1 = "#urlbar .urlbar-input";
			var sel2 = "#urlbar[focused] .urlbar-input";
			for(i = 0;  i < rules.length;  i++) {
				if(rules[i].selectorText == sel1)
					TitleURL.rule1 = rules[i];
				if(rules[i].selectorText == sel2)
					TitleURL.rule2 = rules[i];
			}
			if(!TitleURL.rule1) {
				TitleURL.css.insertRule(sel1+"{ }", rules.length);
				TitleURL.rule1 = TitleURL.css.cssRules[rules.length-1];
			}
			if(!TitleURL.rule2) {
				TitleURL.css.insertRule(sel2+"{ }", rules.length);
				TitleURL.rule2 = TitleURL.css.cssRules[rules.length-1];
			}
		},
		
		/* Updates things after the user has modified settings. */
		updatePrefs:    function() {
			var useMono =  TitleURL.prefs.getBoolPref("use_url_monospace");
			var useColor = TitleURL.prefs.getBoolPref("use_url_color");
			var color =    TitleURL.prefs.getCharPref("url_color");
			
			TitleURL.rule1.style.fontFamily = useMono? "monospace" : null;
			TitleURL.rule2.style.color = useColor? color : null;
		},
		
		/* Updates the title and its style with the status of the tab
		   (being busy or not). */
		statusChanged:  function(e) {
			var tab =  e.target;
			var node;
			if(tab == gBrowser.selectedTab)
				node =  TitleURL.current;
			else if(tab == TitleURL.tabprev)
				node =  TitleURL.preview;
			else    return;
			TitleURL.set(node, tab);
		},
		
		/* Updates the style of the title according to the status of the tab
		   passed (being busy or not). */
		setStatus:      function(node, tab) {
			if(tab.getAttribute("busy") == "true")
				node.classList.add("TitleURL-progress");
			else
				node.classList.remove("TitleURL-progress");
		},
		
		/* Updates the title to the one of the tab passed. */
		setTitle:       function(node, tab) {
			node.value =  tab.label;
		},
		
		/* Updates the preview icon to the one of the tab passed. */
		setIcon:        function(tab) {
			TitleURL.icon.src =  tab.image;
		},
		
		/* Updates everything at a time: title, preview icon and status. */
		set:            function(node, tab) {
			TitleURL.setStatus(node, tab);
			TitleURL.setTitle(node, tab);
			if(node == TitleURL.preview)
				TitleURL.setIcon(tab);
		},
		
		/* Shows the current title. */
		showCurrent:    function() {
			TitleURL.node.classList.remove("TitleURL-preview");
			TitleURL.node.classList.add("TitleURL-current");
			TitleURL.idbox.classList.remove("TitleURL-preview");
		},
		
		/* Shows the preview title. */
		showPreview:    function() {
			TitleURL.node.classList.remove("TitleURL-current");
			TitleURL.node.classList.add("TitleURL-preview");
			TitleURL.idbox.classList.add("TitleURL-preview");
		},
		
		/* Sets the current title to the one of the currently selected tab (and
		   possibly shows it instead of the preview title if this tab is the one
		   hovered, or hides it in favour of the preview title if another tab is
		   hovered). */
		setCurrent:     function() {
			TitleURL.set(TitleURL.current, gBrowser.selectedTab);
			if(gBrowser.selectedTab == TitleURL.tabprev)
				TitleURL.showCurrent();
			else if(TitleURL.tabprev != null)
				TitleURL.showPreview();
		},
		
		/* Sets the preview title to the one of the hovered tab, and shows it
		   instead of the current title (if the tab hovered is not the currently
		   selected one). */
		setPreview:     function(e) {
			var tab =  e.currentTarget;
			TitleURL.tabprev =  tab;
			TitleURL.set(TitleURL.preview, tab);
			if(tab != gBrowser.selectedTab)
				TitleURL.showPreview();
		},
		
		/* Indicates that no tab is hovered anymore. */
		unsetPreview:   function() {
			TitleURL.tabprev =  null;
			TitleURL.showCurrent();
		},
		
		/* Makes the tab created “hoverable”, that is to say, we can
		   hover it to preview its title. */
		setHoverable:   function(tab) {
			tab.addEventListener("mouseover", TitleURL.setPreview, false);
			tab.addEventListener("mouseout", TitleURL.unsetPreview, false);
		}
		
	};
	
	TitleURL.initCss();
	
	/* Listen to the events */
	document.getElementById("appcontent").addEventListener("DOMContentLoaded", TitleURL.setCurrent, false);
	gBrowser.tabContainer.addEventListener("TabSelect", TitleURL.setCurrent, false);
	gBrowser.tabContainer.addEventListener("TabAttrModified", TitleURL.statusChanged, false);
	gBrowser.tabContainer.addEventListener("TabOpen", function(e) {
		TitleURL.setHoverable(e.target);
	}, false);
	/* When a tab is closed while hovered, a preview of this tab can still be
	   shown in certain circumstances, because tabprev is not set to null. To
	   fix that: */
	gBrowser.tabContainer.addEventListener("TabClose", function(e) {
		if(e.target == TitleURL.tabprev)
			TitleURL.unsetPreview();
	}, false);
	/* On window load, the event “tabOpen” is thrown for each tab loaded so they
	   are set hoverable automatically (see above); except for the first tab,
	   thus we have to do it manually. */
	TitleURL.setHoverable(gBrowser.tabContainer.getItemAtIndex(0));
	/* in principle, we should do that ↓, but in fact it is already done when
	   the content of the selected tab is loaded (“tabAttrModified”); that is
	   not true if we have a blank page (about:blank), but nothing grave. */
	//TitleURL.setCurrent(gBrowser.selectedTab);
	
	TitleURL.prefsObserver.register();
	TitleURL.updatePrefs();
	
},  false);
