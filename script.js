document.addEventListener("DOMContentLoaded", function () {
    // Cache DOM elements to avoid repeated queries
    const langButton = document.getElementById('lang').querySelector('img');
    const langText = document.getElementById('lang').querySelector('h3');
    const footerPrompt = document.querySelector('.footer').querySelector('.prompt');
    const footerCta = document.querySelector('.footer').querySelector('.cta');

    // --- Configuration ---
    const config = {
        imageCount: 3,
        videoCount: 1,
        repoConfig: {
            images: {
                owner: 'Monaruku',
                repo: 'Monaruku.github.io',
                path: 'Image/Event%20Photos',
                extensions: ['.jpg', '.jpeg', '.png']
            },
            videos: {
                owner: 'AppleCakes14',
                repo: 'SQL-Link-Tree',
                path: 'Videos',
                extensions: ['.mp4']
            }
        },
        textSources: {
            general: 'https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineChinese.txt',
            xhs: 'https://raw.githubusercontent.com/AppleCakes14/SQL-Link-Tree/main/LineChinese_XHS.txt'
        },
        socialLinks: {
            fb: 'https://www.facebook.com/SQLEstream/',
            insta: 'https://www.instagram.com/sqlestream/?hl=ms',
            google: 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
        }
    };

    // --- Text Localization ---
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
        'cta_cn': '马上分享吧!'
    };

    // --- State Management ---
    let isEnglish = true;
    let imagesLoaded = false;
    let videosLoaded = false;

    // Media storage
    let imageUrls = [];
    let videoUrls = [];
    let savedImageFiles = [];
    let savedVideoFiles = [];
    let combinedMediaFiles = [];

    // Content storage
    let lineCN = [];
    let lineCNXHS = [];

    // --- Utility Functions ---

    // Update UI language
    function load_lang() {
        const currentLang = (isEnglish) ? "_en" : "_cn";
        const media_list = ['rednote', 'fb', 'insta'];

        media_list.forEach(media => {
            const element = document.getElementById(media);
            if (element) {
                const h3 = element.querySelector('h3');
                if (h3) h3.textContent = text_lang[media + currentLang];
            }
        });

        footerPrompt.textContent = text_lang['lang_desc' + currentLang];
        langText.textContent = text_lang['lang' + currentLang];
        footerCta.textContent = text_lang['cta' + currentLang];

        // Update share cards if they're enabled
        if (combinedMediaFiles.length > 0) {
            const shareCards = document.querySelectorAll('#others, #others_insta');
            shareCards.forEach(card => {
                if (!card.classList.contains('disabled-card')) {
                    const h3 = card.querySelector('h3');
                    if (h3) h3.textContent = text_lang[card.id + currentLang];
                }
            });
        }
    }

    // Hide loading screen
    function hideLoadingScreen() {
        const loader = document.getElementById("loading-screen");
        const main = document.getElementById("main-content");

        if (loader) loader.style.display = "none";
        if (main) main.style.display = "block";
    }

    // Log analytics
    function logClick(mode) {
        const formUrl = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdZy1xdTPov0ANI9atEkf9Vp9e36V1lvOKFspzHqUYmxXQNvQ/formResponse";
        const formData = new FormData();

        const labels = ["Facebook", "Rednote", "Instagram", "Share"];
        if (mode >= 1 && mode <= 4) {
            formData.append("entry.2141122930", labels[mode - 1]);

            fetch(formUrl, {
                method: "POST",
                mode: "no-cors",
                body: formData
            }).catch(err => console.error("Analytics error:", err));
        }
    }

    // --- Media Handling ---

    // Download image from url thru CORS proxy
    async function fetchImageAsFile(url, fileName) {
        try {
            const proxyUrl = "https://corsproxy.io/?url=";
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            const blob = await response.blob();
            return new File([blob], fileName, { type: blob.type });
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    }

    // Download video with multiple fallback strategies
    async function fetchVideoAsFile(url, fileName) {
        try {
            // Try direct fetch first
            if (url.includes('githubusercontent.com')) {
                try {
                    const response = await fetch(url, {
                        headers: {
                            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
                        },
                        cache: 'no-store'
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        if (blob.size > 1000) {
                            return new File([blob], fileName, { type: "video/mp4" });
                        }
                    }
                } catch (directError) {
                    console.warn("Direct GitHub fetch failed:", directError);
                }
            }

            // Try simplified URL
            try {
                const simplifiedUrl = url.split('?')[0];
                const response = await fetch(simplifiedUrl, {
                    headers: { 'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8' },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const blob = await response.blob();
                    if (blob.size > 1000) {
                        return new File([blob], fileName, { type: "video/mp4" });
                    }
                }
            } catch (simplifiedError) {
                console.warn("Simplified URL fetch failed:", simplifiedError);
            }

            throw new Error("All direct fetch attempts failed");

        } catch (error) {
            // Return a minimal placeholder video as fallback
            console.log("Using placeholder video as fallback");
            const placeholderVideoBase64 = "AAAAHGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWlzbwAAAAhmcmVlAAAAG21kYXQAAAATABVLBgEG79Px5AAAAAAAAAAAAAAA";
            const binaryString = atob(placeholderVideoBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new File([bytes], fileName, { type: "video/mp4" });
        }
    }

    // Load random images
    async function loadRandomImages() {
        try {
            if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
                console.warn("No image URLs available yet");
                return [];
            }

            // Shuffle and select random images
            const shuffledUrls = [...imageUrls].sort(() => 0.5 - Math.random());
            const selectedUrls = shuffledUrls.slice(0, config.imageCount);

            // Fetch and convert to File objects
            const filePromises = selectedUrls.map((url, index) =>
                fetchImageAsFile(url, `image${index + 1}.jpg`)
            );
            const files = (await Promise.all(filePromises)).filter(Boolean);

            // Store results
            savedImageFiles = files;
            imagesLoaded = true;
            updateCombinedMedia();

            return files;
        } catch (error) {
            console.error("Error loading images:", error);
            imagesLoaded = true;
            updateCombinedMedia();
            return [];
        }
    }

    // Load random videos
    async function loadRandomVideos() {
        try {
            if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
                console.warn("No video URLs available yet");
                return [];
            }

            // Select a random video
            const randomIndex = Math.floor(Math.random() * videoUrls.length);
            const videoUrl = videoUrls[randomIndex];

            // Fetch and convert to File
            const videoFile = await fetchVideoAsFile(videoUrl, "video1.mp4");

            // Store results
            if (videoFile) {
                savedVideoFiles = [videoFile];
            }

            videosLoaded = true;
            updateCombinedMedia();

            return savedVideoFiles;
        } catch (error) {
            console.error("Error loading videos:", error);
            videosLoaded = true;
            updateCombinedMedia();
            return [];
        }
    }

    // Update combined media files
    function updateCombinedMedia() {
        if (!imagesLoaded || !videosLoaded) return;

        try {
            // Reset combined media
            combinedMediaFiles = [];

            // Add videos first
            if (savedVideoFiles && savedVideoFiles.length > 0) {
                const validVideos = savedVideoFiles.filter(file =>
                    file && file instanceof File && file.size > 0
                );
                if (validVideos.length > 0) {
                    combinedMediaFiles.push(...validVideos);
                }
            }

            // Add images
            if (savedImageFiles && savedImageFiles.length > 0) {
                const validImages = savedImageFiles.filter(file =>
                    file && file instanceof File && file.size > 0
                );
                if (validImages.length > 0) {
                    combinedMediaFiles.push(...validImages);
                }
            }

            // Enable sharing cards if we have media
            if (combinedMediaFiles.length > 0) {
                const shareCards = document.querySelectorAll('#others, #others_insta');
                shareCards.forEach(card => {
                    card.classList.remove('disabled-card');
                    const cardId = card.id;
                    const currentLang = (isEnglish) ? "_en" : "_cn";
                    card.querySelector('h3').textContent = text_lang[cardId + currentLang];
                });
            }

            // Hide loading screen when media is ready
            hideLoadingScreen();

        } catch (error) {
            console.error("Error updating combined media:", error);
            combinedMediaFiles = [];
            hideLoadingScreen();
        }
    }

    // --- Text Content Functions (keeping your original approach) ---

    // Get random line from preloaded contents
    function getLines(mode) {
        const randomLines = [];
        const usedIndexes = new Set();

        while (randomLines.length < 1) {
            if (isEnglish) {
                const randomIndex = Math.floor(Math.random() * lineCN.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCN[randomIndex]);
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

        if (mode == 1) {
            const textTC = randomLines.toString();
            window.focus();
            navigator.clipboard.writeText(textTC);
            alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
        }
        else if (mode == 2) {
            const textTC = randomLines.toString();
            window.focus();
            navigator.clipboard.writeText(textTC);
            return textTC;
        }
    }

    // Get random line for XHS with hashtags (keeping your original approach)
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
                    randomLines.push(mixedLine);
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
                window.focus();
                navigator.clipboard.writeText(textTC)
                    .then(() => {
                        alert(isEnglish ? "Text copied! Paste it onto XHS." : "复制成功！请粘贴在小红书。");
                    })
                    .catch(err => {
                        console.error("Clipboard write failed:", err);
                        prompt(isEnglish ? "Please copy this text manually:" : "请手动复制此文本:", textTC);
                    });
            } catch (error) {
                console.error("Clipboard error:", error);
                prompt(isEnglish ? "Please copy this text manually:" : "请手动复制此文本:", textTC);
            }
        } else if (mode == 2) {
            try {
                window.focus();
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
            return textTC;
        }
    }

    // --- Sharing Functions ---

    // Share media and text
    async function shareImages(mode) {
        if (mode == 2) {
            const files = combinedMediaFiles;
            if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
                try {
                    await navigator.share({
                        text: getLinesXHS(2),
                        files
                    });
                } catch (error) {
                    console.error("Sharing failed", error);
                }
            }
        }
    }

    // --- Data Loading ---

    // Load image URLs from GitHub
    fetch(`https://api.github.com/repos/${config.repoConfig.images.owner}/${config.repoConfig.images.repo}/contents/${config.repoConfig.images.path}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Filter for image files
            const imageFiles = data.filter(file =>
                file.name.toLowerCase().endsWith('.jpg') ||
                file.name.toLowerCase().endsWith('.jpeg') ||
                file.name.toLowerCase().endsWith('.png')
            );

            if (imageFiles.length === 0) {
                throw new Error("No image files found");
            }

            // Get download URLs
            imageUrls = imageFiles.map(file => file.download_url);
            return loadRandomImages();
        })
        .catch(error => {
            console.error("Error fetching images:", error);
            imageUrls = [];
            imagesLoaded = true;
            updateCombinedMedia();
        });

    // Load video URLs from GitHub
    fetch(`https://api.github.com/repos/${config.repoConfig.videos.owner}/${config.repoConfig.videos.repo}/contents/${config.repoConfig.videos.path}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Filter for MP4 files
            const mp4Files = data.filter(file => file.name.toLowerCase().endsWith('.mp4'));

            if (mp4Files.length === 0) {
                throw new Error("No MP4 files found");
            }

            // Get download URLs
            videoUrls = mp4Files.map(file => file.download_url);
            return loadRandomVideos();
        })
        .catch(error => {
            console.error("Error fetching videos:", error);
            videoUrls = [];
            videosLoaded = true;
            updateCombinedMedia();
        });

    // Load text content
    fetch(config.textSources.general)
        .then(response => response.text())
        .then(text => {
            lineCN = text.split('@').map(part => part.trim());
        })
        .catch(error => {
            console.error("Error loading general text:", error);
            lineCN = [];
        });

    fetch(config.textSources.xhs)
        .then(response => response.text())
        .then(text => {
            lineCNXHS = text.split('\n').map(part => part.trim());
        })
        .catch(error => {
            console.error("Error loading XHS text:", error);
            lineCNXHS = [];
        });

    // --- Event Handlers ---

    // Initialize language
    window.onload = (event) => {
        load_lang();
    };

    // Language button click handler
    langButton.addEventListener('click', function () {
        isEnglish = !isEnglish;
        load_lang();
    });

    // Card click handlers
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', async function () {
            const platform = this.id;

            // Don't process clicks on disabled cards
            if (this.classList.contains('disabled-card')) {
                alert("Still loading media files. Please try again later.");
                return;
            }

            // Handle RedNote
            if (platform === 'rednote') {
                logClick(2);
                window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                setTimeout(() => {
                    window.open('https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605', '_blank');
                }, 1500);
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
                window.open(config.socialLinks[platform], '_blank');
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