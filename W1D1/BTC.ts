/*
 * @Author: dreamworks.cnn@gmail.com
 * @Date: 2025-01-27
 * @Description: 区块链系统实现 - 包含工作量证明、交易打包和节点同步
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { createHash, randomBytes } from 'crypto';

// ==================== 类型定义 ====================

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  signature?: string;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  merkleRoot: string;
}

interface BlockchainNode {
  id: string;
  address: string;
  blocks: Block[];
  pendingTransactions: Transaction[];
  peers: string[];
}

interface POWResult {
  hash: string;
  nonce: number;
  timeSpent: number;
  attempts: number;
}

// ==================== 工具函数 ====================

class BlockchainUtils {
  /**
   * 计算SHA256哈希值
   */
  static calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 生成随机ID
   */
  static generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * 计算默克尔根
   */
  static calculateMerkleRoot(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return this.calculateHash('empty');
    }
    
    if (transactions.length === 1) {
      return this.calculateHash(JSON.stringify(transactions[0]));
    }

    const hashes = transactions.map(tx => this.calculateHash(JSON.stringify(tx)));
    
    while (hashes.length > 1) {
      const newHashes: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left;
        newHashes.push(this.calculateHash(left + right));
      }
      hashes.splice(0, hashes.length, ...newHashes);
    }
    
    return hashes[0];
  }

  /**
   * 检查哈希值是否满足难度要求
   */
  static checkDifficulty(hash: string, difficulty: number): boolean {
    return hash.startsWith('0'.repeat(difficulty));
  }
}

// ==================== 交易类 ====================

class TransactionManager {
  /**
   * 创建新交易
   */
  static createTransaction(from: string, to: string, amount: number): Transaction {
    return {
      id: BlockchainUtils.generateId(),
      from,
      to,
      amount,
      timestamp: Date.now()
    };
  }

  /**
   * 验证交易
   */
  static validateTransaction(transaction: Transaction): boolean {
    return (
      transaction.id &&
      transaction.from &&
      transaction.to &&
      transaction.amount > 0 &&
      transaction.timestamp > 0
    );
  }

  /**
   * 获取交易池中的有效交易
   */
  static getValidTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter(tx => this.validateTransaction(tx));
  }
}

// ==================== 工作量证明 ====================

class ProofOfWork {
  /**
   * 执行工作量证明
   */
  static mine(blockData: string, difficulty: number): POWResult {
    console.log(`🔍 开始挖掘难度为 ${difficulty} 的区块...`);
    
    const startTime = Date.now();
    let nonce = 0;
    let attempts = 0;
    let hash: string;

    do {
      nonce++;
      attempts++;
      const content = blockData + nonce;
      hash = BlockchainUtils.calculateHash(content);
      
      // 每10000次尝试打印一次进度
      if (attempts % 10000 === 0) {
        console.log(`⏳ 已尝试 ${attempts.toLocaleString()} 次，当前nonce: ${nonce.toLocaleString()}`);
      }
    } while (!BlockchainUtils.checkDifficulty(hash, difficulty));

    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    console.log(`✅ 找到有效哈希值！`);
    console.log(`📊 尝试次数: ${attempts.toLocaleString()}`);
    console.log(`⏱️  耗时: ${this.formatTime(timeSpent)}`);
    console.log(`🔢 Nonce: ${nonce.toLocaleString()}`);
    console.log(`🔐 哈希值: ${hash}`);

    return {
      hash,
      nonce,
      timeSpent,
      attempts
    };
  }

