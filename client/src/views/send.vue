<template>
    <div class="container">
        <!-- 背景视频（可选） -->
        <video autoplay muted loop id="background-video">
            <source src="/videos/10.8.mp4" type="video/mp4">
            您的浏览器不支持HTML5视频。
        </video>

        <!-- 上传区 -->
        <div class="upload-section">
            <h2 class="title">欢迎使用SuperX广告发布站！</h2>
            <p class="subtitle">1. 初代版本支持图片链接、伪代码等！推荐使用动图！</p>
            <p class="subtitle">2. 这里没有任何限制！只要你想你都能免费发布！</p>
            <p class="subtitle">3. 此站没有维护！希望大家高抬贵手！</p>

            <!-- 文件上传 -->
            <label for="file-upload" class="upload-label">图片动画上传</label>
            <input type="file" id="file-upload" @change="handleImageUpload" accept="image/*">
            <p class="upload-info">附属链接</p>

            <label for="compressed-file-upload" class="upload-label">压缩文本上传</label>
            <input type="file" id="compressed-file-upload" @change="handleCompressedUpload" accept="text/*">
            <p class="upload-info">附带链接</p>

            <textarea v-model="adCode" class="ad-code-input" placeholder="广告代码输入" style="height: 30px; width: 150px;"></textarea>
            
            <div class="button-group" style="margin-top: 10px;">
                <button @click="publishAd" class="publish-button" style="margin-right: 10px;">确定发布</button>
                <button @click="clearCanvas" class="clear-canvas-button">清空画布</button>
            </div>
        </div>

        <!-- 实时预览区 -->
        <div v-if="showAdSimulation" class="preview-section">
            <h3 class="preview-title">首页广告位预览</h3>
            <div class="preview-container">
                <button class="preview-jump-button" @click="scrollToUnfixed">
                    <span class="jump-icon">↓</span>
                </button>
                
                <div class="ad-content">
                    <!-- 显示已发布的广告 -->
                    <div v-for="(ad, index) in publishedAds" 
                         :key="'published-' + index" 
                         class="ad-item published"
                         :style="{
                             position: 'absolute',
                             left: ad.position.x + 'px',
                             top: ad.position.y + 'px',
                             width: ad.width + 'px',
                             height: ad.height + 'px',
                             opacity: 0.6
                         }">
                        <img :src="getFullImageUrl(ad.src)" 
                             :style="{
                                 width: '100%',
                                 height: '100%',
                                 objectFit: 'cover'
                             }" />
                    </div>

                    <!-- 当前上传的图片 -->
                    <div v-for="(image, index) in uploadedImages" 
                         :key="index" 
                         class="ad-item current"
                         :style="{
                             position: 'absolute',
                             left: (image.position?.x || 0) + 'px',
                             top: (image.position?.y || 0) + 'px',
                             width: image.width + 'px',
                             height: image.height + 'px'
                         }">
                        <img :src="image.src" 
                             :id="'uploadedImage' + index" 
                             class="uploaded-image"
                             :style="{
                                 width: '100%',
                                 height: '100%',
                                 objectFit: 'cover'
                             }" />
                        <button v-if="!image.fixed" 
                                class="fix-button" 
                                @click="fixImagePosition(index)">
                            固定位置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import interact from 'interactjs';

