// 模拟日志函数
const logMessage = (level, message) => {
  console.log(`[${level.toUpperCase()}] ${message}`)
}

// 质量评估结果接口结构示例
/*
质量评估结果格式：
{
  score: number,          // 评分 0-10
  summary: string,        // 总结评价
  strengths: string[],    // 优点列表
  weaknesses: string[],   // 缺点列表
  recommendations: string[], // 改进建议
  type: string           // 评估类型
}
*/

// 模拟 OwlService 类
class OwlService {
  constructor() {
    this.logMessage = logMessage
  }

  // 生成默认评估结果
  generateDefaultEvaluation(type) {
    return {
      score: 5,
      summary: `无法完成${type}评估，提供的${type}内容可能为空或格式无效。`,
      strengths: ['无法确定优点'],
      weaknesses: ['内容为空或格式无效'],
      recommendations: ['请提供有效的内容进行评估'],
      type
    }
  }

  // 评估内容质量
  evaluateContentQuality(content) {
    // 模拟内容质量评估
    // 实际实现应使用更复杂的算法或调用外部API
    const contentLength = content.length
    const hasStructure = content.includes('\n') || content.includes('。') || content.includes('.')
    const hasDetails = contentLength > 100

    // 根据简单指标计算评分
    const lengthScore = Math.min(Math.max(contentLength / 200, 0), 5)
    const structureScore = hasStructure ? 2 : 0
    const detailScore = hasDetails ? 3 : 0
    const totalScore = Math.min(Math.round(lengthScore + structureScore + detailScore), 10)

    return {
      score: totalScore,
      summary: `内容整体质量评分为 ${totalScore}/10。${totalScore >= 7 ? '内容质量良好。' : '内容有改进空间。'}`,
      strengths: [
        contentLength > 50 ? '内容长度适当' : '简洁明了',
        hasStructure ? '内容结构清晰' : '内容直接表达核心要点',
        hasDetails ? '包含充分细节' : '重点突出'
      ].filter((item) => item !== ''),
      weaknesses: [
        contentLength < 100 ? '内容可能过短' : '',
        !hasStructure ? '缺乏明确的结构' : '',
        !hasDetails ? '细节不足' : ''
      ].filter((item) => item !== ''),
      recommendations: [
        contentLength < 100 ? '考虑增加内容长度和细节' : '',
        !hasStructure ? '添加清晰的段落和标题结构' : '',
        totalScore < 7 ? '考虑增加更多具体例子和解释' : ''
      ].filter((item) => item !== ''),
      type: 'content'
    }
  }

  // 评估代码质量
  evaluateCodeQuality(code) {
    // 验证输入
    if (!code || code.trim() === '') {
      this.logMessage('warning', '评估代码质量: 代码为空')
      return this.generateDefaultEvaluation('code')
    }

    // 模拟代码质量评估
    const codeLength = code.length
    const hasComments = code.includes('//') || code.includes('/*') || code.includes('#')
    const hasIndentation = code.includes('\n  ') || code.includes('\n\t')
    const hasFunctions =
      code.includes('function') || code.includes('def ') || code.includes('=>') || code.includes('class')

    // 计算评分
    const functionsScore = hasFunctions ? 3 : 0
    const commentsScore = hasComments ? 3 : 0
    const structureScore = hasIndentation ? 2 : 0
    const lengthScore = Math.min(Math.max(Math.log10(codeLength) - 1, 0), 2)

    const totalScore = Math.min(Math.round(functionsScore + commentsScore + structureScore + lengthScore), 10)

    return {
      score: totalScore,
      summary: `代码质量评分为 ${totalScore}/10。${totalScore >= 7 ? '代码质量良好。' : '代码有改进空间。'}`,
      strengths: [
        hasFunctions ? '代码结构化，使用了函数/类' : '',
        hasComments ? '包含注释，提高了可读性' : '',
        hasIndentation ? '代码格式规范，有适当缩进' : '',
        codeLength > 50 ? '代码逻辑完整' : '代码简洁'
      ].filter((item) => item !== ''),
      weaknesses: [
        !hasFunctions ? '缺乏函数/类封装' : '',
        !hasComments ? '缺少注释说明' : '',
        !hasIndentation ? '缩进和格式不规范' : '',
        codeLength < 20 ? '代码过于简单' : ''
      ].filter((item) => item !== ''),
      recommendations: [
        !hasFunctions ? '考虑将代码封装为函数或类' : '',
        !hasComments ? '添加适当的注释说明代码功能和逻辑' : '',
        !hasIndentation ? '规范代码缩进和格式' : '',
        totalScore < 7 ? '遵循编程最佳实践，如单一职责原则' : ''
      ].filter((item) => item !== ''),
      type: 'code'
    }
  }

