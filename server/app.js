const express = require('express');
const path = require('path');
const cors = require('cors');
const upload = require('./utils/upload');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs').promises;

// 启用 CORS
app.use(cors());

// 确保必要的目录存在
const ensureDirectories = async () => {
    const directories = [
        path.join(__dirname, 'public'),
        path.join(__dirname, 'public/uploads'),
        path.join(__dirname, 'data')
    ];

    for (const dir of directories) {
        if (!require('fs').existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
};

// 在应用启动时确保目录存在
ensureDirectories().then(() => {
    console.log('Directories initialized');
}).catch(err => {
    console.error('Error initializing directories:', err);
});

// 配置静态资源中间件
// 注意：这里的顺序很重要，要确保在其他路由之前
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 文件上传路由
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }
        
        // 返回完整的URL
        const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: fileUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 获取广告列表接口
app.get('/api/advertisements', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data/advertisements.json');
        
        // 如果文件不存在，返回空数组
        if (!require('fs').existsSync(dataPath)) {
            return res.json([]);
        }

        const data = await fs.readFile(dataPath, 'utf8');
        const advertisements = JSON.parse(data);
        
        // 验证每个广告的图片是否存在
        const validAds = advertisements.filter(ad => {
            const imagePath = ad.src.replace(`http://localhost:${port}`, '');
            return require('fs').existsSync(path.join(__dirname, 'public', imagePath));
        });

        res.json(validAds);
    } catch (error) {
        console.error('Error reading advertisements:', error);
        res.json([]);
    }
});

// 添加保存广告的接口
app.post('/api/advertisements', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data/advertisements.json');
        let advertisements = [];
        
        // 读取现有广告
        if (require('fs').existsSync(dataPath)) {
            const data = await fs.readFile(dataPath, 'utf8');
            advertisements = JSON.parse(data);
        }

        // 添加新广告
        advertisements.push(req.body);

        // 保存更新后的广告列表
        await fs.writeFile(dataPath, JSON.stringify(advertisements, null, 2));

        res.json({
            success: true,
            message: 'Advertisement published successfully'
        });
    } catch (error) {
        console.error('Error saving advertisement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save advertisement'
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 