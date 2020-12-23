<template>
    <div>
        <div>Gamepad Name : {{gamepadName}}</div>
        <div>
            <v-switch inset v-model="enabled" label="Enable"></v-switch>
        </div>
        <v-row>
            <v-col cols="6">
                Steps<br />
                <v-btn-toggle mandatory exclusive v-model="stepIndex">
                    <v-btn v-for="step in stepList" :key="step"> {{step}}</v-btn>
                </v-btn-toggle>
            </v-col>
            <v-col cols="6">
                Feed Rate (mm/s)<br />
                <v-btn-toggle mandatory exclusive v-model="feedRateIndex">
                    <v-btn v-for="rate in feedRateList" :key="rate"> {{rate}}</v-btn>
                </v-btn-toggle>
            </v-col>
        </v-row>
        <v-simple-table>
            <thead>
                <tr>
                    <td><h2>Configuration</h2></td>
                    <td colspan="4" class="cell-right">
                        <v-btn class="mr-2" @click="addNewItem = true">New Action</v-btn>
                        <v-btn @click="showResetDialog = true" color="red">Reset</v-btn>
                    </td>
                </tr>
                <tr>
                    <th>Action</th>
                    <th>Set</th>
                    <th>Configure</th>
                    <th>Custom Command</th>
                    <th>Controller Button Id</th>
                    <th>Keyboard Key</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(action,index) in actions" :key="index" class="action-control" :class="{'action-pressed' : action.pressed}">
                    <td>{{action.action}}</td>
                    <td>{{ isActionSet(action) }}</td>
                    <td>
                        <v-btn class="mr-1" @click="setActionDialog(action)" color="info">Set</v-btn>
                        <v-btn @click="clearAction(action)" color="warning" class="mr-1">Clear</v-btn>
                        <v-btn v-show="action.type === 3" @click="removeCustomAction(index)" color="error">Delete</v-btn>
                    </td>
                    <td>
                        <span v-show="action.type === 3">{{action.command}}</span>
                    </td>
                    <td>{{action.control}}</td>
                    <td>{{action.key}}</td>
                </tr>
            </tbody>
        </v-simple-table>
        <v-dialog v-model="showSetAction" max-width="325">
            <v-card>
                <v-card-title>Set Action</v-card-title>
                <v-card-text>Press a button or move an axis to set value</v-card-text>
                <v-card-actions> <v-btn @click="showSetAction = !showSetAction">Cancel</v-btn> </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="showResetDialog" max-width="325">
            <v-card max-width="325" outlined>
                <v-card-title>Reset Settings</v-card-title>
                <v-card-text>Click reset to confirm reset.</v-card-text>
                <v-card-actions> <v-btn @click="resetSettings" color="red" width="150">Reset</v-btn> <v-btn color="info" @click="showResetDialog = false" width="150">Cancel</v-btn> </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="addNewItem" max-width="325">
            <v-card>
                <v-card-title>Add New Action</v-card-title>
                <v-card-text>
                    <v-form>
                        <v-text-field v-model="newEntry.action" label="Action Name"></v-text-field>
                        <v-textarea v-model="newEntry.command" label="Command" auto-grow filled></v-textarea>
                        <v-btn @click="addCustomAction(newEntry.action, newEntry.command)">Save</v-btn>
                        <v-btn @click="addNewItem = false">Close</v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>


<script>
import { mapActions, mapState } from 'vuex';

let commandType = {
	plugin: 0, //Plugin commands perform an action that drives a chance in the plugin itself like steps or feedrate
	gcode: 1, //GCode command sends gcode to the duet
	move: 2, //Move  commands require processing to add steps and feedrate before being sent to duet
	custom: 3, //Allow for user customized gcode macros to be attached to a button. A good example is running a macro with M98 P"X"
};

