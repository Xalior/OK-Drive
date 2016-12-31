import { TrackParser } from './lib/TrackParser';
import { Track } from "./obj/Track";

export class Game {
    track: Track;

    constructor() {
        this.track = TrackParser('demo_06.mp3');

        console.log(this.track);
    }
}