export default {
    name: 'SendPage',
    setup() {
        const uploadedImages = ref([]);
        const showAdSimulation = ref(false);
        const adCode = ref('');
        const publishedAds = ref([]);

        const clearCanvas = () => {
            showAdSimulation.value = false;
            uploadedImages.value = [];
            // 清空文件输入
            const fileInput = document.getElementById('file-upload');
            if (fileInput) {
                fileInput.value = '';
            }
        };

        const handleImageUpload = async (event) => {
            const input = event.target;
            const files = input.files;
            
            if (files && files.length > 0) {
                try {
                    const file = files[0];
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    const response = await fetch('http://localhost:3000/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    // 添加新图片到数组
                    uploadedImages.value.push({
                        src: result.url,
                        fixed: false,
                        position: { x: 0, y: 0 },
                        width: 500,
                        height: 250
                    });
                    
                    showAdSimulation.value = true;
                    await nextTick();
                    initializeInteract();
                    updateFixButtonPosition(uploadedImages.value.length - 1);
                    
                    // 清空文件输入，允许再次上传
                    event.target.value = '';
                } catch (err) {
                    alert(err.message || "图片上传失败，请重试");
                }
            }
        };

        const handleCompressedUpload = (event) => {
            // 实现压缩文本上传逻辑
        };

        const initializeInteract = () => {
            uploadedImages.value.forEach((image, index) => {
                if (image.fixed) return;

                const uploadedImage = document.getElementById(`uploadedImage${index}`);
                if (!uploadedImage) return;

                interact(uploadedImage)
                    .draggable({
                        inertia: false,
                        modifiers: [
                            interact.modifiers.restrict({
                                restriction: '.ad-content',
                                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                            })
                        ],
                        listeners: {
                            move: (event) => dragMoveListener(event, index)
                        }
                    })
                    .resizable({
                        edges: { left: true, right: true, bottom: true, top: true },
                        modifiers: [
                            interact.modifiers.restrictEdges({
                                outer: '.ad-content'
                            }),
                            interact.modifiers.restrictSize({
                                min: { width: 50, height: 50 },
                                max: { width: 1000, height: 500 }
                            })
                        ],
                        listeners: {
                            move: (event) => resizeMoveListener(event, index)
                        }
                    });
            });
        };

        const resizeMoveListener = (event, index) => {
            const target = event.target;
            if (!target) return;

            const x = (parseFloat(target.getAttribute('data-x')) || 0);
            const y = (parseFloat(target.getAttribute('data-y')) || 0);

            // 更新元素的尺寸
            Object.assign(target.style, {
                width: `${event.rect.width}px`,
                height: `${event.rect.height}px`
            });

            // 更新图片数据
            uploadedImages.value[index].width = event.rect.width;
            uploadedImages.value[index].height = event.rect.height;
            uploadedImages.value[index].position = { x, y };

            // 更新父元素的位置和尺寸
            const parent = target.parentElement;
            if (parent) {
                parent.style.width = event.rect.width + 'px';
                parent.style.height = event.rect.height + 'px';
            }

            // 更新固定按钮位置
            updateFixButtonPosition(index);
        };

        function dragMoveListener(event, index) {
            const target = event.target;
            if (!target) return;

            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            // 临时更新位置以检查重叠
            const parent = target.parentElement;
            const originalLeft = parent.style.left;
            const originalTop = parent.style.top;
            
            parent.style.left = x + 'px';
            parent.style.top = y + 'px';

            // 检查重叠
            if (isOverlapping(parent, index)) {
                // 如果重叠，找到最近的可用位置
                const nearestPosition = findNearestValidPosition(parent, x, y, index);
                parent.style.left = nearestPosition.x + 'px';
                parent.style.top = nearestPosition.y + 'px';
                
                // 更新数据
                target.setAttribute('data-x', nearestPosition.x);
                target.setAttribute('data-y', nearestPosition.y);
                uploadedImages.value[index].position = { x: nearestPosition.x, y: nearestPosition.y };
            } else {
                // 如果没有重叠，正常更新位置
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                uploadedImages.value[index].position = { x, y };
            }
        }

        const findNearestValidPosition = (element, x, y, index) => {
            const step = 10; // 每次检查的步长
            const maxAttempts = 50; // 最大尝试次数
            const directions = [
                { dx: 1, dy: 0 },   // 右
                { dx: -1, dy: 0 },  // 左
                { dx: 0, dy: 1 },   // 下
                { dx: 0, dy: -1 },  // 上
                { dx: 1, dy: 1 },   // 右下
                { dx: -1, dy: 1 },  // 左下
                { dx: 1, dy: -1 },  // 右上
                { dx: -1, dy: -1 }  // 左上
            ];

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                for (const dir of directions) {
                    const testX = x + dir.dx * step * attempt;
                    const testY = y + dir.dy * step * attempt;

                    // 检查位置是否在容器
                    if (isWithinBounds(testX, testY, element)) {
                        element.style.left = testX + 'px';
                        element.style.top = testY + 'px';

                        if (!isOverlapping(element, index)) {
                            return { x: testX, y: testY };
                        }
                    }
                }
            }

            // 如果找不到合适的位置，返回原始位置
            return { x, y };
        };

        const isWithinBounds = (x, y, element) => {
            const container = document.querySelector('.ad-content');
            if (!container) return false;

            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            return x >= 0 &&
                   y >= 0 &&
                   x + elementRect.width <= containerRect.width &&
                   y + elementRect.height <= containerRect.height;
        };

        const isOverlapping = (element, index) => {
            if (!element) return false;

            const elementRect = element.getBoundingClientRect();
            const container = document.querySelector('.ad-content');
            if (!container) return false;

            const containerRect = container.getBoundingClientRect();
            const currentRect = {
                left: elementRect.left - containerRect.left,
                right: elementRect.right - containerRect.left,
                top: elementRect.top - containerRect.top,
                bottom: elementRect.bottom - containerRect.top
            };

            // 检查与已发布广告的重叠，允许边缘接触
            const publishedOverlap = publishedAds.value.some(ad => {
                const adRect = {
                    left: ad.position.x,
                    right: ad.position.x + ad.width,
                    top: ad.position.y,
                    bottom: ad.position.y + ad.height
                };

                // 允许边缘接触，但不允许重叠
                return !(currentRect.right <= adRect.left ||
                        currentRect.left >= adRect.right ||
                        currentRect.bottom <= adRect.top ||
                        currentRect.top >= adRect.bottom);
            });

            if (publishedOverlap) return true;

            // 检查与其他已固定图片的重叠
            return uploadedImages.value.some((image, i) => {
                if (i === index || !image.fixed) return false;

                const otherElement = document.getElementById(`uploadedImage${i}`);
                if (!otherElement) return false;

                const otherParent = otherElement.parentElement;
                const otherRect = otherParent.getBoundingClientRect();
                const other = {
                    left: otherRect.left - containerRect.left,
                    right: otherRect.right - containerRect.left,
                    top: otherRect.top - containerRect.top,
                    bottom: otherRect.bottom - containerRect.top
                };

                // 允许边缘接触，但不允许重叠
                return !(currentRect.right <= other.left ||
                        currentRect.left >= other.right ||
                        currentRect.bottom <= other.top ||
                        currentRect.top >= other.bottom);
            });
        };

        const fixImagePosition = (index) => {
            if (index < 0 || index >= uploadedImages.value.length) {
                return;
            }
            
            uploadedImages.value[index].fixed = true;
            const uploadedImage = document.getElementById(`uploadedImage${index}`);
            if (uploadedImage) {
                interact(uploadedImage).draggable(false).resizable(false);
            }
        };

        const publishAd = async () => {
            try {
                if (uploadedImages.value.length === 0) {
                    alert("请先上传图片");
                    return;
                }

                // 检查是否所有图片都已固定
                if (uploadedImages.value.some(img => !img.fixed)) {
                    alert("请先固定所有图片的位置");
                    return;
                }

                // 发布所有未发布的图片
                for (const image of uploadedImages.value) {
                    const adData = {
                        src: image.src,
                        position: image.position,
                        width: image.width,
                        height: image.height,
                        transform: image.transform,
                        timestamp: new Date().toISOString()
                    };

                    const response = await fetch('http://localhost:3000/api/advertisements', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(adData)
                    });

                    if (!response.ok) {
                        throw new Error('发布失败');
                    }
                }

                alert("所有广告发布成功！");
                clearCanvas();
                fetchPublishedAds();
                
                // 清空文件输入
                const fileInput = document.getElementById('file-upload');
                if (fileInput) {
                    fileInput.value = '';
                }
            } catch (err) {
                console.error('发布错误:', err);
                alert(err.message || "发布失败，请重试");
            }
        };

        const getFullImageUrl = (url) => {
            if (url.startsWith('http')) {
                return url;
            }
            if (url.startsWith('/')) {
                return `http://localhost:3000${url}`;
            }
            return `http://localhost:3000/${url}`;
        };

        const fetchPublishedAds = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/advertisements');
                const data = await response.json();
                publishedAds.value = data;
                console.log('Fetched ads:', data);
            } catch (err) {
                console.error('获取已发布广告失败:', err);
            }
        };

        const updateFixButtonPosition = (index) => {
            const image = document.getElementById(`uploadedImage${index}`);
            if (!image) return;

            const button = image.parentElement.querySelector('.fix-button');
            if (!button) return;

            const imageRect = image.getBoundingClientRect();
            const minWidth = 100; // 定义最小宽度阈值

            if (imageRect.width < minWidth) {
                // 如果图片太小，将按钮放在右侧
                button.style.right = '-80px'; // 按钮宽度 + 间距
                button.style.bottom = '0';
                button.style.transform = 'none';
            } else {
                // 正常位置
                button.style.right = '10px';
                button.style.bottom = '10px';
                button.style.transform = 'none';
            }
        };

        const scrollToUnfixed = () => {
            const previewContainer = document.querySelector('.preview-container');
            if (previewContainer) {
                // 找到第一个未固定的广告
                const unfixedAdIndex = uploadedImages.value.findIndex(img => !img.fixed);
                
                if (unfixedAdIndex !== -1) {
                    // 如果找到未固定的广告，滚动到它的位置
                    const unfixedAd = uploadedImages.value[unfixedAdIndex];
                    const scrollPosition = unfixedAd.position.y + unfixedAd.height + 100; // 额外加100px空间
                    
                    previewContainer.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                    });
                } else {
                    // 如果所有广告都已固定，滚动到最后一个广告的下方
                    const lastAd = uploadedImages.value[uploadedImages.value.length - 1];
                    if (lastAd) {
                        const scrollPosition = lastAd.position.y + lastAd.height + 100;
                        previewContainer.scrollTo({
                            top: scrollPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        };

        onMounted(() => {
            fetchPublishedAds();
        });

        onBeforeUnmount(() => {
            uploadedImages.value.forEach((_, index) => {
                const uploadedImage = document.getElementById(`uploadedImage${index}`);
                if (uploadedImage) {
                    interact(uploadedImage).unset();
                }
            });
        });

        return {
            uploadedImages,
            showAdSimulation,
            adCode,
            publishedAds,
            getFullImageUrl,
            clearCanvas,
            handleImageUpload,
            handleCompressedUpload,
            publishAd,
            fixImagePosition,
            scrollToUnfixed,
        };
    }
};
</script>

<style scoped>
/* 保持原有的样式代码不变 */
body {
    margin: 0;
    font-family: Arial, sans-serif;
    background-color: #333;
    color: #fff;
}

#background-video {
    position: fixed;
    right: 0;
    bottom: 0;
    min-width: 100%;
    min-height: 100%;
    z-index: -1;
}

