(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["GamepadJogger"],{"./node_modules/cache-loader/dist/cjs.js?!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib/index.js!./node_modules/cache-loader/dist/cjs.js?!./node_modules/vue-loader/lib/index.js?!./src/plugins/GamepadJogger/Jogger.vue?vue&type=script&lang=js&":function(e,t,s){"use strict";s.r(t);var o=s("./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js"),n=s("./node_modules/@babel/runtime/helpers/esm/typeof.js"),i=s("./node_modules/@babel/runtime/helpers/esm/objectSpread2.js"),a=(s("./node_modules/core-js/modules/web.dom-collections.for-each.js"),s("./node_modules/core-js/modules/es.array.filter.js"),s("./node_modules/core-js/modules/es.array.concat.js"),s("./node_modules/core-js/modules/es.string.trim.js"),s("./node_modules/core-js/modules/es.array.splice.js"),s("./node_modules/vuex/dist/vuex.esm.js")),d={plugin:0,gcode:1,move:2,custom:3};t["default"]={data:function data(){return{actions:[],enabled:!1,gamepadName:"",activeControls:[],showSetAction:!1,settingAction:null,moving:!1,showResetDialog:!1,debug:!1,stepList:[.1,1,5,10,20,50,100],stepIndex:2,feedRateList:[1,5,15,30,60,100],feedRateIndex:3,addNewItem:!1,newEntry:{action:"",command:""},lastAction:0,inputHasFocus:!1,lastKeyPress:0}},created:function created(){window.addEventListener("keydown",this.checkKeyPress),document.addEventListener("focusin",this.inputFocused),document.addEventListener("focusout",this.inputBlurred)},beforeDestroy:function beforeDestroy(){window.removeEventListener("keydown",this.checkKeyPress),document.removeEventListener("focusin",this.inputFocused),document.addEventListener("focusout",this.inputBlurred)},computed:Object(i["default"])(Object(i["default"])({},Object(a["mapState"])("machine/model",["move","state"])),{},{stepValue:function stepValue(){return this.stepList[this.stepIndex]},feedRateValue:function feedRateValue(){return 60*this.feedRateList[this.feedRateIndex]}}),mounted:function mounted(){this.loadSettings(),setInterval(this.checkGamepad,100)},unmounted:function unmounted(){clearInterval(this.checkGamepad)},methods:Object(i["default"])(Object(i["default"])({},Object(a["mapActions"])("machine",["sendCode"])),{},{buildAction:function buildAction(e,t,s){return{action:e,control:"",type:t,command:s,pressed:!1,key:""}},inputFocused:function inputFocused(){this.inputHasFocus=!0},inputBlurred:function inputBlurred(){this.inputHasFocus=!1},checkKeyPress:function checkKeyPress(e){var t=this;if(this.showSetAction)return this.settingAction.key=e.key,this.showSetAction=!1,void this.saveSettings();if(!this.inputHasFocus&&Date.now()-this.lastKeyPress>100){this.lastKeyPress=Date.now(),this.actions.forEach((function(e){return e.pressed=!1}));var s=this.actions.filter((function(t){return t.key===e.key}));s[0].pressed=!0,this.fireActions(s),setTimeout((function(){t.actions.forEach((function(e){return e.pressed=!1}))}),90)}},isActionSet:function isActionSet(e){return""!==e.control||""!==e.key},buttonPressed:function buttonPressed(e){return"object"==Object(n["default"])(e)?e.pressed:1==e},setActionDialog:function setActionDialog(e){this.settingAction=e,this.showSetAction=!0},resetSettings:function resetSettings(){var e=this;this.actions=[],this.move.axes.forEach((function(t){e.actions.push(e.buildAction("".concat(t.letter,"+"),d.move)),e.actions.push(e.buildAction("".concat(t.letter,"-"),d.move))})),this.actions.push(this.buildAction("Home X",d.gcode,"G28 X")),this.actions.push(this.buildAction("Home Y",d.gcode,"G28 Y")),this.actions.push(this.buildAction("Home Z",d.gcode,"G28 Z")),this.actions.push(this.buildAction("Home All",d.gcode,"G28")),this.actions.push(this.buildAction("Step +",d.plugin,"step+")),this.actions.push(this.buildAction("Step -",d.plugin,"step-")),this.actions.push(this.buildAction("Feed Rate +",d.plugin,"feed+")),this.actions.push(this.buildAction("Feed Rate -",d.plugin,"feed-")),this.actions.push(this.buildAction("Set Zero",d.gcode,"G92 X0 Y0 Z0")),this.saveSettings(),this.showResetDialog=!1},clearAction:function clearAction(e){e.control="",e.key=""},loadSettings:function loadSettings(){var e=localStorage.getItem("joggerSettings");e?this.actions=JSON.parse(e):this.resetSettings()},saveSettings:function saveSettings(){localStorage.setItem("joggerSettings",JSON.stringify(this.actions))},generateGCodeMoveCommand:function generateGCodeMoveCommand(e){var t=this;if(!this.moving){this.moving=!0;var s="";e.forEach((function(e){var o=e.action[0],n="+"===e.action[1]?"":"-",i="".concat(n).concat(t.stepValue);s+=" ".concat(o).concat(i)}));var o="M120\nG91\nG1 ".concat(s.trim()," F").concat(this.feedRateValue,"\nG90\nM121");this.debug?console.log(o):this.sendCode(o),this.moving=!1}},generateGCodeCommand:function generateGCodeCommand(e){this.moving||"idle"!==this.state.status||(this.debug?console.log(e.command):(this.moving=!0,this.sendCode(e.command),this.moving=!1))},performPluginAction:function performPluginAction(e){if(!(Date.now()-this.lastAction<500))switch(this.lastAction=Date.now(),e.command){case"step+":this.stepIndex<this.stepList.length-1&&(this.stepIndex++,this.sendCode('M117 "Jogger Step :  '.concat(this.stepValue,'"')));break;case"step-":this.stepIndex>0&&(this.stepIndex--,this.sendCode('M117 "Jogger Step :  '.concat(this.stepValue,'"')));break;case"feed+":this.feedRateIndex<this.feedRateList.length-1&&(this.feedRateIndex++,this.sendCode('M117 "Jogger Feed Rate :  '.concat(this.feedRateList[this.feedRateIndex],'"')));break;case"feed-":this.feedRateIndex>0&&this.feedRateIndex--,this.sendCode('M117 "Jogger Feed Rate :  '.concat(this.feedRateList[this.feedRateIndex],'"'));break}},checkGamepad:function checkGamepad(){var e=this,t=navigator.getGamepads?navigator.getGamepads():navigator.webkitGetGamepads?navigator.webkitGetGamepads:[];if(t.length>0&&t[0]){this.gamepadName=t[0].id;var s=t[0];if(this.activeControls=[],s.buttons.forEach((function(t,s){e.buttonPressed(t)&&e.activeControls.push("B".concat(s))})),this.activeAxes="",s.axes.forEach((function(t,s){if(1-Math.abs(t)<.5){var o=t>0?"+":"-";e.activeControls.push("A".concat(s).concat(o))}})),this.actions.forEach((function(e){return e.pressed=!1})),this.settingAction&&this.activeControls.length>0)this.settingAction.control=this.activeControls[0],this.settingAction=null,this.showSetAction=!1,this.saveSettings();else if(this.activeControls.length>0){var n=new Array;this.activeControls.forEach((function(t){n.push.apply(n,Object(o["default"])(e.actions.filter((function(e){return e.control===t}))))})),n.forEach((function(e){return e.pressed=!0})),this.debug&&console.log(n),this.fireActions(n)}}},fireActions:function fireActions(e){if(this.enabled){var t=e.filter((function(e){return e.type===d.move}));if(t.length>0)this.generateGCodeMoveCommand(t);else{var s=e.filter((function(e){return e.type===d.gcode||e.type===d.custom}));if(s.length>0)this.generateGCodeCommand(s[0]);else{var o=e.filter((function(e){return e.type===d.plugin}));o.length>0&&this.performPluginAction(o[0])}}}},addCustomAction:function addCustomAction(e,t){this.actions.push(this.buildAction(e,d.custom,t)),this.saveSettings(),this.newEntry.action="",this.newEntry.command="",this.addNewItem=!1},removeCustomAction:function removeCustomAction(e){this.actions.splice(e,1),this.saveSettings()}})}},'./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"5cc64625-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js?!./node_modules/cache-loader/dist/cjs.js?!./node_modules/vue-loader/lib/index.js?!./src/plugins/GamepadJogger/Jogger.vue?vue&type=template&id=59bbce00&':function(e,t,s){"use strict";s.r(t),s.d(t,"render",(function(){return render})),s.d(t,"staticRenderFns",(function(){return o}));var render=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",[s("div",[e._v("Gamepad Name : "+e._s(e.gamepadName))]),s("div",[s("v-switch",{attrs:{inset:"",label:"Enable"},model:{value:e.enabled,callback:function(t){e.enabled=t},expression:"enabled"}})],1),s("v-row",[s("v-col",{attrs:{cols:"6"}},[e._v(" Steps"),s("br"),s("v-btn-toggle",{attrs:{mandatory:"",exclusive:""},model:{value:e.stepIndex,callback:function(t){e.stepIndex=t},expression:"stepIndex"}},e._l(e.stepList,(function(t){return s("v-btn",{key:t},[e._v(" "+e._s(t))])})),1)],1),s("v-col",{attrs:{cols:"6"}},[e._v(" Feed Rate (mm/s)"),s("br"),s("v-btn-toggle",{attrs:{mandatory:"",exclusive:""},model:{value:e.feedRateIndex,callback:function(t){e.feedRateIndex=t},expression:"feedRateIndex"}},e._l(e.feedRateList,(function(t){return s("v-btn",{key:t},[e._v(" "+e._s(t))])})),1)],1)],1),s("v-simple-table",[s("thead",[s("tr",[s("td",[s("h2",[e._v("Configuration")])]),s("td",{staticClass:"cell-right",attrs:{colspan:"4"}},[s("v-btn",{staticClass:"mr-2",on:{click:function(t){e.addNewItem=!0}}},[e._v("New Action")]),s("v-btn",{attrs:{color:"red"},on:{click:function(t){e.showResetDialog=!0}}},[e._v("Reset")])],1)]),s("tr",[s("th",[e._v("Action")]),s("th",[e._v("Set")]),s("th",[e._v("Configure")]),s("th",[e._v("Custom Command")]),s("th",[e._v("Controller Button Id")]),s("th",[e._v("Keyboard Key")])])]),s("tbody",e._l(e.actions,(function(t,o){return s("tr",{key:o,staticClass:"action-control",class:{"action-pressed":t.pressed}},[s("td",[e._v(e._s(t.action))]),s("td",[e._v(e._s(e.isActionSet(t)))]),s("td",[s("v-btn",{staticClass:"mr-1",attrs:{color:"info"},on:{click:function(s){return e.setActionDialog(t)}}},[e._v("Set")]),s("v-btn",{staticClass:"mr-1",attrs:{color:"warning"},on:{click:function(s){return e.clearAction(t)}}},[e._v("Clear")]),s("v-btn",{directives:[{name:"show",rawName:"v-show",value:3===t.type,expression:"action.type === 3"}],attrs:{color:"error"},on:{click:function(t){return e.removeCustomAction(o)}}},[e._v("Delete")])],1),s("td",[s("span",{directives:[{name:"show",rawName:"v-show",value:3===t.type,expression:"action.type === 3"}]},[e._v(e._s(t.command))])]),s("td",[e._v(e._s(t.control))]),s("td",[e._v(e._s(t.key))])])})),0)]),s("v-dialog",{attrs:{"max-width":"325"},model:{value:e.showSetAction,callback:function(t){e.showSetAction=t},expression:"showSetAction"}},[s("v-card",[s("v-card-title",[e._v("Set Action")]),s("v-card-text",[e._v("Press a button or move an axis to set value")]),s("v-card-actions",[s("v-btn",{on:{click:function(t){e.showSetAction=!e.showSetAction}}},[e._v("Cancel")])],1)],1)],1),s("v-dialog",{attrs:{"max-width":"325"},model:{value:e.showResetDialog,callback:function(t){e.showResetDialog=t},expression:"showResetDialog"}},[s("v-card",{attrs:{"max-width":"325",outlined:""}},[s("v-card-title",[e._v("Reset Settings")]),s("v-card-text",[e._v("Click reset to confirm reset.")]),s("v-card-actions",[s("v-btn",{attrs:{color:"red",width:"150"},on:{click:e.resetSettings}},[e._v("Reset")]),e._v(" "),s("v-btn",{attrs:{color:"info",width:"150"},on:{click:function(t){e.showResetDialog=!1}}},[e._v("Cancel")])],1)],1)],1),s("v-dialog",{attrs:{"max-width":"325"},model:{value:e.addNewItem,callback:function(t){e.addNewItem=t},expression:"addNewItem"}},[s("v-card",[s("v-card-title",[e._v("Add New Action")]),s("v-card-text",[s("v-form",[s("v-text-field",{attrs:{label:"Action Name"},model:{value:e.newEntry.action,callback:function(t){e.$set(e.newEntry,"action",t)},expression:"newEntry.action"}}),s("v-textarea",{attrs:{label:"Command","auto-grow":"",filled:""},model:{value:e.newEntry.command,callback:function(t){e.$set(e.newEntry,"command",t)},expression:"newEntry.command"}}),s("v-btn",{on:{click:function(t){return e.addCustomAction(e.newEntry.action,e.newEntry.command)}}},[e._v("Save")]),s("v-btn",{on:{click:function(t){e.addNewItem=!1}}},[e._v("Close")])],1)],1)],1)],1)],1)},o=[]},"./node_modules/mini-css-extract-plugin/dist/loader.js?!./node_modules/css-loader/dist/cjs.js?!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/postcss-loader/src/index.js?!./node_modules/cache-loader/dist/cjs.js?!./node_modules/vue-loader/lib/index.js?!./src/plugins/GamepadJogger/Jogger.vue?vue&type=style&index=0&lang=css&":function(e,t,s){},"./src/plugins/GamepadJogger/Jogger.vue":function(e,t,s){"use strict";s.r(t);var o=s("./src/plugins/GamepadJogger/Jogger.vue?vue&type=template&id=59bbce00&"),n=s("./src/plugins/GamepadJogger/Jogger.vue?vue&type=script&lang=js&"),i=(s("./src/plugins/GamepadJogger/Jogger.vue?vue&type=style&index=0&lang=css&"),s("./node_modules/vue-loader/lib/runtime/componentNormalizer.js")),a=s("./node_modules/vuetify-loader/lib/runtime/installComponents.js"),d=s.n(a),c=s("./node_modules/vuetify/lib/components/VBtn/VBtn.js"),r=s("./node_modules/vuetify/lib/components/VBtnToggle/VBtnToggle.js"),l=s("./node_modules/vuetify/lib/components/VCard/VCard.js"),u=s("./node_modules/vuetify/lib/components/VCard/index.js"),m=s("./node_modules/vuetify/lib/components/VGrid/VCol.js"),h=s("./node_modules/vuetify/lib/components/VDialog/VDialog.js"),v=s("./node_modules/vuetify/lib/components/VForm/VForm.js"),g=s("./node_modules/vuetify/lib/components/VGrid/VRow.js"),p=s("./node_modules/vuetify/lib/components/VDataTable/VSimpleTable.js"),f=s("./node_modules/vuetify/lib/components/VSwitch/VSwitch.js"),b=s("./node_modules/vuetify/lib/components/VTextField/VTextField.js"),_=s("./node_modules/vuetify/lib/components/VTextarea/VTextarea.js"),j=Object(i["default"])(n["default"],o["render"],o["staticRenderFns"],!1,null,null,null);t["default"]=j.exports,d()(j,{VBtn:c["default"],VBtnToggle:r["default"],VCard:l["default"],VCardActions:u["VCardActions"],VCardText:u["VCardText"],VCardTitle:u["VCardTitle"],VCol:m["default"],VDialog:h["default"],VForm:v["default"],VRow:g["default"],VSimpleTable:p["default"],VSwitch:f["default"],VTextField:b["default"],VTextarea:_["default"]})},"./src/plugins/GamepadJogger/Jogger.vue?vue&type=script&lang=js&":function(e,t,s){"use strict";s.r(t);var o=s("./node_modules/cache-loader/dist/cjs.js?!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib/index.js!./node_modules/cache-loader/dist/cjs.js?!./node_modules/vue-loader/lib/index.js?!./src/plugins/GamepadJogger/Jogger.vue?vue&type=script&lang=js&");t["default"]=o["default"]},"./src/plugins/GamepadJogger/Jogger.vue?vue&type=style&index=0&lang=css&":function(e,t,s){"use strict";s.r(t);var o=s("./node_modules/mini-css-extract-plugin/dist/loader.js?!./node_modules/css-loader/dist/cjs.js?!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/postcss-loader/src/index.js?!./node_modules/cache-loader/dist/cjs.js?!./node_modules/vue-loader/lib/index.js?!./src/plugins/GamepadJogger/Jogger.vue?vue&type=style&index=0&lang=css&");for(var n in o)["default"].indexOf(n)<0&&function(e){s.d(t,e,(function(){return o[e]}))}(n)},"./src/plugins/GamepadJogger/Jogger.vue?vue&type=template&id=59bbce00&":function(e,t,s){"use strict";s.r(t);var o=s('./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"5cc64625-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js?!./node_modules/cache-loader/dist/cjs.js?!./node_modules/vue-loader/lib/index.js?!./src/plugins/GamepadJogger/Jogger.vue?vue&type=template&id=59bbce00&');s.d(t,"render",(function(){return o["render"]})),s.d(t,"staticRenderFns",(function(){return o["staticRenderFns"]}))},"./src/plugins/GamepadJogger/index.js":function(e,t,s){"use strict";s.r(t);var o=s("./src/routes/index.js"),n=s("./src/plugins/GamepadJogger/Jogger.vue");Object(o["registerRoute"])(n["default"],{Settings:{Jogger:{icon:"mdi-gamepad-variant",caption:"Jogger",path:"/Jogger"}}})}}]);
//# sourceMappingURL=GamepadJogger.29aa97cf.js.map