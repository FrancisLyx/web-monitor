<template>
    <div class="debug-container">
        <h1>Web Monitor Debug Console</h1>

        <div class="section">
            <h2>🚀 Basic Functions</h2>
            <button @click="testBasicTracking">Test Basic Tracking</button>
            <button @click="testUserIdentification">Test User Identification</button>
            <button @click="testSessionInfo">Test Session Info</button>
            <button @click="testSingletonPattern">Test Singleton Pattern</button>
        </div>

        <div class="section">
            <h2>🐛 Error Tracking</h2>
            <button @click="triggerJSError">Trigger JS Error</button>
            <button @click="triggerPromiseRejection">Trigger Promise Rejection</button>
            <button @click="triggerResourceError">Trigger Resource Error</button>
            <button @click="trackManualError">Track Manual Error</button>
        </div>

        <div class="section">
            <h2>📊 Performance Tracking</h2>
            <button @click="testPerformanceMarks">Test Performance Marks</button>
            <button @click="testPerformanceMeasures">Test Performance Measures</button>
        </div>

        <div class="section">
            <h2>🌐 Network Tracking</h2>
            <button @click="testFetchRequest">Test Fetch Request</button>
            <button @click="testXHRRequest">Test XHR Request</button>
            <button @click="testFailedRequest">Test Failed Request</button>
        </div>

        <div class="section">
            <h2>📄 Page Tracking</h2>
            <button @click="testPageView">Test Manual Page View</button>
            <button @click="testRouteChange">Simulate Route Change</button>
        </div>

        <div class="section">
            <h2>🔧 Queue & Config</h2>
            <button @click="testQueueOperations">Test Queue Operations</button>
            <button @click="testConfigUpdate">Test Config Update</button>
            <button @click="forceFlush">Force Flush Events</button>
        </div>

        <div class="section">
            <h2>📋 Status</h2>
            <div class="status-info">
                <p><strong>Session ID:</strong> {{ sessionId }}</p>
                <p><strong>User ID:</strong> {{ userId || 'Not set' }}</p>
                <p><strong>Events in Queue:</strong> {{ queueSize }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { createWebMonitor, getWebMonitorConfig, getWebMonitorInstance, recreateWebMonitorInstance } from '@web-monitor/log'
import { onMounted, ref } from 'vue'


// 响应式状态
const sessionId = ref('')
const userId = ref('')
const queueSize = ref(0)

// 创建 WebMonitor 实例
const webMonitor = createWebMonitor({
    serverUrl: 'http://localhost:3000/flush', // 使用 httpbin 作为测试端点
    appId: 'debug-demo',
    enableConsoleLog: true, // 开启控制台日志
    flushInterval: 5000, // 5秒刷新一次
    maxQueueSize: 50,
    enableAutoFlush: true
})

// 初始化
webMonitor.init()

onMounted(() => {
    // 更新状态信息
    sessionId.value = webMonitor.getSessionId()
    updateQueueSize()

    console.log('🎉 WebMonitor Debug Console Initialized')
    console.log('📊 WebMonitor Instance:', webMonitor)
    console.log('⚙️ Config:', webMonitor.getConfig())
})

// 更新队列大小
const updateQueueSize = () => {
    // 这里需要暴露队列大小的方法，暂时模拟
    queueSize.value = Math.floor(Math.random() * 10)
}

// ========== 基础功能测试 ==========
const testBasicTracking = () => {
    console.log('🔍 Testing Basic Tracking...')

    webMonitor.trackCustomEvent({
        action: 'button_click',
        category: 'user_interaction',
        label: 'basic_tracking_test',
        value: 1,
        customData: {
            timestamp: new Date().toISOString(),
            testType: 'basic_tracking'
        }
    })

    console.log('✅ Basic tracking event sent')
    updateQueueSize()
}

const testUserIdentification = () => {
    console.log('👤 Testing User Identification...')

    const testUserId = `user_${Date.now()}`
    webMonitor.setUserId(testUserId)
    userId.value = testUserId

    webMonitor.trackCustomEvent({
        action: 'user_identified',
        userId: testUserId,
        customData: {
            identificationTime: new Date().toISOString()
        }
    })

    console.log('✅ User identified:', testUserId)
    updateQueueSize()
}

const testSessionInfo = () => {
    console.log('🔗 Testing Session Info...')

    const currentUserId = webMonitor.getUserId()
    const currentSessionId = webMonitor.getSessionId()

    console.log('📋 Session Info:', {
        sessionId: currentSessionId,
        userId: currentUserId
    })

    webMonitor.trackCustomEvent({
        action: 'session_info_check',
        customData: {
            sessionId: currentSessionId,
            userId: currentUserId,
            checkTime: new Date().toISOString()
        }
    })

    updateQueueSize()
}

const testSingletonPattern = () => {
    console.log('🔄 Testing Singleton Pattern...')
    console.log('='.repeat(50))

    // 1. 测试相同配置的重复调用
    console.log('📋 Test 1: Same config repeated calls')
    const sameConfig = {
        serverUrl: 'https://httpbin.org/post',
        appId: 'debug-demo'
    }

    const monitor1 = createWebMonitor(sameConfig)
    const monitor2 = createWebMonitor(sameConfig) // 相同配置

    console.log('🔍 Same config instances equal?', monitor1 === monitor2)
    console.log('-'.repeat(30))

    // 2. 测试不同配置的重复调用
    console.log('📋 Test 2: Different config calls')
    const differentConfig = {
        serverUrl: 'https://different-endpoint.com',
        appId: 'different-app'
    }

    const monitor3 = createWebMonitor(differentConfig) // 不同配置
    console.log('🔍 Different config instance equal?', monitor1 === monitor3)
    console.log('-'.repeat(30))

    // 3. 测试获取当前配置
    console.log('📋 Test 3: Get current config')
    const currentConfig = getWebMonitorConfig()
    console.log('⚙️ Current stored config:', currentConfig)
    console.log('-'.repeat(30))

    // 4. 测试强制重新创建
    console.log('📋 Test 4: Force recreate instance')
    const oldSessionId = webMonitor.getSessionId()
    const newMonitor = recreateWebMonitorInstance({
        serverUrl: 'https://recreated-endpoint.com',
        appId: 'recreated-app'
    })
    const newSessionId = newMonitor.getSessionId()

    console.log('🔍 Session ID changed after recreate?', oldSessionId !== newSessionId)
    console.log('🔍 Old session ID:', oldSessionId)
    console.log('🔍 New session ID:', newSessionId)
    console.log('-'.repeat(30))

    // 5. 测试获取实例
    console.log('📋 Test 5: Get existing instance')
    const retrievedInstance = getWebMonitorInstance()
    console.log('🔍 Retrieved instance same as new?', newMonitor === retrievedInstance)
    console.log('-'.repeat(30))

    // 6. 记录测试结果
    newMonitor.trackCustomEvent({
        action: 'singleton_comprehensive_test',
        customData: {
            sameConfigTest: monitor1 === monitor2,
            differentConfigTest: monitor1 === monitor3,
            recreateTest: oldSessionId !== newSessionId,
            retrieveTest: newMonitor === retrievedInstance,
            testTime: new Date().toISOString()
        }
    })

    console.log('✅ Comprehensive singleton test completed')
    console.log('='.repeat(50))
    updateQueueSize()
}

// ========== 错误跟踪测试 ==========
const triggerJSError = () => {
    console.log('💥 Triggering JavaScript Error...')

    setTimeout(() => {
        try {
            // 故意触发错误
            (window as any).nonExistentFunction()
        } catch (error) {
            console.log('✅ JS Error caught and should be tracked')
        }
    }, 100)
}

const triggerPromiseRejection = () => {
    console.log('🚫 Triggering Promise Rejection...')

    // 创建一个被拒绝的 Promise
    Promise.reject(new Error('Test Promise Rejection')).catch(() => {
        console.log('✅ Promise rejection should be tracked')
    })

    // 也创建一个未处理的拒绝
    setTimeout(() => {
        Promise.reject(new Error('Unhandled Promise Rejection Test'))
    }, 100)
}

const triggerResourceError = () => {
    console.log('📸 Triggering Resource Error...')

    // 创建一个不存在的图片来触发资源加载错误
    const img = document.createElement('img')
    img.src = 'https://non-existent-domain-12345.com/image.jpg'
    img.style.display = 'none'
    document.body.appendChild(img)

    setTimeout(() => {
        document.body.removeChild(img)
        console.log('✅ Resource error should be tracked')
    }, 1000)
}

const trackManualError = () => {
    console.log('🔧 Tracking Manual Error...')

    const testError = new Error('This is a manual test error')
    testError.stack = 'Manual Error Stack Trace'

    webMonitor.trackError(testError, {
        context: 'manual_test',
        component: 'HelloWorld',
        action: 'manual_error_tracking',
        customData: {
            errorType: 'manual',
            testTime: new Date().toISOString()
        }
    })

    console.log('✅ Manual error tracked')
    updateQueueSize()
}

// ========== 性能跟踪测试 ==========
const testPerformanceMarks = () => {
    console.log('⏱️ Testing Performance Marks...')

    webMonitor.mark('test-start')

    setTimeout(() => {
        webMonitor.mark('test-middle')

        setTimeout(() => {
            webMonitor.mark('test-end')
            console.log('✅ Performance marks created: test-start, test-middle, test-end')
        }, 100)
    }, 50)
}

const testPerformanceMeasures = () => {
    console.log('📏 Testing Performance Measures...')

    webMonitor.mark('measure-start')

    // 模拟一些工作
    const startTime = Date.now()
    while (Date.now() - startTime < 10) {
        // 忙等待 10ms
    }

    webMonitor.mark('measure-end')
    webMonitor.measure('test-measure', 'measure-start', 'measure-end')

    console.log('✅ Performance measure created: test-measure')
}

// ========== 网络跟踪测试 ==========
const testFetchRequest = async () => {
    console.log('🌐 Testing Fetch Request...')

    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
        const data = await response.json()
        console.log('✅ Fetch request completed:', data.title)
    } catch (error) {
        console.log('❌ Fetch request failed:', error)
    }
}

