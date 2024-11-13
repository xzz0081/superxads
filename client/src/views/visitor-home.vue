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

    onMounted(() => {
      fetchAdvertisements();
    });

    return {
      handleButtonClick,
      handlePlaneClick,
      handleSendAd,
      advertisements,
      handleAdClick,
      getFullImageUrl
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
  height: calc(100vh - 70px); /* 减去header的高度 */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-item {
  position: absolute;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.ad-item:hover {
  transform: scale(1.02);
}

.ad-item img {
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style> 