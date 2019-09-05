'use strict';
const fs = require('fs');
const moment = require('moment');
const solc = require('solc');
const EthereumTx = require('ethereumjs-tx');
const keythereum = require('keythereum');
const ethUtil = require('ethereumjs-util');
const txDecoder = require('ethereum-tx-decoder');

class utils {
    async getCurrentTime() {
        return moment().format('YYYY-MM-DD HH:mm:ss').trim();
    }
      
    /** To extract the encodedABI before deploying the smart contract on blockchain!
    */
    async getContractEncodeABI(abi,bytecode,web3,arg) {
        try{
            let contract = new web3.eth.Contract(JSON.parse(abi));
            return await contract.deploy({ data : bytecode, arguments : arg}).encodeABI();
        } catch (error) {
            console.log("Exception in utils.getContractEncodeABI(): " + error);
        } 
    }
    
    /** To deploy a smart contract on blockchain!
     * fromAccount private key will be needed for signing transaction. 
    */
    async deployContract(contractAbi, bytecode, ownerAddress, constructorParameters) {
        console.log("deployContract");
        try{
            let deployedContract = new web3.eth.Contract(JSON.parse(contractAbi));
            deployedAddress = await deployedContract.deploy({
                data : bytecode, 
                arguments: constructorParameters
            })
            .send({
                from : ownerAddress,
                gas : 5500000
            });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    }

    /** To send signed transnsaction for execution on blockchain!
     * fromAccount private key will be needed for signing transaction. 
    */
    async sendMethodTransaction(fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas) {
        try
        {
            var gasPrice = await web3.eth.getGasPrice();
            console.log("gasPrice ",web3.utils.toHex(gasPrice)); 

            var balance = await web3.eth.getBalance(fromAccountAddress);

            console.log("FromAccount", fromAccountAddress, "has balance of", web3.utils.fromWei(balance, 'xlg'), "xlg");
            
            let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                gasPrice: web3.utils.toHex(gasPrice),//'0x4A817C800', //20Gwei
                gasLimit: '0x47b760',//'0x48A1C0',//web3.utils.toWei(20,'gwei'), //estimatedGas, // Todo, estimate gas
                from: fromAccountAddress,
                to: toContractAddress,
                value: web3.utils.toHex(0),
                data: methodData
                //"privateFor" : privateFor
            }
            const tx = new EthereumTx(txParams);
            const privateKeyBuffer = new Buffer.from(privateKey, 'hex');
            tx.sign(privateKeyBuffer);
            const serializedTx = tx.serialize();

            let transactionHash = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
            // var receipt;
            // do{
            //     receipt = await web3.eth.getTransactionReceipt(transactionHash);
            // }
            // while(receipt == null)
            if(transactionHash.status)
                return transactionHash;
            else
                return "";
        }
        catch (error) {
            console.log("Error in utils.sendMethodTransaction(): " + error);
            return "";
        }
    }

    /** To extract the input value of unsigned transactions
    */
    async decodeInputVals(transactionHash, abi, web3) {
        try
        {
            var trandetails = await web3.eth.getTransaction(transactionHash);
            const fnDecoder = new txDecoder.FunctionDecoder(abi);
            const res = fnDecoder.decodeFn(trandetails.input);
            return res;
        }
        catch (error) {
            console.log("Error in utils.decodeInputVals(): " + error);
            return "";
        }    
    }
    