  /**
   * 格式化时间显示
   */
  private static formatTime(milliseconds: number): string {
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

// ==================== 区块类 ====================

class BlockManager {
  /**
   * 创建创世区块
   */
  static createGenesisBlock(): Block {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
      difficulty: 4,
      merkleRoot: ''
    };

    genesisBlock.merkleRoot = BlockchainUtils.calculateMerkleRoot(genesisBlock.transactions);
    genesisBlock.hash = this.calculateBlockHash(genesisBlock);
    
    return genesisBlock;
  }

  /**
   * 创建新区块
   */
  static createBlock(
    index: number,
    transactions: Transaction[],
    previousHash: string,
    difficulty: number = 4
  ): Block {
    const block: Block = {
      index,
      timestamp: Date.now(),
      transactions: TransactionManager.getValidTransactions(transactions),
      previousHash,
      hash: '',
      nonce: 0,
      difficulty,
      merkleRoot: ''
    };

    block.merkleRoot = BlockchainUtils.calculateMerkleRoot(block.transactions);
    
    // 执行工作量证明
    const blockData = this.getBlockDataForMining(block);
    const powResult = ProofOfWork.mine(blockData, difficulty);
    
    block.hash = powResult.hash;
    block.nonce = powResult.nonce;

    return block;
  }

  /**
   * 计算区块哈希值
   */
  static calculateBlockHash(block: Block): string {
    const blockData = this.getBlockDataForMining(block);
    return BlockchainUtils.calculateHash(blockData + block.nonce);
  }

  /**
   * 获取用于挖矿的区块数据
   */
  private static getBlockDataForMining(block: Block): string {
    return JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      merkleRoot: block.merkleRoot,
      difficulty: block.difficulty
    });
  }

  /**
   * 验证区块
   */
  static validateBlock(block: Block, previousBlock?: Block): boolean {
    // 验证区块结构
    if (!block.index || !block.timestamp || !block.hash || !block.previousHash) {
      return false;
    }

    // 验证索引连续性
    if (previousBlock && block.index !== previousBlock.index + 1) {
      return false;
    }

    // 验证前一个区块的哈希值
    if (previousBlock && block.previousHash !== previousBlock.hash) {
      return false;
    }

    // 验证当前区块的哈希值
    const calculatedHash = this.calculateBlockHash(block);
    if (calculatedHash !== block.hash) {
      return false;
    }

    // 验证工作量证明
    if (!BlockchainUtils.checkDifficulty(block.hash, block.difficulty)) {
      return false;
    }

    // 验证交易
    const validTransactions = TransactionManager.getValidTransactions(block.transactions);
    if (validTransactions.length !== block.transactions.length) {
      return false;
    }

    return true;
  }
}

// ==================== 区块链类 ====================

class Blockchain {
  private blocks: Block[];
  private pendingTransactions: Transaction[];
  private difficulty: number;
  private miningReward: number;

  constructor(difficulty: number = 4, miningReward: number = 100) {
    this.blocks = [BlockManager.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = difficulty;
    this.miningReward = miningReward;
  }

  /**
   * 获取最新区块
   */
  getLatestBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  /**
   * 添加交易到待处理池
   */
  addTransaction(transaction: Transaction): void {
    if (TransactionManager.validateTransaction(transaction)) {
      this.pendingTransactions.push(transaction);
      console.log(`📝 交易已添加到待处理池: ${transaction.id}`);
    } else {
      console.log(`❌ 无效交易: ${transaction.id}`);
    }
  }

  /**
   * 创建挖矿奖励交易
   */
  private createMiningRewardTransaction(minerAddress: string): Transaction {
    return TransactionManager.createTransaction(
      'system',
      minerAddress,
      this.miningReward
    );
  }

  /**
   * 挖矿新区块
   */
  mineBlock(minerAddress: string): Block {
    console.log(`\n⛏️  开始挖矿新区块...`);
    console.log(`👤 矿工地址: ${minerAddress}`);
    console.log(`📊 待处理交易数量: ${this.pendingTransactions.length}`);
    
    // 添加挖矿奖励交易
    const rewardTransaction = this.createMiningRewardTransaction(minerAddress);
    const transactionsToMine = [...this.pendingTransactions, rewardTransaction];

    const latestBlock = this.getLatestBlock();
    const newBlock = BlockManager.createBlock(
      latestBlock.index + 1,
      transactionsToMine,
      latestBlock.hash,
      this.difficulty
    );

    // 验证新区块
    if (BlockManager.validateBlock(newBlock, latestBlock)) {
      this.blocks.push(newBlock);
      this.pendingTransactions = []; // 清空待处理交易
      
      console.log(`✅ 新区块已添加到区块链！`);
      console.log(`📦 区块索引: ${newBlock.index}`);
      console.log(`🔗 区块哈希: ${newBlock.hash}`);
      console.log(`💰 挖矿奖励: ${this.miningReward} BTC`);
      
      return newBlock;
    } else {
      throw new Error('新区块验证失败');
    }
  }

  /**
   * 验证整个区块链
   */
  validateChain(): boolean {
    console.log(`🔍 验证区块链完整性...`);
    
    for (let i = 1; i < this.blocks.length; i++) {
      const currentBlock = this.blocks[i];
      const previousBlock = this.blocks[i - 1];

      if (!BlockManager.validateBlock(currentBlock, previousBlock)) {
        console.log(`❌ 区块 ${i} 验证失败`);
        return false;
      }
    }

    console.log(`✅ 区块链验证通过！`);
    return true;
  }

  /**
   * 获取区块链信息
   */
  getBlockchainInfo(): any {
    return {
      length: this.blocks.length,
      latestBlock: this.getLatestBlock(),
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      miningReward: this.miningReward
    };
  }

  /**
   * 获取所有区块
   */
  getAllBlocks(): Block[] {
    return [...this.blocks];
  }

  /**
   * 获取待处理交易
   */
  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }
}

