'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Utils = require('./web3util');
const quorumjs = require("quorum-js");
const sslCerts = require('./helpers/generatecerts')

var provider,protocol,host,port,web3;
var fromPubKey,toPubKey; //Used for Private Transactions
var subscribePastEventsFlag = false;
var webSocketProtocolFlag = false;
global.webSocketProtocolFlag = webSocketProtocolFlag;
global.subscribePastEventsFlag = subscribePastEventsFlag;

var web3;
global.web3 = web3;

const utils = new Utils();
global.utils = utils;

var URL;
var privateKey = {};
var accountAddressList = [];
var contractsList = {};
var usecontractconfigFlag = false;

global.contractsList = contractsList;

var main = async function () {

  const args = process.argv.slice(2);
  for (let i=0; i<args.length ; i++) {
      let temp = args[i].split("=");
      switch (temp[0]) {
            case "protocol": {
                switch (temp[1]) {
                    case "ws":
                        protocol = "ws://";
                        global.protocol = protocol;
                        webSocketProtocolFlag = true;
                        global.webSocketProtocolFlag = webSocketProtocolFlag;
                        break;
                    case "http":
                    default:
                        protocol = "http://";
                        global.protocol = protocol;
                        webSocketProtocolFlag = false;
                        global.webSocketProtocolFlag = webSocketProtocolFlag;
                        break;
                }
                break;
            }    
            case "hostname": {
                host = temp[1];
                global.host = host;
                break;
            }    
            case "port": {
                port = temp[1];
                global.port = port;
                URL = protocol + host + ":" + port;
                if(protocol == "ws://") {
                    web3 = new Web3(new Web3.providers.WebsocketProvider(URL));
                } else if(protocol == "http://") {
                    web3 = new Web3(new Web3.providers.HttpProvider(URL));
                } else {
                    console.log("Wrong protocol!!, exiting");
                    process.exit(1);
                }
                global.web3 = web3;
                break;
            }    
            case "privateKeys": {
                let prvKeys = temp[1].split(",");
                utils.createAccountsAndManageKeysFromPrivateKeys(prvKeys);
                utils.writeAccountsAndKeys();
                break;
            }    
            case "readkeyconfig": {
                let readkeyconfig = temp[1];
                switch(readkeyconfig){
                    case "true":
                    default: 
                        utils.readAccountsAndKeys();
                        break;
                    case "false":
                        console.log("Given readkeyconfig option not supported! Provide correct details");
                        break;     
                }
                break;
            }    
            case "usecontractconfig": {
                let contractconfig = temp[1];
                switch(contractconfig){
                    case "true":
                        usecontractconfigFlag = true;
                        break;
                    case "false":
                    default:
                        usecontractconfigFlag = false;
                        break;     
                }
                break;
            }    
            case "createPrivatePublicCombo": {
                let mnemonic = temp[1];
                await createPrivatePublicCombo(mnemonic);
                break;
            }    
            case "testPersonalImportAccount": {
                let prvKeys = temp[1].split(",");
                let password = prvKeys.pop();
                await testPersonalImportAccount(prvKeys,password);
                break;
            }    
            case "testLedgeriumToken": {
                await testLedgeriumToken();
                break;
            }                
            case "transferXLG": {
                let inputList = temp[1].split(",");
                await transferXLG(inputList[0],inputList[1],inputList[2]);
                break;
            }    
            case "testInvoice": {
                let list = temp[1].split(",");
                await testInvoicesContract(list[0],list[1]);
                break;
            }
            case "testGreeter": {
                await testGreetingContract();
                break;
            }    
            case "testSimpleStorage": {
                await testSimpleStorageContract();
                break;
            }                
            case "generateTLSCerts": {
                await generateTLSCerts();
                break;
            }
            case "fromPubKey": {
                fromPubKey = temp[1];
                fromPubKey+="=";
                break;
            }                
            case "toPubKey": {
                toPubKey = temp[1];
                toPubKey+="=";
                break;
            }    
            case "testprivateTransactions": {
                let inputValues = temp[1].split(",");
                if(inputValues.length > 6) {
                    await deployGreeterPrivate(inputValues[0],inputValues[1],inputValues[2],inputValues[3],inputValues[4],inputValues[5],inputValues[6],inputValues[7]);
                }    
                break;
            }    
            case "testNewBlockEvent": {
                await testNewBlockEvent(host,port);
                break;
            }                
            default:
                //throw "command should be of form :\n node deploy.js host=<host> file=<file> contracts=<c1>,<c2> dir=<dir>";
                break;
      }
  }
  if(provider)
      provider.engine.stop();
  return;
}

