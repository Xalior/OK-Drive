/// <reference path="../node_modules/babylonjs/babylon.d.ts" />
/// <reference path="../node_modules/@types/es6-promise/index.d.ts" />

import { Game } from './Game';
window.addEventListener('DOMContentLoaded', () => {
    // your code here
    console.log("INDEX.TS");
    window['game'] = new Game();
    console.log(window['game']);
});
