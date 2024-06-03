//krpano instance
var krpano = null;
//trace
var debug = false;
//is krpano loaded
var krpanoLoaded = false;
//methods to call when plugin is loaded
var pluginLoaded = new ktools.Map();
//is tour started
var isTourStarted = false;
//fullscreen object
var kolorFullscreen = null;
//browser detection
var kolorBrowserDetect = null;
//start z-index value
var kolorStartIndex = 4000;
//target url for cross domains application
var crossDomainTargetUrl = '';
var tourLanguage;

if ( debug ) {
	if ( typeof(console) == 'undefined' ) {
		console = {log : function (text) {} };
	}
}

/* ======== FULLSCREEN STUFF ========================================== */

/**
 * @description Register Fullscreen on DOM ready.
 */
jQuery(document).ready(function() {
	//add browser detection
	kolorBrowserDetect = new ktools.BrowserDetect();
	kolorBrowserDetect.init();
	//kolorBrowserDetect.browser : Browser string
	//kolorBrowserDetect.version : Browser version
	//kolorBrowserDetect.OS : Platform OS
	
	//add fullscreen
	kolorFullscreen = new ktools.Fullscreen(document.getElementById("tourDIV"));
	kolorFullscreen.supportsFullscreen();
	//activate krpano fallback and update methods
	kolorFullscreen.setExternal({
		'enter': krPanoFullscreenEnter,
		'exit': krPanoFullscreenExit,
		'change': krpanoFullscreenChange,
		'resize': krPanoFullscreenResize
	});
});

/**
 * @function
 * @description Enter fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenEnter() {
	var ki = getKrPanoInstance();
	if(ki !== null){
		getKrPanoInstance().call("enterFullScreenFallback");
	}
}

/**
 * @function
 * @description Exit fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenExit() {
	var ki = getKrPanoInstance();
	if(ki !== null){
		ki.call("exitFullScreenFallback");
	}
}

/**
 * @function
 * @description Launch method for krpano on fullscreen change event.
 * @param {Boolean} state If true enter fullscreen event, else exit fullscreen event.
 * @return {void}
 */
function krpanoFullscreenChange(state) {
	var ki = getKrPanoInstance();
	if(ki !== null){
		if(state){
			getKrPanoInstance().call("enterFullScreenChangeEvent");
		}else{
			getKrPanoInstance().call("exitFullScreenChangeEvent");
		}
	}
}

/**
 * @function
 * @description Launch resize method for krpano correct resize.
 * @return {void}
 */
function krPanoFullscreenResize() {
	var ki = getKrPanoInstance();
	if(ki !== null){
		getKrPanoInstance().call("resizeFullScreenEvent");
	}
}

/**
 * @function
 * @description Set fullscreen mode.
 * @param {String|Boolean} value The fullscreen status: 'true' for open or 'false' for close.
 * @return {void}
 */
function setFullscreen(value) {
	var state;
	if(typeof value == "string")
		state = (value.toLowerCase() == "true");
	else
		state = Boolean(value);

	if (kolorFullscreen) {
		if(state){
			kolorFullscreen.request();
		}else{
			kolorFullscreen.exit();
		}
	}
}

/* ========== DIALOG BETWEEN KRPANO/JS STUFF ================================= */

/**
 * @function
 * @description Get krpano instance.
 * @return {Object} krpano instance.
 */
function getKrPanoInstance() {
	if ( krpano == null ) {
		krpano = document.getElementById('krpanoSWFObject');
	}
	return krpano;
}

/**
 * @function
 * @description Call krpano function.
 * @param {String} fnName The krpano action name.
 * @param {*} Following parameters are passed to the krPano function
 * @return {void}
 */
function invokeKrFunction(fnName) {
	var args = [].slice.call(arguments, 1);
	var callString = fnName+'(';
	for(var i=0, ii=args.length; i<ii; i++)
	{
		callString += args[i];
		if(i != ii-1) { callString += ', '; }
	}
	callString += ');';
	if(getKrPanoInstance() !== null)
	{
		getKrPanoInstance().call(callString);
	}
}