main();

async function createPrivatePublicCombo(mnemonic) {
    if(!mnemonic.length) {
        console.log("Invalid mnemonics. restart it")
        return; 
    }
    const ethUtils = require('ethereumjs-util');
    privateKey = '0x'+ethUtils.keccak(mnemonic).toString('hex');
    var publicKey = ethUtils.privateToPublic(privateKey).toString('hex');
    let ethAddress = ethUtils.privateToAddress(privateKey).toString('hex');

    console.log("mnemonics:", mnemonic, "\nprivateKey:", privateKey, "\npublicKey:", publicKey, "\nLedgerium Account Address:", ethAddress);
}

async function testPersonalImportAccount(inputPrivateKeys, password) {

    if(inputPrivateKeys.length <= 0)
        return;
  
    try
    {
        var ethereumAccountsList = await web3.eth.getAccounts();
        console.log("No of Ethereum accounts on the node ",ethereumAccountsList.length);

        for(var index = 0; index < inputPrivateKeys.length; index++)
        {
            let flag = false;
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
            let fromAccountAddress = await web3.eth.accounts.privateKeyToAccount(eachElement).address;
            //ethereum gives back mixed case account address, we need to lowercase each of them before comparing! Have to run the loop. 
            let found = false;
            for (let item of ethereumAccountsList) {
                if(item.toLowerCase() == fromAccountAddress.toLowerCase()) {
                    found = true;
                    break;
                }
            }
            if(found){
                found = false;
                continue;
            }
            let ret = await utils.personalImportAccount(eachElement,password);
            console.log("Account", ret, "got imported!");
            var balance = await web3.eth.getBalance(ret);
            console.log("FromAccount", ret, "has balance of", web3.utils.fromWei(balance, 'xlg'), "xlg");
        }
    }    
    catch (error) {
        console.log("Error in testPersonalImportAccount(): " + error);
    }
    if(protocol == "ws://") {
       web3.currentProvider.connection.close();
    }
}

async function testLedgeriumToken(){

    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;

    var ethAccountToUse = accountAddressList[0];
    
    // Todo: Read ABI from dynamic source.
    var filename = __dirname + "/build/contracts/LedgeriumToken";
    var value = utils.readSolidityContractJSON(filename);
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }

    try {
        var deployedLedgeriumTokenAddress;
        if(!usecontractconfigFlag){
            let constructorParameters = [];
            //value[0] = Contract ABI and value[1] =  Contract Bytecode
            let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
            let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
            deployedLedgeriumTokenAddress = transactionHash.contractAddress;
        }
        else {
            deployedLedgeriumTokenAddress = utils.readContractFromConfigContracts("LedgeriumToken");
        }   
        console.log("LedgeriumToken deployedAddress ", deployedLedgeriumTokenAddress);

        var ledgeriumToken = new web3.eth.Contract(JSON.parse(value[0]),deployedLedgeriumTokenAddress);
        global.ledgeriumToken = ledgeriumToken;

        var result = await ledgeriumToken.methods.totalSupply().call();
        console.log("totalSupply", result);

        result = await ledgeriumToken.methods.symbol().call();
        console.log("symbol", result);

        result = await ledgeriumToken.methods.decimals().call();
        console.log("decimals", result);

        result = await ledgeriumToken.methods.balanceOf(ethAccountToUse).call();
        console.log("balanceOf", result, "of account", ethAccountToUse);

        result = await ledgeriumToken.methods.balanceOf(accountAddressList[1]).call();
        console.log("balanceOf", result, "of account",  accountAddressList[1]);
        
        let encodedABI = ledgeriumToken.methods.transfer(accountAddressList[1],123).encodeABI();
        let transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedLedgeriumTokenAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
        console.log("TransactionLog for ledgeriumToken transfer -", transactionObject.transactionHash);

        result = await ledgeriumToken.methods.balanceOf(accountAddressList[1]).call();
        console.log("balanceOf", result, "of account",  accountAddressList[1]);

        result = await ledgeriumToken.methods.balanceOf(accountAddressList[0]).call();
        console.log("balanceOf", result, "of account",  accountAddressList[0]);
    }    
    catch (error) {
        console.log("Error in testLedgeriumToken(): " + error);
    }
    if(protocol == "ws://") {
        web3.currentProvider.connection.close();
    }
}

