import { Track } from '../obj/Track'

let track: Track;

/*
 This may take several seconds to load depending on bandwidth.
 Once completed it will provide several global arrays in track.buffers...
 */

function loadTrack(url) {
    // Fetch Audio Track via AJAX with URL
    let request = new XMLHttpRequest();

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function(ajaxResponseBuffer) {
        // Create and Save Original Buffer Audio Context in 'track.buffers.original'
        var audioCtx = new AudioContext();

        track.frames = ajaxResponseBuffer['total'];

        // Arguments: Channels, Length, Sample Rate
        track.context = new OfflineAudioContext(1, track.frames, 44100);
        let source = track.context.createBufferSource();
        var audioData = request.response;
        audioCtx.decodeAudioData(audioData, function(buffer) {
            console.log(track);
            track.buffer = buffer;

            track.data_original = numberizeArray(track.buffer.getChannelData(0));

            generateFilters();
        }, decodeFail);
    };
    request.send();
}

function decodeFail(e) {
    alert('decodeFail');
    console.log('decodeFail: ', e)
}

function generateFilters() {
    var source = track.context.createBufferSource();
    source.buffer = track.buffer;

    // Create a Low Pass Filter to Isolate Low End Beat
    var filter = track.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 140;
    source.connect(filter);
    filter.connect(track.context.destination);

    // Schedule start at time 0
    source.start(0);

    // Render this low pass filter data to new Audio Context and Save in 'lowPassAudioBuffer'
    track.context.startRendering().then((lowPassAudioBuffer) =>{
// LOW PASS FILTER
        var audioCtx = new AudioContext();
        var song = audioCtx.createBufferSource();
        song.buffer = lowPassAudioBuffer;
        song.connect(audioCtx.destination);


        track.data_lowpass = normalizeArrayP(song.buffer.getChannelData(0));
        console.log("Low Pass Buffer Rendered!");
    }).then(() => {

    });
}

function numberizeArray(data) {

    var newArray = [];

    for (var i = 0; i < data.length; i++) {
        newArray.push(Math.round((data[i + 1] - data[i]) * 1000));
    }

    return newArray;
}

function normalizeArrayP(data) {

    var newArray = [];

    for (var i = 0; i < data.length; i++) {
        newArray.push(Math.abs(Math.round((data[i + 1] - data[i]) * 1000)));
    }

    return newArray;
}

function downSample(data, samples) {

    var newArray = [];
    var modulus_coefficient = Math.round(data.length / samples);

    for (var i = 0; i < data.length; i++) {
        if (i % modulus_coefficient == 0) {
            newArray.push(data[i]);
        }
    }
    return newArray;
}

export function TrackParser(url: String = "demo.mp3"): Track {
    track = new Track();
    track.url = url;

    loadTrack('/assets/'+track.url);
    return track;
}