/**
 * @function
 * @description Get krpano identifier value.
 * @param {String} identifier The qualifier.
 * @param {String} type The converting type. Can be: 'int', 'float', 'string', 'boolean', 'object'.
 * @return {Object}
 */
function getKrValue(identifier, type) {
	if ( typeof identifier == "undefined" ){
		return identifier;
	}
	
	if(getKrPanoInstance() !== null)
	{
		if(getKrPanoInstance().get(identifier) == null) {
			return null;
		}

		switch ( type ) {
			case "int":
				return parseInt(getKrPanoInstance().get(identifier));
			case "float":
				return parseFloat(getKrPanoInstance().get(identifier));
			case "string":
				return String(getKrPanoInstance().get(identifier));
			case "bool":
				return Boolean(getKrPanoInstance().get(identifier) === 'true' || parseInt(getKrPanoInstance().get(identifier)) === 1 || getKrPanoInstance().get(identifier) === 'yes' || getKrPanoInstance().get(identifier) === 'on');
			default:
				return getKrPanoInstance().get(identifier);
		}
	}
	else
	{
		return null;
	}
}

/**
 * @function
 * @description Invoke a function of a plugin engine.
 * @param {String} pluginName The name/id of the plugin.
 * @param {String} functionName The name of the function to invoke.
 * @param {Object[]} arguments Additional arguments will be passed to the invoked function as an array.
 * @return {Object}
 */
function invokePluginFunction(pluginName, functionName) {
	if ( debug ) {
		console.log("invokePluginFunction("+pluginName+", "+functionName+")");
	}
	
	var plugin = ktools.KolorPluginList.getInstance().getPlugin(pluginName);
	if (plugin == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin instance doesn't exist"); }
		if(pluginLoaded && pluginLoaded.item(pluginName)){
			pluginLoaded.update(pluginName, arguments);
		}else{
			pluginLoaded.add(pluginName, arguments);
		}
		return false;
	}
	var engine = plugin.getRegistered();
	if (engine == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin isn't registered"); }
		if(pluginLoaded && pluginLoaded.item(pluginName)){
			pluginLoaded.update(pluginName, arguments);
		}else{
			pluginLoaded.add(pluginName, arguments);
		}
		return false;
	}
	var restArgs = [].slice.call(arguments, 2);
	return engine[functionName](restArgs);
}

/**
 * @function
 * @description This function is called when krpano is ready.
 * The ready state of krpano is told by its event onready (in fact it's not fully ready, included XML are not necessarily loaded) 
 * @return {void}
 */
function eventKrpanoLoaded (isWebVr) {
	if ( debug ) {
		console.log('krpano is loaded');
	}
	
	if (krpanoLoaded) { return false; }
	
	tourLanguage = getKrValue("tour_language","string")
	if(typeof tourLanguage == "undefined"){
		tourLanguage = 'pt_BR';
	}
	ktools.I18N.getInstance().initLanguage(tourLanguage, crossDomainTargetUrl+'indexdata/index_messages_','.xml');
	krpanoLoaded = true;
	
	if(isWebVr){
	
	
	}else{
	
	addKolorMenu('panoramaMenu');

addKolorArea('floorPlanArea');
addKolorBox('gallery2');
addKolorBox('gallery1');
addKolorBox('gallery');

	}
}

/**
 * @function
 * @description This function is called when plugins must be unloaded.
 * @return {void}
 */
function eventUnloadPlugins () {
	resetValuesForPlugins();

	deleteKolorBox('gallery');
deleteKolorBox('gallery1');
deleteKolorBox('gallery2');

deleteKolorFloorPlan('floorPlan');
deleteKolorArea('floorPlanArea');
deleteKolorMenu('panoramaMenu');

}

/**
 * @function
 * @description Reset the default values for the player and plugins loaders.
 * @return {void}
 */
function resetValuesForPlugins () {
	krpano = null;
	krpanoLoaded = false;
	isTourStarted = false;
	pluginLoaded = new ktools.Map();
	kolorStartIndex = 4000;
}

/**
 * @function
 * @description This function is called when tour is started.
 * @return {void}
 */
