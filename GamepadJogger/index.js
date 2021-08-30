'use strict'
import { registerRoute } from '../../routes';
import Jogger from './Jogger.vue';

registerRoute(Jogger, {
  Settings: {
    Jogger: {
      icon: 'mdi-gamepad-variant',
      caption: 'Jogger',
      path: '/Jogger',
    },
  },
});