async function transferXLG(fromPrivateKey,toEthereumAccount,XLGAmount) {
    
    var transactionObject = "";
    if(fromPrivateKey.indexOf("0x") == 0) { //when privatekeys are prefixed 0x
        transactionObject = await utils.transferXLG(fromPrivateKey,toEthereumAccount,XLGAmount,web3);
        console.log("TransactionLog for transfer -", transactionObject.transactionHash);
    } else if(fromPrivateKey.indexOf("0x") == -1) { //when privatekeys are not prefixed 0x
        fromPrivateKey = "0x" + fromPrivateKey;
        transactionObject = await utils.transferXLG(fromPrivateKey,toEthereumAccount,XLGAmount,web3);
        console.log("TransactionLog for transfer -", transactionObject.transactionHash);
    } else {
        console.log("Wrong format private keys!!");
        //process.exit(1);
    }
    try {
        if(protocol == "ws://") {
            web3.currentProvider.connection.close();
        }
    }    
    catch (error) {
        console.log("Error in transferXLG(): " + error);
    }
}

async function testInvoicesContract(invoiceID,hashVal) {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Invoice");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    try {
        var ethAccountToUse = accountAddressList[0];
        var deployedAddressInvoice;
        if(!usecontractconfigFlag){
            let constructorParameters = [];
            constructorParameters.push(101);
            //value[0] = Contract ABI and value[1] =  Contract Bytecode
            let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
            let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
            deployedAddressInvoice = transactionHash.contractAddress;
            utils.writeContractsINConfig("Invoice",deployedAddressInvoice);
        }
        else{
            deployedAddressInvoice = utils.readContractFromConfigContracts("Invoice");
        }
        console.log("Invoice deployedAddress ", deployedAddressInvoice);
        
        var invoice = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressInvoice);
        global.invoice = invoice;
        
        var result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
        console.log("isHashExists after", result);
        
        let encodedABI = invoice.methods.addInvoice(invoiceID,hashVal).encodeABI();
        var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressInvoice,encodedABI,privateKey[ethAccountToUse],web3,0);
        console.log("TransactionLog for Invoice Setvalue -", transactionObject.transactionHash);

        result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
        console.log("isHashExists after", result);

        result = await invoice.methods.getInvoiceID(hashVal).call({from : ethAccountToUse});
        console.log("getInvoiceID after", result);
    }    
    catch (error) {
        console.log("Error in testInvoicesContract(): " + error);
    }
    if(protocol == "ws://") {
        web3.currentProvider.connection.close();
    }
}

async function testGreetingContract() {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  
  
    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    
    try {
        var ethAccountToUse = accountAddressList[0];
        var deployedAddressGreeter;
        if(!usecontractconfigFlag){
            let constructorParameters = [];
            constructorParameters.push("Hi Ledgerium");
            //value[0] = Contract ABI and value[1] =  Contract Bytecode
            let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
            let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
            deployedAddressGreeter = transactionHash.contractAddress;
            utils.writeContractsINConfig("Greeter",deployedAddressGreeter);
        }
        else{
            deployedAddressGreeter = utils.readContractFromConfigContracts("Greeter");
        }
        console.log("Greeter deployedAddress ", deployedAddressGreeter);
        
        var greeting = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);
        global.greeting = greeting;
        
        var result = await greeting.methods.getMyNumber().call({from : ethAccountToUse});
        console.log("getMyNumber", result);
        
        let encodedABI = greeting.methods.setMyNumber(499).encodeABI();
        var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressGreeter,encodedABI,privateKey[ethAccountToUse],web3,0);
        console.log("TransactioHash for Greeter Setvalue -", transactionObject.transactionHash);

        var val = await utils.decodeInputVals(transactionObject.transactionHash,value[0],web3);
        console.log("Input value for TransactioHash", transactionObject.transactionHash, "is", val.value);

        result = await greeting.methods.getMyNumber().call({from : ethAccountToUse});
        console.log("getMyNumber after", result);
    }    
    catch (error) {
        console.log("Error in testGreetingContract(): " + error);
    }    
    if(protocol == "ws://") {
        web3.currentProvider.connection.close();
    }
}