function eventTourStarted () {
	if ( debug ) {
		console.log('tour is started');
	}
	
	isTourStarted = true;
}

/**
 * @function
 * @description This function is called when tour language is updated.
 * @return {void}
 */
function eventTourChangeLanguage (pLang) {
	if ( debug ) {
		console.log('change tour language : '+pLang);
	}
	
	ktools.I18N.getInstance().initLanguage(pLang, crossDomainTargetUrl+'indexdata/index_messages_','.xml');
}


/* ========= KOLOR PLUGINS SCRIPTS ============================== */


/**
 * @function
 * @description Add an instance of kolorBox JS Engine, loads JS and CSS files then init and populate related plugin that's based on it.
 * @param {String} pPlugID The name of the plugin you want to give to the kolorBox instance. 
 * @return {void}
 */
function addKolorBox(pPlugID)
{
	if(typeof ktools.KolorPluginList.getInstance().getPlugin(pPlugID) == "undefined")
	{
		var kolorBoxCSS = new ktools.CssStyle("KolorBoxCSS", crossDomainTargetUrl+"indexdata/graphics/KolorBox/kolorBox.css");
		var kolorBoxJS = new ktools.Script("KolorBoxJS", crossDomainTargetUrl+"indexdata/graphics/KolorBox/KolorBox.min.js", [], true);
		var kolorBoxPlugin = new ktools.KolorPlugin(pPlugID);
		kolorBoxPlugin.addScript(kolorBoxJS);
		kolorBoxPlugin.addCss(kolorBoxCSS);
		ktools.KolorPluginList.getInstance().addPlugin(kolorBoxPlugin.getPluginName(), kolorBoxPlugin, true);
		showKolorBox(pPlugID, 0, true);
	}
}

/**
 * @function
 * @description Init, populate and show the kolorBox. You can init only.
 * @param {String} pPlugID The name of the plugin you want to init and/or show.
 * @param {Number} pIndex The index you want to open, supposing your kolorBox is populated by a list of items (gallery case).
 * @param {Boolean} pInitOnly If this param is true, just populate the kolorBox engine with the XML data without opening it.
 * @return {void}
 */
function showKolorBox(pPlugID, pIndex, pInitOnly)
{
	if(debug) { console.log("showKolorBox " + pPlugID); }

	//Check if the KolorBox is loaded
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() || typeof KolorBox === "undefined")
	{
		err = "KolorBox JS or XML is not loaded !";
		if(debug){ console.log(err); }
		//If not loaded, retry in 100 ms
		setTimeout(function() { showKolorBox(pPlugID, pIndex, pInitOnly); }, 100);
		return;
	}

	//Check if the KolorBox is instantiate and registered with the ktools.Plugin Object
	//If not, instantiate the KolorBox and register it.
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() === null)
	{
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).register(new KolorBox(pPlugID, "panoDIV"));
	}

	//Get the registered instance of KolorBox
	var kolorBox = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();

	//If kolorBox is not ready, populate datas
	if(!kolorBox.isReady())
	{
		var kolorBoxOptions = [];
		var optionName = '';
		var optionValue = '';

		//Build the Options data for the KolorBox
		var optionLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].settings.option.count"));

		for(var j = 0; j < optionLength; j++)
		{
			optionName = getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].name","string");
			if (optionName == 'zorder') {
				optionValue = kolorStartIndex + getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].type", "string"));
			} else {
				optionValue = getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].type", "string"));
			}
			kolorBoxOptions[optionName] = optionValue;
		}
		//add the device check
		kolorBoxOptions['device'] = getKrValue('vrtourdevice','string');
		//kolorBoxOptions['scale'] = getKrValue('vrtourdevicescale','float');
		kolorBox.setKolorBoxOptions(kolorBoxOptions);

		if(kolorBoxOptions['starts_opened']) {
			pInitOnly = false;
		}

		//Build the Items data for the KolorBox
		var kbItem = null;
		var itemLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata.item.count"));
		for(var k = 0; k < itemLength; k++)
		{
			//Build a new item
			kbItem = new KolorBoxObject();
			kbItem.setName(getKrValue("ptplugin["+pPlugID+"].internaldata.item["+k+"].name","string"));
			kbItem.setTitle(getKrValue("ptplugin["+pPlugID+"].internaldata.item["+k+"].title","string"));
			kbItem.setCaption(getKrValue("ptplugin["+pPlugID+"].internaldata.item["+k+"].caption","string"));
			kbItem.setValue(getKrValue("ptplugin["+pPlugID+"].internaldata.item["+k+"].value","string"));

			//If external data get n' set
			if(kbItem.getValue() === "externalData")
				kbItem.setData(getKrValue('data['+getKrValue("ptplugin["+pPlugID+"].internaldata.item["+k+"].dataName","string")+'].content', 'string'));

			//Add the item
			kolorBox.addKolorBoxItem(kbItem);

			kbItem.init();
		}

		//Kolorbox is now ready !
		kolorBox.setReady(true);
		//call ready statement for krpano script
		invokeKrFunction("kolorBoxJsReady_"+pPlugID);
	}

	//If id is defined, show this kolorBox
	if(typeof pPlugID !== "undefined" && (typeof pInitOnly === "undefined" || pInitOnly === false))
	{
		//If no index specified, set 0 as default index
		if(typeof pIndex === "undefined") { pIndex = 0; }
		kolorBox.openKolorBox(pIndex);
	}

	//If a plugin method has been called before registration the method is called now
	if(pluginLoaded && pluginLoaded.item(pPlugID)){
		invokePluginFunction.apply(null, pluginLoaded.item(pPlugID));
		pluginLoaded.remove(pPlugID);
	}
}

