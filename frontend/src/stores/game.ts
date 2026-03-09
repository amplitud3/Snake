import { writable } from 'svelte/store';
export const score = writable(0);
export const highScore = writable(typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('snake_highscore') || '0') : 0);
export const level = writable(1);
export const playerName = writable(typeof localStorage !== 'undefined' ? localStorage.getItem('snake_name') || '' : '');
export const settings = writable({ difficulty: 'normal', soundEnabled: true });
highScore.subscribe(v => { if (typeof localStorage !== 'undefined') localStorage.setItem('snake_highscore', v.toString()); });
playerName.subscribe(v => { if (typeof localStorage !== 'undefined') localStorage.setItem('snake_name', v); });