async function testSimpleStorageContract() {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  
  
    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/SimpleStorage");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    try {
        var ethAccountToUse = accountAddressList[0];
        var deployedAddressSimpleStorage;
        if(!usecontractconfigFlag){
            let constructorParameters = [];
            constructorParameters.push(101);
            //value[0] = Contract ABI and value[1] =  Contract Bytecode
            let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
            let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
            deployedAddressSimpleStorage = transactionHash.contractAddress;
            utils.writeContractsINConfig("SimpleStorage",deployedAddressSimpleStorage);
        }
        else{
            deployedAddressSimpleStorage = utils.readContractFromConfigContracts("SimpleStorage");
        }
        console.log("SimpleStorage deployedAddress ", deployedAddressSimpleStorage);
        
        var simpleStorage = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressSimpleStorage);
        global.simpleStorage = simpleStorage;
        
        var result = await simpleStorage.methods.get().call({from : ethAccountToUse});
        console.log("getMyNumber", result);
        
        let encodedABI = simpleStorage.methods.set(499).encodeABI();
        var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressSimpleStorage,encodedABI,privateKey[ethAccountToUse],web3,0);
        console.log("TransactioHash for SimpleStorage set -", transactionObject.transactionHash);

        var val = await utils.decodeInputVals(transactionObject.transactionHash,value[0],web3);
        var bn;
        for(bn of val) {
            console.log("Input value for TransactioHash", transactionObject.transactionHash, ":", bn.toNumber());
        }     
        result = await simpleStorage.methods.get().call({from : ethAccountToUse});
        console.log("get after", result);
    }    
    catch (error) {
        console.log("Error in testSimpleStorageContract(): " + error);
    }
    if(protocol == "ws://") {
        web3.currentProvider.connection.close();
    }
}

async function generateTLSCerts() {
    await sslCerts.generateTLSCerts()
}