/**
 * @function
 * @description Delete kolorBox.
 * @param {String} pPlugID The name of the plugin you want to delete.
 * @return {void}
 */
function deleteKolorBox(pPlugID)
{
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID)){
		ktools.KolorPluginList.getInstance().removePlugin(pPlugID);
	}
	var parent = document.getElementById("panoDIV");
	var child = document.getElementById(pPlugID);
	if(parent && child){
		parent.removeChild(child);
	}
}


/**
 * @function
 * @description Add an instance of kolorFloorPlan JS Engine, loads JS and CSS files then init and populate related plugin that's based on it.
 * @param {String} pPlugID The name of the plugin you want to give to the kolorFloorPlan instance.
 * @param {String} pContent The content you want to inject into the kolorFloorPlan. I could be HTML string or any other string.
 * @return {void} 
 */
function addKolorFloorPlan(pPlugID, pContent)
{
	if(typeof ktools.KolorPluginList.getInstance().getPlugin(pPlugID) == "undefined")
	{
		var kolorFloorPlanCSS = new ktools.CssStyle("KolorFloorPlanCSS", crossDomainTargetUrl+"indexdata/graphics/KolorFloorPlan/kolorFloorPlan.css");
		var kolorFloorPlanJS = new ktools.Script("KolorFloorPlanJS", crossDomainTargetUrl+"indexdata/graphics/KolorFloorPlan/KolorFloorPlan.min.js", [], true);
		var kolorFloorPlanPlugin = new ktools.KolorPlugin(pPlugID);
		kolorFloorPlanPlugin.addScript(kolorFloorPlanJS);
		kolorFloorPlanPlugin.addCss(kolorFloorPlanCSS);
		ktools.KolorPluginList.getInstance().addPlugin(kolorFloorPlanPlugin.getPluginName(), kolorFloorPlanPlugin, true);
	}
	
	showKolorFloorPlan(pPlugID, pContent);
}

/**
 * @function
 * @description Init, populate and show the kolorFloorPlan. 
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @param {String} pContent The content you want to inject into the kolorFloorPlan. I could be HTML string or any other string.
 * @return {void} 
 */
