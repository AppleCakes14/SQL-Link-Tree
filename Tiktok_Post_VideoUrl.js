// TikTok Video Publishing in JavaScript
class Fields {
    // Static field constants
    static POST_INFO = 'post_info';
    static PRIVACY_LEVEL = 'privacy_level';
    static TITLE = 'title';
    static VIDEO_COVER_TIMESTAMP_MS = 'video_cover_timestamp_ms';
    static SOURCE_INFO = 'source_info';
    static SOURCE = 'source';
    static VIDEO_URL = 'video_url';
    static DISABLE_DUET = 'disable_duet';
    static DISABLE_STITCH = 'disable_stitch';
    static DISABLE_COMMENT = 'disable_comment';
    static BRAND_ORGANIC = 'brand_organic';
    static BRAND_CONTENT = 'brand_content';
}

class Post {
    constructor(config) {
        this.accessToken = config.access_token;
        // this.apiBaseUrl = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
        this.statusUrl = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
        this.postVideoUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
        this.creatorInfo = null;
    }

    async getCreatorInfo() {
        try {
            //not done
            // const corsProxy = 'https://corsproxy.io/?url=';
            // const response = await fetch(corsProxy + encodeURIComponent(this.creatorInfoUrl), {
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.creatorInfoUrl, {
            method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                throw new Error(`HTTP error!(${response.status}): ${errorText}`);
            }

            this.creatorInfo = await response.json();
            return this.creatorInfo;
        } catch (error) {
            if (error.name === 'TypeError') {
                throw new Error(`Network error: ${error.message} (Check CORS proxy availability)`);
            }
            throw error;
        }
    }

    async publish(params) {
        try {
            // const corsProxy = 'https://corsproxy.io/?url=';
            // const response = await fetch(corsProxy + encodeURIComponent(this.apiBaseUrl), {
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.postVideoUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                console.error(`HTTP error!(${response.status}): ${errorText}`);
                // Return error object instead of throwing
                return {
                    success: false,
                    error: `HTTP error!(${response.status})`
                };
            }

            return await response.json();
        } catch (error) {
            // Add API context to the error
            if (error.name === 'TypeError') {
                throw new Error(`Network error: ${error.message} (Check CORS proxy availability)`);
            }
            throw error;
        }
    }
}

// Usage example
async function publishVideoToTikTok(privacyLevel, videoTitle, disableComment, disableDuet, disableStitch) {
    // Instantiation config params
    const config = {
        access_token: localStorage.getItem('tiktokAccessToken'),
    };

    // Instantiate a new post
    const post = new Post(config);

    const videoElement = document.getElementById('videoPreview');
    const sourceElement = videoElement.querySelector('source');
    const videoUrl = sourceElement.src;

    const params = {
        [Fields.POST_INFO]: {
            [Fields.TITLE]: videoTitle,
            [Fields.PRIVACY_LEVEL]: privacyLevel,
            [Fields.DISABLE_DUET]: disableDuet,
            [Fields.DISABLE_COMMENT]: disableComment,
            [Fields.DISABLE_STITCH]: disableStitch,
            [Fields.VIDEO_COVER_TIMESTAMP_MS]: 1000 // spot in video to use as cover photo
        },
        [Fields.SOURCE_INFO]: {
            [Fields.SOURCE]: 'PULL_FROM_URL',
            [Fields.VIDEO_URL]: videoUrl // video URL that is publicly accessible
        }
    };

    console.log('Param for publish : ', params);
    return await post.publish(params);
}

// Call the function when needed
// publishVideoToTikTok().then(result => console.log(result));