const testXHRRequest = () => {
    console.log('📡 Testing XHR Request...')

    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts/2')
    xhr.onload = () => {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText)
            console.log('✅ XHR request completed:', data.title)
        }
    }
    xhr.onerror = () => {
        console.log('❌ XHR request failed')
    }
    xhr.send()
}

const testFailedRequest = async () => {
    console.log('🚫 Testing Failed Request...')

    try {
        await fetch('https://non-existent-api-12345.com/data')
    } catch (error) {
        console.log('✅ Failed request should be tracked:', error)
    }
}

// ========== 页面跟踪测试 ==========
const testPageView = () => {
    console.log('📄 Testing Manual Page View...')

    webMonitor.trackPageView('/debug/test-page', 'Test Page Title')
    console.log('✅ Manual page view tracked')
    updateQueueSize()
}

const testRouteChange = () => {
    console.log('🔄 Simulating Route Change...')

    // 模拟路由变化
    const newUrl = '/debug/new-route'
    history.pushState({}, 'New Route', newUrl)

    setTimeout(() => {
        history.back()
        console.log('✅ Route change simulation completed')
    }, 1000)
}

// ========== 队列和配置测试 ==========
const testQueueOperations = () => {
    console.log('📦 Testing Queue Operations...')

    // 添加多个事件到队列
    for (let i = 0; i < 5; i++) {
        webMonitor.trackCustomEvent({
            action: 'queue_test',
            index: i,
            customData: {
                batchTest: true,
                timestamp: new Date().toISOString()
            }
        })
    }

    console.log('✅ Added 5 events to queue')
    updateQueueSize()
}