function showKolorFloorPlan(pPlugID, pContent)
{
	if(debug) { console.log("showKolorFloorPlan " + pPlugID); }
	
	//Check if the KolorFloorPlan is loaded
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() || typeof KolorFloorPlan == "undefined")
	{
		var err = "KolorFloorPlan is not loaded";
		if(debug){ console.log(err); }
		//If not loaded, retry in 100 ms
		setTimeout(function() { showKolorFloorPlan(pPlugID, pContent); }, 100);
		return;
	}
	
	//If not, instantiate the KolorFloorPlan and register it.
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() == null)
	{
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).register(new KolorFloorPlan(pPlugID, pContent));
	}
	
	//Get the registered instance of KolorFloorPlan
	var kolorFloorPlan = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();
	
	//If kolorFloorPlan is not ready, populate datas
	if(!kolorFloorPlan.isReady())
	{
		var kolorFloorPlanOptions = [];
		var optionName = '';
		var optionValue = '';
		//Build the Options data for the KolorFloorPlan
		var optionLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].settings.option.count"));
		for(var j = 0; j < optionLength; j++)
		{
			optionName = getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].name","string");
			optionValue = getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].type", "string"));
			kolorFloorPlanOptions[optionName] = optionValue;
		}
		//add the device check
		kolorFloorPlanOptions['device'] = getKrValue('vrtourdevice','string');
		//kolorFloorPlanOptions['scale'] = getKrValue('vrtourdevicescale','float');
		kolorFloorPlan.setKolorFloorPlanOptions(kolorFloorPlanOptions);
		
		var kolorFloorPlanItems = [];
		var kolorFloorPlanSpots = [];
		var planName = '';
		var planValues = null;
		var planSpots = null;
		var planSpot = null;
		
		var kolorFloorPlanSelectedItem = getKrValue("ptplugin["+pPlugID+"].floorplanItems.selectedItem","string");
		var kolorFloorPlanSelectedSpot = getKrValue("ptplugin["+pPlugID+"].floorplanItems.selectedSpot","string");
		var kolorFloorPlanSelectedSpotOptions = [getKrValue("ptplugin["+pPlugID+"].floorplanItems.selectedSpotScene","string"), getKrValue("ptplugin["+pPlugID+"].floorplanItems[0].selectedSpotHeading","float"), getKrValue("ptplugin["+pPlugID+"].floorplanItems.selectedSpotFov","float")];
		
		var floorplansLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].floorplanItems.floorplanItem.count"));
		for(var j = 0; j < floorplansLength; j++)
		{
			planName = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].name","string");
			
			planValues = new Object();
			planValues.title = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].title","string");
			planValues.src = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].url","string");
			planValues.width = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].width","int");
			planValues.height = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].height","int");
			planValues.heading = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].heading","float");
			
			kolorFloorPlanItems[planName] = planValues;
			
			planSpots = [];
			var floorplansItemsLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot.count"));
			for(var k = 0; k < floorplansItemsLength; k++)
			{
				planSpot = new Object();
				planSpot.name = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].name","string");
				planSpot.posx = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].posX","float");
				planSpot.posy = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].posY","float");
				planSpot.heading = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].heading","float");
				planSpot.desc = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].desc","string");
				planSpot.desctype = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].descType","string");
				planSpot.scene = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].scene","string");
				planSpot.jsclick = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].jsClick","string");
				planSpot.planar = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].planar","bool");
				planSpot.icon = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].icon.url","string");
				planSpot.width = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].icon.iconWidth","int");
				planSpot.height = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].icon.iconHeight","int");
				planSpot.anchor = getKrValue("ptplugin["+pPlugID+"].floorplanItems.floorplanItem["+j+"].spot["+k+"].icon.iconAnchor","string");
				
				planSpots[planSpot.name] = planSpot;
			}
			kolorFloorPlanSpots[planName] = planSpots;
		}
		kolorFloorPlan.setKolorFloorPlanItems(kolorFloorPlanItems);
		kolorFloorPlan.setKolorFloorPlanSpots(kolorFloorPlanSpots);
		kolorFloorPlan.setKolorFloorPlanSelectedItem(kolorFloorPlanSelectedItem);
		kolorFloorPlan.setKolorFloorPlanSelectedSpot(kolorFloorPlanSelectedSpot);
		kolorFloorPlan.setKolorFloorPlanSelectedSpotOptions(kolorFloorPlanSelectedSpotOptions);
		
		kolorFloorPlan.setKrpanoEngine(getKrPanoInstance());
		
		//set url for images
		kolorFloorPlan.setGraphicsUrl(crossDomainTargetUrl+"indexdata/graphics/"+pPlugID.toLowerCase()+"/");
		
		//KolorFloorPlan is now ready
		kolorFloorPlan.setReady(true);
		//call ready statement for krpano script
		invokeKrFunction("kolorFloorplanJsReady_"+pPlugID);
	}
	
	kolorFloorPlan.showKolorFloorPlan();
	
	//If a plugin method has been called before registration the method is called now
	if(pluginLoaded && pluginLoaded.item(pPlugID)){
		invokePluginFunction.apply(null, pluginLoaded.item(pPlugID).funcArgs);
		pluginLoaded.remove(pPlugID);
	}
}

