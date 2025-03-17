"use strict"; 

const http = require('http');  // Importing HTTP module
const https = require('https'); // Importing HTTPS module

// Overriding HTTP request to block it
http.request = () => {   
  console.warn("Blocked an HTTP request.");   
  return {     
    end: () => {},     // Empty end function
    on: () => {}       // Empty event handler
  }; 
};

// Overriding HTTPS request to block it
https.request = () => {   
  console.warn("Blocked an HTTPS request.");   
  return {     
    end: () => {},     // Empty end function
    on: () => {}       // Empty event handler
  }; 
};

// Setting process title
process.title = "Multithread Solana Brute-Force by Corvus Codex";  

//=============================================================== 
//Created by: CorvusCodex 
//Github: https://github.com/CorvusCodex/ 
//Github Repo: https://github.com/CorvusCodex/Multithread-Solana-Brute-Force 
//Licence : MIT 
//Support/Donate: 
//=============================================================== 
//SOL: FsX3CsTFkRjzne2KiD8gjw3PEW2bYqezKfydAP55BVj7 
//BTC: bc1q7wth254atug2p4v9j3krk9kauc0ehys2u8tgg3 
//POL, ETH & BNB: 0x68B6D33Ad1A3e0aFaDA60d6ADf8594601BE492F0 
//=============================================================== 
//Buy me a coffee: https://www.buymeacoffee.com/CorvusCodex 
//KO-FI: https://ko-fi.com/s/547b50850e 
//===============================================================   

const { Keypair } = require('@solana/web3.js'); // Importing Keypair from Solana web3.js
const fs = require('fs'); // Importing filesystem module
const cluster = require('cluster'); // Importing cluster module for multi-threading
const numCPUs = require('os').cpus().length; // Getting number of CPU cores
const blessed = require('blessed'); // Importing blessed for terminal UI

// Function to display credits and donation info
function credit(){   
  console.log("=================================================================");   
  console.log("Multithread Solana Bruteforce");   
  console.log("Created by: Corvus Codex");   
  console.log("Github: https://github.com/CorvusCodex/");   
  console.log("Licence : MIT License");   
  console.log("=================================================================");   
  console.log("Support my work:");   
  console.log("BTC: bc1q7wth254atug2p4v9j3krk9kauc0ehys2u8tgg3");   
  console.log("ETH/BNB/POLYGON: 0x68B6D33Ad1A3e0aFaDA60d6ADf8594601BE492F0");   
  console.log("SOL: FsX3CsTFkRjzne2KiD8gjw3PEW2bYqezKfydAP55BVj7");   
  console.log("Buy me a coffee: https://www.buymeacoffee.com/CorvusCodex");   
  console.log("Buy standalone Windows app: https://ko-fi.com/s/36307ffb03");   
  console.log("=================================================================");  
};   

console.clear(); // Clear console
credit(); // Display credits

let addresses; // Declare addresses variable
addresses = new Set(); // Initialize as Set to store unique addresses

// Read and process addresses from data.txt
const data = fs.readFileSync('./data.txt'); 
data.toString().split("\n").forEach(address => addresses.add(address));

// Object to store counts for each worker
let counts = {};

// Object to store start times for each worker
let startTimes = {};

// Function to generate keys and check against address set
function generate() {     
  // Increment worker's count
  counts[cluster.worker.id] = (counts[cluster.worker.id] || 0) + 1;     
  
  // Send updated counts to master process
  process.send({counts: counts});     
  
  // Generate new Solana keypair
  const keypair = Keypair.generate();     
  
  // Get private key as byte array
  const privateKey = keypair.secretKey;     
  
  // Get public key as base58 string
  const publicKey = keypair.publicKey.toString();     
  
  // Check if public key exists in address set
  if(addresses.has(publicKey)){       
    console.log("");       
    process.stdout.write('\x07'); // Beep sound
    console.log("\x1b[32m%s\x1b[0m", ">> Match Found: " + publicKey); // Green success message
    var successString = "Wallet: " + publicKey + "\n\nSeed: " + privateKey.toString('hex');     
      
    // Save match to file
    fs.writeFileSync('./match.txt', successString, (err) => {         
      if (err) throw err;       
    });       
    process.exit(); // Exit on success
  }   
}

// Master process logic
if (cluster.isMaster) {   
  let screen = blessed.screen({     
    smartCSR: true // Enable smart cursor optimization
  });   

  let boxes = []; // Array to store worker boxes
  
  // Create UI box for each worker
  for (let i = 0; i < numCPUs; i++) {     
    let box = blessed.box({       
      top: `${i * 100/numCPUs}%`,       
      left: '0%',       
      width: '50%',       
      height: `${100/numCPUs}%`,       
      content: `Worker ${i+1} Loop count: 0 Keys/min: N/A`,       
      border: { type: 'line' },       
      style: { border: { fg: 'blue' } }     
    });     
    screen.append(box);     
    boxes.push(box);   
  }   

  // Create box for generated addresses
  let addressBox = blessed.box({     
    top: '0%',     
    left: '50%',     
    width: '50%',     
    height: '100%',     
    content: `Generated Addresses:\n\n`,     
    border: { type: 'line' },     
    style: { border: { fg: 'blue' } }   
  });   
  screen.append(addressBox);   

  // Function to update address display
  function updateAddressBox() {     
    let content = `Generated Addresses:\n\n`;     
    for (let i = 0; i < 10; i++) {       
      const keypair = Keypair.generate();       
      const publicKey = keypair.publicKey.toString();       
      content += `${publicKey}\n`;     
    }     
    addressBox.setContent(content);     
    screen.render();   
  }   

  setInterval(updateAddressBox, 60 * 1000); // Update addresses every minute

  // Function to update worker stats
  function updateWorkerBoxes() {     
    for (let workerId in counts) {       
      let elapsedTime = (Date.now() - startTimes[workerId]) / 1000 / 60;       
      let keysPerMin = (counts[workerId] / elapsedTime).toFixed(2);       
      boxes[workerId-1].setContent(`Worker ${workerId} Loop count: ${counts[workerId]} Keys/min: ${keysPerMin}`);     
    }     
    screen.render();   
  }   

  setInterval(updateWorkerBoxes, 60 * 1000); // Update worker stats every minute

  screen.render(); // Initial screen render

  // Handle messages from workers
  cluster.on('message', (worker, message) => {     
    if (message.counts) {       
      for (let workerId in message.counts) {         
        counts[workerId] = message.counts[workerId];         
        if (!startTimes[workerId]) {           
          startTimes[workerId] = Date.now();         
        }       
      }     
    }   
  });   

  // Fork workers for each CPU
  for (let i = 0; i < numCPUs; i++) {     
    cluster.fork();   
  }   

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {     
    console.log(`worker ${worker.process.pid} died`);   
  }); 
} else {   
  // Worker process logic
  setInterval(generate, 0); // Run generate continuously
}