// ==================== 节点网络类 ====================

class BlockchainNetwork {
  private nodes: Map<string, BlockchainNode>;
  private nodeId: string;

  constructor() {
    this.nodes = new Map();
    this.nodeId = BlockchainUtils.generateId();
  }

  /**
   * 创建新节点
   */
  createNode(address: string): BlockchainNode {
    const node: BlockchainNode = {
      id: BlockchainUtils.generateId(),
      address,
      blocks: [BlockManager.createGenesisBlock()],
      pendingTransactions: [],
      peers: []
    };

    this.nodes.set(node.id, node);
    console.log(`🆕 新节点已创建: ${node.id} (${address})`);
    
    return node;
  }

  /**
   * 添加节点到网络
   */
  addNode(node: BlockchainNode): void {
    this.nodes.set(node.id, node);
    console.log(`➕ 节点已添加到网络: ${node.id}`);
  }

  /**
   * 同步区块到所有节点
   */
  syncBlockToAllNodes(block: Block): void {
    console.log(`🔄 开始同步区块到所有节点...`);
    
    this.nodes.forEach((node, nodeId) => {
      if (nodeId !== this.nodeId) {
        this.syncBlockToNode(node, block);
      }
    });
  }

  /**
   * 同步区块到指定节点
   */
  private syncBlockToNode(node: BlockchainNode, block: Block): void {
    const latestBlock = node.blocks[node.blocks.length - 1];
    
    if (BlockManager.validateBlock(block, latestBlock)) {
      node.blocks.push(block);
      console.log(`✅ 区块已同步到节点 ${node.id}`);
    } else {
      console.log(`❌ 区块同步失败到节点 ${node.id}`);
    }
  }

  /**
   * 广播交易到所有节点
   */
  broadcastTransaction(transaction: Transaction): void {
    console.log(`📡 广播交易到所有节点...`);
    
    this.nodes.forEach((node, nodeId) => {
      if (nodeId !== this.nodeId) {
        node.pendingTransactions.push(transaction);
        console.log(`📤 交易已发送到节点 ${node.id}`);
      }
    });
  }

  /**
   * 获取网络状态
   */
  getNetworkStatus(): any {
    return {
      totalNodes: this.nodes.size,
      nodeId: this.nodeId,
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.id,
        address: node.address,
        blockCount: node.blocks.length,
        pendingTransactions: node.pendingTransactions.length
      }))
    };
  }
}

// ==================== 主程序 ====================

class BlockchainDemo {
  private blockchain: Blockchain;
  private network: BlockchainNetwork;

  constructor() {
    this.blockchain = new Blockchain(4, 100);
    this.network = new BlockchainNetwork();
  }

  /**
   * 运行完整的区块链演示
   */
  async runDemo(): Promise<void> {
    console.log('🚀 开始区块链系统演示...\n');

    // 1. 创建网络节点
    await this.createNetworkNodes();

    // 2. 创建和广播交易
    await this.createAndBroadcastTransactions();

    // 3. 挖矿新区块
    await this.mineNewBlocks();

    // 4. 验证区块链
    await this.validateBlockchain();

    // 5. 显示最终状态
    await this.showFinalStatus();
  }