/**
 * @function
 * @description Delete kolorFloorPlan.
 * @param {String} pPlugID The name of the plugin you want to delete.
 * @return {void} 
 */
function deleteKolorFloorPlan(pPlugID)
{
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID)){
		ktools.KolorPluginList.getInstance().removePlugin(pPlugID);
	}
}


/**
 * @function
 * @description Add an instance of kolorArea JS Engine, loads JS and CSS files then init and populate related plugin that's based on it.
 * @param {String} pPlugID The name of the plugin you want to give to the kolorArea instance.
 * @return {void}
 */
function addKolorArea(pPlugID)
{
	if(typeof ktools.KolorPluginList.getInstance().getPlugin(pPlugID) == "undefined")
	{
		var kolorAreaCSS = new ktools.CssStyle("KolorAreaCSS", crossDomainTargetUrl+"indexdata/graphics/KolorArea/kolorArea.css");
		var kolorAreaJS = new ktools.Script("KolorAreaJS", crossDomainTargetUrl+"indexdata/graphics/KolorArea/KolorArea.min.js", [], true);
		var kolorAreaPlugin = new ktools.KolorPlugin(pPlugID);
		kolorAreaPlugin.addScript(kolorAreaJS);
		kolorAreaPlugin.addCss(kolorAreaCSS);
		ktools.KolorPluginList.getInstance().addPlugin(kolorAreaPlugin.getPluginName(), kolorAreaPlugin, true);
	}
}

/**
 * @function
 * @description Init, populate and show the kolorArea.
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @param {String} pContent The content you want to inject into the kolorArea. I could be HTML string or any other string.
 * @return {void}
 */
function showKolorArea(pPlugID, pContent)
{
	if(debug) { console.log("showKolorArea " + pPlugID); }

	//Check if the KolorArea is loaded
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() || typeof KolorArea == "undefined")
	{
		err = "KolorArea JS is not loaded !";
		if(debug){ console.log(err); }
		//If not loaded, retry in 100 ms
		setTimeout(function() { showKolorArea(pPlugID, pContent); }, 100);
		return;
	}

	//Check if the KolorArea is instantiate and registered with the ktools.Plugin Object
	//If not, instantiate the KolorArea and register it.
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() == null)
	{
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).register(new KolorArea(pPlugID, "panoDIV"));
	}

	//Get the registered instance of KolorArea
	var kolorArea = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();

	//If kolorArea is not ready, populate datas
	if(!kolorArea.isReady())
	{
		var kolorAreaOptions = [];
		var optionName = '';
		var optionValue = '';

		//Build the Options data for the KolorArea
		var optionLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].settings.option.count"));

		for(var j = 0; j < optionLength; j++)
		{
			optionName = getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].name","string");
			if (optionName == 'zorder') {
				optionValue = kolorStartIndex + getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].type", "string"));
			} else {
				optionValue = getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+j+"].type", "string"));
			}
			kolorAreaOptions[optionName] = optionValue;
		}
		//add the device check
		kolorAreaOptions['device'] = getKrValue('vrtourdevice','string');
		//kolorAreaOptions['scale'] = getKrValue('vrtourdevicescale','float');
		kolorArea.setKolorAreaOptions(kolorAreaOptions);

		//KolorArea is now ready !
		kolorArea.setReady(true);
		//call ready statement for krpano script
		invokeKrFunction("kolorAreaJsReady_"+pPlugID);
	}

	kolorArea.setKolorAreaContent(pContent);
	kolorArea.openKolorArea();

	//If a plugin method has been called before registration the method is called now
	if(pluginLoaded && pluginLoaded.item(pPlugID)){
		invokePluginFunction.apply(null, pluginLoaded.item(pPlugID).funcArgs);
		pluginLoaded.remove(pPlugID);
	}
}

