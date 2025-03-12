import { owlService } from './src/renderer/src/services/OwlService'
import { safeGet } from './src/renderer/src/utils/safeObjectUtils'

console.log('使用已导出的OWL服务实例')

// 测试函数
async function runTests() {
  console.log('开始测试OWL服务真实API调用...')

  try {
    // 测试质量评估
    console.log('\n==== 测试质量评估功能 ====')

    // 1. 测试内容质量评估
    const contentText = '这是一段测试内容，用于评估质量评估功能是否正常工作。Cherry Studio是一个强大的AI应用开发平台。'
    console.log('\n-- 内容质量评估 --')
    try {
      const contentResult = await owlService.evaluateQuality(contentText, 'content')
      console.log('内容评估结果:')
      console.log(`得分: ${safeGet(contentResult, 'score')}/10`)
      console.log('评估摘要:', safeGet(contentResult, 'summary'))
      const strengths = safeGet(contentResult, 'strengths') || []
      console.log('优点:', strengths.length > 0 ? strengths.join('\n - ') : '无')
      const weaknesses = safeGet(contentResult, 'weaknesses') || []
      console.log('弱点:', weaknesses.length > 0 ? weaknesses.join('\n - ') : '无')
    } catch (err) {
      console.error('内容评估错误:', err)
    }

    // 2. 测试代码质量评估
    const codeText = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

// 测试函数
const items = [
  { name: 'Product 1', price: 10, quantity: 2 },
  { name: 'Product 2', price: 15, quantity: 1 },
  { name: 'Product 3', price: 20, quantity: 3 }
];

console.log('Total price:', calculateTotal(items));
`
    console.log('\n-- 代码质量评估 --')
    try {
      const codeResult = await owlService.evaluateQuality(codeText, 'code')
      console.log('代码评估结果:')
      console.log(`得分: ${safeGet(codeResult, 'score')}/10`)
      console.log('评估摘要:', safeGet(codeResult, 'summary'))
      const codeStrengths = safeGet(codeResult, 'strengths') || []
      console.log('优点:', codeStrengths.length > 0 ? codeStrengths.join('\n - ') : '无')
      const codeWeaknesses = safeGet(codeResult, 'weaknesses') || []
      console.log('弱点:', codeWeaknesses.length > 0 ? codeWeaknesses.join('\n - ') : '无')
    } catch (err) {
      console.error('代码评估错误:', err)
    }

    // 3. 测试设计质量评估
    const designText =
      '该设计方案是一个响应式网站界面，采用现代清新的开发风格。用户界面元素节奉灵活性与可操作性平衡，并且每个交互组件都经过了付出体验研究和设计复盘。启用了自适应布局和动态主题切换。'
    console.log('\n-- 设计质量评估 --')
    try {
      const designResult = await owlService.evaluateQuality(designText, 'design')
      console.log('设计评估结果:')
      console.log(`得分: ${safeGet(designResult, 'score')}/10`)
      console.log('评估摘要:', safeGet(designResult, 'summary'))
      const designStrengths = safeGet(designResult, 'strengths') || []
      console.log('优点:', designStrengths.length > 0 ? designStrengths.join('\n - ') : '无')
      const designWeaknesses = safeGet(designResult, 'weaknesses') || []
      console.log('弱点:', designWeaknesses.length > 0 ? designWeaknesses.join('\n - ') : '无')
    } catch (err) {
      console.error('设计评估错误:', err)
    }

    console.log('\n所有测试完成!')
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
runTests()
  .then(() => {
    console.log('测试程序执行完毕')
  })
  .catch((err) => {
    console.error('测试运行失败:', err)
  })