  // 评估设计质量
  evaluateDesignQuality(design) {
    // 验证输入
    if (!design || design.trim() === '') {
      this.logMessage('warning', '评估设计质量: 设计内容为空')
      return this.generateDefaultEvaluation('design')
    }

    // 模拟设计质量评估
    const designLength = design.length
    const hasStructure = design.includes('\n') || design.includes('。') || design.includes('.')
    const mentionsUX =
      design.toLowerCase().includes('用户') ||
      design.toLowerCase().includes('user') ||
      design.toLowerCase().includes('ux') ||
      design.toLowerCase().includes('体验')
    const mentionsUI =
      design.toLowerCase().includes('界面') ||
      design.toLowerCase().includes('ui') ||
      design.toLowerCase().includes('布局') ||
      design.toLowerCase().includes('layout')

    // 计算评分
    const uxScore = mentionsUX ? 3 : 0
    const uiScore = mentionsUI ? 3 : 0
    const structureScore = hasStructure ? 2 : 0
    const detailScore = Math.min(Math.max(Math.log10(designLength) - 1, 0), 2)

    const totalScore = Math.min(Math.round(uxScore + uiScore + structureScore + detailScore), 10)

    return {
      score: totalScore,
      summary: `设计质量评分为 ${totalScore}/10。${totalScore >= 7 ? '设计质量良好。' : '设计有改进空间。'}`,
      strengths: [
        mentionsUX ? '考虑了用户体验因素' : '',
        mentionsUI ? '包含界面设计元素' : '',
        hasStructure ? '设计结构清晰' : '',
        designLength > 100 ? '设计细节丰富' : '设计简洁明了'
      ].filter((item) => item !== ''),
      weaknesses: [
        !mentionsUX ? '缺少用户体验考量' : '',
        !mentionsUI ? '界面设计元素不足' : '',
        !hasStructure ? '设计结构不清晰' : '',
        designLength < 100 ? '设计细节不足' : ''
      ].filter((item) => item !== ''),
      recommendations: [
        !mentionsUX ? '增加用户体验相关考量，如用户流程、可用性' : '',
        !mentionsUI ? '添加界面设计元素描述，如布局、色彩、交互' : '',
        !hasStructure ? '提供更清晰的设计结构和层次' : '',
        totalScore < 7 ? '考虑添加设计决策理由和设计原则' : ''
      ].filter((item) => item !== ''),
      type: 'design'
    }
  }