/**
 * @function
 * @description Delete kolorArea.
 * @param {String} pPlugID The name of the plugin you want to delete.
 * @return {void}
 */
function deleteKolorArea(pPlugID)
{
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID)){
		ktools.KolorPluginList.getInstance().removePlugin(pPlugID);
	}
	var parent = document.getElementById("panoDIV");
	var child = document.getElementById(pPlugID);
	if(parent && child){
		parent.removeChild(child);
	}
}


/**
 * @function
 * @description Add an instance of kolorMenu JS Engine, loads JS and CSS files then init and populate related plugin that's based on it.
 * @param {String} pPlugID The name of the plugin you want to give to the kolorBox instance. 
 * @return {void} 
 */
function addKolorMenu(pPlugID) 
{
	if(typeof ktools.KolorPluginList.getInstance().getPlugin(pPlugID) == "undefined")
	{
		var kolorMenuCSS = new ktools.CssStyle("KolorMenuCSS", crossDomainTargetUrl+"indexdata/graphics/KolorMenu/kolorMenu.css");
		var kolorMenuJS = new ktools.Script("KolorMenuJS", crossDomainTargetUrl+"indexdata/graphics/KolorMenu/KolorMenu.min.js", [], true);
		var kolorMenuPlugin = new ktools.KolorPlugin(pPlugID);
		kolorMenuPlugin.addScript(kolorMenuJS);
		kolorMenuPlugin.addCss(kolorMenuCSS);
		ktools.KolorPluginList.getInstance().addPlugin(kolorMenuPlugin.getPluginName(), kolorMenuPlugin, true);
	}
}

/**
 * @function
 * @description Create KolorMenu and/or display it if exists.
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @return {void} 
 */
function openKolorMenu(pPlugID)
{
	if(debug) { console.log("openKolorMenu "+pPlugID); }
	
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() || !ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() || typeof KolorMenu == "undefined"){
		createKolorMenu(pPlugID);
	} else {
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered().showKolorMenu();
	}
}

/**
 * @function
 * @description Init, populate and show the kolorMenu.
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @return {void} 
 */
