# **Getting Started**
This repository provides utility functions to test different scenarios on Ledgerium Blockchain e.g. deploy public and private smart contracts, execute transactions using web3js.

## **Clone the repo and install the project**
- git clone https://github.com/ledgerium-io/ledgeriumutility.git 
- cd ledgeriumutility
- **yarn install**

Note : `XLG` is the native cryptocurrency used on the Ledgerium blockchain network and it is needed while interacting with Ledgerium Blockchain. `web3.js` package uses `ethjs-unit` whenever it needs to deal with the denomination. The default `ethjs-unit package` has `ether` as its native currency which is being overridden for Ledgerium to `XLG`. In turn, Ledgerium has published `ethjs-unit-ledgerium` with `XLG` as native denomination and user has to use it in its development environment using yarn package.

## **Specifications**
The ledgeriumutility can be used with different switches

**protocol**
- http
- ws

**hostname**
- toorak01.ledgerium.net //If you want to connect to toorak specific node
- flinders01.ledgerium.io //If you want to connect to flinders specific node

**port**
- e.g. 8545 for HTTP
- e.g. 9000 for Websocket

**readKeyConfig**
- if `keystore/privatekey.json` needs to be used for Ledgerium accounts and their respective private keys. Make sure that these accounts have XLG balance else, user can go to Ledgerium Faucet and ask for some test XLG. The code defaults pick up the first account in the list. 

**useContractConfig**
- While using this repository, the user can deploy fresh contract with smart contract code made available at `$ledgeriumutility/contracts/`. Once deployed, the address of the deployed smart contract is saved in `$ledgeriumutility/keystore/contractsconfig.json`. If user wants to execute further transactions afterwards, this flag can be set to true.

## **Run the tests - Usages**

### **Public Transactions**

- **Generate the public/private key combination against input of mnemonics on Ledgerium Blockchain**
- The user can create a fresh Ledgerium External Owned Accounts (EOA) to interact with Ledgerium Blockchain by providing mnemonics. To know more about it, read https://docs.ledgerium.io/docs/accounts
  ```
  node index.js createPrivatePublicSet=<mnemonics string>
  ``` 

- **Import account to the given Block Producer of Ledgerium Blockchain**
- Read about the option at https://docs.ledgerium.io/docs/accounts#section--externally-owned-accounts-eoas-
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer Node Hostname> port=<rpc/ws port> testPersonalImportAccount=<private key> <password>
  ```

- **Deploy LedgeriumToken smart contract on Ledgerium Blockchain**  
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer Node Hostname> port=<rpc/ws port> readKeyConfig=true testLedgeriumToken
  ```

- **Transfer XLG from one Ledgerium account to another Ledgerium account on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer ip address> port=<rpc/ws port> transferXLG=<private key of 'from' account>,<to account address>,<XLG amount>
  ```

- **Deploy fresh Invoice smart contract and add Invoice hash to it on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer Node Hostname> port=<rpc/ws port> readKeyConfig=true testInvoice=<InvoiceID>,<Invoice Hash>
  ```

- **Deploy fresh Greeter smart contract on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer Node Hostname> port=<rpc/ws port> readKeyConfig=true testGreeter
  ```

- **Deploy fresh SimpleStorage smart contract on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer Node Hostname> port=<rpc/ws port> readKeyConfig=true testSimpleStorage
  ```

- **Subscribe the 'newBlockHeaders' event on Ledgerium Blockchain**
  ```
  node index.js protocol=<ws> hostname=<Block Producer Node Hostname> port=<ws port> testNewBlockEvent
  ```

### **Private Transactions**
  