const testConfigUpdate = () => {
    console.log('⚙️ Testing Config Update...')

    const currentConfig = webMonitor.getConfig()
    console.log('📋 Current Config:', currentConfig)

    webMonitor.updateConfig({
        enableConsoleLog: !currentConfig.enableConsoleLog,
        flushInterval: 3000
    })

    const newConfig = webMonitor.getConfig()
    console.log('📋 Updated Config:', newConfig)
    console.log('✅ Config updated')
}

const forceFlush = async () => {
    console.log('🚀 Force Flushing Events...')

    try {
        await webMonitor.flush()
        console.log('✅ Events flushed successfully')
        updateQueueSize()
    } catch (error) {
        console.log('❌ Flush failed:', error)
    }
}

// 定期更新队列大小
setInterval(updateQueueSize, 2000)
</script>

<style scoped>
.debug-container {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.section {
    margin: 30px 0;
    padding: 20px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    background: #f8f9fa;
}

.section h2 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 18px;
}

button {
    margin: 5px 10px 5px 0;
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

button:hover {
    background: #0056b3;
}

button:active {
    transform: translateY(1px);
}

.status-info {
    background: #e9ecef;
    padding: 15px;
    border-radius: 4px;
    font-family: monospace;
}

.status-info p {
    margin: 5px 0;
    font-size: 14px;
}

h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 30px;
}
</style>