function createKolorMenu(pPlugID)
{	
	if(debug) { console.log("createKolorMenu "+pPlugID); }

	//Check if the KolorMenu is loaded
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized()  || typeof KolorMenu == "undefined")
	{
		err = "KolorMenu JS or XML is not loaded !";
		if(debug){ console.log(err); }
		//If not loaded, retry in 100 ms
		setTimeout(function() { createKolorMenu(pPlugID); }, 100);
		return;
	}

	//Check if the KolorMenu is instantiate and registered with the ktools.Plugin Object
	//If not, instantiate the KolorMenu and register it.
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() == null)
	{
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).register(new KolorMenu(pPlugID, "panoDIV"));
	}
	
	//Get the registered instance of KolorMenu
	var kolorMenu = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();
	
	//If kolorMenu is not ready, populate datas
	if(!kolorMenu.isReady())
	{
		var kolorMenuOptions = [];
		
		//Build the Options data for the KolorMenu
		var optionLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].settings.option.count"));
	
		for(var i = 0; i < optionLength; i++)
		{
			if (getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].name","string") == 'zorder') {
				kolorMenuOptions[getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].name","string")] = kolorStartIndex + getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].type", "string"));
			} else {
				kolorMenuOptions[getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].name","string")] = getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].type", "string"));
			}
		}
		//add the device check
		kolorMenuOptions['device'] = getKrValue('vrtourdevice','string');
		//kolorMenuOptions['scale'] = getKrValue('vrtourdevicescale','float');
		kolorMenu.setKolorMenuOptions(kolorMenuOptions);
		
		var groupLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata.group.count"));
		var group = null;
		
		var itemLength = 0;
		var item = null;
		
		var itemOptionsLength = 0;
		
		for(var j = 0; j < groupLength; j++)
		{
			group = new KolorMenuObject();
			group.setName(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].name","string"));
			if(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].titleID","string") !== '')
				group.setTitle(ktools.I18N.getInstance().getMessage(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].titleID","string")));
			group.setI18nText(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].titleID","string"));
			group.setAction(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].action","string"));
			group.setThumbnail(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].thumbnail","string"));
			group.setSubMenu(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].subMenu","bool"));
			group.setCssClass(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].cssClass","string"));
			
			itemLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata.group["+j+"].item.count"));
			
			for(var k = 0; k < itemLength; k++)
			{
				item = new KolorMenuObject();
				item.setName(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].name","string"));
				if(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].titleID","string") !== '')
					item.setTitle(ktools.I18N.getInstance().getMessage(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].titleID","string")));
				item.setI18nText(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].titleID","string"));
				item.setAction(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].action","string"));
				item.setThumbnail(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].thumbnail","string"));
				item.setCssClass(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].cssClass","string"));
				item.setParent(group);
				
				//Build the Options data for the item
				itemOptionsLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].option.count"));
				for(var l = 0; l < itemOptionsLength; l++)
				{
					item.addOption(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].option["+l+"].name","string"), getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].option["+l+"].value", getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].item["+k+"].option["+l+"].type", "string")));
				}
				
				group.addChild(item);
			}
			
			groupOptionsLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata.group["+j+"].option.count"));
			for(var m = 0; m < groupOptionsLength; m++)
			{
				group.addOption(getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].option["+m+"].name","string"), getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].option["+m+"].value", getKrValue("ptplugin["+pPlugID+"].internaldata.group["+j+"].option["+m+"].type", "string")));
			}
			
			kolorMenu.addKolorMenuGroup(group);
		}
		
		//KolorMenu is now ready
		kolorMenu.setReady(true);
		//call ready statement for krpano script
		invokeKrFunction("kolorMenuJsReady_"+pPlugID);
		
		//Display the menu
		kolorMenu.openKolorMenu();
	}
}

/**
 * @function
 * @description Update and populate kolorMenu.
 * @param {String} pPlugID The name of the plugin you want to update.
 * @return {void} 
 */
function updateKolorMenu(pPlugID)
{
	if(debug) { console.log("updateKolorMenu "+pPlugID); }

	//Check if the KolorMenu is loaded
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() && typeof KolorMenu != "undefined" && ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() != null)
	{
		//Get the registered instance of KolorMenu
		var kolorMenu = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();
		
		//If kolorMenu is ready, update datas
		if(kolorMenu.isReady())
		{
			var groups = kolorMenu.getKolorMenuGroups();
			var groupsLength = groups.size();
			var itemsLength = 0;
			var group, item;
			
			for(var i = 0; i < groupsLength; i++)
			{
				group = groups.get(i);
				itemsLength = group.getChildren().size();
				
				if(group.getSubMenu()){
					group.setTitle(ktools.I18N.getInstance().getMessage(group.getI18nText()));
				}
				
				if(group.hasChildren() && itemsLength > 0){
					for(var j = 0; j < itemsLength; j++){
						item = group.getChildren().get(j);
						item.setTitle(ktools.I18N.getInstance().getMessage(item.getI18nText()));
					}
				}
			}
		}
	}
}

/**
 * @function
 * @description Delete kolorMenu.
 * @param {String} pPlugID The name of the plugin you want to delete.
 * @return {void} 
 */
function deleteKolorMenu(pPlugID)
{
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID)){
		ktools.KolorPluginList.getInstance().removePlugin(pPlugID);
	}
	var parent = document.getElementById("panoDIV");
	var child = document.getElementById(pPlugID);
	if(parent && child){
		parent.removeChild(child);
	}
}
