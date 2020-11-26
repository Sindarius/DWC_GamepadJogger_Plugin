<template>
  <div>
    <div>Gamepad Name : {{gamepadName}}</div>
    <v-switch v-model="enabled" label="Enable"></v-switch>
    <v-btn @click="resetSettings" color="red">Reset</v-btn>
    <v-simple-table>
      <thead>
        <tr>
          <th>Action</th>
          <th>Set</th>
          <th>Configure</th>
          <th>Controller Button Id</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(action,index) in actions" :key="index" class="action-control" :class="{'action-pressed' : action.pressed}">
          <td>{{action.action}}</td>
          <td>{{ isActionSet(action.control) }}</td>
          <td><v-btn class="mr-1" @click="setActionDialog(action)">Set Action</v-btn><v-btn @click="clearAction(action)">Clear Action</v-btn></td>
          <td>{{action.control}}</td>
        </tr>
      </tbody>
    </v-simple-table>
    <v-dialog v-model="showSetAction">
      <v-card>
        <v-card-title>Set Action</v-card-title>
        <v-card-text>Press a button or move an axis to set value</v-card-text>
      </v-card>
      <v-btn @click="showSetAction = !showSetAction">Cancel</v-btn>
    </v-dialog>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex';

  let commandType = {
    plugin: 0,
    gcode: 1,
    move: 2,
  };

  export default {
    data: function () {
      return {
        actions: [],
        enabled: false,
        resetDefaults: false,
        gamepadName: '',
        activeControls: [],
        showSetAction: false,
        settingAction: null,
        moving: false,
        debug: false,
        stepDistance: 5,
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
        if (this.debug) {
          console.log(gcode.command);
        } else {
          await this.sendCode(gcode.command);
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