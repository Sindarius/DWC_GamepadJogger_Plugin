<template>
  <div>
    <div>Gamepad Name : {{gamepadName}}</div>
    <v-switch v-model="enabled" label="Enable"></v-switch>
    <v-btn @click="resetSettings" color="red">Reset</v-btn><v-btn @click="addNewItem = true">New Action</v-btn><br />
    Steps
    <v-btn-toggle mandatory exclusive v-model="stepDistance">
      <v-btn v-for="step in stepAmounts" :key="step" @click="stepDistance = step" :value="step">{{step}}</v-btn>
    </v-btn-toggle>
    <v-simple-table>
      <thead>
        <tr>
          <th>Action</th>
          <th>Set</th>
          <th>Configure</th>
          <th>Custom Command</th>
          <th>Controller Button Id</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(action,index) in actions" :key="index" class="action-control" :class="{'action-pressed' : action.pressed}">
          <td>{{action.action}}</td>
          <td>{{ isActionSet(action.control) }}</td>
          <td>
            <v-btn class="mr-1" @click="setActionDialog(action)" color="info">Set</v-btn>
            <v-btn @click="clearAction(action)" color="warning" class="mr-1">Clear</v-btn>
            <v-btn v-show="action.type === 3" @click="removeCustomAction(index)" color="error">Delete</v-btn>
          </td>
          <td>
            <span v-show="action.type === 3">{{action.command}}</span>
          </td>
          <td>{{action.control}}</td>
        </tr>
      </tbody>
    </v-simple-table>
    <v-dialog v-model="showSetAction">
      <v-card>
        <v-card-title>Set Action</v-card-title>
        <v-card-text>Press a button or move an axis to set value</v-card-text>
        <v-card-actions> <v-btn @click="showSetAction = !showSetAction">Cancel</v-btn> </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="addNewItem">
      <v-card>
        <v-card-title>Add New Action</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field v-model="newEntry.action" label="Action Name"></v-text-field>
            <v-text-field v-model="newEntry.command" label="Command"></v-text-field>
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
    plugin: 0,
    gcode: 1,
    move: 2,
    custom: 3,
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
        debug: false,
        stepAmounts: [0.1, 1, 5, 10, 25, 50, 100],
        stepDistance: 5,
        addNewItem: false,
        newEntry: {
          action: '',
          command: '',
        },
      };
    },
    computed: {
      ...mapState('machine/model', ['move']),
    },
    mounted() {
      this.loadSettings();
      setInterval(this.checkGamepad, 100);
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
        };
      },
      isActionSet(control) {
        return control !== '';
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
        this.move.axes.forEach((axis) => {
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
        this.saveSettings();
      },

      clearAction(action) {
        action.control = '';
      },
      loadSettings() {
        //Check for saved settings
        let actionsString = localStorage.getItem('joggerSettings');
        if (actionsString) {
          this.actions = JSON.parse(actionsString);
          console.log(this.actions);
        } else {
          this.resetSettings();
        }
      },
      saveSettings() {
        localStorage.setItem('joggerSettings', JSON.stringify(this.actions));
      },
      groupBy(array, key) {
        const result = {};
        array.forEach((item) => {
          if (!result[item[key]]) {
            result[item[key]] = [];
          }
          result[item[key]].push(item);
        });
        return result;
      },
      async generateGCodeMoveCommand(moves) {
        if (this.moving) return; //discard any commands while moving
        this.moving = true;
        let moveCommands = '';
        moves.forEach((axisAction) => {
          var axis = axisAction.action[0];
          var direction = axisAction.action[1] === '+' ? '' : '-';
          var move = `${direction}${this.stepDistance}`;
          moveCommands += ` ${axis}${move}`;
        });
        var command = `M120\nG91\nG1 ${moveCommands.trim()}\nG90\nM121`;
        if (this.debug) {
          console.log(command);
        } else {
          await this.sendCode(command);
        }
        this.moving = false;
      },
      async generateGCodeCommand(gcode) {
        if (this.moving) {
          return;
        }
        if (this.debug) {
          console.log(gcode.command);
        } else {
          this.moving = true;
          await this.sendCode(gcode.command);
          this.moving = false;
        }
      },
      performPluginAction(action) {
        console.log(action);
      },
      checkGamepad() {
        //check if gamepads are connected and update their current button/axis states
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : [];
        if (gamepads.length > 0 && gamepads[0]) {
          this.gamepadName = gamepads[0].id;

          let gamepad = gamepads[0]; //we'll just work with the first controller that is detected for now.

          this.activeControls = [];

          gamepad.buttons.forEach((b, i) => {
            if (this.buttonPressed(b)) {
              this.activeControls.push(`B${i}`);
            }
          });
          this.activeAxes = '';
          gamepad.axes.forEach((axis, index) => {
            if (1 - Math.abs(axis) < 0.5) {
              let sign = axis > 0 ? '+' : '-';
              this.activeControls.push(`A${index}${sign}`);
            }
          });

          this.actions.forEach((a) => (a.pressed = false));

          //check if we are setting a control
          if (this.settingAction && this.activeControls.length > 0) {
            this.settingAction.control = this.activeControls[0];
            this.settingAction = null;
            this.showSetAction = false;
            this.saveSettings();
          } else if (this.activeControls.length > 0) {
            let firedActions = new Array();
            //get a list of fired commands
            this.activeControls.forEach((control) => {
              firedActions.push(...this.actions.filter((action) => action.control === control));
            });
            firedActions.forEach((a) => (a.pressed = true));

            if (!this.enabled) {
              return;
            }

            let moves = firedActions.filter((act) => act.type === commandType.move);
            if (moves.length > 0) {
              this.generateGCodeMoveCommand(moves);
              return;
            }

            let gcode = firedActions.filter((act) => act.type === commandType.gcode);
            if (gcode.length > 0) {
              //for now we'll only allow one gcode command to be fired;
              this.generateGCodeCommand(gcode[0]);
              return;
            }

            let plugins = firedActions.filter((act) => act.type === commandType.plugin);
            if (plugins.length > 0) {
              this.performPluginAction(plugins[0]); //only do the first command
              return;
            }
          }
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
</style>