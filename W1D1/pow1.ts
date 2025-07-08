import { createHash } from 'crypto';

class POW_CLASS {
  private userName: string;
  private nonce: number;

  constructor(userName: string){
    this.userName = userName;
    this.nonce = 0;
  }

  private createHash(str: string, nonce: number): string{
    const hash = createHash('sha256');

    hash.update(str + nonce);
    return hash.digest('hex');
  }

  private testHash(length: number){
    const checkHash = (hash: string): string | void => {
      if(hash.startsWith(String(length).repeat(length))){
        return hash
      }      
    }
    checkHash(this.createHash(this.userName, this.nonce))
    this.nonce++
    if(1){}
  }
}


function main(): void{
  const pow = new POW_CLASS('userName');
  pow.testHash(4)
  pow.testHash(5)
  

}

main();