/**
 * 测试OWL HTTP请求IPC处理程序
 * 用于验证owl:http-request处理程序是否正常工作
 */

const { ipcRenderer } = require('electron');

// 测试HTTP GET请求
async function testHttpGet() {
  console.log('测试HTTP GET请求...');
  try {
    const result = await ipcRenderer.invoke('owl:http-request', [{
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: {
        'User-Agent': 'Cherry-Studio-Test',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }]);
    
    console.log('GET请求成功:', result);
    return true;
  } catch (error) {
    console.error('GET请求失败:', error);
    return false;
  }
}

// 测试HTTP POST请求
async function testHttpPost() {
  console.log('测试HTTP POST请求...');
  try {
    const result = await ipcRenderer.invoke('owl:http-request', [{
      method: 'POST',
      url: 'https://httpbin.org/post',
      headers: {
        'User-Agent': 'Cherry-Studio-Test',
        'Content-Type': 'application/json'
      },
      data: {
        test: 'value',
        time: new Date().toISOString()
      },
      timeout: 10000
    }]);
    
    console.log('POST请求成功:', result);
    return true;
  } catch (error) {
    console.error('POST请求失败:', error);
    return false;
  }
}

// 测试错误处理
async function testErrorHandling() {
  console.log('测试错误处理...');
  try {
    const result = await ipcRenderer.invoke('owl:http-request', [{
      method: 'GET',
      url: 'https://this-domain-does-not-exist-123456789.com',
      timeout: 5000
    }]);
    
    console.log('错误处理测试结果:', result);
    return result.error === true; // 应该返回error=true
  } catch (error) {
    console.error('错误处理测试异常:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试owl:http-request处理程序...');
  
  const getResult = await testHttpGet();
  const postResult = await testHttpPost();
  const errorResult = await testErrorHandling();
  
  console.log('测试结果汇总:');
  console.log('- GET测试:', getResult ? '成功' : '失败');
  console.log('- POST测试:', postResult ? '成功' : '失败');
  console.log('- 错误处理测试:', errorResult ? '成功' : '失败');
  
  const allSuccess = getResult && postResult && errorResult;
  console.log(`总体结果: ${allSuccess ? '所有测试通过' : '部分测试失败'}`);
}

// 测试运行
runAllTests().catch(console.error);
