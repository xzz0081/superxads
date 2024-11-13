<template>
    <div class="container">
      <!-- 页面的最外层容器 -->
      <div class="header">
        <!-- 页面的头部部分 -->
        <div class="logo">SUPERX</div>
        <div class="nav">
          <!-- 导航栏部分 -->
          <div class="button" @click="handleButtonClick(1)">1</div>
          <div class="button" @click="handleButtonClick(2)">2</div>
          <div class="button" @click="handleButtonClick(3)">3</div>
          <div class="button" @click="handleButtonClick(4)">4</div>
          <div class="plane" @click="handlePlaneClick" title="飞机图标"></div>
          <button class="login-button" @click="handleSendAd">发布广告</button>
        </div>
      </div>
      <!-- 黑色广告区域 -->
      <div class="ad-content">
        <button class="jump-button" @click="scrollToUnfixed">
          <span class="jump-icon">↓</span>
        </button>
        <div class="ad-scroll-container">
            <div v-for="(ad, index) in advertisements" 
                 :key="index" 
                 class="ad-item"
                 :style="{
                   position: 'absolute',
                   left: ad.position.x + 'px',
                   top: ad.position.y + 'px',
                   width: ad.width + 'px',
                   height: ad.height + 'px',
                   transform: ad.transform
                 }">
                <img :src="getFullImageUrl(ad.src)" 
                     :style="{
                       width: '100%',
                       height: '100%',
                       objectFit: 'cover'
                     }" 
                     @click="handleAdClick(ad)" />
            </div>
        </div>
      </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

export default {
  name: 'VisitorHome',
  setup() {
    const router = useRouter();
    const advertisements = ref([]);

    const handleButtonClick = (buttonNumber) => {
      alert(`按钮 ${buttonNumber} 被点击了`);
    };

    const handlePlaneClick = () => {
      alert('飞机按钮被点击');
    };

    const handleSendAd = () => {
      router.push('/send');
    };

    const getFullImageUrl = (url) => {
      if (url.startsWith('http')) {
        return url;
      }
      return `http://localhost:3000${url}`;
    };

    const fetchAdvertisements = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/advertisements');
        const data = await response.json();
        advertisements.value = data;
      } catch (err) {
        console.error('获取广告失败:', err);
      }
    };

    const handleAdClick = (ad) => {
      if (ad.link) {
        window.open(ad.link, '_blank');
      }
    };

    const scrollToUnfixed = () => {
      // 找到第一个未固定位置的广告
      const unfixedAd = advertisements.value.find(ad => 
        !ad.position || (ad.position.x === undefined || ad.position.y === undefined)
      );

      if (unfixedAd) {
        // 如果找到未固定的广告，滚动到其位置
        const element = document.querySelector('.ad-content');
        element.scrollTo({
          top: unfixedAd.position?.y || 0,
          behavior: 'smooth'
        });
      }
    };

    onMounted(() => {
      fetchAdvertisements();
    });

    return {
      handleButtonClick,
      handlePlaneClick,
      handleSendAd,
      advertisements,
      handleAdClick,
      getFullImageUrl,
      scrollToUnfixed,
    };
  }
};
</script>

<style scoped>
body {
  margin: 0;
  background-color: #333;
  color: #fff;
  font-family: Arial, sans-serif;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  width: 100%;
  flex-wrap: wrap;
  background-color: #fff;
}

.logo {
  font-size: 2em;
  color: red;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 15px;
  margin-right: 20px;
  flex-wrap: wrap;
}

.nav .button {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #43cea2, #185a9d);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s, box-shadow 0.3s;
}

.nav .button:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4);
}

.nav .plane {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ff9800, #f44336);
  clip-path: polygon(100% 50%, 0 0, 0 100%);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.nav .plane:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4);
}

.login-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: background 0.3s, box-shadow 0.3s, transform 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.login-button:hover {
  background: linear-gradient(135deg, #0072ff, #00c6ff);
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4);
}

.ad-content {
  flex-grow: 1;
  background-color: #000;
  position: relative;
  width: 100%;
  min-height: calc(100vh - 70px);
  height: auto;
  overflow: auto;
  display: flex;
  justify-content: center;
}

.ad-scroll-container {
  position: relative;
  width: 100%;
  max-width: 3000px;
  min-height: 100%;
  height: auto;
  padding: 20px;
  background-color: #000;
  flex-grow: 1;
  margin: 0 auto;
}

.ad-item {
  position: absolute;
  cursor: pointer;
  transition: transform 0.3s ease;
  max-width: 100%;
}

.ad-item:hover {
  transform: scale(1.02);
}

.ad-item img {
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  max-width: 100%;
  height: auto;
}

.ad-content::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.ad-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.ad-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
}

.ad-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.ad-content::-webkit-scrollbar-corner {
  background: rgba(255, 255, 255, 0.1);
}

.jump-button {
  position: fixed;
  top: 100px; /* 调整位置，确保在头部导航栏下方 */
  right: 30px;
  width: 50px;
  height: 50px;
  background-color: #ff4444;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
}

.jump-button:hover {
  background-color: #ff6666;
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.jump-icon {
  display: inline-block;
  transform: rotate(0deg);
  transition: transform 0.3s ease;
}

.jump-button:hover .jump-icon {
  transform: rotate(360deg);
}
</style> 