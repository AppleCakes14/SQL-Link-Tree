document.addEventListener("DOMContentLoaded", function () {

    const text_lang = {
        'rednote_en': "RedNote",
        'rednote_cn': "小红书",

        'fb_en': "Facebook",
        'fb_cn': "脸书",

        'insta_en': "Instagram",
        'insta_cn': "Instagram",

        'others_en': "Share to Facebook",
        'others_cn': "分享给你的朋友",

        'others_insta_en': "Share to Instagram",
        'others_insta_cn': "分享给你的朋友",

        'others_xhs_en': "Share to RedNote",
        'others_xhs_cn': "分享至小红书",

        'lang_desc_en': "切换语言至...",
        'lang_desc_cn': "Change language to...",

        'lang_en': "中文",
        'lang_cn': "English",

        'cta_en': 'Share now!',
        'cta_cn': '马上分享吧!',
    }
    let isEnglish = true;

    function load_lang() {
        var currentLang = (isEnglish) ? "_en" : "_cn";
        //const media_list = ['tiktok', 'rednote', 'google', 'fb', 'insta', 'others', 'store', 'others_fixed'];
        // const media_list = ['rednote', 'fb', 'insta', 'others', 'others_insta'];
        const media_list = ['rednote', 'fb', 'insta'];
        media_list.forEach(media => {
            document.getElementById(media).querySelector('h3').textContent = text_lang[media + currentLang];
        });
        document.querySelector('.footer').querySelector('.prompt').textContent = text_lang['lang_desc' + currentLang];
        document.getElementById('lang').querySelector('h3').textContent = text_lang['lang' + currentLang];
        document.querySelector('.footer').querySelector('.cta').textContent = text_lang['cta' + currentLang];
    };

    window.onload = (event) => {
        load_lang();
    };

    document.getElementById('lang').querySelector('img').addEventListener('click', function (e) {
        isEnglish = !isEnglish;
        load_lang();
    });

    const links = {
        'fb': 'https://www.facebook.com/SQLEstream/',
        'insta': 'https://www.instagram.com/sqlestream/?hl=ms',
        'google': 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
    };
    //Loading Screen Stuff-------------------------------------------
    function hideLoadingScreen() {
        const loader = document.getElementById("loading-screen");
        const main = document.getElementById("main-content");

        loader.style.display = "none";
        main.style.display = "block";
    }
    //----------------------------------------------------------------

    //Download image from url thru CORS proxy
    async function fetchImageAsFile(url, fileName) {
        try {
            const proxyUrl = "https://corsproxy.io/?url="; // Free CORS proxy
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            //const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], fileName, { type: blob.type });
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    }

    //Download video from url thru CORS proxy
    async function fetchVideoAsFile(url, fileName) {
        try {
            // console.log("Attempting to fetch video directly:", url);

            // For GitHub raw content, we can often access it directly from GitHub Pages
            if (url.includes('githubusercontent.com')) {
                try {
                    // Try direct fetch first - this should work from GitHub Pages to githubusercontent
                    const response = await fetch(url, {
                        headers: {
                            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
                        },
                        cache: 'no-store'  // Prevent caching issues
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        if (blob.size > 1000) {
                            console.log(`Successfully fetched video directly: ${fileName}, Size: ${blob.size} bytes, original type: ${blob.type}`);
                            // Always use video/mp4 type regardless of what the server returns
                            return new File([blob], fileName, { type: "video/mp4" });
                        } else {
                            throw new Error("Video file too small, likely invalid");
                        }
                    } else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                } catch (directError) {
                    console.warn("Direct GitHub fetch failed:", directError);
                    // Fall through to the fallback
                }
            }

            // If we're here, the direct fetch failed
            // Try an alternative approach with simpler URL
            try {
                const simplifiedUrl = url.split('?')[0]; // Remove query parameters
                console.log("Trying simplified URL:", simplifiedUrl);

                const response = await fetch(simplifiedUrl, {
                    headers: { 'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8' },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const blob = await response.blob();
                    if (blob.size > 1000) {
                        console.log(`Successfully fetched video with simplified URL: ${fileName}, Size: ${blob.size} bytes, original type: ${blob.type}`);
                        // Always use video/mp4 type regardless of what the server returns
                        return new File([blob], fileName, { type: "video/mp4" });
                    }
                }
            } catch (simplifiedError) {
                console.warn("Simplified URL fetch failed:", simplifiedError);
            }

            // Last resort: Use the embedded placeholder video
            throw new Error("All direct fetch attempts failed");

        } catch (error) {
            console.error("Error fetching video:", error);

            // Return a minimal placeholder video as fallback
            console.log("Using placeholder video as fallback");
            // Small valid MP4 video placeholder
            const placeholderVideoBase64 = "AAAAHGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWlzbwAAAAhmcmVlAAAAG21kYXQAAAATABVLBgEG79Px5AAAAAAAAAAAAAAA";
            const binaryString = atob(placeholderVideoBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // Ensure placeholder is also video/mp4 type
            return new File([bytes], fileName, { type: "video/mp4" });
        }
    }

    var imageUrls;
    const imageAmt = 3;
    var savedImageFiles = [];

    var videoUrls;
    const videoAmt = 1;
    var savedVideoFiles = [];

    var combinedMediaFiles = [];
    var imagesLoaded = false;
    var videosLoaded = false;

    var savedImageFilesWA = [];
    var savedVideoFilesWA = [];
    var combinedMediaFilesWA = [];

    // Improved function to handle image loading with proper Promise resolution
    async function loadRandomImages() {
        try {
            if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
                console.warn("No image URLs available yet, delaying image loading");
                return [];
            }

            // Shuffle and select
            const shuffledUrls = [...imageUrls].sort(() => 0.5 - Math.random());
            const selectedUrls = shuffledUrls.slice(0, imageAmt);
            console.log("Selected image URLs:", selectedUrls);

            // Fetch and convert
            const filePromises = selectedUrls.map((url, index) =>
                fetchImageAsFile(url, `image${index + 1}.jpg`)
            );
            const files = (await Promise.all(filePromises)).filter(Boolean);

            // Save to array
            savedImageFiles = files;
            console.log("Images loaded successfully:", files.length);

            imagesLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return files;
        } catch (error) {
            console.error("Error in loadRandomImages:", error);
            imagesLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return [];
        }
    }

    // Improved function to handle video loading with proper Promise resolution
    async function loadRandomVideos() {
        try {
            if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
                console.warn("No video URLs available yet, delaying video loading");
                return [];
            }

            // Shuffle and randomly select one video URL
            const randomIndex = Math.floor(Math.random() * videoUrls.length);
            const videoUrl = videoUrls[randomIndex];
            console.log("Selected video URL:", videoUrl);

            // Fetch and convert
            const videoFile = await fetchVideoAsFile(videoUrl, "video1.mp4");
            // Save to array (only if the fetch was successful)
            if (videoFile) {
                savedVideoFiles = [videoFile];
                console.log("Video loaded successfully");
            } else {
                console.error("Failed to load video");
                savedVideoFiles = [];
            }

            videosLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return savedVideoFiles;
        } catch (error) {
            console.error("Error in loadRandomVideos:", error);
            videosLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return [];
        }
    }

    // Update combined media when both images and videos are loaded
    function updateCombinedMedia() {
        if (imagesLoaded && videosLoaded) {
            try {
                // Reset combined media files
                combinedMediaFiles = [];

                // Add videos first if they exist
                if (savedVideoFiles && savedVideoFiles.length > 0) {
                    const validVideos = savedVideoFiles.filter(file => file && file instanceof File && file.size > 0);
                    if (validVideos.length > 0) {
                        console.log("Adding videos to combined media:", validVideos.length);
                        combinedMediaFiles.push(...validVideos);
                    }
                }

                // Add images if they exist
                if (savedImageFiles && savedImageFiles.length > 0) {
                    const validImages = savedImageFiles.filter(file => file && file instanceof File && file.size > 0);
                    if (validImages.length > 0) {
                        console.log("Adding images to combined media:", validImages.length);
                        combinedMediaFiles.push(...validImages);
                    }
                }

                console.log("Combined media files updated:", combinedMediaFiles.length, "files");
                console.log("Combined media files:", combinedMediaFiles);

                // Enable sharing cards if we have media files
                if (combinedMediaFiles.length > 0) {
                    const shareCards = document.querySelectorAll('#others, #others_insta');
                    shareCards.forEach(card => {
                        card.classList.remove('disabled-card');
                        // Update the text to the appropriate sharing text based on language
                        const cardId = card.id;
                        const currentLang = (isEnglish) ? "_en" : "_cn";
                        card.querySelector('h3').textContent = text_lang[cardId + currentLang];
                    });
                }
            } catch (error) {
                console.error("Error combining media files:", error);
                combinedMediaFiles = [];
            }
        }
    }

    // Preload ImageURLs using GitHub API method (similar to video preloading)
    fetch("https://api.github.com/repos/Monaruku/Monaruku.github.io/contents/Image/Event%20Photos")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Filter for image files (jpg, jpeg, png)
            const imageFiles = data.filter(file => 
                file.name.toLowerCase().endsWith('.jpg') || 
                file.name.toLowerCase().endsWith('.jpeg') || 
                file.name.toLowerCase().endsWith('.png')
            );
            
            if (imageFiles.length === 0) {
                throw new Error("No image files found in the repository folder");
            }
            
            // Get download URLs for all images
            imageUrls = imageFiles.map(file => file.download_url);
            console.log("Image URLs loaded:", imageUrls.length);
            return loadRandomImages();
        })
        .catch(error => {
            console.error("Error fetching image links from GitHub:", error);
            imageUrls = [];
            imagesLoaded = true;
            updateCombinedMedia();
        });

    //Preload VideoURLs from text file with better error handling
    fetch("https://api.github.com/repos/AppleCakes14/SQL-Link-Tree/contents/Videos")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Filter for .mp4 files
            const mp4Files = data.filter(file => file.name.toLowerCase().endsWith('.mp4'));
            
            if (mp4Files.length === 0) {
                throw new Error("No MP4 files found in the repository folder");
            }
            
            // Randomly select one MP4 file
            const randomIndex = Math.floor(Math.random() * mp4Files.length);
            const selectedFile = mp4Files[randomIndex];
            
            // Set videoUrls to just contain the one selected URL
            videoUrls = [selectedFile.download_url];
            console.log("Random video URL selected:", videoUrls[0]);
            return loadRandomVideos();
        })
        .catch(error => {
            console.error("Error fetching video links from GitHub:", error);
            videoUrls = [];
            videosLoaded = true;
            updateCombinedMedia();
        });

    //The actual share Image function, basically retrieve saved images and send them to share
    async function shareImages(mode) {
        if (mode == 1)            //Normal Mode
        {
            const dummyJpgDataUrl =
                'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTERUTEhMWFhUXFxgYFxcYGBgYGBcXGBgXFxgYGBgYHSggGBolHRgXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGy0lICUvLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAJABWgMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAFAQIDBAYAB//EAD0QAAIBAgMFBQYFAwMFAAAAAAABAgMRBBIhMQVBUWFxgZGh8BMikQcjQlJicoKx0eHwM2LhFjNTc5Ik/8QAGgEAAgMBAQAAAAAAAAAAAAAAAAQCAwUBBv/EACIRAQEAAgEEAgMAAAAAAAAAAAABAhEDITESQVFhEzKhcf/aAAwDAQACEAMQAAAB4ltRFOu7XGLXHaHzAWxBaAa2bUkGHnEfqNPAm6AW8YOYPvN+HezRBSfWmXgACQpbnJj9TlnxWc9qAiVZKucYiPMlnLHYU3mgWEsS05klgz7kQ4iCDKCyxDNi/PSYhtqS92REnAhHnDdtNv0IMinV7hMKYW9EsGyglLqAlPGdlQ1WxRJrKM2tHIt1Si0KQUJYIQ3K7ZAtGmPGWNv8kIG4eI5XiGZJ6m9hvKeZro0WaQ7lFRUXZBVuQ4v/2Q==';

            function dataUrlToFile(dataUrl, filename) {
                const arr = dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                const n = bstr.length;
                const u8arr = new Uint8Array(n);
                for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
                return new File([u8arr], filename, { type: mime });
            }

            // Usage
            const dummy = dataUrlToFile(dummyJpgDataUrl, 'dummy.jpg');

            //const dummy = new File([""], "empty.txt", { type: "text/plain" });
            try {
                await navigator.share({
                    text: getLines(2),
                    files: [savedImageFilesWA, dummy]
                    //url: "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg"
                });
                //console.log("Shared successfully!");
            } catch (error) {
                console.error("Sharing failed", error);
            }
        }
        else if (mode == 2) {
            const files = combinedMediaFiles; // Assign the images to be shared
            if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
                try {
                    await navigator.share({
                        text: getLinesXHS(2),
                        files
                    });
                    //console.log("Shared successfully!");
                } catch (error) {
                    //console.error("Sharing failed", error);
                }
            } else {
                //console.log("Your browser does not support sharing multiple files or image fetch failed.");
            }
        }

        else if (mode == 3) {
            try {
                await navigator.share({
                    text: getLines(2),
                    files: [savedImageFilesWA]
                    //url: "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg"
                });
                //console.log("Shared successfully!");
            } catch (error) {
                console.error("Sharing failed", error);
            }
        }

    }


    /*------------- This section is currently under testing, so it looks real stupid -------------*/
    let imageUrlsEN = [];
    let imageUrlsCN = [];

    // Fetch image URLs for both languages in a single request
    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/ImageLinksFlagged.txt")
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            let currentSection = "";

            for (let line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.startsWith("#")) {
                    currentSection = trimmed;
                    continue;
                }
                
                if (trimmed === "") continue;
                
                // Add URLs to appropriate arrays based on current section
                if (currentSection === "#English") {
                    imageUrlsEN.push(trimmed);
                } else if (currentSection === "#Chinese") {
                    imageUrlsCN.push(trimmed);
                }
            }
        })
        .catch(error => console.error("Error fetching image links:", error));

    var lineCN;

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineChinese.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const linesCN = text.split('@').map(part => part.trim());
            lineCN = linesCN;
            //console.log(lineCN);
        })
        .catch(error => console.error("Error fetching the file:", error));

    //var lineXHS;
    var lineCNXHS;

    fetch("https://raw.githubusercontent.com/AppleCakes14/SQL-Link-Tree/main/LineChinese_XHS.txt")
        //https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineChinese_XHS.txt
        .then(response => response.text())
        .then(text => {
            // Split the text using '@' as the delimiter
            const lineCNXHS1 = text.split('\n').map(part => part.trim());
            lineCNXHS = lineCNXHS1;
            //console.log(lineCNXHS);
        })
        .catch(error => console.error("Error fetching the file:", error));


    /* <-------------------> */

    //Click Analytics
    function logClick(mode) {
        const formUrl = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdZy1xdTPov0ANI9atEkf9Vp9e36V1lvOKFspzHqUYmxXQNvQ/formResponse";
        const formData = new FormData();

        // Replace this with the name attribute of your form field
        if (mode == 1) {                                         //Facebook
            formData.append("entry.2141122930", "Facebook");
        }
        else if (mode == 2) {                                   //Rednote
            formData.append("entry.2141122930", "Rednote");
        }
        else if (mode == 3) {                                   //Instagram
            formData.append("entry.2141122930", "Instagram");
        }
        else if (mode == 4) {                                   //Share
            formData.append("entry.2141122930", "Share");
        }

        fetch(formUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });
    }

    //Get Random Line from preloaded contents
    function getLines(mode) {
        const randomLines = [];
        const usedIndexes = new Set();

        while (randomLines.length < 1) {
            if (isEnglish) {
                const randomIndex = Math.floor(Math.random() * lineCN.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCN[randomIndex]);      //Only received chinese text
                }
            }
            else {
                const randomIndex = Math.floor(Math.random() * lineCN.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCN[randomIndex]);
                }
            }

        }

        //document.getElementById('output').textContent = "Randomly Selected Lines:\n" + randomLines.join('\n');
        //Basically now the two mode is just to prompt alert or not
        if (mode == 1) {
            const textTC = randomLines.toString();
            //console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
        }
        else if (mode == 2) {
            const textTC = randomLines.toString();
            //console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            return textTC;
        }

    }

    //Get Random Line from preloaded contents for XHS Special
    function getLinesXHS(mode) {
        const randomLines = [];
        const usedIndexes = new Set();
        const hashtags = "#einvoice #einvoiceseminar #myinvois #lhdn #电子发票 #nationwideseminar " +
                        "#SQLAccounting #sqlestream #Einvoice2025 #EInvoiceReady #einvoicemalaysia " +
                        "#SQL #sqlseminar #einvois";

        while (randomLines.length < 1) {
            if (isEnglish) {
                const randomIndex = Math.floor(Math.random() * lineCNXHS.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    mixedLine = lineCNXHS[randomIndex] + "\n\n" + hashtags; // Append hashtags to the line
                    randomLines.push(mixedLine);      //Only received chinese text
                }
            }
            else {
                const randomIndex = Math.floor(Math.random() * lineCNXHS.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    mixedLine = lineCNXHS[randomIndex] + "\n\n" + hashtags; // Append hashtags to the line
                    randomLines.push(mixedLine);
                }
            }

        }

        const textTC = randomLines.toString();
        if (mode == 1) {
            try {
                window.focus(); // Try to focus the window
                navigator.clipboard.writeText(textTC)
                    .then(() => {
                        alert(isEnglish ? "Text copied! Paste it onto XHS." : "复制成功！请粘贴在小红书。");
                    })
                    .catch(err => {
                        console.error("Clipboard write failed:", err);
                        // Fallback - show text to manually copy
                        prompt(isEnglish ? "Please copy this text manually:" : "请手动复制此文本:", textTC);
                    });
            } catch (error) {
                console.error("Clipboard error:", error);
                // Fallback - show text to manually copy
                prompt(isEnglish ? "Please copy this text manually:" : "请手动复制此文本:", textTC);
            }
        } else if (mode == 2) {
            // Try to copy the text to clipboard
            try {
                window.focus(); // Try to focus the window to help with clipboard permissions
                navigator.clipboard.writeText(textTC)
                    .then(() => {
                        console.log("Text copied to clipboard successfully");
                    })
                    .catch(err => {
                        console.error("Failed to copy text: ", err);
                    });
            } catch (error) {
                console.error("Clipboard operation failed:", error);
            }
            return textTC; // Just return the text without clipboard operations
        }
    }

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', async function () {
            const platform = this.id;
            
            // Handle RedNote
            if (platform === 'rednote') {
                logClick(2);
                
                // Check if user is on a mobile device
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobile) {
                    // Use deeplink for mobile devices
                    window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                    
                    // Fallback to web URL after a delay in case the app isn't installed
                    setTimeout(() => {
                        window.open('https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605', '_blank');
                    }, 1500);
                } else {
                    window.open('https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605', '_blank');
                }
            }
            // Handle sharing options
            else if (platform === 'others' || platform === 'others_insta') {
                if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                    logClick(4);
                    shareImages(2);
                } else {
                    alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                }
            }
            // Handle XHS sharing
            else if (platform === 'others_xhs') {
                try {
                    const shareText = getLinesXHS(2);
                    
                    // Try sharing with image if available
                    if (savedImageFiles?.length > 0) {
                        const validImage = savedImageFiles.find(file => file?.size > 0);
                        if (validImage && navigator.canShare && navigator.canShare({ files: [validImage] })) {
                            await navigator.share({ text: shareText, files: [validImage] });
                            return;
                        }
                    }
                    
                    // Fallback to text-only sharing
                    await navigator.share({ text: shareText });
                } catch (error) {
                    console.error("XHS sharing failed:", error);
                    try {
                        window.focus();
                        if (document.hasFocus()) {
                            await navigator.clipboard.writeText(getLinesXHS(2));
                        } else {
                            alert("Please focus the window and try again.");
                        }
                    } catch (clipboardError) {
                        prompt("Please copy this text manually:", getLinesXHS(2));
                    }
                }
            }
            // Handle social links
            else if (platform === 'fb' || platform === 'insta') {
                window.open(links[platform], '_blank');
                logClick(platform === 'fb' ? 1 : 3);
            }
        });
    });
    // Prevent zoom on double tap for iOS
    document.addEventListener('touchend', function (event) {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;

        if (this.lastTouchEndTime && now - this.lastTouchEndTime < DOUBLE_TAP_THRESHOLD) {
            event.preventDefault();
        }

        this.lastTouchEndTime = now;
    }, { passive: false });
});