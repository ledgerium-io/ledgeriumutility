# **Getting Started**
This repository provides utility functions to test different scenarios on Ledgerium Blockchain e.g. deploy public and private smart contracts, execute transactions using web3js.

## **Clone the repo and install the project**
- git clone https://github.com/ledgerium-io/ledgeriumutility.git 
- cd ledgeriumutility
- yarn install

### **Specifications**
The ledgeriumutility can be used with different switches

**protocol**
- ws
- http

**hostname**
- testnet.ledgerium.net <If you want to connect to toorak>
- 138.197.193.201 <If you want to connect to flinders specific node>

**port**
- e.g. 9000 for Websocket
- e.g. 8545 for HTTP

**readkeyconfig**
- if keystore\privatekey.json needs to be used for Ledgerium accounts and their respective private keys. Make sure that these accounts have XLG balance else, user can go to Ledgerium Faucet and ask for some test XLG.

**usecontractconfig**
- While using this repository, the user can deploy fresh contract with smart contract code made available at $ledgeriumutility/contracts/. Once deployed, the address of the deployed smart contract is saved in $ledgeriumutility/keystore/contractsconfig.json. If user wants to execute further transactions afterwards, this flag can be set to true.

### **Run the tests - Usages**

- **Generate the public/private key combination against input of mnemonics on Ledgerium Blockchain**
  ```
  node index.js createPrivatePublicCombo=<mnemonics string>
  ``` 

- **Import account to the given Block Producer of Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer node ip address> port=<rpc/ws port> testPersonalImportAccount=<private key> <password>
  ```

- **Deploy LedgeriumToken smart contract on Ledgerium Blockchain**  
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer node IP address> port=<rpc/ws port> readkeyconfig=true testLedgeriumToken
  ```

- **Transfer XLG from one Ledgerium account to another Ledgerium account on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer ip address> port=<rpc/ws port> transferXLG=<private key of 'from' account>,<to account address>,<XLG amount>
  ```

- **Add Invoice hash to Invoice smart contract on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer node ip address> port=<rpc/ws port> readkeyconfig=true testInvoice=<InvoiceID>,<Invoice Hash>
  ```

- **Deploy Greeter smart contract on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer node ip address> port=<rpc/ws port> readkeyconfig=true testGreeter
  ```

- **Deploy SimpleStorage smart contract on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer node ip address> port=<rpc/ws port> readkeyconfig=true testSimpleStorage
  ```

- **Subscribe the 'newBlockHeaders' event on Ledgerium Blockchain**
  ```
  node index.js protocol=<http/ws> hostname=<Block Producer node ip address> port=<rpc/ws port> testNewBlockEvent
  ```

## **Additional:**
If one needs to develop and transact on custom developed smart contract after deploying, the code has to be compiled and .bin and .abi files are to be made available at ./build/contracts folder.
### **Solidity compiler to compile smart contract, to be deployed and transact**
- solc --overwrite --gas --bin --abi --optimize-runs=200 -o ./build/contracts ./contracts/contractname.sol
- Output files contractname.bin and contractname.abi are available in ./build/contracts folder. If file does not exist, program will throw "file not found!" error

### **Precompiled smart contract are deployed from the genesis block using --bin-runtime.**
- solc --overwrite --gas --bin-runtime --abi --optimize-runs=200 -o ./build/contracts ./contracts/contractname.sol
- Output files contractname.bin and contractname.abi are available in ./build/contracts folder. If file dpes not exist, program will throw "file not found!" error

