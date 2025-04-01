// Debug Ethers.js
console.log('Ethers.js loaded:', typeof ethers);

// Konfigurasi jaringan Tea Sepolia Testnet
const teaSepoliaConfig = {
  chainId: '0x27ea', // 10218 dalam hex
  chainName: 'Tea Sepolia',
  rpcUrls: ['https://tea-sepolia.g.alchemy.com/public'],
  nativeCurrency: {
    name: 'TEA',
    symbol: 'TEA',
    decimals: 18
  },
  blockExplorerUrls: ['https://sepolia.tea.xyz']
};

// Alamat kontrak dan ABI
const contractAddress = '0x073CF9B93A3F40A4B5e8634DA06Bf5A63545780E';
const contractABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"string","name":"message","type":"string"},{"indexed":false,"internalType":"uint256","name":"count","type":"uint256"}],"name":"HelloSaid","type":"event"},
  {"inputs":[],"name":"sayHello","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"newMessage","type":"string"}],"name":"setMessage","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"clickCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"message","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}
];

let provider, signer, contract, account;

// Elemen DOM
const connectButton = document.getElementById('connectButton');
const sayHelloButton = document.getElementById('sayHelloButton');
const setMessageButton = document.getElementById('setMessageButton');
const accountDisplay = document.getElementById('account');
const currentMessageDisplay = document.getElementById('currentMessage');
const clickCountDisplay = document.getElementById('clickCount');
const newMessageInput = document.getElementById('newMessage');
const helloHistory = document.getElementById('helloHistory');
const audioButton = document.getElementById('audioButton');
const backgroundAudio = document.getElementById('backgroundAudio');

// Fungsi untuk menghubungkan wallet
async function connectWallet() {
  console.log('Connect Wallet clicked');
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    console.log('MetaMask not detected');
    return;
  }

  try {
    console.log('MetaMask detected, requesting accounts...');
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); // Pop-up MetaMask
    console.log('Accounts requested:', accounts);

    // Cek jaringan
    const { chainId } = await provider.getNetwork();
    if (chainId !== 10218) {
      console.log('Switching to Tea Sepolia...');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: teaSepoliaConfig.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          console.log('Adding Tea Sepolia...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [teaSepoliaConfig],
          });
        } else {
          throw switchError;
        }
      }
    }

    signer = provider.getSigner();
    account = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    accountDisplay.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
    connectButton.textContent = 'Connected';
    connectButton.disabled = true;
    sayHelloButton.disabled = false;
    setMessageButton.disabled = false;
    console.log('Connected to Tea Sepolia with account:', account);

    updateContractData();
    loadHelloHistory();
  } catch (error) {
    console.error('Connection error:', error.message);
    alert('Failed to connect: ' + error.message);
  }
}

// Fungsi untuk memperbarui data kontrak
async function updateContractData() {
  try {
    const message = await contract.message();
    const count = await contract.clickCount();
    currentMessageDisplay.textContent = message;
    clickCountDisplay.textContent = count.toString();
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
}

// Fungsi untuk memuat history Say Hello
async function loadHelloHistory() {
  helloHistory.innerHTML = '';
  const filter = contract.filters.HelloSaid(account);
  const events = await contract.queryFilter(filter);
  events.forEach(event => {
    const li = document.createElement('li');
    li.textContent = `Said "${event.args.message}" at count ${event.args.count.toString()}`;
    helloHistory.appendChild(li);
  });
}

// Fungsi untuk memanggil sayHello
async function handleSayHello() {
  try {
    console.log('Sending sayHello transaction...');
    const tx = await contract.sayHello();
    await tx.wait();
    console.log('Hello said!');
    updateContractData();
    loadHelloHistory();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Fungsi untuk mengatur pesan baru
async function handleSetMessage() {
  const newMessage = newMessageInput.value;
  if (!newMessage) {
    console.log('Enter a message!');
    return;
  }
  try {
    console.log('Sending setMessage transaction...');
    const tx = await contract.setMessage(newMessage);
    await tx.wait();
    console.log('Message updated!');
    newMessageInput.value = '';
    updateContractData();
    loadHelloHistory();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Fungsi untuk kontrol audio
let isPlaying = false;
audioButton.addEventListener('click', () => {
  if (isPlaying) {
    backgroundAudio.pause();
    audioButton.textContent = 'Play Music';
    isPlaying = false;
  } else {
    backgroundAudio.play();
    audioButton.textContent = 'Mute Music';
    isPlaying = true;
  }
});

// Event listeners
connectButton.addEventListener('click', connectWallet);
sayHelloButton.addEventListener('click', handleSayHello);
setMessageButton.addEventListener('click', handleSetMessage);