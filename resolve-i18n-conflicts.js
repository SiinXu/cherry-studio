const fs = require('fs')
const path = require('path')

const localesDir = path.join(__dirname, 'src/renderer/src/i18n/locales')
const files = fs.readdirSync(localesDir).filter((file) => file.endsWith('.json'))

// 处理单个文件的冲突
function resolveConflicts(fileContent) {
  // 使用正则表达式查找所有的冲突块
  const conflictRegex = /<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> upstream\/main/g

  // 替换每个冲突块，将两边的内容合并
  return fileContent.replace(conflictRegex, (match, headContent, upstreamContent) => {
    // 去掉每行开头的缩进和结尾的逗号
    const headLines = headContent
      .trim()
      .split('\n')
      .map((line) => line.trim())
    const upstreamLines = upstreamContent
      .trim()
      .split('\n')
      .map((line) => line.trim())

    // 找出结尾的逗号
    const lastHeadLine = headLines[headLines.length - 1]
    const hasTrailingCommaHead = lastHeadLine.endsWith(',')

    // 准备合并的内容
    let mergedContent = headContent

    // 如果HEAD内容末尾没有逗号，并且有内容，则添加逗号
    if (!hasTrailingCommaHead && headLines.length > 0 && headLines[0] !== '') {
      mergedContent = mergedContent.trimEnd() + ',\n'
    }

    // 添加上游内容（如果不为空）
    if (upstreamLines.length > 0 && upstreamLines[0] !== '') {
      mergedContent += upstreamContent
    }

    return mergedContent
  })
}

// 处理所有的本地化文件
files.forEach((file) => {
  const filePath = path.join(localesDir, file)

  // 读取文件内容
  let content = fs.readFileSync(filePath, 'utf8')

  // 检查文件是否包含冲突标记
  if (content.includes('<<<<<<< HEAD')) {
    console.log(`处理文件：${file}`)

    // 解决冲突
    const resolvedContent = resolveConflicts(content)

    // 将结果写回文件
    fs.writeFileSync(filePath, resolvedContent, 'utf8')

    console.log(`✅ 已完成对 ${file} 的冲突解决`)
  }
})

console.log('所有本地化文件的冲突解决完成！')