  /**
   * 创建网络节点
   */
  private async createNetworkNodes(): Promise<void> {
    console.log('=== 第一步：创建网络节点 ===');
    
    const node1 = this.network.createNode('192.168.1.100:3001');
    const node2 = this.network.createNode('192.168.1.101:3002');
    const node3 = this.network.createNode('192.168.1.102:3003');

    console.log(`📊 网络状态: ${JSON.stringify(this.network.getNetworkStatus(), null, 2)}\n`);
  }

  /**
   * 创建和广播交易
   */
  private async createAndBroadcastTransactions(): Promise<void> {
    console.log('=== 第二步：创建和广播交易 ===');
    
    const transactions = [
      TransactionManager.createTransaction('Alice', 'Bob', 50),
      TransactionManager.createTransaction('Bob', 'Charlie', 30),
      TransactionManager.createTransaction('Charlie', 'David', 20),
      TransactionManager.createTransaction('David', 'Eve', 10)
    ];

    transactions.forEach(tx => {
      this.blockchain.addTransaction(tx);
      this.network.broadcastTransaction(tx);
    });

    console.log(`📝 已创建 ${transactions.length} 笔交易\n`);
  }

  /**
   * 挖矿新区块
   */
  private async mineNewBlocks(): Promise<void> {
    console.log('=== 第三步：挖矿新区块 ===');
    
    // 挖矿第一个区块
    const block1 = this.blockchain.mineBlock('Miner001');
    this.network.syncBlockToAllNodes(block1);

    // 创建更多交易
    const moreTransactions = [
      TransactionManager.createTransaction('Eve', 'Frank', 15),
      TransactionManager.createTransaction('Frank', 'Grace', 25)
    ];

    moreTransactions.forEach(tx => {
      this.blockchain.addTransaction(tx);
      this.network.broadcastTransaction(tx);
    });

    // 挖矿第二个区块
    const block2 = this.blockchain.mineBlock('Miner002');
    this.network.syncBlockToAllNodes(block2);

    console.log('');
  }

  /**
   * 验证区块链
   */
  private async validateBlockchain(): Promise<void> {
    console.log('=== 第四步：验证区块链 ===');
    
    const isValid = this.blockchain.validateChain();
    if (isValid) {
      console.log('✅ 区块链验证成功！\n');
    } else {
      console.log('❌ 区块链验证失败！\n');
    }
  }

  /**
   * 显示最终状态
   */
  private async showFinalStatus(): Promise<void> {
    console.log('=== 最终状态 ===');
    
    const info = this.blockchain.getBlockchainInfo();
    console.log(`📊 区块链信息:`);
    console.log(`   - 区块数量: ${info.length}`);
    console.log(`   - 最新区块索引: ${info.latestBlock.index}`);
    console.log(`   - 待处理交易: ${info.pendingTransactions}`);
    console.log(`   - 挖矿难度: ${info.difficulty}`);
    console.log(`   - 挖矿奖励: ${info.miningReward} BTC`);

    console.log(`\n🌐 网络状态:`);
    console.log(JSON.stringify(this.network.getNetworkStatus(), null, 2));

    console.log(`\n📦 所有区块:`);
    this.blockchain.getAllBlocks().forEach((block, index) => {
      console.log(`   区块 ${index}: ${block.hash.substring(0, 16)}... (${block.transactions.length} 笔交易)`);
    });

    console.log('\n🎉 区块链系统演示完成！');
  }
}

// ==================== 导出和主函数 ====================

// 主函数
function main(): void {
  try {
    const demo = new BlockchainDemo();
    demo.runDemo();
  } catch (error) {
    console.error('区块链演示过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main();
}

export {
  Blockchain,
  BlockchainNetwork,
  BlockManager,
  TransactionManager,
  ProofOfWork,
  BlockchainUtils,
  BlockchainDemo,
  Block,
  Transaction,
  BlockchainNode,
  POWResult
};