const express = require('express');
const path = require('path');
const cors = require('cors');
const upload = require('./utils/upload');
const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors());

// 配置静态资源中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'public/uploads');
if (!require('fs').existsSync(uploadDir)) {
    require('fs').mkdirSync(uploadDir, { recursive: true });
}

// 文件上传路由
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }
        
        // 返回上传成功的文件URL
        res.json({
            success: true,
            url: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
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