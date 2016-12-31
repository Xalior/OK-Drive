
export class Track {
    url: String;
    frames: number;
    context: OfflineAudioContext;
    buffer: AudioBuffer;
    data_original: Array<number>;
    data_lowpass: Array<number>;
    name: String;
    artist: String;

    constructor() {

    }
}