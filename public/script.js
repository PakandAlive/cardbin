document.addEventListener('DOMContentLoaded', function() {
    const binInput = document.getElementById('binInput');
    const checkBtn = document.getElementById('checkBtn');
    const binButtons = document.querySelectorAll('.bin-btn');
    const loading = document.getElementById('loading');

    // 存储用户真实IP
    let userRealIP = null;

    // 获取用户真实IP
    async function getUserRealIP() {
        try {
            // 使用免费的IP检测服务
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            userRealIP = data.ip;
            console.log('获取到用户真实IP:', userRealIP);
            return userRealIP;
        } catch (error) {
            console.error('获取IP失败:', error);
            // 备选方案
            try {
                const response2 = await fetch('https://httpbin.org/ip');
                const data2 = await response2.json();
                userRealIP = data2.origin.split(',')[0].trim();
                console.log('备选方案获取IP:', userRealIP);
                return userRealIP;
            } catch (error2) {
                console.error('备选方案也失败:', error2);
                return null;
            }
        }
    }

    // 页面加载时获取IP
    getUserRealIP();

    // 只允许输入数字
    binInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 6) {
            this.value = this.value.slice(0, 6);
        }
    });

    // 最近查询BIN号的最大数量
    const MAX_RECENT_BINS = 16;
    const binButtonsContainer = document.querySelector('.bin-buttons');

    // 读取最近查询的BIN号
    function getRecentBins() {
        const bins = localStorage.getItem('recentBins');
        if (!bins) return [];
        try {
            return JSON.parse(bins);
        } catch {
            return [];
        }
    }

    // 保存最近查询的BIN号
    function saveRecentBin(bin) {
        let bins = getRecentBins();
        // 移除已存在的
        bins = bins.filter(b => b !== bin);
        // 添加到最前面
        bins.unshift(bin);
        // 限制数量
        if (bins.length > MAX_RECENT_BINS) bins = bins.slice(0, MAX_RECENT_BINS);
        localStorage.setItem('recentBins', JSON.stringify(bins));
    }

    // 渲染最近BIN按钮
    function renderRecentBinButtons() {
        const bins = getRecentBins();
        binButtonsContainer.innerHTML = '';
        bins.forEach(bin => {
            const btn = document.createElement('button');
            btn.className = 'recent-bin-btn';
            btn.textContent = bin;
            btn.setAttribute('data-bin', bin);
            btn.addEventListener('click', function() {
                binInput.value = bin;
                checkBIN(bin);
            });
            addButtonAnimation(btn);
            binButtonsContainer.appendChild(btn);
        });
    }

    // 查询按钮点击事件
    checkBtn.addEventListener('click', function() {
        const bin = binInput.value.trim();
        if (bin.length < 6) {
            alert('请输入完整的6位BIN号码');
            return;
        }
        checkBIN(bin);
    });

    // 回车键查询
    binInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkBtn.click();
        }
    });

    // 查询BIN信息
    async function checkBIN(bin) {
        try {
            loading.classList.remove('hidden');
            if (!userRealIP) {
                await getUserRealIP();
            }
            const requestBody = { 
                bin: bin,
                userIP: userRealIP
            };
            const response = await fetch('/api/check-bin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            loading.classList.add('hidden');
            if (response.ok) {
                // 保存到最近BIN
                saveRecentBin(bin);
                renderRecentBinButtons();
                // 跳转到结果页面
                const encodedData = encodeURIComponent(JSON.stringify(data));
                window.location.href = `/result?data=${encodedData}`;
            } else {
                alert(data.error || '查询失败，请稍后重试');
            }
        } catch (error) {
            loading.classList.add('hidden');
            alert('网络错误，请检查网络连接后重试');
        }
    }

    // 添加输入框焦点效果
    binInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });

    binInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });

    // 按钮动画效果
    function addButtonAnimation(button) {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });

        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }

    // 为所有按钮添加动画
    binButtons.forEach(addButtonAnimation);
    addButtonAnimation(checkBtn);

    // 页面加载时渲染最近BIN按钮
    renderRecentBinButtons();
}); 