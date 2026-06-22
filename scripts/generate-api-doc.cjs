#!/usr/bin/env node

/**
 * OpenAPI 文档生成与验证脚本
 * 
 * 用法：
 *   node scripts/generate-api-doc.js validate  - 验证 OpenAPI 文档
 *   node scripts/generate-api-doc.js convert   - 转换为 YAML 格式
 *   node scripts/generate-api-doc.js serve      - 启动本地预览服务器
 */

const fs = require('fs');
const path = require('path');

const OPENAPI_PATH = path.join(__dirname, '../docs/openapi.json');
const YAML_PATH = path.join(__dirname, '../docs/openapi.yaml');

// 简单的 JSON 转 YAML
function jsonToYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'boolean') {
    return obj.toString();
  }

  if (typeof obj === 'number') {
    return obj.toString();
  }

  if (typeof obj === 'string') {
    if (obj.includes('\n')) {
      return `|\n${obj.split('\n').map(line => `${spaces}  ${line}`).join('\n')}`;
    }
    if (obj.includes(':') || obj.includes('#') || obj.startsWith(' ') || obj.endsWith(' ') || obj === '') {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const yamlItem = jsonToYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        return `\n${spaces}- ${yamlItem.trimStart()}`;
      }
      return `\n${spaces}- ${yamlItem}`;
    }).join('');
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    return keys.map(key => {
      const value = obj[key];
      const yamlValue = jsonToYaml(value, indent + 1);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
        return `${spaces}${key}:\n${yamlValue}`;
      }
      if (Array.isArray(value) && value.length > 0) {
        return `${spaces}${key}:\n${yamlValue}`;
      }
      return `${spaces}${key}: ${yamlValue}`;
    }).join('\n');
  }

  return String(obj);
}

// 验证 OpenAPI 文档
function validate(doc) {
  const errors = [];
  const warnings = [];

  // 检查必需字段
  if (!doc.openapi) errors.push('缺少 "openapi" 版本字段');
  if (!doc.info) errors.push('缺少 "info" 信息字段');
  if (!doc.info?.title) errors.push('缺少 "info.title" 字段');
  if (!doc.info?.version) errors.push('缺少 "info.version" 字段');
  if (!doc.paths) errors.push('缺少 "paths" 路径字段');

  // 检查路径
  if (doc.paths) {
    for (const [path, methods] of Object.entries(doc.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
        
        if (!operation.operationId) {
          warnings.push(`${method.toUpperCase()} ${path}: 缺少 operationId`);
        }
        if (!operation.summary) {
          warnings.push(`${method.toUpperCase()} ${path}: 缺少 summary`);
        }
        if (!operation.responses || Object.keys(operation.responses).length === 0) {
          errors.push(`${method.toUpperCase()} ${path}: 缺少 responses`);
        }
      }
    }
  }

  // 检查 components
  if (doc.components?.schemas) {
    for (const [name, schema] of Object.entries(doc.components.schemas)) {
      if (!schema.type && !schema.properties && !schema.$ref) {
        warnings.push(`Schema "${name}": 缺少 type 或 properties`);
      }
    }
  }

  return { errors, warnings };
}

// 主函数
function main() {
  const command = process.argv[2];

  if (!fs.existsSync(OPENAPI_PATH)) {
    console.error('❌ 未找到 openapi.json 文件');
    process.exit(1);
  }

  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(OPENAPI_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌ JSON 解析失败:', e.message);
    process.exit(1);
  }

  switch (command) {
    case 'validate':
    case undefined:
      console.log('📋 验证 OpenAPI 文档...\n');
      const { errors, warnings } = validate(doc);
      
      if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ 文档验证通过！');
        console.log(`   - ${Object.keys(doc.paths || {}).length} 个路径`);
        console.log(`   - ${Object.keys(doc.components?.schemas || {}).length} 个 Schema`);
      } else {
        if (errors.length > 0) {
          console.log(`❌ 错误 (${errors.length}):`);
          errors.forEach(e => console.log(`   - ${e}`));
        }
        if (warnings.length > 0) {
          console.log(`\n⚠️  警告 (${warnings.length}):`);
          warnings.forEach(w => console.log(`   - ${w}`));
        }
        process.exit(errors.length > 0 ? 1 : 0);
      }
      break;

    case 'convert':
      console.log('🔄 转换为 YAML 格式...');
      const yaml = `# 墨墨单词助手 API 文档
# 由 scripts/generate-api-doc.js 自动生成

${jsonToYaml(doc)}`;
      
      fs.writeFileSync(YAML_PATH, yaml);
      console.log(`✅ 已生成: ${YAML_PATH}`);
      break;

    case 'serve':
      console.log('🚀 启动本地预览服务器...');
      const http = require('http');
      
      const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(doc));
      });

      server.listen(3001, () => {
        console.log('   地址: http://localhost:3001');
        console.log('   用途: 可用于 Swagger UI 等工具预览');
        console.log('\n   按 Ctrl+C 停止服务器');
      });
      break;

    case 'stats':
      console.log('📊 文档统计:\n');
      console.log(`   版本: ${doc.openapi}`);
      console.log(`   标题: ${doc.info?.title}`);
      console.log(`   路径数: ${Object.keys(doc.paths || {}).length}`);
      console.log(`   Schema数: ${Object.keys(doc.components?.schemas || {}).length}`);
      
      console.log('\n   接口列表:');
      for (const [path, methods] of Object.entries(doc.paths || {})) {
        for (const [method, op] of Object.entries(methods)) {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            console.log(`     ${method.toUpperCase().padEnd(7)} ${path.padEnd(30)} ${op.summary || ''}`);
          }
        }
      }
      break;

    default:
      console.log('用法: node scripts/generate-api-doc.js [command]');
      console.log('');
      console.log('命令:');
      console.log('  validate  验证 OpenAPI 文档 (默认)');
      console.log('  convert   转换为 YAML 格式');
      console.log('  serve     启动本地预览服务器');
      console.log('  stats     显示文档统计');
      process.exit(1);
  }
}

main();