.container {
    position: relative;
    width: 100%;
    max-width: 1400px;
    margin: 50px auto;
    padding: 20px;
}

.title {
    color: #ff00ff;
    font-size: 2em;
    text-align: center;
}

.subtitle {
    color: #00ff00;
    text-align: center;
}

.upload-section {
    text-align: left;
    color: #ff0000;
    margin-bottom: 10px;
}

.upload-label {
    color: #ff0000;
    font-weight: bold;
    display: block;
}

.upload-info {
    color: #00ff00;
    margin: 10px 0;
}

.ad-code-input {
    margin-top: 10px;
    background-color: rgba(255, 255, 255, 0.3);
    color: #000;
    border: none;
    padding: 10px;
    box-sizing: border-box;
    border-radius: 5px;
}

.button-group {
    margin-top: 10px;
}

.preview-section {
    text-align: center;
    margin-top: 20px;
    position: relative;
    width: 100%;
}

.ad-simulation {
    width: 1000px;
    height: 500px;
    background-color: rgba(0, 0, 0, 0.5);
    position: relative;
    margin: 20px auto;
    overflow: visible;
    border: 2px solid #fff;
    min-height: 500px;
    padding: 20px;
}

.image-container {
    position: absolute;
    z-index: 1;
    touch-action: none;
}