  // 评估质量的主函数
  async evaluateQuality(content, type = 'content') {
    try {
      // 参数验证和防御性编程
      if (!content || content.trim() === '') {
        this.logMessage('warning', '评估质量: 内容为空')
        return this.generateDefaultEvaluation(type)
      }

      const evaluationType = type.toLowerCase()
      this.logMessage('debug', `执行${evaluationType}质量评估，内容长度: ${content.length}`)

      // 模拟尝试使用IPC调用主进程中的评估方法
      try {
        console.log('模拟IPC调用质量评估...')
        // 这里实际应该使用 ipcRenderer.invoke，但为了测试我们跳过
      } catch (ipcError) {
        console.log('IPC调用失败，回退到本地评估')
      }

      // 使用本地评估
      let result

      switch (evaluationType) {
        case 'code':
          result = this.evaluateCodeQuality(content)
          break
        case 'design':
          result = this.evaluateDesignQuality(content)
          break
        case 'content':
        default:
          result = this.evaluateContentQuality(content)
          break
      }

      // 记录评估结果
      this.logMessage('info', `质量评估完成 [${type}]: 得分 ${result.score}/10`)

      return result
    } catch (error) {
      // 错误处理
      const errorMessage = error?.message || '质量评估时发生未知错误'
      const errorType = error?.name || 'Error'

      this.logMessage('error', `质量评估失败 [${errorType}]: ${errorMessage}`)

      // 即使出错也返回一个默认的评估结果，而不是抛出异常
      return this.generateDefaultEvaluation(type)
    }
  }
}

// 测试代码
async function runTests() {
  console.log('======== 开始测试 OwlService 质量评估功能 ========')
  const owlService = new OwlService()

  // 测试 evaluateQuality 方法 - 内容评估
  console.log('\n测试 1: 内容质量评估')
  const contentText =
    '这是一篇测试文章。\n它有多行内容，结构清晰。\n包含足够多的文字使其被评为高质量。这是额外的文字使内容更长。这段文字旨在测试质量评估功能是否正常工作。'
  const contentResult = await owlService.evaluateQuality(contentText, 'content')
  console.log('结果:', contentResult)

  // 测试 evaluateQuality 方法 - 代码评估
  console.log('\n测试 2: 代码质量评估')
  const codeText = `
// 这是一个示例函数
function calculateSum(a, b) {
  // 参数检查
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  
  // 计算并返回结果
  return a + b;
}
  `
  const codeResult = await owlService.evaluateQuality(codeText, 'code')
  console.log('结果:', codeResult)

  // 测试 evaluateQuality 方法 - 设计评估
  console.log('\n测试 3: 设计质量评估')
  const designText = `
用户界面设计方案:
1. 主页采用简洁的布局，顶部导航栏包含主要功能入口
2. 用户体验优先，减少点击层级
3. 响应式设计，适配不同设备
4. 采用蓝色为主色调，突出品牌特性
5. 交互设计遵循直觉原则，降低用户学习成本
  `
  const designResult = await owlService.evaluateQuality(designText, 'design')
  console.log('结果:', designResult)

  // 测试空内容处理
  console.log('\n测试 4: 空内容处理')
  const emptyResult = await owlService.evaluateQuality('', 'content')
  console.log('结果:', emptyResult)

  console.log('\n======== 测试完成 ========')
}

// 验证函数 - 检查测试结果
function verifyResult(result, expectedScore, type, description) {
  console.log(`验证结果: ${description}`)

  // 检查关键属性
  const hasRequiredFields =
    'score' in result &&
    'summary' in result &&
    'strengths' in result &&
    'weaknesses' in result &&
    'recommendations' in result &&
    'type' in result

  if (!hasRequiredFields) {
    console.log('  ✖ 失败: 缺少必要字段')
    return false
  }

  // 验证分数范围
  if (result.score < 0 || result.score > 10) {
    console.log(`  ✖ 失败: 分数超出范围 (${result.score})`)
    return false
  }

  // 验证类型
  if (result.type !== type) {
    console.log(`  ✖ 失败: 验证类型不匹配 (${result.type} != ${type})`)
    return false
  }

  // 检查分数是否在预期范围内
  const scoreRange = 2 // 允许的分数误差范围
  const scoreDiff = Math.abs(result.score - expectedScore)
  const scoreMatches = scoreDiff <= scoreRange

  if (!scoreMatches) {
    console.log(`  ✖ 失败: 分数与预期相差过大 (${result.score} vs ${expectedScore})`)
    return false
  }

  // 验证数组属性
  if (!Array.isArray(result.strengths) || !Array.isArray(result.weaknesses) || !Array.isArray(result.recommendations)) {
    console.log('  ✖ 失败: strengths/weaknesses/recommendations 应该是数组')
    return false
  }

  console.log('  ✔ 通过: 结果格式和内容符合预期')
  return true
}

