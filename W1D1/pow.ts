/*
 * @Author: dreamworks.cnn@gmail.com
 * @Date: 2025-07-08 09:20:12
 * @LastEditors: dreamworks.cnn@gmail.com
 * @LastEditTime: 2025-07-08 16:58:23
 * @FilePath: /web3/W1D1/pow.ts
 * @Description: 工作量证明（Proof of Work）实现
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { createHash } from 'crypto';

interface POWResult {
  hash: string;
  content: string;
  nonce: number;
  timeSpent: number;
  attempts: number;
}

class ProofOfWork {
  private nickname: string;

  constructor(nickname: string = 'dreamworks') {
    this.nickname = nickname;
  }

  /**
   * 计算SHA256哈希值
   */
  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 检查哈希值是否以指定数量的0开头
   */
  private checkLeadingZeros(hash: string, zeroCount: number): boolean {
    return hash.startsWith('0'.repeat(zeroCount));
  }

  /**
   * 执行工作量证明
   */
  private mine(targetZeros: number): POWResult {
    console.log(`开始挖掘 ${targetZeros} 个0开头的哈希值...`);
    
    const startTime = Date.now();
    let nonce = 0;
    let attempts = 0;
    let hash: string;
    let content: string;

    do {
      nonce++;
      attempts++;
      content = `${this.nickname}${nonce}`;
      hash = this.calculateHash(content);
      
      // 每10000次尝试打印一次进度
      if (attempts % 10000 === 0) {
        console.log(`已尝试 ${attempts} 次，当前nonce: ${nonce}`);
      }
    } while (!this.checkLeadingZeros(hash, targetZeros));

    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    return {
      hash,
      content,
      nonce,
      timeSpent,
      attempts
    };
  }

  /**
   * 执行完整的POW测试
   */
  public runPOWTest(): void {
    console.log('=== 工作量证明（Proof of Work）测试 ===');
    console.log(`使用昵称: ${this.nickname}`);
    console.log('');

    // 挖掘4个0开头的哈希值
    console.log('🔍 第一阶段：寻找4个0开头的哈希值');
    const result4 = this.mine(4);
    this.printResult(result4, 4);
    console.log('');

    // 挖掘5个0开头的哈希值
    console.log('🔍 第二阶段：寻找5个0开头的哈希值');
    const result5 = this.mine(5);
    this.printResult(result5, 5);
    console.log('');

    // 总结
    console.log('=== 测试总结 ===');
    console.log(`4个0开头哈希值耗时: ${this.formatTime(result4.timeSpent)}`);
    console.log(`5个0开头哈希值耗时: ${this.formatTime(result5.timeSpent)}`);
    console.log(`总尝试次数: ${result4.attempts + result5.attempts}`);
  }

  /**
   * 打印结果
   */
  private printResult(result: POWResult, zeroCount: number): void {
    console.log(`✅ 找到 ${zeroCount} 个0开头的哈希值！`);
    console.log(`📊 尝试次数: ${result.attempts.toLocaleString()}`);
    console.log(`⏱️  耗时: ${this.formatTime(result.timeSpent)}`);
    console.log(`🔢 Nonce: ${result.nonce.toLocaleString()}`);
    console.log(`📝 原始内容: ${result.content}`);
    console.log(`🔐 哈希值: ${result.hash}`);
    console.log(`📈 哈希率: ${Math.round(result.attempts / (result.timeSpent / 1000))} 哈希/秒`);
  }

  /**
   * 格式化时间显示
   */
  private formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}秒`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(2);
      return `${minutes}分${seconds}秒`;
    }
  }
}

// 主函数
function main(): void {
  try {
    const pow = new ProofOfWork('dreamworks');
    pow.runPOWTest();
  } catch (error) {
    console.error('POW测试过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main();
}

export { ProofOfWork, POWResult };