export default {
	data: function () {
		return {
			actions: [],
			enabled: false,
			gamepadName: '',
			activeControls: [],
			showSetAction: false,
			settingAction: null,
			moving: false,
			showResetDialog: false,
			debug: false,
			stepList: [0.1, 1, 5, 10, 20, 50, 100],
			stepIndex: 2,
			feedRateList: [1, 5, 15, 30, 60, 100],
			feedRateIndex: 3,
			addNewItem: false,
			newEntry: {
				action: '',
				command: '',
			},
			lastAction: 0,
			inputHasFocus: false,
			lastKeyPress: 0,
		};
	},
	created() {
		window.addEventListener('keydown', this.checkKeyPress);
		document.addEventListener('focusin', this.inputFocused);
		document.addEventListener('focusout', this.inputBlurred);
	},
	beforeDestroy() {
		window.removeEventListener('keydown', this.checkKeyPress);
		document.removeEventListener('focusin', this.inputFocused);
		document.addEventListener('focusout', this.inputBlurred);
	},
	computed: {
		...mapState('machine/model', ['move', 'state']),
		stepValue() {
			return this.stepList[this.stepIndex];
		},
		feedRateValue() {
			return this.feedRateList[this.feedRateIndex] * 60;
		},
	},
	mounted() {
		this.loadSettings();
		setInterval(this.checkGamepad, 100);
	},
	unmounted() {
		clearInterval(this.checkGamepad);
	},
	methods: {
		...mapActions('machine', ['sendCode']),
		buildAction(action, type, command) {
			return {
				action: action,
				control: '',
				type: type,
				command: command,
				pressed: false,
				key: '',
			};
		},
		inputFocused() {
			this.inputHasFocus = true;
		},
		inputBlurred() {
			this.inputHasFocus = false;
		},
		checkKeyPress(evt) {
			//Check if we are setting a key
			if (this.showSetAction) {
				this.settingAction.key = evt.key;
				this.showSetAction = false;
				this.saveSettings();
				return;
			}

			if (!this.inputHasFocus && Date.now() - this.lastKeyPress > 100) {
				this.lastKeyPress = Date.now();

				this.actions.forEach(action => (action.pressed = false));

				let firedAction = this.actions.filter(action => action.key === evt.key);
				firedAction[0].pressed = true;
				this.fireActions(firedAction);
				setTimeout(() => {
					this.actions.forEach(action => (action.pressed = false));
				}, 90);
			}
		},
		isActionSet(action) {
			return action.control !== '' || action.key !== '';
		},
		buttonPressed(b) {
			if (typeof b == 'object') {
				return b.pressed;
			}
			return b == 1.0;
		},
		setActionDialog(action) {
			this.settingAction = action;
			this.showSetAction = true;
		},
		resetSettings() {
			this.actions = [];
			//lets build a new  action list from the axes
			this.move.axes.forEach(axis => {
				this.actions.push(this.buildAction(`${axis.letter}+`, commandType.move));
				this.actions.push(this.buildAction(`${axis.letter}-`, commandType.move));
			});

			//Add some default commands we'll handle
			this.actions.push(this.buildAction('Home X', commandType.gcode, 'G28 X'));
			this.actions.push(this.buildAction('Home Y', commandType.gcode, 'G28 Y'));
			this.actions.push(this.buildAction('Home Z', commandType.gcode, 'G28 Z'));
			this.actions.push(this.buildAction('Home All', commandType.gcode, 'G28'));
			this.actions.push(this.buildAction('Step +', commandType.plugin, 'step+'));
			this.actions.push(this.buildAction('Step -', commandType.plugin, 'step-'));
			this.actions.push(this.buildAction('Feed Rate +', commandType.plugin, 'feed+'));
			this.actions.push(this.buildAction('Feed Rate -', commandType.plugin, 'feed-'));
			this.actions.push(this.buildAction('Set Zero', commandType.gcode, 'G92 X0 Y0 Z0'));
			this.saveSettings();
			this.showResetDialog = false;
		},
		clearAction(action) {
			action.control = '';
			action.key = '';
		},
		loadSettings() {
			//Check for saved settings
			let actionsString = localStorage.getItem('joggerSettings');
			if (actionsString) {
				this.actions = JSON.parse(actionsString);
			} else {
				this.resetSettings();
			}
		},
		saveSettings() {
			localStorage.setItem('joggerSettings', JSON.stringify(this.actions));
		},
		generateGCodeMoveCommand(moves) {
			/*
                        Maybe look into computing estimated time of completions for a move to smooth 
                        if (Date.now() - this.lastAction < 500) {
                          return;
                        }
                        this.lastAction = Date.now();
                        */
			if (this.moving) return; //discard any commands while moving
			this.moving = true;
			let moveCommands = '';
			moves.forEach(axisAction => {
				var axis = axisAction.action[0];
				var direction = axisAction.action[1] === '+' ? '' : '-';
				var move = `${direction}${this.stepValue}`;
				moveCommands += ` ${axis}${move}`;
			});
			var command = `M120\nG91\nG1 ${moveCommands.trim()} F${this.feedRateValue}\nG90\nM121`;
			if (this.debug) {
				console.log(command);
			} else {
				this.sendCode(command);
			}
			this.moving = false;
		},
		generateGCodeCommand(gcode) {
			if (this.moving || this.state.status !== 'idle') {
				return;
			}
			if (this.debug) {
				console.log(gcode.command);
			} else {
				this.moving = true;
				this.sendCode(gcode.command);
				this.moving = false;
			}
		},
		performPluginAction(action) {
			if (Date.now() - this.lastAction < 500) {
				return;
			}
			this.lastAction = Date.now();

			switch (action.command) {
				case 'step+':
					if (this.stepIndex < this.stepList.length - 1) {
						this.stepIndex++;
						this.sendCode(`M117 "Jogger Step :  ${this.stepValue}"`);
					}
					break;
				case 'step-':
					if (this.stepIndex > 0) {
						this.stepIndex--;
						this.sendCode(`M117 "Jogger Step :  ${this.stepValue}"`);
					}
					break;
				case 'feed+':
					if (this.feedRateIndex < this.feedRateList.length - 1) {
						this.feedRateIndex++;
						this.sendCode(`M117 "Jogger Feed Rate :  ${this.feedRateList[this.feedRateIndex]}"`);
					}
					break;
				case 'feed-':
					{
						if (this.feedRateIndex > 0) this.feedRateIndex--;
						this.sendCode(`M117 "Jogger Feed Rate :  ${this.feedRateList[this.feedRateIndex]}"`);
					}
					break;
			}
		},
		checkGamepad() {
			//check if gamepads are connected and update their current button/axis states
			var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : [];
			if (gamepads.length > 0 && gamepads[0]) {
				this.gamepadName = gamepads[0].id;

				let gamepad = gamepads[0]; //we'll just work with the first controller that is detected for now.

				//Collection of all the buttons/axes activated on this frame
				this.activeControls = [];

				//Get a collection of pushed buttons
				gamepad.buttons.forEach((b, i) => {
					if (this.buttonPressed(b)) {
						this.activeControls.push(`B${i}`);
					}
				});

				//Check the axes controls to see if they exceed threshold
				this.activeAxes = '';
				gamepad.axes.forEach((axis, index) => {
					if (1 - Math.abs(axis) < 0.5) {
						let sign = axis > 0 ? '+' : '-';
						this.activeControls.push(`A${index}${sign}`);
					}
				});

				//Clear all of the actions from the last pass
				this.actions.forEach(a => (a.pressed = false));

				//check if we are setting a control
				if (this.settingAction && this.activeControls.length > 0) {
					this.settingAction.control = this.activeControls[0];
					this.settingAction = null;
					this.showSetAction = false;
					this.saveSettings();
				} else if (this.activeControls.length > 0) {
					//Perform activated actions
					let firedActions = new Array();
					//get a list of fired commands
					this.activeControls.forEach(control => {
						firedActions.push(...this.actions.filter(action => action.control === control));
					});
					firedActions.forEach(a => (a.pressed = true));
					if (this.debug) {
						console.log(firedActions);
					}
					this.fireActions(firedActions);
				}
			}
		},
		fireActions(firedActions) {
			if (!this.enabled) {
				return;
			}

			let moves = firedActions.filter(act => act.type === commandType.move);
			if (moves.length > 0) {
				this.generateGCodeMoveCommand(moves);
				return;
			}

			let gcode = firedActions.filter(act => act.type === commandType.gcode || act.type === commandType.custom);
			if (gcode.length > 0) {
				//for now we'll only allow one gcode command to be fired;
				this.generateGCodeCommand(gcode[0]);
				return;
			}

			let plugins = firedActions.filter(act => act.type === commandType.plugin);
			if (plugins.length > 0) {
				this.performPluginAction(plugins[0]); //only do the first command
				return;
			}
		},
		addCustomAction(action, command) {
			this.actions.push(this.buildAction(action, commandType.custom, command));
			this.saveSettings();
			this.newEntry.action = '';
			this.newEntry.command = '';
			this.addNewItem = false;
		},
		removeCustomAction(index) {
			this.actions.splice(index, 1);
			this.saveSettings();
		},
	},
};
</script>

<style>
.action-control {
	background-color: transparent;
	-webkit-transition-duration: 0.3s;
	-moz-transition-duration: 0.3s;
	-o-transition-duration: 0.3s;
	transition-duration: 0.3s;
}

.action-pressed {
	background-color: blue;
}

.cell-right {
	text-align: right;
}
</style>