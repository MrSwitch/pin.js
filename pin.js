/**
 * reviously http://code.google.com/p/sitemode/
 *
 * Dont make others pine for your site, make it pinned in Windows7!
 *
 * @copyright Micrsoft
 * @license MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * 
 * @author Andrew Dodson (drew81.com)
 * @since Jan/2011
 */

var pin = new (function(){

	/**
	 * Internal debugging
	 */
	function log() {
		if (typeof(console) === 'undefined'||typeof(console.log) === 'undefined'){
			 return;
		}
		else if (typeof console.log === 'function') {
			console.log.apply(console, arguments); // FF, CHROME, Webkit
		}
		else{
			console.log(Array.prototype.slice.call(arguments)); // IE
		}
	}

	/**
	 * Store random objects in a global localStorage
	 */
	var store = {
		/**
		 * GET the latest from the localStorage object, as it could have been updated outside
		 * @return
		 */
		get : function(){
			if(localStorage&&localStorage.pinStorage&&typeof(JSON) !== 'undefined'){
				var o = JSON.parse( localStorage.pinStorage ),x;
				if(typeof(o)!=='object'){
					o = {};
				}
				else {
					for(x in o){if(o.hasOwnProperty(x)){
						if( ( x !== 'get' && x !== 'save' ) ){
							this[x] = o[x];
						}
					}}
				}
				return o;
			}
		},
		/**
		 * Save the current localStorage object, as it is in this window as the main storage object
		 * @return
		 */
		save : function(n,o){
			if(n){
				this[n] = o;
			}
			if( typeof(JSON) !== 'undefined' ){
				localStorage.pinStorage = JSON.stringify( this );
			}
		}
	};

	// Self
	var self = this;
	
	// Update the global storage
	store.get();

	
	/*********************************************************************
	 *
	 *							PROPERTIES
	 *
	 *********************************************************************/

	// sitemode supported
	this.pinable=( "external" in window ) && 
				 ( "msIsSiteMode" in window.external ); 

	// sitemode supported and pinned
	this.pinned	=this.pinable && 
				 window.external.msIsSiteMode(); 

	//  is this the first time opening a pinned button.
	this.first	=this.pinned && 
				 ( "msIsSiteModeFirstRun" in window.external ) && 
				 window.external.msIsSiteModeFirstRun(false); 

	// Under which URL was this pinned
	this.pinnedUrl = this.pinned && 
				(this.first?window.location.href:store.pinnedUrl);


	/**
	 * Store for other windows to use
	 * Define the jumplist items
	 * Save
	 */
	store.items = store.items || [];
	store.pinnedUrl = this.pinnedUrl;
	store.save();

	this.btns = [];


	/*********************************************************************
	 *
	 *							META
	 *
	 *********************************************************************/

	/**
	 * Meta tag function
	 * Updates head meta tags
	 *
	 * PRIVATE
	 * @param string
	 * @param mixed
	 * @return
	 */
	function meta(name,content){
	
		if( !( content instanceof Array ) ){

			if (typeof content !== "string" || content.trim() === "" || !document.querySelector ) {
				return false;
			}

			content = [content];
		}
	
		// Remove meta tag(s), although there should only be one
		var tags=document.head.querySelectorAll('meta[name='+name+']'),
			i=0;

		for(i=0;i<tags.length;i++){
			tags[i].parentNode.removeChild(tags[i]);
		}

		// Add meta tag
		for(i=0;i<content.length;i++){
			var metaTag = document.createElement("meta");
	        metaTag.setAttribute("name", name);
	        metaTag.setAttribute("content", content[i]);
	        document.head.appendChild(metaTag);
		}

	}

    /**
     * Add meta tag describing the application site name
     * @param string
     * @return
     */
	this.name = function(content){
		meta('application-name', content);
	};
	
    /**
     * Add meta tag describing the application tooltip to use when pinned
     * @param string
     * @return
     */
	this.tooltip = function(content){
		meta('msapplication-tooltip', content);
	};

    /**
     * Add meta tag describing the application startUrl which the pinned page will access
     * @param string
     * @return
     */
	this.starturl = function(content){
		meta('msapplication-starturl', content);
	};

    /**
     * Add meta tag describing the applications task
     * @param object[], {title:string,url:string,icon:string,target:string}
     * @return
     */
	this.tasks = function(content){
		var i=0;
		if( content instanceof Array ){
			for(;i<content.length;i++){
				// stringify
				content[i] = "name="+content[i].title + 
							"; action-uri=" +content[i].url+
							"; icon-uri=" +content[i].icon+
							"; window-type=" + (content[i].target||'self');
			}
		}
		meta('msapplication-task', content);
	};


	/*********************************************************************
	 *
	 *							JUMPLIST
	 *
	 *********************************************************************/

	this.jumplist = {

		/**
		 * Return the list of items in the jumplist
		 * @return array
		 */
		items	: function(){
			store.get();
			return store.items;
		},

		/**
		 * Create a new jumplist menu with title.
		 * @param string
		 * @return
		 */
		title : function(s){
			if( !self.pinned ){
				log("Cannot change jumplist title. Site is not pinned");
				return false;
			}
			if(!s){
				store.get();
				log("Returning jumplist title");
				return store.label || ''; // Jumplist title
			}
			// restore all the items
			var a = this.items();
			this.clear();

			log("Changing jumplist title");
			window.external.msSiteModeCreateJumplist(s);
			window.external.msSiteModeShowJumpList();

			this.add(a);
			// update the list
			store.label = s;
			store.save();
		},

		/**
		 * Add items to the jumplist menu
		 * @param object, containing title, url, icon
		 * @param number	Position to insert
		 * @return
		 */
		add : function(item,pos,c,d){
			var i,j;
		
			if( !self.pinned ){
				return false;
			}
			// Arguments format
			if(typeof(item) === 'string'){
				item = {title:item,url:pos};
				pos = c;
				if(typeof(c)==="string"){
					item.icon = c;
					pos = d;
				}
			}
			// Convert single object to an array
			if( !( item instanceof Array ) ){
				item = [item];
			}
			
			// Get the latest store version
			store.get();

			// Loop through the arrays of item objects to build a list
			for(i=item.length;i--;){
				// Add Item to the Jumplist
				if(!pos){
					log([item[i].title,item[i].url,item[i].icon]);
					window.external.msSiteModeAddJumpListItem(item[i].title,item[i].url,item[i].icon||false);
				}

				for(j=0;j<store.items.length;j++){
					if( store.items[j].title === item[i].title ){
						// remove from list
						log("remove"+store.items[j].url);
						store.items.splice(j,1);
						if(pos>j){
							pos--;
						}
						break;
					}
				}
				
				// Update the list with the new jumplist items
				store.items.splice((pos||0),0,item[i]);
			}
			
			if( pos > 0 ){
				var a = store.items;
				this.clear();
				this.add(a);
				return;
			}
			
			// Show updated jumplist
			log("Show new jumplist items");
			window.external.msSiteModeShowJumpList();

			// Save to localStorage
			store.save();
		},

		/**
		 * Replace items in the jumplist menu
		 * @param number				Position
		 * @param number(optional)		Length
		 * @param object, containing title, url, icon
		 * @return
		 */
		replace	: function(pos,len,object){
			if( !self.pinned ){
				return false;
			}
			if(typeof(pos)==='object'){
				object = pos;
				len = 20;
				pos = 0;
			}
			pos = pos || 0;
			if(typeof(len)==='object'){
				object = len;
				len = 1;
			}
			len = len || 1;

			// Get the latest store
			store.get();

			// New list is...
			var a = store.items.slice(0,pos).concat((object instanceof Array?object:[object]), store.items.slice(pos+len));

			// Clear and rebuild list
			this.clear();
			this.add(a);
		},
		/**
		* Delete items in the jumplist menu\
		* @param number				Position
		* @param number(optional)	Length, default 1
		* @return
		*/
		remove	: function(pos,len){
			if( !self.pinned ){
				return false;
			}
			// Get the latest store
			store.get();

			var a = this.items();
			a.splice((pos||0),len||1);

			this.clear();
			this.add(a);
		},
		// Clear entire list
		clear : function(){
			if( !self.pinned ){
				return false;
			}
			window.external.msSiteModeClearJumpList();

			// Get the latest store
			store.get();

			store.label = '';
			store.items = [];

			store.save();
		}
	};
	
	

	/*********************************************************************
	 *
	 *							THUMBNAIL BUTTONS
	 *
	 *********************************************************************/
	// Add a button counter
	var btn_counter = 0;

	/**
	* Add/Edit/Delete a button to a page
	* @param integer	Button ID (optional, if present this is an update)
	* @param string		Icon (optional)
	* @param string		Label (optional)
	* @param function	Callback (optional)
	*/
	this.button	= function(btnid,icon,label,callback){

		var i;

		if( !this.pinned ){
			return false;
		}

		if( typeof(btnid) !== 'number'){
			callback = label;
			label = icon;
			icon = btnid;
			btnid = null;
		}

		if( typeof(label) === 'function'){
			callback = label;
			label=null;
		}

		if( typeof(icon) === 'function'){
			callback = icon;
			label=null;
			icon=null;
		}

		if( btnid !== null ){
			// Hide the button
			if ( icon === false ){
				window.external.msSiteModeUpdateThumbBarButton(btnid, false, false);
			}
			// Change callback
			if ( typeof( callback ) === 'function' ){
				this.btns[btn_counter] = callback;
			}
			// Modify the button
			if( icon ){
				var style = window.external.msSiteModeAddButtonStyle(btnid, icon, label);
				window.external.msSiteModeShowButtonStyle(btnid,style);
			}
			return true;
		}
		
		// Has a button been set so far in this 

		// Adding a button... buttons persist and each seperate tab/window has their own
		// buttons need to be declared everytime the page is opened.
		if(btn_counter++ === 0){
			var btn='';
			// Create buttons if we can
			try{
				do{ 
					// Create button, use an iterative label with the current label
					btn = window.external.msSiteModeAddThumbBarButton(icon, label+btn);
				} while (btn<=6);
			}catch(e){
			}

			// Show buttons
			window.external.msSiteModeShowThumbBar();

			// Loop through and hide buttons
			for(i=1;i<=btn;i++){
				window.external.msSiteModeUpdateThumbBarButton(i, false, false);
			}
		}

		// Force this button to be visible and active
		// Enable its visibility
		window.external.msSiteModeUpdateThumbBarButton(btn_counter, true, true);

		// if the unload event didn't kill the button, then we reset its style.
		this.button(btn_counter,icon,label);

		// Add callback for this button.
		this.btns[btn_counter] = callback;
		log("Added btn "+btn_counter);

		// Return btn
		return btn_counter;
	};
	
	/**
	 * Add Button
	 */
	this.button.add = function(icon,label,callback){
		return self.button(icon,label,callback);
	};

	/**
	 * Update Button
	 */
	this.button.update = function(btnid,icon,label,callback){
		return self.button(btnid,icon,label,callback);
	};

	/**
	 * Hide Button
	 */
	this.button.hide = function(btnid){
		return self.button(btnid,false);
	};



	/*********************************************************************
	 *
	 *							OVERLAY
	 *
	 *********************************************************************/
	// Array of Overlays that have been assigned
	this.overlays = [];

	// SetInterval tracker
	var overlayInt = null;

	/**
	 * Add an Overlay icon to the taskbar button.
	 * @param string 
	 * @param string 
	 * @param number
	 */
	this.overlay = function(icon,tooltip,ttl){
		if(!this.pinned){
			return false;
		}

		if(typeof(tooltip)==='number'&&typeof(ttl)==='undefined'){
			ttl = tooltip;
			tooltip = null;
		}

		if(typeof(icon)==='object'){
			tooltip = icon.tooltip;
			icon = icon.icon;
		}
						
		// Add to overlay list
		var i = this.overlays.length-1,
			o = {icon:icon,tooltip:tooltip},
			func = function(){
				i++;
				var o = self.overlays[i];
				if(!o){
					o = self.overlays[0];
					i=0;
				}
				if(o){
					log("Add overlay"+i);
					window.external.msSiteModeSetIconOverlay(o.icon,o.tooltip);
				}
				else{
					window.external.msSiteModeClearIconOverlay();
					clearInterval(overlayInt);
				}
			};

		// Is there a ttl on this entry?
		if(typeof(ttl)==='number'){
			var pin = this;
			setTimeout(function(){
				
				var pos = self.overlayRemove(o);
				log("Removing ",o.icon,o.tooltip,pos,i);
				if(i===pos){
					func();
				}
			},ttl);

			if(ttl===0){
				return o;
			}
		}

		// Remove All
		if(icon===0){
			this.overlays = [];
			func();
			return;
		}

		this.overlays.push(o);

		clearInterval(overlayInt);

		func();

		overlayInt = setInterval(func,3000);
		
		return o;
	};



	/**
	 * Remove Overlay from the taskbar icon
	 * Match an object by tooltip, icon properties
	 * @param object
	 * @return
	 */
	this.overlayRemove = function(o){
		var i;
		if(!this.pinned){
			return false;
		}
		for(i=0;i<this.overlays.length;i++){
			if(this.overlays[i].icon===o.icon && this.overlays[i].tooltip===o.tooltip){
				this.overlays.splice(i,1);
				return i;
			}
		}
	};
		


	/*********************************************************************
	 *
	 *							ACTIVATE
	 *
	 *********************************************************************/
	/**
	 * Activate
	 * Make the desktop icon glow where the window is not of focus
	 * @return
	 */
	this.activate = function (){
		if(!this.pinned){
			return false;
		}
		window.external.msSiteModeActivate();
		log("Activate");
		return true;
	};





	/*********************************************************************
	 *
	 *							MASTER
	 *
	 *********************************************************************/

	/**
	 * Am i master?
	 * The master checker is a way to reduce the ammount of repetitive tasks 
	 * - which multiple windows to the same site may generate
	 * @param bool  Make me the master, default undefined
	 */
	var guid;
	
	this.masterReign = 120e3;

	this.master = function(bool){

		// Set the page's unique id
		if(!guid){
			guid = Math.random();
		}
		

		store.get();
		
		if(bool===false){
			store.masterId=false;
			store.save();
			return false;
		}
		// Have we not set master before?
		// Or is master older than 120 seconds (2 minutes)?
		if(!store.masterStamp 
			|| !store.masterId 
			|| store.masterStamp < ((new Date()).getTime()-this.masterReign) 
			|| bool ){

			// Update master to the local page
			store.masterStamp=(new Date()).getTime();
			store.masterId=guid;
			store.save();
		}

		// Return whether this page matches the master ID.
		return (store.masterId === guid);
	};




	/*********************************************************************
	 *
	 *							EVENT LISTENERS
	 *
	 *********************************************************************/
	if(document.addEventListener && self.pinned ){

		// On button unload, hide them all
		window.addEventListener('beforeunload', function(){
			var i;
			for(i=0;i<self.btns.length;i++){
				try{window.external.msSiteModeUpdateThumbBarButton(i, false, false);}catch(e){}
			}
		}, false);

		// Thumbnail preview button is clicked
		document.addEventListener('msthumbnailclick', function(e){
			// Button clicked
			log("Button clicked "+e.buttonID);

			// trigger the callback for that button
			self.btns[e.buttonID](e.buttonID);
		}, false);
		
		/**
		 *
		 this doesn't work
		 // mssitemodejumplistitemremoved
		document.addEventListener('mssitemodejumplistitemremoved', function(url){
			log("Removed",url);
			store.get();
			for(var i=0;i<store.items.length;i++){
				if(store.items[i].url === url ){
					store.items.splice(i--,1);
				}
			}
			store.save();
			
		}, false);
		*/
	}
});