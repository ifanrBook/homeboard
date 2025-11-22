document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('status-message');
    const spinner = document.querySelector('.spinner');
    const cancelBtn = document.getElementById('cancel-btn');

    let isCancelled = false;
    let redirectTimer;

    const urls = window.lineConfig && window.lineConfig.urls ? window.lineConfig.urls : [];

    if (urls.length === 0) {
        showError('未配置检测线路，请检查配置文件。');
        return;
    }

    const startDetection = async () => {
        let completedCount = 0;
        const total = urls.length;
        let hasWinner = false;

        statusMessage.innerHTML = `<span style="color: var(--primary-color);">正在检测主线路 (0/${total})...</span>`;
        statusMessage.classList.remove('hidden');

        try {
            const requests = urls.map(url => {
                return fetch(url, { mode: 'no-cors', method: 'HEAD' })
                    .then(() => {
                        return url;
                    })
                    .catch(err => {
                        throw err;
                    })
                    .finally(() => {
                        if (!hasWinner && !isCancelled) {
                            completedCount++;
                            statusMessage.innerHTML = `<span style="color: var(--primary-color);">正在检测主线路 (${completedCount}/${total})...</span>`;
                        }
                    });
            });

            const fastestUrlPromise = Promise.any(requests);

            const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1500));

            const [fastestUrl] = await Promise.all([fastestUrlPromise, minDelayPromise]);

            hasWinner = true;
            if (isCancelled) return;

            handleSuccess(fastestUrl);

        } catch (error) {
            if (isCancelled) return;
            console.error('All lines failed:', error);
            showError('所有线路检测失败，请检查网络连接。');
        }
    };

    function handleSuccess(url) {
        statusMessage.innerHTML = `
            <span class="check-icon">✓</span>
            <span class="success-text">检测成功，<a href="${url}" class="link">正在跳转...</a></span>
        `;
        statusMessage.classList.remove('hidden');

        redirectTimer = setTimeout(() => {
            if (!isCancelled) {
                window.location.href = url;
            }
        }, 1000);
    }

    function showError(msg) {
        statusMessage.innerHTML = `<span style="color: #ff4d4f;">${msg}</span>`;
        statusMessage.classList.remove('hidden');
        spinner.style.borderTopColor = '#ff4d4f';
        spinner.style.animation = 'none';
    }

    cancelBtn.addEventListener('click', () => {
        isCancelled = true;
        clearTimeout(redirectTimer);

        if (confirm('确定要取消跳转吗？')) {
            statusMessage.innerHTML = '<span style="color: #999;">已取消跳转</span>';
            statusMessage.classList.remove('hidden');
            spinner.style.animation = 'none';
            spinner.style.borderTop = '4px solid #999';
            cancelBtn.disabled = true;
            cancelBtn.style.cursor = 'not-allowed';
        } else {
            isCancelled = false;
        }
    });

    startDetection();
});