- **Deploy Greeter** smart contract with **private transaction** between node **'from'** and Node **'to'** on Ledgerium Blockchain
 
  For first time usages with **generateTLSCerts** option
 
   Generate the TLS certificates needed for communicating with tessera node using https for private transactions. The subject information used for creating the certificates can be found in `certs/config.json`. When regenerating the certificates, we recommend to use unique subject information. This option needs to be used only once to generate certificate before first usages. 

   ```
   node index.js protocol=<http> hostname=<Block Producer Node Hostname> port=<rpc port> readKeyConfig=true generateTLSCerts fromPubKey=<public key of 'from' node> toPubKey=<public key of 'to' node> testGreeterPrivateDeployment=<From Node>,<Node1>,<Node2>,<Node3>,<tessera third party port of 'from' node>,<RPC Port Node1>,<RPC Port Node2>,<RPC Port Node3>
   ```

  Next time usage without **generateTLSCerts** option
   ```
   node index.js protocol=<http> hostname=<Block Producer Node Hostname> port=<rpc port> readKeyConfig=true fromPubKey=<public key of 'from' node> toPubKey=<public key of 'to' node> testGreeterPrivateDeployment=<From Node>,<Node1>,<Node2>,<Node3>,<tessera third party port of 'from' node>,<RPC Port Node1>,<RPC Port Node2>,<RPC Port Node3>
   ```
  
- **Write transactions on Greeter** smart contract with **private transaction** between node **'from'** and Node **'to'** on Ledgerium Blockchain
 
  For first time usages with **generateTLSCerts** option
 
   Generate the TLS certificates needed for communicating with tessera node using https for private transactions. The subject information used for creating the certificates can be found in `certs/config.json`. When regenerating the certificates, we recommend to use unique subject information. This option needs to be used only once to generate certificate before first usages. 

   ```
   node index.js protocol=<http> hostname=<Block Producer Node Hostname> port=<rpc port> readKeyConfig=true generateTLSCerts fromPubKey=<public key of 'from' node> toPubKey=<public key of 'to' node> testSetPrivateGreeter=<From Node>,<Node1>,<Node2>,<Node3>,<tessera third party port of 'from' node>,<RPC Port Node1>,<RPC Port Node2>,<RPC Port Node3>,<Address of private greeter contract>
   ```

  Next time usage without **generateTLSCerts** option
   ```
   node index.js protocol=<http> hostname=<Block Producer Node Hostname> port=<rpc port> readKeyConfig=true fromPubKey=<public key of 'from' node> toPubKey=<public key of 'to' node> testSetPrivateGreeter=<From Node>,<Node1>,<Node2>,<Node3>,<RPC Port Node1>,<RPC Port Node2>,<RPC Port Node3>,<Address of private greeter contract>
   ```

- **Get** value on **Greeter** smart contract with **private transaction** between node **'from'** and Node **'to'** on Ledgerium Blockchain
 
   ```
   node index.js protocol=<http> hostname=<Block Producer Node Hostname> port=<rpc port> readKeyConfig=true generateTLSCerts fromPubKey=<public key of 'from' node> toPubKey=<public key of 'to' node> getPrivateGreeterValues=<From Node>,<Node1>,<Node2>,<Node3>,<RPC Port Node1>,<RPC Port Node2>,<RPC Port Node3>,<Address of private greeter contract>
   ```
- **Pre-conditions**
  - Private Transactions works only for '**http**' protocol
  - Private Transactions can be sent using coinbase account of 'from' node. It does not work with any random Ledgerium account, even it has sufficient XLG balance. So, the account and private key details have to be added as `"0xef759369e2b95b207fcc9ec2a6925fe3f8945f8f":"20a139ed2023c910d54b2ce7fb4377d81dd3471d6f16f27116c39c6184a3fd7c"` as first account in the privatekey.json file. The code defaults pick up the first account in the list. 
  
## **Additional:**
If one needs to develop and transact on custom developed smart contract after deploying, the code has to be compiled and .bin and .abi files are to be made available at ./build/contracts folder.
### **Solidity compiler to compile smart contract, to be deployed and transact**
- ```solc --overwrite --gas --bin --abi --optimize-runs=200 -o ./build/contracts ./contracts/contractname.sol```
- Output files contractname.bin and contractname.abi are available in ./build/contracts folder. If file does not exist, program will throw "file not found!" error

### **Precompiled smart contract are deployed from the 'genesis' block using --bin-runtime.**
- ```solc --overwrite --gas --bin-runtime --abi --optimize-runs=200 -o ./build/contracts ./contracts/contractname.sol```
- Output files contractname.bin and contractname.abi are available in ./build/contracts folder. If file does not exist, program will throw "file not found!" error

