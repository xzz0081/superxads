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
                <div class="ad-content">
                    <!-- 显示已发布的广告，使用与首页完全相同的样式和定位 -->
                    <div v-for="(ad, index) in publishedAds" 
                         :key="'published-' + index" 
                         class="ad-item published"
                         :style="{
                             position: 'absolute',
                             left: ad.position.x + 'px',
                             top: ad.position.y + 'px',
                             width: ad.width + 'px',
                             height: ad.height + 'px',
                             transform: ad.transform || '',
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
        };

        const handleImageUpload = async (event) => {
            const input = event.target;
            const files = input.files;
            
            if (files && files.length > 0) {
                if (uploadedImages.value.some(image => !image.fixed)) {
                    alert('请先固定当前图片的位置，然后再上传下一张图片。');
                    return;
                }

                try {
                    const file = files[0];
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    const response = await fetch('http://localhost:3000/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
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
        };

        function dragMoveListener(event, index) {
            const target = event.target;
            if (!target) return;

            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            // 更新元素的位置
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
            
            // 更新图片数据
            uploadedImages.value[index].position = { x, y };

            // 更新父元素的位置
            const parent = target.parentElement;
            if (parent) {
                parent.style.left = x + 'px';
                parent.style.top = y + 'px';
            }
        }

        const isOverlapping = (target, index, width = null, height = null) => {
            if (!target) return false;

            const container = document.querySelector('.ad-content');
            if (!container) return false;

            try {
                const targetRect = target.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // 使用提供的宽度和高度，或者使用当前元素的尺寸
                const testRect = {
                    left: targetRect.left - containerRect.left,
                    top: targetRect.top - containerRect.top,
                    right: targetRect.left - containerRect.left + (width || targetRect.width),
                    bottom: targetRect.top - containerRect.top + (height || targetRect.height)
                };

                // 检查与已发布广告的重叠
                const publishedOverlap = publishedAds.value.some(ad => {
                    if (!ad.position) return false;
                    return !(testRect.right < ad.position.x ||
                            testRect.left > ad.position.x + (ad.width || 0) ||
                            testRect.bottom < ad.position.y ||
                            testRect.top > ad.position.y + (ad.height || 0));
                });

                if (publishedOverlap) return true;

                // 检查与其他上传图片的重叠
                return uploadedImages.value.some((image, i) => {
                    if (i === index || !image.fixed) return false;
                    
                    const otherImage = document.getElementById(`uploadedImage${i}`);
                    if (!otherImage) return false;

                    try {
                        const otherRect = otherImage.getBoundingClientRect();
                        const other = {
                            left: otherRect.left - containerRect.left,
                            top: otherRect.top - containerRect.top,
                            right: otherRect.left - containerRect.left + otherRect.width,
                            bottom: otherRect.top - containerRect.top + otherRect.height
                        };

                        return !(testRect.right < other.left ||
                                testRect.left > other.right ||
                                testRect.bottom < other.top ||
                                testRect.top > other.bottom);
                    } catch (error) {
                        console.warn('Error checking overlap for image', i, error);
                        return false;
                    }
                });
            } catch (error) {
                console.warn('Error in overlap detection:', error);
                return false;
            }
        };

        const fixImagePosition = (index) => {
            uploadedImages.value[index].fixed = true;
            const uploadedImage = document.getElementById(`uploadedImage${index}`);
            if (uploadedImage) {
                interact(uploadedImage).draggable(false).resizable(false);
            }
        };

        const publishAd = async () => {
            try {
                if (!uploadedImages.value.length) {
                    alert("请至少上传一张图片");
                    return;
                }

                if (uploadedImages.value.some(img => !img.fixed)) {
                    alert("请先固定所有图片的位置");
                    return;
                }

                const lastIndex = uploadedImages.value.length - 1;
                const currentImage = uploadedImages.value[lastIndex];

                const adData = {
                    src: currentImage.src,
                    position: currentImage.position,
                    width: currentImage.width,
                    height: currentImage.height,
                    transform: currentImage.transform,
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

                alert("广告发布成功！");
                clearCanvas();
                fetchPublishedAds();
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
            fixImagePosition
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
    bottom: 5px;
    right: 5px;
    background-color: rgba(40, 167, 69, 0.8);
    color: #fff;
    border: none;
    padding: 5px;
    cursor: pointer;
    border-radius: 5px;
    font-size: 0.9em;
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
    height: calc(100vh - 70px);
    position: relative;
    background-color: #000;
    overflow: hidden;
}

.ad-content {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
}

.ad-item {
    position: absolute;
    touch-action: none;
}

.ad-item.published {
    pointer-events: none;
    border: 2px dashed rgba(255, 255, 255, 0.3);
}

.ad-item.current {
    z-index: 10;
}

.uploaded-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: move;
    touch-action: none;
    user-select: none;
}

.fix-button {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(40, 167, 69, 0.8);
    color: #fff;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    z-index: 11;
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
    height: 600px;
    overflow: auto;
    position: relative;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.3);
    margin: 0 auto;
    padding: 20px;
}

.ad-simulation {
    width: 1000px;
    height: 500px;
    background-color: rgba(0, 0, 0, 0.5);
    position: relative;
    margin: 0 auto;
    border: 2px solid #fff;
}

/* 添加提示样式 */
.overlap-warning {
    position: absolute;
    background-color: rgba(255, 0, 0, 0.3);
    border: 2px solid red;
    pointer-events: none;
    z-index: 100;
}

/* 自定义滚动条样式 */
.preview-container::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.preview-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
}

.preview-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
}

.preview-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

/* 添加拖动提示 */
.preview-container::after {
    content: '↕️ 滚动查看更多';
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    pointer-events: none;
}

/* 确保父容器有明确的尺寸和定位 */
.preview-container {
    width: 100%;
    height: calc(100vh - 200px);
    position: relative;
    overflow: hidden;
    background-color: #000;
}
</style> 