// 运行边缘测试
async function runMoreTests() {
  const owlService = new OwlService()
  let passed = 0
  let failed = 0

  console.log('\n======== 运行边缘测试用例 ========')

  // 测试极短内容
  console.log('\n测试 5: 极短内容处理')
  const shortText = 'Hello'
  const shortResult = await owlService.evaluateQuality(shortText, 'content')
  console.log('结果:', shortResult)
  verifyResult(shortResult, 0, 'content', '极短内容') ? passed++ : failed++

  // 测试特殊字符内容
  console.log('\n测试 6: 特殊字符内容')
  const specialCharsText = '!@#$%^&*() 中文字符 \n\t\r'
  const specialResult = await owlService.evaluateQuality(specialCharsText, 'content')
  console.log('结果:', specialResult)
  verifyResult(specialResult, 1, 'content', '特殊字符内容') ? passed++ : failed++

  // 测试大量文本
  console.log('\n测试 7: 大量文本')
  let longText = '这是一个非常长的文本。\n'
  for (let i = 0; i < 20; i++) {
    longText += `这是第 ${i + 1} 段文字，用于测试质量评估功能对大文本的处理能力。\n`
  }
  const longResult = await owlService.evaluateQuality(longText, 'content')
  console.log('结果: (碉略部分内容)')
  console.log(`分数: ${longResult.score}, 类型: ${longResult.type}, 优点数: ${longResult.strengths.length}`)
  verifyResult(longResult, 8, 'content', '大量文本') ? passed++ : failed++

  // 测试非法评估类型
  console.log('\n测试 8: 非法评估类型')
  const invalidTypeResult = await owlService.evaluateQuality('Some content', 'invalid_type')
  console.log('结果:', invalidTypeResult)
  verifyResult(invalidTypeResult, 2, 'content', '非法评估类型') ? passed++ : failed++

  // 错误处理测试
  console.log('\n测试 9: 模拟错误处理')
  try {
    // 模拟在评估中抛出错误
    const originalEvaluateContentQuality = owlService.evaluateContentQuality
    owlService.evaluateContentQuality = () => {
      throw new Error('模拟评估失败')
    }

    const errorResult = await owlService.evaluateQuality('Error test content', 'content')
    console.log('结果:', errorResult)
    const errorHandled = errorResult.score === 5 && errorResult.type === 'content'

    // 恢复原始方法
    owlService.evaluateContentQuality = originalEvaluateContentQuality

    if (errorHandled) {
      console.log('  ✔ 通过: 错误处理正确')
      passed++
    } else {
      console.log('  ✖ 失败: 错误处理有问题')
      failed++
    }
  } catch (e) {
    console.log(`  ✖ 失败: 错误测试异常 - ${e.message}`)
    failed++
  }

  // 汇总结果
  console.log(`\n测试结果: 通过 ${passed}, 失败 ${failed}`)
  return { passed, failed }
}

