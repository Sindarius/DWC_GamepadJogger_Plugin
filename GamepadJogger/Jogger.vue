<template>
  <div>
    <div>Gamepad Name : {{gamepadName}}</div>
    <div>Active Controls : {{activeControls}}</div>
    <div>Setting Axis : {{settingAxis}}</div>
    <v-btn @click="resetSettings" color="red">Reset</v-btn>
    <v-simple-table>
        <thead>
            <th>
                <td>Axis</td>
                <td>Set</td>
                <td>Configure</td>
                <td>Value</td>
            </th>
        </thead>
        <tbody>
            <tr v-for="(action,index) in actions" :key="index">
                <td>{{action.axis}}</td>
                <td>{{ isActionSet(action.control) }}</td>
                <td><v-btn @click="setActionDialog(action)">Set Action</v-btn></td>
                <td>{{action}}</td>
            </tr>
            </tbody>
    </v-simple-table>
    <v-dialog v-model="showSetAxis">
        <v-btn @click="showSetAxis = !showSetAxis">Cancel</v-btn>
    </v-dialog>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex';

  export default {
    data: function () {
      return {
        actions: [],
        resetDefaults: false,
        gamepadName: '',
        activeControls: [],
        showSetAxis: false,
        settingAxis: null,
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
        this.settingAxis = action;
        this.showSetAxis = true;
      },
      resetSettings() {
        this.actions = [];
        //lets build a new  action list from the axes
        this.move.axes.forEach((axis) => {
          this.actions.push({ axis: `${axis.letter}p`, control: '' });
          this.actions.push({ axis: `${axis.letter}n`, control: '' });
        });
      },
      loadSettings() {
        //Check for saved settings
        let actionsString = localStorage.getItem('joggerSettings');
        console.log(actionsString);
        if (actionsString) {
          this.actions = JSON.parse(actionsString);
        } else {
          this.resetSettings();
        }
      },
      saveSettings() {
        console.log(JSON.stringify(this.actions));
        localStorage.setItem('joggerSettings', JSON.stringify(this.actions));
      },

      async generateGCodeCommand(controls) {
        if (this.moving) return; //discard any commands while moving
        this.moving = true;
        let moveCommands = '';
        console.log(controls);
        controls.forEach((control) => {
          let axisActions = this.actions.filter((a) => a.control === control); //It's possibe that we may have a button set to 2 axis actions
          axisActions.forEach((axisAction) => {
            var axis = axisAction.axis[0];
            var direction = axisAction.axis[1] === 'p' ? '+' : '-';
            var move = `${direction}${this.stepDistance}`;
            moveCommands += ` ${axis}${move}`;
          });
        });
        var command = `M120\nG91\nG1 ${moveCommands.trim()}\nG90\nM121`;
        if (this.debug) {
          console.log(command);
        }
        await this.sendCode(command);
        this.moving = false;
      },
      checkGamepad() {
        //check if gamepads are connected and update their current button/axis states
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : [];
        if (gamepads.length > 0 && gamepads[0]) {
          this.gamepadName = gamepads[0].id;
          let gamepad = gamepads[0];
          this.activeControls = [];
          gamepad.buttons.forEach((b, i) => {
            if (this.buttonPressed(b)) {
              this.activeControls.push(`b${i}`);
            }
          });
          this.activeAxes = '';
          gamepad.axes.forEach((axis, index) => {
            if (1 - Math.abs(axis) < 0.5) {
              let sign = axis > 0 ? '+' : '-';
              this.activeControls.push(`A${index}${sign}`);
            }
          });

          //check if we are setting a control
          if (this.settingAxis && this.activeControls.length > 0) {
            this.settingAxis.control = this.activeControls[0];
            this.settingAxis = null;
            this.showSetAxis = false;
            this.saveSettings();
          } else if (this.activeControls.length > 0) {
            //if we aren't setting then we are issuing a command
            this.generateGCodeCommand(this.activeControls);
          }
        }
      },
    },
  };
</script>

<style>
</style>