.uploaded-image {
    max-width: none;
    max-height: none;
    object-fit: contain;
    border: 2px solid #fff;
    border-radius: 10px;
    cursor: grab;
    touch-action: none;
}

.fix-button {
    position: absolute;
    background-color: rgba(40, 167, 69, 0.8);
    color: #fff;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    z-index: 11;
    white-space: nowrap;
    transition: all 0.3s ease;
}

.fix-button:hover {
    background-color: rgba(33, 136, 56, 0.8);
}

.clear-canvas-button {
    margin-top: 10px;
    background-color: #cc0000;
    color: #fff;
    border: none;
    padding: 5px 15px;
    cursor: pointer;
    border-radius: 3px;
    transition: background-color 0.3s;
}

.clear-canvas-button:hover {
    background-color: #990000;
}

.publish-button {
    margin-top: 10px;
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 5px 15px;
    cursor: pointer;
    border-radius: 3px;
    transition: background-color 0.3s;
}

.publish-button:hover {
    background-color: #0056b3;
}

.published-image {
    object-fit: cover;
    border-radius: 5px;
}

.image-container.published {
    pointer-events: none;
}

.image-container.current {
    z-index: 10;
}

.preview-title {
    color: #00ff00;
    text-align: center;
    margin-bottom: 20px;
}