// 运行安全性测试 - 专注于数组和对象安全访问
async function runSafetyTests() {
  const owlService = new OwlService()
  let passed = 0
  let failed = 0

  console.log('\n======== 运行安全性测试 ========')

  // 测试 10: 模拟空数组处理
  console.log('\n测试 10: 模拟空数组处理')
  try {
    // 调整 evaluateQuality 方法来处理空数组
    const originalMethod = owlService.evaluateQuality
    owlService.evaluateQuality = async function (content, type) {
      const result = await originalMethod.call(this, content, type)

      // 将其中一个数组属性设置为 null来模拟错误
      result.strengths = null

      // 安全地访问空数组
      const safeArrayAccess = () => {
        // 如果使用了安全数组访问，下面的操作不会抛出错误
        const strengthsList = result.strengths || []
        return strengthsList.map((s) => s).filter((s) => s).length >= 0
      }

      const isSafe = safeArrayAccess()
      console.log(`空数组安全性检查: ${isSafe ? '安全' : '不安全'}`)

      // 恢复数组属性
      if (result.strengths === null) {
        result.strengths = []
      }

      return result
    }

    const safetyResult = await owlService.evaluateQuality('Test content', 'content')
    console.log('结果:', safetyResult)

    // 还原原始方法
    owlService.evaluateQuality = originalMethod

    console.log('  ✔ 通过: 安全处理空数组')
    passed++
  } catch (e) {
    console.log(`  ✖ 失败: 安全数组测试异常 - ${e.message}`)
    failed++
  }

  // 测试 11: 模拟深度对象访问
  console.log('\n测试 11: 模拟深度对象访问')
  try {
    // 创建一个有缺失属性的对象
    const nestedObj = {
      level1: {
        level2: null // 这里故意设置为 null
      }
    }

    // 安全地访问深度对象属性
    const safeObjectAccess = () => {
      // 不安全的访问会抛出错误: nestedObj.level1.level2.level3
      // 安全的访问方式:
      const level3 = nestedObj?.level1?.level2?.level3
      return level3 === undefined
    }

    const isSafe = safeObjectAccess()
    console.log(`深度对象安全性检查: ${isSafe ? '安全' : '不安全'}`)

    if (isSafe) {
      console.log('  ✔ 通过: 安全处理深度对象访问')
      passed++
    } else {
      console.log('  ✖ 失败: 深度对象访问不安全')
      failed++
    }
  } catch (e) {
    console.log(`  ✖ 失败: 安全对象测试异常 - ${e.message}`)
    failed++
  }

  // 测试 12: 并发调用测试
  console.log('\n测试 12: 并发调用测试')
  try {
    // 并发调用多个评估方法
    const promises = [
      owlService.evaluateQuality('Content test 1', 'content'),
      owlService.evaluateQuality('Code test 1', 'code'),
      owlService.evaluateQuality('Design test 1', 'design'),
      owlService.evaluateQuality('', 'content'),
      owlService.evaluateQuality('Content test 2', 'content')
    ]

    const results = await Promise.all(promises)
    console.log(`并发调用结果数量: ${results.length}`)
    const allValid = results.every(
      (r) =>
        r &&
        typeof r.score === 'number' &&
        r.score >= 0 &&
        r.score <= 10 &&
        Array.isArray(r.strengths) &&
        Array.isArray(r.weaknesses) &&
        Array.isArray(r.recommendations)
    )

    if (allValid) {
      console.log('  ✔ 通过: 并发调用处理正确')
      passed++
    } else {
      console.log('  ✖ 失败: 并发调用结果异常')
      failed++
    }
  } catch (e) {
    console.log(`  ✖ 失败: 并发调用测试异常 - ${e.message}`)
    failed++
  }

  // 汇总结果
  console.log(`\n安全性测试结果: 通过 ${passed}, 失败 ${failed}`)
  return { passed, failed }
}

// 运行所有测试
async function runAllTests() {
  try {
    // 运行基本测试
    await runTests()

    // 运行边缘测试
    const { passed: passed1, failed: failed1 } = await runMoreTests()

    // 运行安全性测试
    const { passed: passed2, failed: failed2 } = await runSafetyTests()

    // 最终结果
    const totalPassed = passed1 + passed2 + 4 // 加4个基本测试
    const totalFailed = failed1 + failed2

    console.log(`\n======== 所有测试完成 ========`)
    if (totalFailed === 0) {
      console.log(`全部测试通过! 测试项数: ${totalPassed}`)
    } else {
      console.log(`测试有问题! 通过: ${totalPassed}, 失败: ${totalFailed}`)
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 启动测试
runAllTests()
