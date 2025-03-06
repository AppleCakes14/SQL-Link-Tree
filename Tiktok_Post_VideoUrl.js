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
        this.apiBaseUrl = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
        this.statusUrl = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
        this.creatorInfo = null;
    }

    async getCreatorInfo() {
        try {
            //not done
            const corsProxy = 'https://corsproxy.io/?url=';
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
            const corsProxy = 'https://corsproxy.io/?';
            const response = await fetch(corsProxy + this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                throw new Error(`HTTP error!(${response.status}): ${errorText}`);
                // throw new Error(`HTTP error! Status: ${response.status}`);
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
async function publishVideoToTikTok() {
    // Instantiation config params
    const config = {
        access_token: localStorage.getItem('tiktokAccessToken'),
    };

    // Instantiate a new post
    const post = new Post(config);

    const params = {
        [Fields.POST_INFO]: JSON.stringify({
            [Fields.PRIVACY_LEVEL]: 'SELF_ONLY',
            [Fields.TITLE]: 'SQL BOLEH!!!',
            [Fields.VIDEO_COVER_TIMESTAMP_MS]: 1000 // spot in video to use as cover photo
        }),
        [Fields.SOURCE_INFO]: JSON.stringify({
            [Fields.SOURCE]: 'PULL_FROM_URL',
            [Fields.VIDEO_URL]: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // video URL that is publicly accessible
            // e.g. http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
        })
    };

    return await post.publish(params);
}

// Call the function when needed
// publishVideoToTikTok().then(result => console.log(result));