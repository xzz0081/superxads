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
            <div class="ad-simulation" id="adSimulationContainer">
                <div v-for="(image, index) in uploadedImages" :key="index" class="image-container">
                    <img :src="image.src" :id="'uploadedImage' + index" class="uploaded-image" />
                    <button v-if="!image.fixed" :style="{ transform: image.transform }" class="fix-button" @click="fixImagePosition(index)">固定位置</button>
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
                    
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    uploadedImages.value.push({
                        src: result.url,
                        fixed: false,
                        transform: 'translate(0px, 0px)',
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

        // 初始化 interact.js
        const initializeInteract = () => {
            uploadedImages.value.forEach((image, index) => {
                if (image.fixed) return;

                const uploadedImage = document.getElementById(`uploadedImage${index}`);
                if (!uploadedImage) return;

                interact(uploadedImage)
                    .draggable({
                        listeners: { move: (event) => dragMoveListener(event, index) },
                        inertia: true,
                        modifiers: [
                            interact.modifiers.restrict({
                                restriction: '#adSimulationContainer',
                                elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                                endOnly: true,
                            }),
                        ],
                    })
                    .resizable({
                        edges: { left: true, right: true, bottom: true, top: true },
                        listeners: {
                            move(event) {
                                const { x, y } = event.target.dataset;
                                const newX = (parseFloat(x) || 0) + event.deltaRect.left;
                                const newY = (parseFloat(y) || 0) + event.deltaRect.top;

                                Object.assign(event.target.style, {
                                    width: `${event.rect.width}px`,
                                    height: `${event.rect.height}px`,
                                    transform: `translate(${newX}px, ${newY}px)`
                                });

                                Object.assign(event.target.dataset, { x: newX, y: newY });
                                uploadedImages.value[index].transform = `translate(${newX}px, ${newY}px)`;
                            },
                        },
                        modifiers: [
                            interact.modifiers.restrictEdges({
                                outer: 'parent',
                            }),
                            interact.modifiers.restrictSize({
                                min: { width: 50, height: 50 },
                                max: { width: 1000, height: 500 }
                            }),
                        ],
                        inertia: true,
                    });
            });
        };

        function dragMoveListener(event, index) {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            if (isOverlapping(target, index)) return;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
            uploadedImages.value[index].transform = `translate(${x}px, ${y}px)`;
        }

        const isOverlapping = (target, index) => {
            const targetRect = target.getBoundingClientRect();
            return uploadedImages.value.some((image, i) => {
                if (i === index || image.fixed) return false;
                const otherImage = document.getElementById(`uploadedImage${i}`);
                if (!otherImage) return false;
                const otherRect = otherImage.getBoundingClientRect();
                return !(targetRect.right < otherRect.left ||
                         targetRect.left > otherRect.right ||
                         targetRect.bottom < otherRect.top ||
                         targetRect.top > otherRect.bottom);
            });
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

                // 这里需要实现实际的发布逻辑
                alert("广告发布成功！");
                clearCanvas();
            } catch (err) {
                alert(err.message || "发布失败，请重试");
            }
        };

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
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #fff;
    border-radius: 10px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
}

.image-container {
    position: absolute;
}

.uploaded-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border: 2px solid #fff;
    border-radius: 10px;
    cursor: grab;
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
</style> 