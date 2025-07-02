require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 20209;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 信任代理设置，用于正确获取用户IP
app.set('trust proxy', true);

// 配置 axios 代理设置
const axiosConfig = {
    timeout: 10000,
    // 如果需要使用代理，可以取消注释下面的配置
    // proxy: {
    //     protocol: 'socks5',
    //     host: '127.0.0.1',
    //     port: 2025
    // }
};

// 创建 axios 实例
const apiClient = axios.create(axiosConfig);

// 获取用户真实IP的函数
function getUserIP(req) {
    // 按优先级获取真实IP
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    const reqIP = req.ip;
    
    let userIP;
    
    if (forwarded) {
        // x-forwarded-for 可能包含多个IP，取第一个
        userIP = forwarded.split(',')[0].trim();
    } else if (realIP) {
        userIP = realIP;
    } else if (reqIP) {
        userIP = reqIP;
    } else {
        userIP = remoteAddress;
    }
    
    // 移除IPv6前缀（如果是IPv4映射的IPv6地址）
    if (userIP && userIP.startsWith('::ffff:')) {
        userIP = userIP.substring(7);
    }
    
    // 如果是本地地址，使用一个公网IP作为示例
    if (!userIP || userIP === '127.0.0.1' || userIP === 'localhost' || userIP === '::1') {
        userIP = '2.56.188.79'; // 备用IP
        console.log('检测到本地地址，使用备用IP:', userIP);
    }
    
    return userIP;
}

// 提供静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

// BIN 查询 API
app.post('/api/check-bin', async (req, res) => {
    try {
        const { bin, userIP: frontendIP } = req.body;
        
        if (!bin) {
            return res.status(400).json({ error: 'BIN号码是必需的' });
        }

        // 优先使用前端传递的真实IP，否则从请求头获取
        let userIP = frontendIP;
        if (!userIP) {
            userIP = getUserIP(req);
            console.log('前端未提供IP，从请求头获取:', userIP);
        } else {
            console.log('使用前端提供的真实IP:', userIP);
        }
        
        console.log(`查询 BIN: ${bin}`);
        console.log(`最终使用IP: ${userIP}`);

        const response = await apiClient.post(
            `https://bin-ip-checker.p.rapidapi.com/?bin=${bin}&ip=${userIP}`,
            {
                bin: bin,
                ip: userIP
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': 'bin-ip-checker.p.rapidapi.com',
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY || (() => { throw new Error('RAPIDAPI_KEY 环境变量未设置'); })()
                }
            }
        );

        console.log('API调用成功:', response.status);
        
        // 提取并格式化需要的数据
        const apiData = response.data;
        if (apiData.success && apiData.BIN) {
            const binData = apiData.BIN;
            const formattedData = {
                BIN: binData.number || bin,
                CardType: binData.brand || binData.scheme || '-',
                BankName: binData.issuer?.name || '-',
                CountryName: binData.country?.name || '-',
                CountryCode: binData.country?.alpha2 || '-',
                CardLevel: binData.level || '-',
                CardTypeDetail: binData.type || '-',
                Currency: binData.currency || '-',
                IsCommercial: binData.is_commercial || 'false',
                IsPrepaid: binData.is_prepaid || 'false',
                // 包含用户IP信息
                UserIP: userIP,
                // 原始数据，以防前端需要
                _original: apiData
            };
            res.json(formattedData);
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        console.error('API调用失败:', error.message);
        console.error('错误详情:', error.response?.status, error.response?.statusText);
        
        // 如果是网络或代理问题，返回模拟数据用于测试
        if (error.code === 'ECONNREFUSED' || error.message.includes('protocol mismatch')) {
            console.log('返回模拟数据用于测试');
            const { userIP: frontendIP } = req.body;
            const userIP = frontendIP || getUserIP(req);
            const mockData = {
                BIN: bin,
                CardType: 'VISA',
                BankName: 'TEST BANK',
                CountryName: 'United States',
                CountryCode: 'US',
                CardLevel: 'STANDARD',
                CardTypeDetail: 'CREDIT',
                Currency: 'USD',
                IsCommercial: 'false',
                IsPrepaid: 'false',
                UserIP: userIP
            };
            return res.json(mockData);
        }
        
        res.status(500).json({ 
            error: '查询失败，请稍后重试',
            details: error.response?.data || error.message
        });
    }
});

// 新增：获取用户IP的API端点（用于调试）
app.get('/api/get-ip', (req, res) => {
    const userIP = getUserIP(req);
    res.json({ 
        userIP: userIP,
        headers: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-real-ip': req.headers['x-real-ip'],
            'user-agent': req.headers['user-agent']
        },
        reqIP: req.ip,
        remoteAddress: req.connection?.remoteAddress || req.socket?.remoteAddress
    });
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 