var web31,web32,web33,web34;
async function deployGreeterPrivate(host1, host2, host3, host4, toPrivatePort, toPort1, otherPort1, otherPort2) {
    console.log(`${fromPubKey}`);
    console.log(`${toPubKey}`);
    const h1 = "http://" + host1 + ":" + port;
    const h2 = "http://" + host2 + ":" + toPort1;
    const h3 = "http://" + host3 + ":" + otherPort1;
    const h4 = "http://" + host4 + ":" + otherPort2;
    const toPrivateURL = "https://" + host + ":" + toPrivatePort;

    web31 = new Web3(new Web3.providers.HttpProvider(h1));
    web32 = new Web3(new Web3.providers.HttpProvider(h2));
    web33 = new Web3(new Web3.providers.HttpProvider(h3));
    web34 = new Web3(new Web3.providers.HttpProvider(h4));

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    var ethAccountToUse = global.accountAddressList[0];
    var gasPrice = await web3.eth.getGasPrice();
    console.log("gasPrice ",web3.utils.toHex(gasPrice)); 

    //const fromAccountAddress = web3.eth.accounts.privateKeyToAccount(fromPrivateKey).address;
    var balance = await web3.eth.getBalance(ethAccountToUse);
    console.log("FromAccount", ethAccountToUse, "has balance of", web3.utils.fromWei(balance, 'xlg'), "xlg");

    var deployedAddressGreeter;

    let constructorParameters = [];
    constructorParameters.push("Hi Ledgerium");

    let tlsOptions;
    try {
         tlsOptions = {
            key: fs.readFileSync('./certs/cert.key'),
            clcert: fs.readFileSync('./certs/cert.pem'),
            allowInsecure: true
        }
    } catch (e) {
        if(e.code === 'ENOENT') {
            console.log('Unable to read the certificate files. Do they exist?')
        }
        else console.log(e);
        return;
    }

    //value[0] = Contract ABI and value[1] =  Contract Bytecode
    let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web31,constructorParameters);
    const rawTransactionManager = quorumjs.RawTransactionManager(web31, {
        privateUrl:toPrivateURL,
        tlsSettings: tlsOptions
    });
    var abcd = '0x' + global.privateKey[ethAccountToUse];
    var gasPrice = await web3.eth.getGasPrice();
    const txnParams = {
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: 4300000,
        to: "",
        value: 0,
        data: encodedABI,        
        isPrivate: true,
        from: {
            privateKey: abcd
        },
        privateFrom: fromPubKey,
        privateFor: [toPubKey],
        nonce: 0
    };
    web31.eth.getTransactionCount(ethAccountToUse, 'pending', (err, nonce) => {
        txnParams.nonce = nonce;
        console.log("Nonce :", nonce);
        const newTx = rawTransactionManager.sendRawTransaction(txnParams);
        newTx.then(function (tx){
            deployedAddressGreeter = tx.contractAddress;
            console.log("Greeter deployed contract address: ", deployedAddressGreeter);
            console.log("Greeter deployed transactionHash: ", tx.transactionHash);
            utils.writeContractsINConfig("Greeter",deployedAddressGreeter);
            getGreeterValues(deployedAddressGreeter);
        }).catch(function (err) {
            console.log(err);
        });
    });
}

async function getGreeterValues(deployedAddressGreeter) {
    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    
    const contract1 = new web31.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);
    const contract2 = new web32.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);
    const contract3 = new web33.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);
    const contract4 = new web34.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);

    contract1.methods.getMyNumber().call().then(function (val, error) {
        if(!error)
            console.log('Host ' + web31._provider.host + ' value returned: ' + val);
        else {
            console.log('Host ' + web31._provider.host + ' error 1', error);
        }
    }).catch(err => {
        console.log('Host ' + web31._provider.host + ' Message ' + err.message + '. Is this a private transaction?')
    });

    contract2.methods.getMyNumber().call().then(function (val, error) {
        if(!error)
        console.log('Host ' + web32._provider.host + ' value returned: ' + val);
        else {
            console.log('Host ' + web32._provider.host + ' error 2', error);
        }
    }).catch(err => {
        console.log('Host ' + web32._provider.host + ' Message ' + err.message + '. Is this a private transaction?')
    });

    contract3.methods.getMyNumber().call().then(function (val, error) {
        if(!error)
        console.log('Host ' + web33._provider.host + ' value returned: ' + val);
        else {
            console.log('Host ' + web33._provider.host + ' error 3', error);
        }
    }).catch(err => {
        console.log('Host ' + web33._provider.host + ' Message ' + err.message + '. Is this a private transaction?')
    });

    contract4.methods.getMyNumber().call().then(function (val, error) {
        if(!error)
        console.log('Host ' + web34._provider.host + ' value returned: ' + val);
        else {
            console.log('Host ' + web34._provider.host + ' error 4', error);
        }
    }).catch(err => {
        console.log('Host ' + web34._provider.host + ' Message ' + err.message + '. Is this a private transaction?')
    });
}

async function testNewBlockEvent(host, port) {

    //This is subscribing to an event from the blockchain and it has to be websocket!
    const h1 = protocol + host + ":" + port;
    const web3 = new Web3(new Web3.providers.WebsocketProvider(h1));
    try {
        web3.eth.subscribe('newBlockHeaders', function(error, result) {
            if (!error) {
                console.log(result);
            }
            else {
                console.error(error);
            }    
            web3.currentProvider.connection.close();
            process.exit(1);
        });
    } catch (exception) {
        console.log(`${exception}`)
    }
    return;
}