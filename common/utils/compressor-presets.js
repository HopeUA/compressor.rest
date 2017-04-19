export default function getPreset(name) {
    /**
     * 16/9->Stream, 4/3->Stream
     */
    if (name === '16/9->Stream' || name === '4/3->Stream') {
        const videoFilters = [];
        const audioFilters = ['volume=-1dB'];

        switch (this.data.preset) {
            case '16/9->Stream':
                audioFilters.push('adelay=120|120');
                break;
            case '4/3->Stream':
                videoFilters.push('yadif=0:-1:0');
                videoFilters.push('scale=896:672');
                videoFilters.push('crop=896:576');
                videoFilters.push('pad=1024:576:64:0');
                break;
        }
        videoFilters.push('scale=720x576');
        videoFilters.push('setdar=16/9');

        return [
            '-codec:v libx264',
            '-b:v 3M',
            '-r:v 25',
            '-filter:v "' + videoFilters.join(',') + '"',
            '-pix_fmt:v yuv420p',
            '-profile:v baseline',
            '-level 3.0',
            '-preset medium',
            '-movflags +faststart',
            '-codec:a aac',
            '-b:a 256k',
            '-filter:a "' + audioFilters.join(',') + '"',
            '-ar 48000',
            '-threads 24'
        ];
    }

    if (name === 'preview') {
        const videoFilters = ['scale=640:-1'];

        return [
            '-codec:v libx264',
            '-b:v 512K',
            '-filter:v "' + videoFilters.join(',') + '"',
            '-pix_fmt:v yuv420p',
            '-profile:v baseline',
            '-level 3.0',
            '-preset fast',
            '-movflags +faststart',
            '-codec:a aac',
            '-b:a 128k',
            '-ar 48000',
            '-threads 24'
        ];
    }
}
