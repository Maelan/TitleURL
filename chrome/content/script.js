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
		/* the tab being hovered and previewed */
		tabprev:  null,
		
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
				node.className +=  " TitleURL-progress";
			else
				node.className =  node.className.replace (
				  /\b ?TitleURL-progress\b/g, "");
		},
		
		/* Updates the title to the one of the tab passed. */
		setTitle:       function(node, tab) {
			node.value =  tab.label;
		},
		
		
		/* Updates the preview icon to the one of the tab passed. */
		setIcon:       function(tab) {
			TitleURL.icon.src =  tab.image;
		},
		
		/* Updates everything at a time: title, preview icon and status. */
		set:            function(node, tab) {
			TitleURL.setStatus(node, tab);
			TitleURL.setTitle(node, tab);
			if(tab == TitleURL.tabprev)
				TitleURL.setIcon(tab);
		},
		
		/* Sets the current title to the one of the currently selected
		   tab. */
		setCurrent:     function() {
			TitleURL.set(TitleURL.current, gBrowser.selectedTab);
			if(gBrowser.selectedTab == TitleURL.tabprev)
				TitleURL.showCurrent();
		},
		
		/* Sets the preview title to the one of the hovered tab, and
		   shows it instead of the current title. */
		setPreview:     function(e) {
			var tab =  e.currentTarget;
			if(tab != gBrowser.selectedTab) {
				TitleURL.tabprev =  tab;
				TitleURL.set(TitleURL.preview, tab);
				TitleURL.node.className =
				  TitleURL.node.className.replace  (
				  /\bTitleURL-current\b/g, "TitleURL-preview" );
				TitleURL.idbox.className +=  " TitleURL-preview";
			}
		},
		
		/* Shows the current title again. */
		showCurrent:    function() {
			TitleURL.tabprev =  null;
			TitleURL.node.className =
			  TitleURL.node.className.replace  (
			  /\bTitleURL-preview\b/g, "TitleURL-current" );
			TitleURL.idbox.className =
			  TitleURL.idbox.className.replace  (
			  /\b ?TitleURL-preview\b/g, "" );
		},

		/* Makes the tab created “hoverable”, that is to say, we can
		   hover it to preview its title. */
		setHoverable:   function(tab) {
			tab.addEventListener("mouseover", TitleURL.setPreview, false);
			tab.addEventListener("mouseout", TitleURL.showCurrent, false);
		}
		
	};
	
	/* Move the title to a more convenient place than the one obtained via
	   the XUL overlay (could not put it directly here because the parent
	   node do not have ID) */
	var input =  document.getAnonymousElementByAttribute  (
	               document.getElementById("urlbar"),
	               "anonid", "textbox-input-box"          );
	input.insertBefore(TitleURL.node, input.firstChild);
	
	/* Permit resizing the input in order to hide it (see style.css; CSS
	   property ‘-moz-box-flex’ is overhidden by XUL attribute ‘flex’) */
	//TitleURL.input.removeAttribute("flex");
	
	/* Listen to the events */
	/*document.getElementById("appcontent")
	        .addEventListener("DOMContentLoaded", TitleURL.setCurrent, false);*/
	gBrowser.tabContainer
	        .addEventListener("TabSelect", TitleURL.setCurrent, false);
	gBrowser.tabContainer
	        .addEventListener("TabAttrModified", TitleURL.statusChanged, false);
	gBrowser.tabContainer
	        .addEventListener("TabOpen", function(e) {
	        	TitleURL.setHoverable(e.target);
	        }, false);
	TitleURL.setHoverable(gBrowser.selectedTab);
	
},  false);
