import { ProofOfWork } from './pow';

// 测试不同的昵称
const testNicknames = ['dreamworks', 'alice', 'bob', 'charlie'];

console.log('🚀 开始POW测试...\n');

testNicknames.forEach((nickname, index) => {
  console.log(`=== 测试 ${index + 1}/${testNicknames.length}: ${nickname} ===`);
  const pow = new ProofOfWork(nickname);
  pow.runPOWTest();
  console.log('\n' + '='.repeat(50) + '\n');
}); 