    /** To transfer XLG from one Ledgerium Account to another Ledgerium Account on the given Ledgerium Blockchain
    */
   async transferXLG(fromPrivateKey, toAddress, XLGAmount, web3) {
        try
        {
            var gasPrice = await web3.eth.getGasPrice();
            console.log("gasPrice ",web3.utils.toHex(gasPrice)); 

            const fromAccountAddress = web3.eth.accounts.privateKeyToAccount(fromPrivateKey).address;
            var balance = await web3.eth.getBalance(fromAccountAddress);
            console.log("FromAccount", fromAccountAddress, "has balance of", web3.utils.fromWei(balance, 'xlg'), "xlg");
            
            let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                //gasPrice: '0x00',
                gasPrice: web3.utils.toHex(gasPrice),//'0x4A817C800', //20Gwei
                gasLimit: '0x47b760',//'0x48A1C0',//web3.utils.toWei(20,'gwei'), //estimatedGas, // Todo, estimate gas
                from: fromAccountAddress,
                to: toAddress,
                value: web3.utils.toHex(web3.utils.toWei(XLGAmount, "xlg")),
                data: ''
            }
            const tx = new EthereumTx(txParams);
            const privateKey = fromPrivateKey.slice(2,fromPrivateKey.length);
            const privateKeyBuffer = new Buffer.from(privateKey, 'hex');
            tx.sign(privateKeyBuffer);
            const serializedTx = tx.serialize();

            let transactionHash = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));

            var balance = await web3.eth.getBalance(fromAccountAddress);
            console.log("Now FromAccount", fromAccountAddress, "has balance of", web3.utils.fromWei(balance, 'xlg'), "xlg");
            // var receipt;
            // do{
            //     receipt = await web3.eth.getTransactionReceipt(transactionHash);
            // }
            // while(receipt == null)
            if(transactionHash.status)
                return transactionHash;
            else
                return "";
        }
        catch (error) {
            console.log("Error in utils.transferXLG(): " + error);
            return "";
        }
    }

    /** To send unsigned transnsaction for execution on blockchain!
     * fromAccount needs to be kept open! Be Aware that if you open the account, it can be hacked!!
    */
    async sendUnsignedTransaction (fromAccountAddress, toContractAddress, methodData, web3) {
        try
        {
            var gasPrice = await web3.eth.getGasPrice();
            console.log("gasPrice ",web3.utils.toHex(gasPrice)); 
      
            let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: '0x47b760',
                from: fromAccountAddress,
                to: toContractAddress,
                value: web3.utils.toHex(0),
                data: methodData
                //"privateFor" : privateFor
            }
      
            let transactionHash = await web3.eth.sendTransaction(txParams);
            if(transactionHash.status)
                return transactionHash;
            else
                return "";
        }
        catch (error) {
            console.log("Error in utils.sendUnsignedTransaction(): " + error);
            return "";
        }
    }
    
    /** To get estimate of gas consumption for the given transaction prior to actual
     * execution on blockchain!
    */
    async estimateGasTransaction (fromAccountAddress, toContractAddress, methodData, web3) {
        return await web3.eth.estimateGas(
            {
                from    : fromAccountAddress,
                to      : toContractAddress,
                data    : methodData
            });
    }

    /** to get receipt of the event raised from the blockchain
    */ 
    async getReceipt(transactionHash,web3){
        var receipt = web3.eth.getTransactionReceipt(transactionHash);
        if(!receipt)
            console.log("Transaction",transactionHash,"did not get mined!");
        return receipt;
    }
    
    /** to read .abi and .bin file and return the values
    */ 
    readSolidityContractJSON (filename) {
        let jsonAbi, jsonBytecode;
        try {
            jsonAbi = JSON.parse(fs.readFileSync(filename + ".abi", 'utf8'));
            jsonBytecode = "0x" + fs.readFileSync(filename + ".bin", 'utf8');
            return [JSON.stringify(jsonAbi), jsonBytecode];
        } catch (error) {
            if (error.code === 'ENOENT')
                console.log(error.path, 'file not found!');
            else
                console.log("readSolidityContractJSON error ", error);
            return ["",""];
        }
    }

    /** To compile of gas consumptio for the given transaction prior to actual
     * execution on blockchain!
    */
    compileSolidityContract (filename,contractName) {
        let source = fs.readFileSync(filename, 'utf8');
        let compiledContract = solc.compile(source, 1);
        let abi = compiledContract.contracts[":"+contractName].interface;
        let bytecode = compiledContract.contracts[":"+contractName].bytecode;
        return [abi, bytecode];
    }

    keccakM (web3,text){
        return web3.sha3(text);
    }

    generatePublicKey (privateKey) {
        return '0x'+ethUtil.privateToAddress(privateKey).toString('hex');
    }

    getPrivateKeyFromKeyStore (accountAddress, keyStorePath, password) {
        var keyObject = keythereum.importFromFile(accountAddress, keyStorePath);
        var privateKey = keythereum.recover(password, keyObject);
        return privateKey.toString('hex');
    }

    async subscribe (string,web3,callback) {
        web3.eth.subscribe(string,(error,transaction)=>{
            if(error){
                console.log("error",`SUBSCRIBE:\n${error.message}\n${error.stack}`);
            }else{
                callback(transaction);
            }
        });
    }
    
    // to get all events from a submitted transaction to send to node application
    async listen(contract,callback){
        contract.events.allEvents({
            fromBlock: 0,
            toBlock  : 'latest'
        },(err,event)=>{
            if(err){
                console.log('error',`\n${err.message}\n${err.stack}`)
            }else{
                console.log('info',`:\n${event}`);
                callback(event);
            }
        });
    }

    async getData(fromAccount,toContract,endata,web3){
        return await web3.eth.call({
            from : fromAccount,
            to: toContract,
            data: endata
        });
    }

    split(array){
        temp = [];
        add = [];
        array = array.slice(2,array.length);
        for(var i=0;i<array.length;i+=64){
            temp.push(array.slice(i,i+64));
        }
        for(var j=0;j<temp.length;j++){
            add.push("0x"+temp[j].slice(24,64));
        }
        return add.splice(2, add.length);
    }

    convertToBool(inputString){
        if(inputString == "0x0000000000000000000000000000000000000000000000000000000000000001")
            return true;
        else (inputString == "0x0000000000000000000000000000000000000000000000000000000000000000")
            return false;
    }

    /** To import the account to the Ledgerium Blockchain node, with the given privateKey and password
     * execution on blockchain!
    */
    async personalImportAccount(privateKey,password){
        var flag = false;
        //importRawKey method does not like "0x" in the privatekeys. So need to remove if 0x is present!
        if(privateKey.indexOf("0x") == 0) {
            privateKey = privateKey.slice(2);
            flag = true;
        } else if(privateKey.indexOf("0x") == -1) { //when privatekeys are not prefixed 0x
            flag = true;
        } else {
            console.log("Wrong format private key!!, This key will not be considered");
        }
        if(!flag)
            return;
        return await web3.eth.personal.importRawKey(privateKey,password);
    }

    /** To unlock the account to the Ledgerium Blockchain node, with the given account and password. 
     * The account should be native account of the node
    */
    async unlockPersonalAccount(account, password) {
        var message = {
            method: "personal_unlockAccount",
            params: [account,password],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    }

    /** To lock the account to the Ledgerium Blockchain node, with the given account and password. 
     * The account should be native account of the node
    */
   async lockPersonalAccount(account) {
        var message = {
            method: "personal_lockAccount",
            params: [account],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    }

    sleep(ms){
        return new Promise(resolve=> {
            setTimeout(resolve,ms)
        })
    }

    /** Internal method to read accounts and private keys file. 
    */
    async createAccountsAndManageKeysFromPrivateKeys(inputPrivateKeys){
    
        accountAddressList.length = 0;
        let pubkey; var flag = false;
        for(var index = 0; index < inputPrivateKeys.length; index++){
            let eachElement = inputPrivateKeys[index];
            if(eachElement.indexOf("0x") == 0) { //when privatekeys are prefixed 0x
                flag = true;
            } else if(eachElement.indexOf("0x") == -1) { //when privatekeys are not prefixed 0x
                eachElement = "0x" + eachElement;
                flag = true;
            } else {
                console.log("Wrong format private key!!, This key will not be considered");
            }
            if(!flag)
                continue;
            try{
                let prvKey = ethUtil.toBuffer(eachElement);
                pubkey = '0x' + ethUtil.privateToAddress(prvKey).toString('hex');
            }
            catch (error) {
                console.log("Error in utils.createAccountsAndManageKeysFromPrivateKeys(): " + error);
                return "";
            }    
            accountAddressList.push(pubkey);
            privateKey[pubkey] = eachElement;
        }
        var noOfPrivateKeys = Object.keys(privateKey).length;
        var noOfAccounts = accountAddressList.length;
        if(noOfAccounts > 0 && noOfPrivateKeys > 0 && (noOfAccounts == noOfPrivateKeys)){
            console.log(accountAddressList.length + " ethereum accounts are created using private keys!");
        }
        global.accountAddressList = accountAddressList;
        global.privateKey = privateKey;
        return;
    }
      
    async readWritePrivateKeys() {
        try{
            const password = "password";
            accountAddressList.length = 0;
            accountAddressList = await web3.eth.getAccounts();
            if(accountAddressList.length <= 0)
                return;
            
            var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
            var keyStorePath = __dirname;
            
            var keyData = {};
            if(fs.existsSync(privateKeyFileName)){
                keyData = fs.readFileSync(privateKeyFileName,"utf8");
                keyData = JSON.parse(keyData);
            }    
            var key;
            console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
            if(accountAddressList.length > 0){
                var i = 0;
                accountAddressList.forEach(eachElement => {
                console.log(i++,"th account",eachElement);
                
                if(keyData[eachElement] != undefined){
                    key = keyData[eachElement];
                }    
                else
                {    
                    try{
                        key = getPrivateKeyFromKeyStore(eachElement, keyStorePath, password);
                    }
                    catch (error) {
                        return;
                    }
                }    
                privateKey[eachElement] = key;
                console.log(key);
                });
            }    
            data = JSON.stringify(privateKey,null, 2);
            fs.writeFileSync(privateKeyFileName,data);
        
            console.log("No of private keys", Object.keys(privateKey).length);
            
            // var newAccount = await web3.eth.personal.newAccount(password);
            // console.log("accountAddressList ", newAccount);
        
            //var account = web3.eth.accounts.privateKeyToAccount(privateKey[accountAddressList[0]]);
            //console.log("accountaddress ", accountAddressList[0], "recovered account with private key is", privateKey[accountAddressList[0]], account.address);
        }
        catch (error) {
            console.log("Error in utils.readWritePrivateKeys: " + error);
        }
    }  
    
    async readAccountsAndKeys() {
        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        if(fs.existsSync(privateKeyFileName)){
            var keyData = fs.readFileSync(privateKeyFileName,"utf8");
            var privateKey = JSON.parse(keyData);
            var accountAddressList = Object.keys(privateKey);
            console.log("There are", accountAddressList.length, "ethereum accounts & private keys in the privatekey file");
            global.accountAddressList = accountAddressList;
            global.privateKey = privateKey;
            return true;
        }
        else{
            console.log("privatekey.json file does not exist! The program may not function properly!");
            return false;
        }    
    }
      
    async writeAccountsAndKeys() {
        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        var data = JSON.stringify(privateKey,null, 2);
        fs.writeFileSync(privateKeyFileName,data);
        console.log(accountAddressList.length + " ethereum accounts & private keys are written to the privateKey.json file");
        return false;
    }
      
    readContractFromConfigContracts(contractName) {
        try{
            var contractFileName = __dirname + "/keystore/" + "contractsconfig.json";
            var keyData = {};
            if(fs.existsSync(contractFileName)){
                keyData = fs.readFileSync(contractFileName,"utf8");
                contractsList = JSON.parse(keyData);
                if(contractsList[contractName] != undefined)
                    return contractsList[contractName];
                else 
                    return "";
            }
        }
        catch (error) {
            console.log("Error in readContractFromConfigContracts: " + error);
            return "";
        }
    }    
      
    async writeContractsINConfig(contractName,contractAddress) {
        try{
            var contractFileName = __dirname + "/keystore/" + "contractsconfig.json";
            contractsList[contractName] = contractAddress;
        
            var data = JSON.stringify(contractsList,null, 2);
            fs.writeFileSync(contractFileName,data);
        }
        catch (error) {
            console.log("Error in writeContractsINConfig: " + error);
        }
    }

    readContractsFromConfig() {
        try{
              var contractFileName = __dirname + "/keystore/" + "contractsconfig.json";
              var keyData = {};
              if(fs.existsSync(contractFileName)){
                  keyData = fs.readFileSync(contractFileName,"utf8");
                  contractsList = JSON.parse(keyData);
              }
        }
        catch (error) {
            console.log("Error in utils.readContractsFromConfig: " + error);
        }
    }   
}
module.exports = utils;