.ad-simulation {
    width: 1000px;
    height: 500px;
    background-color: rgba(0, 0, 0, 0.5);
    position: relative;
    margin: 20px auto;
    overflow: visible;
    border: 2px solid #fff;
    min-height: 500px;
    padding: 20px;
}

.grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    pointer-events: none;
    min-height: 500px;
}

.grid-cell {
    border: 1px dashed rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.2em;
}

.ad-info {
    position: absolute;
    top: 5px;
    left: 5px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.8em;
}

.preview-info {
    margin-top: 20px;
    color: #00ff00;
    text-align: center;
}

/* 添加网格参考线 */
.ad-simulation {
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
}

/* 新增预览容器样式 */
.preview-container {
    width: 100%;
    height: calc(100vh - 200px);
    position: relative;
    background-color: #000;
    overflow: auto;
    padding: 20px;
}

.ad-content {
    position: relative;
    width: 3000px !important; /* 改回固定宽度，与首页保持一致 */
    min-height: 3000px; /* 保持高度可以无限延展 */
    background-color: #000;
    margin: 0 auto;
}

/* 确保图片位置精确匹配 */
.ad-item {
    position: absolute;
    touch-action: none;
    transform-origin: 0 0;
}

.ad-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* 优化滚动条样式 */
.preview-container::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

.preview-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
}

.preview-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
}

.preview-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
}

.preview-container::-webkit-scrollbar-corner {
    background: rgba(255, 255, 255, 0.1);
}

/* 添加滚动提示 */
.preview-container::after {
    content: '↑ ↓ 可无限向下滚动添加广告';  /* 更新提示文本，去掉左右滚动提示 */
    position: fixed;
    bottom: 20px;
    right: 20px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    padding: 5px 10px;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    pointer-events: none;
    z-index: 1000;
}

/* 确保内容区域居中 */
.preview-section {
    text-align: center;
    margin-top: 20px;
    position: relative;
    width: 100%;
    overflow: hidden;
}

/* 调整预览标题样式 */
.preview-title {
    color: #00ff00;
    text-align: center;
    margin-bottom: 20px;
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
}

/* 修改容器内边距，确保有足够的滚动空间 */
.container {
    padding-bottom: 50px;
}

/* 移除可能影响滚动的限制 */
.preview-container {
    max-height: none;
    max-width: none;
}

.preview-jump-button {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background-color: #ff4444;
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    transition: all 0.3s ease;
}

.preview-jump-button:hover {
    background-color: #ff6666;
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.jump-icon {
    display: inline-block;
    transform: rotate(0deg);
    transition: transform 0.3s ease;
}

.preview-jump-button:hover .jump-icon {
    transform: rotate(360deg);
}
</style> 