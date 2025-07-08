/*
 * @Author: dreamworks.cnn@gmail.com
 * @Date: 2025-07-08 20:15:08
 * @LastEditors: dreamworks.cnn@gmail.com
 * @LastEditTime: 2025-07-08 21:08:12
 * @FilePath: /web3/W1D1/jiami.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 * 
 */

/**
 *
实践非对称加密 RSA（编程语言不限）：
先生成一个公私钥对
用私钥对符合 POW 4 个 0 开头的哈希值的 “昵称 + nonce” 进行私钥签名
用公钥验证
*/

import forge from 'node-forge';

// 1. 生成RSA密钥对
function generateRSAKeyPair() {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
  return { publicKey: keypair.publicKey, privateKey: keypair.privateKey, publicKeyPem, privateKeyPem };
}

// 2. POW 挖掘4个0开头的哈希
function powNickname(nickname: string) {
  let nonce = 0;
  let hash = '';
  let content = '';
  do {
    nonce++;
    content = `${nickname}${nonce}`;
    hash = forge.md.sha256.create().update(content).digest().toHex();
  } while (!hash.startsWith('0000'));
  return { hash, content, nonce };
}

// 3. 用私钥签名（PKCS#1 v1.5）
function signWithPrivateKey(privateKey: forge.pki.rsa.PrivateKey, message: string): string {
  const md = forge.md.sha256.create();
  md.update(message, 'utf8');
  const signature = privateKey.sign(md, 'RSASSA-PKCS1-V1_5');
  return forge.util.encode64(signature);
}

// 4. 用公钥验证签名
function verifyWithPublicKey(publicKey: forge.pki.rsa.PublicKey, message: string, signature64: string): boolean {
  const md = forge.md.sha256.create();
  md.update(message, 'utf8');
  const signature = forge.util.decode64(signature64);
  return publicKey.verify(md.digest().bytes(), signature, 'RSASSA-PKCS1-V1_5');
}

// 主流程
function main() {
  const nickname = 'dreamworks';
  // 1. 生成密钥对
  const { publicKey, privateKey, publicKeyPem, privateKeyPem } = generateRSAKeyPair();
  console.log('公钥 PEM:\n', publicKeyPem);
  console.log('私钥 PEM:\n', privateKeyPem);

  // 2. POW 挖掘
  const { hash, content, nonce } = powNickname(nickname);
  console.log(`找到4个0开头哈希: ${hash}`);
  console.log(`内容: ${content} (nonce=${nonce})`);

  // 3. 签名
  const signature = signWithPrivateKey(privateKey, content);
  console.log('签名(base64):', signature);

  // 4. 验证
  const isValid = verifyWithPublicKey(publicKey, content, signature);
  console.log('签名验证结果:', isValid);
}

if (require.main === module) {
  main();
}
